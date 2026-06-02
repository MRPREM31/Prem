import { 
  dbGetProjects, 
  dbGetProjectByIdOrSlug, 
  dbGetPublicReviews,
  dbInsertMessage,
  dbUpsertVisitor,
  dbSaveSetting,
  dbInsertCertificate,
  dbUpdateCertificate,
  dbInsertMemorableImage,
  dbInsertProjectImages,
  dbInsertMediaLibrary
} from './db.js';
import { jsonResponse, errorResponse, log } from './utils.js';
import { authenticateRequest } from './auth.js';

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

// Simple slugify function for generating slugs in fallback
function slugify(text) {
  if (!text) return '';
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-');        // Replace multiple - with single -
}

// Helper for SHA-1 hashing used by Cloudinary signature
async function sha1Hex(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Handle POST /api/admin/cloudinary-sign
 * Returns secure upload signatures
 */
export async function handleCloudinarySign(request, env) {
  const admin = await authenticateRequest(request, env);
  if (!admin) {
    return errorResponse('Unauthorized access', 401, request);
  }

  try {
    const body = await request.json() || {};
    const { folder } = body;
    const timestamp = Math.floor(Date.now() / 1000);
    
    let signatureStr = '';
    if (folder) {
      signatureStr = `folder=${folder}&timestamp=${timestamp}`;
    } else {
      signatureStr = `timestamp=${timestamp}`;
    }
    
    const signatureBase = signatureStr + env.CLOUDINARY_API_SECRET;
    const signature = await sha1Hex(signatureBase);
    
    return jsonResponse({
      signature,
      timestamp,
      apiKey: env.CLOUDINARY_API_KEY,
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      folder: folder || ''
    }, 200, request);
  } catch (err) {
    log('error', 'Cloudinary signing failed', { error: err.message });
    return errorResponse('Failed to sign upload parameters', 500, request);
  }
}

/**
 * Handle settings URL updates (profile, navbar, resume, favicon, signature)
 */
export async function handleSaveSetting(request, env, settingKey) {
  const admin = await authenticateRequest(request, env);
  if (!admin) {
    return errorResponse('Unauthorized access', 401, request);
  }

  try {
    const body = await request.json();
    let value = '';
    if (settingKey === 'profileImage') value = body.imageUrl || body.image;
    else if (settingKey === 'resumeUrl') value = body.resumeUrl || body.resume;
    else if (settingKey === 'faviconUrl') value = body.faviconUrl || body.favicon;
    else if (settingKey === 'signatureUrl') value = body.signatureUrl || body.signature;
    else if (settingKey === 'navbarImage') value = body.navbarImageUrl || body.navbar;

    if (!value) {
      return errorResponse(`Value is required for setting key: ${settingKey}`, 400, request);
    }

    await dbSaveSetting(env, settingKey, value);
    return jsonResponse({ success: true, message: `Setting ${settingKey} saved successfully` }, 200, request);
  } catch (err) {
    log('error', `Failed to save setting ${settingKey}`, { error: err.message });
    return errorResponse('Failed to save settings data', 500, request);
  }
}

/**
 * Handle POST/PUT /api/admin/certificates
 */
export async function handleSaveCertificate(request, env) {
  const admin = await authenticateRequest(request, env);
  if (!admin) {
    return errorResponse('Unauthorized access', 401, request);
  }

  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    const isUpdate = request.method === 'PUT' || (id && id !== 'certificates');

    const body = await request.json();
    const { title, description, date, image, image_alt } = body;

    const slug = title ? slugify(title) : '';
    const certData = { title, description, date, image, image_alt, slug };

    if (isUpdate) {
      await dbUpdateCertificate(env, id, certData);
      return jsonResponse({ success: true, message: 'Certificate updated' }, 200, request);
    } else {
      const result = await dbInsertCertificate(env, certData);
      return jsonResponse({ success: true, id: result ? result.id : null, message: 'Certificate created' }, 201, request);
    }
  } catch (err) {
    log('error', 'Failed to save certificate in fallback', { error: err.message });
    return errorResponse('Failed to save certificate details', 500, request);
  }
}

/**
 * Handle POST /api/admin/memorable-images
 */
export async function handleSaveMemorableImage(request, env) {
  const admin = await authenticateRequest(request, env);
  if (!admin) {
    return errorResponse('Unauthorized access', 401, request);
  }

  try {
    const body = await request.json();
    const { title, imageUrl, image_alt, image_description, aspect_ratio } = body;

    if (!imageUrl) {
      return errorResponse('Image URL is required', 400, request);
    }

    const slug = (title ? slugify(title) : 'memory') + '-' + Date.now().toString().slice(-4);
    const imgData = { 
      title: title || 'Untitled Memory', 
      image_url: imageUrl, 
      aspect_ratio: aspect_ratio || 'landscape', 
      upload_date: new Date().toISOString(),
      image_alt: image_alt || 'Memory Image', 
      image_description: image_description || '', 
      slug 
    };

    const result = await dbInsertMemorableImage(env, imgData);
    return jsonResponse({ success: true, id: result ? result.id : null, message: 'Memory created' }, 201, request);
  } catch (err) {
    log('error', 'Failed to save memorable image in fallback', { error: err.message });
    return errorResponse('Failed to save memory details', 500, request);
  }
}

/**
 * Handle POST /api/admin/projects/:id/images
 */
export async function handleSaveProjectImages(request, env) {
  const admin = await authenticateRequest(request, env);
  if (!admin) {
    return errorResponse('Unauthorized access', 401, request);
  }

  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const projectId = pathParts[pathParts.length - 2];

    const body = await request.json();
    let images = [];
    
    if (body.images && Array.isArray(body.images)) {
      images = body.images.map(img => ({
        project_id: parseInt(projectId),
        image_url: img.image_url || img.url || img,
        alt_text: img.alt_text || 'Project Screenshot'
      }));
    } else if (body.image_url || body.url || body.image) {
      images = [{
        project_id: parseInt(projectId),
        image_url: body.image_url || body.url || body.image,
        alt_text: body.alt_text || 'Project Screenshot'
      }];
    }

    if (images.length === 0) {
      return errorResponse('No images provided to save', 400, request);
    }

    await dbInsertProjectImages(env, images);
    return jsonResponse({ success: true, message: 'Project images added successfully' }, 201, request);
  } catch (err) {
    log('error', 'Failed to save project images in fallback', { error: err.message });
    return errorResponse('Failed to save project images', 500, request);
  }
}

/**
 * Handle POST /api/media/upload (Media Library CDN upload)
 */
export async function handleSaveMediaLibrary(request, env) {
  const admin = await authenticateRequest(request, env);
  if (!admin) {
    return errorResponse('Unauthorized access', 401, request);
  }

  try {
    const body = await request.json();
    const { name, url, size } = body;

    if (!url) {
      return errorResponse('URL is required', 400, request);
    }

    const slug = slugify(name || 'media') + '-' + Math.random().toString(36).substr(2, 5);
    const mediaData = {
      name: name || 'Media Asset',
      slug,
      url,
      direct_image_url: url,
      imagekit_file_id: 'cloudinary-' + Date.now(),
      size: size || 0,
      uploaded_by: 'Admin',
      upload_date: new Date().toISOString()
    };

    const result = await dbInsertMediaLibrary(env, mediaData);
    return jsonResponse(result, 201, request);
  } catch (err) {
    log('error', 'Failed to save media asset in fallback', { error: err.message });
    return errorResponse('Failed to save media asset', 500, request);
  }
}


