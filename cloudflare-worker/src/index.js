import { handleOptions, jsonResponse, errorResponse, log } from './utils.js';
import { 
  handleGetProjects, 
  handleGetProjectDetail, 
  handleGetReviews, 
  handlePostContact, 
  handlePostVisitor,
  handlePostChat
} from './handlers.js';
import { dbTestConnection } from './db.js';

export default {
  async fetch(request, env, ctx) {
    // 1. Handle CORS Preflight Options
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // 2. Handle Custom Health Check Route (Bypasses proxy)
    if (path === '/api/health') {
      return handleHealthCheck(request, env);
    }

    // 3. Pre-buffer request body if this is a mutating request.
    // This allows us to try proxying, and if it fails, parse the body again in the fallback.
    let bodyText = null;
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      try {
        bodyText = await request.clone().text();
      } catch (err) {
        log('error', 'Failed to buffer request body', { error: err.message });
      }
    }

    // 4. Try Proxying to Render Backend
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 4000); // 4-second timeout limit

    try {
      const proxyUrl = new URL(request.url);
      const backendUrl = new URL(env.PRIMARY_BACKEND_URL);
      
      proxyUrl.host = backendUrl.host;
      proxyUrl.protocol = backendUrl.protocol;

      const proxyRequest = new Request(proxyUrl.toString(), {
        method: request.method,
        headers: request.headers,
        body: bodyText,
        signal: controller.signal,
        redirect: 'manual' // Do not follow redirects automatically
      });

      const response = await fetch(proxyRequest);
      clearTimeout(timeoutId);

      // Trigger fallback if primary backend returns gateway/server errors
      if ([502, 503, 504].includes(response.status)) {
        throw new Error(`Primary backend returned gateway error status: ${response.status}`);
      }

      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      
      const isAbort = err.name === 'AbortError';
      log('warn', `Primary backend ${isAbort ? 'timed out' : 'connection failed'}. Executing failover fallback routing.`, {
        path,
        method: request.method,
        error: err.message
      });

      return handleFallback(request, env, ctx, path, bodyText);
    }
  }
};

/**
 * Route traffic to secondary DB/Cloudinary direct endpoints
 */
async function handleFallback(request, env, ctx, path, bodyText) {
  // GET /api/projects
  if (path === '/api/projects' && request.method === 'GET') {
    return handleGetProjects(request, env, ctx);
  }

  // GET /api/projects/:idOrSlug
  if (path.startsWith('/api/projects/') && request.method === 'GET') {
    return handleGetProjectDetail(request, env, ctx);
  }

  // GET /api/reviews or GET /api/admin/reviews
  if ((path === '/api/reviews' || path === '/api/admin/reviews') && request.method === 'GET') {
    return handleGetReviews(request, env, ctx);
  }

  // POST /api/contact
  if (path === '/api/contact' && request.method === 'POST') {
    // Reconstruct request-like payload for handler using buffered bodyText
    const mockRequest = new Request(request.url, {
      method: 'POST',
      headers: request.headers,
      body: bodyText
    });
    return handlePostContact(mockRequest, env);
  }

  // POST /api/track-visitor or POST /api/analytics
  if ((path === '/api/track-visitor' || path === '/api/analytics') && request.method === 'POST') {
    const mockRequest = new Request(request.url, {
      method: 'POST',
      headers: request.headers,
      body: bodyText
    });
    return handlePostVisitor(mockRequest, env);
  }

  // POST /api/chat
  if (path === '/api/chat' && request.method === 'POST') {
    const mockRequest = new Request(request.url, {
      method: 'POST',
      headers: request.headers,
      body: bodyText
    });
    return handlePostChat(mockRequest, env);
  }

  // Degraded response for unimplemented fallback routes (e.g. AI chatbot or admin edits)
  log('info', `Fallback not implemented for route: ${request.method} ${path}`);
  return errorResponse(
    'Primary backend is undergoing maintenance. This feature is temporarily degraded, but the portfolio remains active.',
    503,
    request
  );
}

/**
 * Handle GET /api/health
 * Checks connectivity to Render (primary) and Supabase (secondary)
 */
async function handleHealthCheck(request, env) {
  let primaryHealth = 'unknown';
  let databaseHealth = 'unknown';
  
  // 1. Check Render Primary Backend
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);
  try {
    const res = await fetch(`${env.PRIMARY_BACKEND_URL}/api/profile-image`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    primaryHealth = res.ok ? 'healthy' : `error_${res.status}`;
  } catch (err) {
    clearTimeout(timeoutId);
    primaryHealth = err.name === 'AbortError' ? 'timeout' : 'unreachable';
  }

  // 2. Check Supabase Connectivity
  try {
    await dbTestConnection(env);
    databaseHealth = 'healthy';
  } catch (err) {
    databaseHealth = `error_${err.message}`;
  }

  const overallStatus = (primaryHealth === 'healthy' || databaseHealth === 'healthy') ? 'operational' : 'degraded';

  return jsonResponse({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    services: {
      primary_backend: {
        status: primaryHealth,
        url: env.PRIMARY_BACKEND_URL
      },
      secondary_database: {
        status: databaseHealth
      }
    }
  }, overallStatus === 'operational' ? 200 : 500, request);
}
