import { 
  dbGetProjects, 
  dbGetProjectByIdOrSlug, 
  dbGetPublicReviews,
  dbInsertMessage,
  dbUpsertVisitor
} from './db.js';
import { jsonResponse, errorResponse, log } from './utils.js';

/**
 * Handle GET /api/projects
 */
export async function handleGetProjects(request, env, ctx) {
  const cache = caches.default;
  const cacheKey = new Request(request.url, request);
  
  try {
    let cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-Fallback-Cache', 'HIT');
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers
      });
    }

    const projects = await dbGetProjects(env);
    const res = jsonResponse(projects, 200, request, {
      'Cache-Control': 'public, s-maxage=60'
    });
    ctx.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
  } catch (err) {
    log('error', 'Failed in handleGetProjects fallback', { error: err.message });
    return errorResponse('Database connection failed', 500, request);
  }
}

/**
 * Handle GET /api/projects/:idOrSlug
 */
export async function handleGetProjectDetail(request, env, ctx) {
  const cache = caches.default;
  const cacheKey = new Request(request.url, request);

  try {
    let cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-Fallback-Cache', 'HIT');
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers
      });
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const idOrSlug = pathParts[pathParts.length - 1];

    if (!idOrSlug) {
      return errorResponse('Project slug or ID is required', 400, request);
    }

    const project = await dbGetProjectByIdOrSlug(env, idOrSlug);
    if (!project) {
      return errorResponse('Project not found', 404, request);
    }

    const res = jsonResponse(project, 200, request, {
      'Cache-Control': 'public, s-maxage=60'
    });
    ctx.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
  } catch (err) {
    log('error', 'Failed in handleGetProjectDetail fallback', { error: err.message });
    return errorResponse('Database connection failed', 500, request);
  }
}

/**
 * Handle GET /api/reviews
 */
export async function handleGetReviews(request, env, ctx) {
  const cache = caches.default;
  const cacheKey = new Request(request.url, request);

  try {
    let cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-Fallback-Cache', 'HIT');
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers
      });
    }

    const reviews = await dbGetPublicReviews(env);
    const res = jsonResponse(reviews, 200, request, {
      'Cache-Control': 'public, s-maxage=60'
    });
    ctx.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
  } catch (err) {
    log('error', 'Failed in handleGetReviews fallback', { error: err.message });
    return errorResponse('Database connection failed', 500, request);
  }
}

/**
 * Handle POST /api/contact
 */
export async function handlePostContact(request, env) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return errorResponse('All fields are required', 400, request);
    }

    const savedMessage = await dbInsertMessage(env, { name, email, message });
    return jsonResponse({ 
      success: true, 
      id: savedMessage ? savedMessage.id : null,
      message: 'Message saved directly via fallback secondary backend.'
    }, 201, request);
  } catch (err) {
    log('error', 'Failed in handlePostContact fallback', { error: err.message });
    return errorResponse('Failed to record message', 500, request);
  }
}

// Utility to generate unique MD5 hash for visitors
async function computeMD5(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  try {
    const hashBuffer = await crypto.subtle.digest('MD5', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback to SHA-256 sliced to 32 characters if MD5 is restricted
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
  }
}

/**
 * Handle POST /api/track-visitor or POST /api/analytics
 */
export async function handlePostVisitor(request, env) {
  try {
    const body = await request.json();
    const { sessionId, subscriptionStatus, subscriptionId, lastPromptTime, deviceBrowser } = body;
    
    const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown User-Agent';

    let uniqueId;
    if (sessionId) {
      uniqueId = await computeMD5(sessionId);
    } else {
      const today = new Date().toISOString().split('T')[0];
      uniqueId = await computeMD5(`${ip}-${userAgent}-${today}`);
    }

    const visitorPayload = {
      unique_id: uniqueId,
      ip,
      user_agent: userAgent,
      visited_at: new Date().toISOString()
    };

    if (subscriptionStatus !== undefined) visitorPayload.subscription_status = subscriptionStatus;
    if (subscriptionId !== undefined) visitorPayload.subscription_id = subscriptionId;
    if (lastPromptTime !== undefined) visitorPayload.last_prompt_time = lastPromptTime;
    if (deviceBrowser !== undefined) visitorPayload.device_browser = deviceBrowser;

    await dbUpsertVisitor(env, visitorPayload);

    return jsonResponse({ 
      success: true, 
      message: 'Visitor analytics recorded directly via fallback secondary backend.'
    }, 200, request);
  } catch (err) {
    log('error', 'Failed in handlePostVisitor fallback', { error: err.message });
    // Silently succeed or return a clean JSON code so client doesn't break on analytic failures
    return jsonResponse({ success: false, error: err.message }, 200, request);
  }
}

/**
 * Handle POST /api/chat (Workers AI Fallback Chatbot)
 */
export async function handlePostChat(request, env) {
  try {
    const { message, history = [] } = await request.json();

    if (!message) {
      return errorResponse('Message is required', 400, request);
    }

    if (!env.AI) {
      return errorResponse('AI binding is not configured in wrangler.toml', 500, request);
    }

    const messages = [
      { 
        role: 'system', 
        content: `You are PremBot (Fallback Mode), the elite digital assistant for Prem Prasad Pradhan.
        Represent Prem professionally, intelligently, and tech-savvy. Keep responses concise (under 4 sentences).
        If asked, state that you are operating in server-degraded fallback mode but remain functional.` 
      },
      ...history,
      { role: 'user', content: message }
    ];

    const aiResponse = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages
    });

    return jsonResponse({ 
      response: aiResponse.response || "I am currently running in fallback mode. How can I assist you?" 
    }, 200, request);
  } catch (err) {
    log('error', 'Failed in handlePostChat fallback', { error: err.message });
    return errorResponse('AI neural link fallback failed', 500, request);
  }
}

