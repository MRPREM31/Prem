import { handleOptions, jsonResponse, errorResponse, log } from './utils.js';
import { 
  handleGetProjects, 
  handleGetProjectDetail, 
  handleGetReviews, 
  handlePostContact, 
  handlePostVisitor,
  handlePostChat,
  handleCloudinarySign,
  handleSaveSetting,
  handleSaveCertificate,
  handleSaveMemorableImage,
  handleSaveProjectImages,
  handleSaveMediaLibrary,
  handleDeleteMediaLibrary,
  handleGetCertificates,
  handleGetCertificateDetail,
  handleGetResume,
  handleGetProfileImage,
  handleGetAdminMessages,
  handleGetAdminVisitors,
  handleGetSitemapIndex,
  handleGetSitemap,
  handleGetImageSitemap
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

    // 2.5. Handle Sitemap Index & Image Sitemap (Bypasses proxy)
    if (path === '/sitemap-index.xml' && request.method === 'GET') {
      return handleGetSitemapIndex(request, env, ctx);
    }
    if (path === '/sitemap.xml' && request.method === 'GET') {
      return handleGetSitemap(request, env, ctx);
    }
    if (path === '/image-sitemap.xml' && request.method === 'GET') {
      return handleGetImageSitemap(request, env, ctx);
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

    // 3.5. Bypass proxy for JSON metadata uploads (Active-Active)
    const contentType = request.headers.get('Content-Type') || '';
    const isJson = contentType.includes('application/json');
    const isUploadOrMetadataWrite = (
      path.startsWith('/api/admin/upload-') || 
      path.startsWith('/api/admin/certificates') || 
      path.startsWith('/api/admin/memorable-images') || 
      (path.startsWith('/api/admin/projects/') && path.endsWith('/images')) ||
      path === '/api/media/upload' ||
      path === '/api/admin/cloudinary-sign'
    ) && ['POST', 'PUT', 'PATCH'].includes(request.method);

    const isMediaDelete = path.startsWith('/api/media/') && request.method === 'DELETE';
    const isCloudinarySignGet = path === '/api/admin/cloudinary-sign' && request.method === 'GET';

    if ((isUploadOrMetadataWrite && isJson) || isMediaDelete || isCloudinarySignGet) {
      log('info', `Bypassing proxy to execute direct metadata write/delete/GET on Worker`, { path });
      return handleFallback(request, env, ctx, path, bodyText);
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

  // GET /api/certificates
  if (path === '/api/certificates' && request.method === 'GET') {
    return handleGetCertificates(request, env, ctx);
  }

  // GET /api/certificates/:idOrSlug
  if (path.startsWith('/api/certificates/') && request.method === 'GET') {
    return handleGetCertificateDetail(request, env, ctx);
  }

  // GET /api/resume
  if (path === '/api/resume' && request.method === 'GET') {
    return handleGetResume(request, env);
  }

  // GET /api/profile-image
  if (path === '/api/profile-image' && request.method === 'GET') {
    return handleGetProfileImage(request, env);
  }

  // GET /api/admin/messages
  if (path === '/api/admin/messages' && request.method === 'GET') {
    return handleGetAdminMessages(request, env);
  }

  // GET /api/admin/visitors
  if (path === '/api/admin/visitors' && request.method === 'GET') {
    return handleGetAdminVisitors(request, env);
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

  // Reusable helper for JSON fallback handlers
  const getMockRequest = () => new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body: bodyText
  });

  // POST /api/admin/cloudinary-sign
  if (path === '/api/admin/cloudinary-sign' && request.method === 'POST') {
    return handleCloudinarySign(getMockRequest(), env);
  }

  // GET /api/admin/cloudinary-sign
  if (path === '/api/admin/cloudinary-sign' && request.method === 'GET') {
    return jsonResponse({ error: 'Method Not Allowed. Cloudinary signature requests must use POST.' }, 405, request);
  }

  // Settings fallbacks
  if (path === '/api/admin/upload-profile' && request.method === 'POST') {
    return handleSaveSetting(getMockRequest(), env, 'profileImage');
  }
  if (path === '/api/admin/upload-navbar' && request.method === 'POST') {
    return handleSaveSetting(getMockRequest(), env, 'navbarImage');
  }
  if (path === '/api/admin/upload-resume' && request.method === 'POST') {
    return handleSaveSetting(getMockRequest(), env, 'resumeUrl');
  }
  if (path === '/api/admin/upload-favicon' && request.method === 'POST') {
    return handleSaveSetting(getMockRequest(), env, 'faviconUrl');
  }
  if (path === '/api/admin/upload-signature' && request.method === 'POST') {
    return handleSaveSetting(getMockRequest(), env, 'signatureUrl');
  }

  // Certificates fallbacks
  if (path.startsWith('/api/admin/certificates') && (request.method === 'POST' || request.method === 'PUT')) {
    return handleSaveCertificate(getMockRequest(), env);
  }

  // Memorable images fallback
  if (path === '/api/admin/memorable-images' && request.method === 'POST') {
    return handleSaveMemorableImage(getMockRequest(), env);
  }

  // Project images fallback
  if (path.startsWith('/api/admin/projects/') && path.endsWith('/images') && request.method === 'POST') {
    return handleSaveProjectImages(getMockRequest(), env);
  }

  // Media Library fallback
  if (path === '/api/media/upload' && request.method === 'POST') {
    return handleSaveMediaLibrary(getMockRequest(), env);
  }
  if (path.startsWith('/api/media/') && request.method === 'DELETE') {
    return handleDeleteMediaLibrary(getMockRequest(), env);
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
