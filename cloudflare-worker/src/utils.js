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
