/**
 * HS256 JWT Token Verification for Cloudflare Workers using Web Crypto API.
 */

// Helper to convert base64url string to ArrayBuffer
function base64urlToArrayBuffer(base64url) {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(padLen);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Verifies HS256 JWT signature and decodes the payload
export async function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const dataToVerify = encoder.encode(`${headerB64}.${payloadB64}`);
    
    // Import HMAC Key
    const key = await crypto.subtle.importKey(
      'raw', 
      keyData, 
      { name: 'HMAC', hash: 'SHA-256' }, 
      false, 
      ['verify']
    );
    
    const sigBuffer = base64urlToArrayBuffer(signatureB64);
    
    // Verify signature
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBuffer,
      dataToVerify
    );
    
    if (!isValid) return null;
    
    // Decode and parse payload
    const payloadStr = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadStr);

    // Validate expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    return payload;
  } catch (err) {
    console.error('[JWT verify error]:', err.message);
    return null;
  }
}

// Middleware helper to authenticate requests
export async function authenticateRequest(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const secret = env.JWT_SECRET || 'super_secret_jwt_key_here';
  
  return verifyJWT(token, secret);
}
