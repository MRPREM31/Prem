/**
 * CORS and Response utilities for Cloudflare Workers
 */

const ALLOWED_ORIGINS = [
  'https://mrprem.in',
  'https://prem-prasad-pradhan.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

export function getCorsHeaders(request) {
  const origin = request.headers.get('Origin');
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

export function handleOptions(request) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

export function jsonResponse(data, status = 200, request = null, additionalHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    ...additionalHeaders
  };
  
  if (request) {
    Object.assign(headers, getCorsHeaders(request));
  }

  return new Response(JSON.stringify(data), {
    status,
    headers
  });
}

export function errorResponse(message, status = 500, request = null, details = null) {
  return jsonResponse(
    {
      error: message,
      ...(details ? { details } : {})
    },
    status,
    request
  );
}

export function log(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length ? ` | Meta: ${JSON.stringify(meta)}` : '';
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`);
}

export function parseImageUrl(imageUrl) {
  if (!imageUrl) return { slug: '', ext: 'png' };

  let slug = '';
  let ext = 'png';

  // Extract extension if any
  const extMatch = imageUrl.match(/\.([a-z0-9]+)(?:[?#]|$)/i);
  if (extMatch) {
    ext = extMatch[1].toLowerCase();
  }

  // Check if Cloudinary URL
  if (imageUrl.includes('cloudinary.com')) {
    // Cloudinary format: .../image/upload/v12345678/public_id.ext
    // or .../image/upload/public_id.ext
    const match = imageUrl.match(/\/image\/upload\/(?:v\d+\/)?([^?#]+)/);
    if (match && match[1]) {
      slug = match[1];
      // strip extension from slug
      if (slug.endsWith('.' + ext)) {
        slug = slug.substring(0, slug.length - ext.length - 1);
      }
    }
  }

  // Fallback for other URLs (e.g. img.mrprem.in or others)
  if (!slug) {
    try {
      const parsedUrl = new URL(imageUrl);
      // Remove leading slash and extension
      let pathname = parsedUrl.pathname;
      if (pathname.startsWith('/')) {
        pathname = pathname.substring(1);
      }
      if (pathname.endsWith('.' + ext)) {
        pathname = pathname.substring(0, pathname.length - ext.length - 1);
      }
      slug = pathname || 'media-' + Math.random().toString(36).substr(2, 5);
    } catch (e) {
      slug = 'media-' + Math.random().toString(36).substr(2, 5);
    }
  }

  return { slug, ext };
}

