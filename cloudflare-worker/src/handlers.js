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
  dbInsertMediaLibrary,
  dbGetCertificates,
  dbGetCertificateByIdOrSlug,
  dbGetSetting,
  dbGetMessagesPaginated,
  dbGetVisitorsPaginated,
  dbGetAllSettings,
  dbGetMemorableImages,
  dbGetMediaLibrary,
  dbDeleteMediaLibrary
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
      return jsonResponse({ success: true, id: result && result.length > 0 ? result[0].id : null, message: 'Certificate created' }, 201, request);
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
    return jsonResponse({ success: true, id: result && result.length > 0 ? result[0].id : null, message: 'Memory created' }, 201, request);
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
    return jsonResponse(result && result.length > 0 ? result[0] : null, 201, request);
  } catch (err) {
    log('error', 'Failed to save media asset in fallback', { error: err.message });
    return errorResponse('Failed to save media asset', 500, request);
  }
}

/**
 * Handle GET /api/certificates (Certificates Fallback)
 */
export async function handleGetCertificates(request, env, ctx) {
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

    const certificates = await dbGetCertificates(env);
    const res = jsonResponse(certificates, 200, request, {
      'Cache-Control': 'public, s-maxage=60'
    });
    ctx.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
  } catch (err) {
    log('error', 'Failed in handleGetCertificates fallback', { error: err.message });
    return errorResponse('Database connection failed', 500, request);
  }
}

/**
 * Handle GET /api/certificates/:idOrSlug (Certificate Detail Fallback)
 */
export async function handleGetCertificateDetail(request, env, ctx) {
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
      return errorResponse('Certificate slug or ID is required', 400, request);
    }

    const certificate = await dbGetCertificateByIdOrSlug(env, idOrSlug);
    if (!certificate) {
      return errorResponse('Certificate not found', 404, request);
    }

    const res = jsonResponse(certificate, 200, request, {
      'Cache-Control': 'public, s-maxage=60'
    });
    ctx.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
  } catch (err) {
    log('error', 'Failed in handleGetCertificateDetail fallback', { error: err.message });
    return errorResponse('Database connection failed', 500, request);
  }
}

/**
 * Handle GET /api/resume (Resume Fallback)
 */
export async function handleGetResume(request, env) {
  try {
    const setting = await dbGetSetting(env, 'resumeUrl');
    const resumeUrl = setting ? setting.value : '/resume.pdf';
    return jsonResponse({ resumeUrl }, 200, request);
  } catch (err) {
    log('error', 'Failed in handleGetResume fallback', { error: err.message });
    return errorResponse('Database connection failed', 500, request);
  }
}

/**
 * Handle GET /api/profile-image (Profile Image Fallback)
 */
export async function handleGetProfileImage(request, env) {
  try {
    const setting = await dbGetSetting(env, 'profileImage');
    const imageUrl = setting ? setting.value : '/assets/profile.jpg';
    return jsonResponse({ imageUrl }, 200, request);
  } catch (err) {
    log('error', 'Failed in handleGetProfileImage fallback', { error: err.message });
    return errorResponse('Database connection failed', 500, request);
  }
}

/**
 * Handle GET /api/admin/messages (Admin Messages Fallback)
 */
export async function handleGetAdminMessages(request, env) {
  const admin = await authenticateRequest(request, env);
  if (!admin) {
    return errorResponse('Unauthorized access', 401, request);
  }

  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    const { data, count } = await dbGetMessagesPaginated(env, page, limit);
    return jsonResponse({ messages: data, totalCount: count }, 200, request);
  } catch (err) {
    log('error', 'Failed in handleGetAdminMessages fallback', { error: err.message });
    return errorResponse('Database connection failed', 500, request);
  }
}

/**
 * Handle GET /api/admin/visitors (Admin Visitors Fallback)
 */
