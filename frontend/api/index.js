import publicHandler from '../src/api-handlers/public.js';
import authHandler from '../src/api-handlers/auth.js';
import adminHandler from '../src/api-handlers/admin.js';
import uploadHandler from '../src/api-handlers/upload.js';
import analyticsHandler from '../src/api-handlers/analytics.js';
import aiHandler from '../src/api-handlers/ai.js';

// Disable default Vercel bodyParser so Multer can parse multi-part forms in admin & upload
export const config = {
  api: {
    bodyParser: false,
  },
};

// Custom Helper: Parse stream JSON body for handlers requiring req.body
async function parseJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;

  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        if (!data) {
          resolve({});
          return;
        }
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
    req.on('error', () => {
      resolve({});
    });
  });
}

export default async function handler(req, res) {
  const { handler: handlerName } = req.query;

  try {
    switch (handlerName) {
      case 'public': {
        // For POST endpoints (like contact or reviews), parse body manually since bodyParser is disabled
        if (req.method === 'POST') {
          req.body = await parseJsonBody(req);
        }
        return await publicHandler(req, res);
      }

      case 'auth': {
        if (req.method === 'POST') {
          req.body = await parseJsonBody(req);
        }
        return await authHandler(req, res);
      }

      case 'admin': {
        // admin.js uses Multer for uploads, which parses multi-part itself.
        // If a request is pure JSON and POST/PUT, Multer won't be used, so we can parse body if not multipart
        const contentType = req.headers['content-type'] || '';
        if (!contentType.includes('multipart/form-data') && (req.method === 'POST' || req.method === 'PUT')) {
          req.body = await parseJsonBody(req);
        }
        return await adminHandler(req, res);
      }

      case 'upload': {
        // upload.js uses Multer for file processing
        return await uploadHandler(req, res);
      }

      case 'analytics': {
        if (req.method === 'POST') {
          req.body = await parseJsonBody(req);
        }
        return await analyticsHandler(req, res);
      }

      case 'ai': {
        if (req.method === 'POST') {
          req.body = await parseJsonBody(req);
        }
        return await aiHandler(req, res);
      }

      default:
        return res.status(404).json({ error: `Handler not found: ${handlerName}` });
    }
  } catch (error) {
    console.error(`[Single Router Multiplexer Error] handler=${handlerName}:`, error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