export async function handleGetAdminVisitors(request, env) {
  const admin = await authenticateRequest(request, env);
  if (!admin) {
    return errorResponse('Unauthorized access', 401, request);
  }

  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '5', 10);

    const { data, count } = await dbGetVisitorsPaginated(env, page, limit);
    return jsonResponse({ visitors: data, totalCount: count }, 200, request);
  } catch (err) {
    log('error', 'Failed in handleGetAdminVisitors fallback', { error: err.message });
    return errorResponse('Database connection failed', 500, request);
  }
}

/**
 * Escape strings for valid XML formatting
 */
function xmlEscape(str) {
  if (!str) return '';
  return str.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Handle GET /sitemap-index.xml (Bypasses proxy)
 */
export async function handleGetSitemapIndex(request, env, ctx) {
  const lastmod = new Date().toISOString().split('T')[0];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemapindex.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/siteindex.xsd">
  <sitemap>
    <loc>https://mrprem.in/sitemap.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://mrprem.in/image-sitemap.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
</sitemapindex>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600'
    }
  });
}

/**
 * Handle GET /sitemap.xml (Bypasses proxy)
 */
export async function handleGetSitemap(request, env, ctx) {
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

    const [projects, certificates, memories, media] = await Promise.all([
      dbGetProjects(env),
      dbGetCertificates(env),
      dbGetMemorableImages(env),
      dbGetMediaLibrary(env)
    ]);

    const lastmod = new Date().toISOString().split('T')[0];
    const siteUrl = 'https://mrprem.in';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    const addUrl = (path, priority, freq) => {
      xml += `  <url>\n`;
      xml += `    <loc>${siteUrl}${path}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>${freq}</changefreq>\n`;
      xml += `    <priority>${priority}</priority>\n`;
      xml += `  </url>\n`;
    };

    // Static Core Pages
    addUrl('', '1.0', 'weekly');
    addUrl('/all-projects', '0.9', 'weekly');
    addUrl('/all-certificates', '0.9', 'monthly');
    addUrl('/memories', '0.9', 'monthly');
    addUrl('/github-insights', '0.8', 'daily');
    addUrl('/prem-media-library', '0.7', 'monthly');

    // Dynamic Projects
    projects.forEach(p => {
      addUrl(`/project/${p.slug || p.id}`, '0.8', 'monthly');
    });

    // Dynamic Certificates
    certificates.forEach(c => {
      addUrl(`/certificate/${c.slug || c.id}`, '0.8', 'monthly');
    });

    // Dynamic Memories
    memories.forEach(m => {
      addUrl(`/memory/${m.slug || m.id}`, '0.7', 'monthly');
    });

    // Dynamic CDN Images
    media.forEach(img => {
      addUrl(`/cdn/${img.slug}`, '0.6', 'yearly');
    });

    xml += `</urlset>`;

    const res = new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600'
      }
    });

    ctx.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
  } catch (err) {
    log('error', 'Sitemap generation failed', { error: err.message });
    return errorResponse('Failed to generate sitemap', 500, request);
  }
}

/**
 * Handle GET /image-sitemap.xml (Bypasses proxy)
 */
export async function handleGetImageSitemap(request, env, ctx) {
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

    const [projects, certificates, memories, settings, media] = await Promise.all([
      dbGetProjects(env),
      dbGetCertificates(env),
      dbGetMemorableImages(env),
      dbGetAllSettings(env),
      dbGetMediaLibrary(env)
    ]);

    const siteUrl = 'https://mrprem.in';
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

    // Helper function to generate an <image:image> block
    const imageBlock = (loc, title, caption) => {
      if (!loc) return '';
      return `    <image:image>\n` +
             `      <image:loc>${xmlEscape(loc)}</image:loc>\n` +
             `      <image:title>${xmlEscape(title)}</image:title>\n` +
             `      <image:caption>${xmlEscape(caption)}</image:caption>\n` +
             `    </image:image>\n`;
    };

    // Homepage with profile/brand images
    let homeImagesXml = '';
    const profileSetting = settings ? settings.find(s => s.key === 'profileImage') : null;
    const navbarSetting = settings ? settings.find(s => s.key === 'navbarImage') : null;
    const signatureSetting = settings ? settings.find(s => s.key === 'signatureUrl') : null;

    if (profileSetting && profileSetting.value) {
      homeImagesXml += imageBlock(
        profileSetting.value, 
        'Prem Prasad Pradhan - Professional Profile Photo',
        'Official profile photo of Prem Prasad Pradhan, Full-Stack Software Developer.'
      );
    }
    if (navbarSetting && navbarSetting.value) {
      homeImagesXml += imageBlock(
        navbarSetting.value,
        'Prem Prasad Pradhan Logo',
        'Official brand header logo representing Prem Prasad Pradhan\'s portfolio.'
      );
    }
    if (signatureSetting && signatureSetting.value) {
      homeImagesXml += imageBlock(
        signatureSetting.value,
        'Prem Prasad Pradhan Signature',
        'Digital signature of Prem Prasad Pradhan.'
      );
    }

    xml += `  <url>\n` +
           `    <loc>${siteUrl}/</loc>\n` +
           homeImagesXml +
           `  </url>\n`;

    // Dynamic Projects
    projects.forEach(p => {
      let projectImagesXml = '';
      if (p.images && p.images.length > 0) {
        p.images.forEach((img, idx) => {
          projectImagesXml += imageBlock(
            img.image_url,
            `${p.title} - Screenshot ${idx + 1}`,
            `${img.alt_text || 'Screenshot ' + (idx + 1) + ' of ' + p.title}. Developed by Prem Prasad Pradhan.`
          );
        });
      }
      if (projectImagesXml) {
        xml += `  <url>\n` +
               `    <loc>${siteUrl}/project/${p.slug || p.id}</loc>\n` +
               projectImagesXml +
               `  </url>\n`;
      }
    });

    // Dynamic Certificates
    certificates.forEach(c => {
      if (c.image) {
        const certImageXml = imageBlock(
          c.image,
          `${c.title} - Certification`,
          `${c.image_alt || 'Certificate award representing ' + c.title}. Earned by Prem Prasad Pradhan.`
        );
        xml += `  <url>\n` +
               `    <loc>${siteUrl}/certificate/${c.slug || c.id}</loc>\n` +
               certImageXml +
               `  </url>\n`;
      }
    });

    // Dynamic Memories
    memories.forEach(m => {
      if (m.image_url) {
        const memoryImageXml = imageBlock(
          m.image_url,
          `${m.title} - Memorable Moment`,
          `${m.image_alt || m.image_description || 'Moment: ' + m.title}. Prem's gallery.`
        );
        xml += `  <url>\n` +
               `    <loc>${siteUrl}/memory/${m.slug || m.id}</loc>\n` +
               memoryImageXml +
               `  </url>\n`;
      }
    });

    // Dynamic CDN Images
    media.forEach(img => {
      if (img.url || img.direct_image_url) {
        const cdnImageXml = imageBlock(
          img.direct_image_url || img.url,
          `${img.name} - Premium CDN Asset`,
          `Branded CDN hosted asset representing ${img.name}.`
        );
        xml += `  <url>\n` +
               `    <loc>${siteUrl}/cdn/${img.slug}</loc>\n` +
               cdnImageXml +
               `  </url>\n`;
      }
    });

    xml += `</urlset>`;

    const res = new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600'
      }
    });

    ctx.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
  } catch (err) {
    log('error', 'Image sitemap generation failed', { error: err.message });
    return errorResponse('Failed to generate image sitemap', 500, request);
  }
}

/**
 * Handle DELETE /api/media/:id (Media Library Fallback)
 */
export async function handleDeleteMediaLibrary(request, env) {
  const admin = await authenticateRequest(request, env);
  if (!admin) {
    return errorResponse('Unauthorized access', 401, request);
  }

  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    if (!id) {
      return errorResponse('Media ID is required', 400, request);
    }

    await dbDeleteMediaLibrary(env, id);
    return jsonResponse({ success: true, message: 'Media deleted successfully' }, 200, request);
  } catch (err) {
    log('error', 'Failed to delete media asset in fallback', { error: err.message });
    return errorResponse('Failed to delete media asset', 500, request);
  }
}





