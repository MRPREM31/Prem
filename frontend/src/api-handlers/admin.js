import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import ImageKit from 'imagekit';
import bcrypt from 'bcryptjs';

// Disable default Vercel bodyParser so Multer can parse multi-part forms
export const config = {
  api: {
    bodyParser: false,
  },
};

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_here';
const VAULT_JWT_SECRET = JWT_SECRET + "_vault";

// Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || 'placeholder_public_key',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || 'placeholder_private_key',
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/placeholder'
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isPDF = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    return {
      folder: 'portfolio',
      resource_type: isPDF ? 'raw' : 'auto',
      public_id: Date.now() + '-' + file.originalname.replace(/\.[^/.]+$/, ""),
    };
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// --- VAULT ENCRYPTION DECRYPTION ---
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'prem_vault_default_secret_32_chars';
const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest('base64').substr(0, 32);
const iv = Buffer.alloc(16, 0);

function encrypt(text) {
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(text) {
  try {
    if (text.startsWith('http')) return text;
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return text;
  }
}

// --- ONESIGNAL PUSH NOTIFICATION ---
async function sendPushNotification({ title, message, url }) {
  const appId = process.env.ONESIGNAL_APP_ID || '454dcf3b-18c2-4b30-bf85-b43b67161d92';
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!apiKey || apiKey === 'your_onesignal_rest_api_key') {
    console.warn(`[OneSignal] REST API key missing. Simulating notification.`);
    return { simulated: true, success: true, id: 'simulated-push-id-' + Date.now() };
  }

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${apiKey}`
      },
      body: JSON.stringify({
        app_id: appId,
        contents: { en: message },
        headings: { en: title },
        included_segments: ['Subscribed Users'],
        url: url || 'https://mrprem.in'
      })
    });
    return await response.json();
  } catch (err) {
    console.error('[OneSignal Error]:', err.message);
    throw err;
  }
}

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

// Helper: JWT verification middleware
function verifyToken(req) {
  let token = req.headers['authorization'] || req.headers['Authorization'];
  if (!token && req.query.token) token = `Bearer ${req.query.token}`;
  if (!token) throw new Error('No token provided.');
  
  const tokenParts = token.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') throw new Error('Malformed token.');
  
  return jwt.verify(tokenParts[1], JWT_SECRET);
}

function verifySuperAdmin(user) {
  if (!user || user.email !== 'mr.prem2006@gmail.com') {
    throw new Error('Access Denied: Personal Vault is only for the Primary Super Admin.');
  }
}

function verifyFrontendVaultToken(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader) throw new Error('No token provided');
  const token = authHeader.split(' ')[1];
  return jwt.verify(token, VAULT_JWT_SECRET);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse path and action
  const { route, id } = req.query;

  try {
    // ----------------------------------------------------
    // FRONTEND VAULT USER ROUTES (Protected by Vault Token)
    // ----------------------------------------------------
    if (route === 'vault-links') {
      try {
        verifyFrontendVaultToken(req);
      } catch (authErr) {
        return res.status(401).json({ error: authErr.message });
      }

      if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
      const { data, error } = await supabase.from('secure_links').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (route === 'vault-open-link') {
      try {
        verifyFrontendVaultToken(req);
      } catch (authErr) {
        return res.status(401).json({ error: authErr.message });
      }

      if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
      const { data, error } = await supabase.from('secure_links').select('google_drive_link').eq('id', id).single();
      if (error || !data) return res.status(404).json({ error: 'Link not found or unauthorized.' });
      return res.status(200).json({ url: data.google_drive_link });
    }

    // ----------------------------------------------------
    // ADMIN DASHBOARD ROUTES (Protected by standard JWT Token)
    // ----------------------------------------------------
    let adminUser;
    try {
      adminUser = verifyToken(req);
    } catch (authErr) {
      return res.status(401).json({ error: authErr.message });
    }

    switch (route) {
      case 'secure-links': {
        verifySuperAdmin(adminUser);
        if (req.method === 'GET') {
          const { data } = await supabase.from('secure_links').select('*').order('created_at', { ascending: false });
          return res.status(200).json(data || []);
        }
        
        await runMiddleware(req, res, upload.none());
        const { title, google_drive_link, category } = req.body;

        if (req.method === 'POST') {
          const { data, error } = await supabase.from('secure_links').insert([{ title, google_drive_link, category, created_at: new Date().toISOString() }]).select();
          if (error) throw error;
          return res.status(201).json(data[0]);
        }
        if (req.method === 'PUT') {
          const { data, error } = await supabase.from('secure_links').update({ title, google_drive_link, category }).eq('id', id).select();
          if (error) throw error;
          return res.status(200).json(data[0]);
        }
        if (req.method === 'DELETE') {
          const { error } = await supabase.from('secure_links').delete().eq('id', id);
          if (error) throw error;
          return res.status(200).json({ success: true });
        }
        break;
      }

      case 'maintenance': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
        await runMiddleware(req, res, upload.none());
        const { maintenance_enabled, start_time, end_time, message } = req.body;

        const { data, error } = await supabase.from('maintenance_settings').upsert({ id: 1, maintenance_enabled: maintenance_enabled === 'true' || maintenance_enabled === true, start_time: start_time || null, end_time: end_time || null, message }).select();
        if (error) throw error;

        // Auto notifications if maintenance turned off could be handled in a background task
        return res.status(200).json({ success: true, settings: data[0] });
      }

      case 'whitelist': {
        if (req.method === 'GET') {
          const { data } = await supabase.from('admins').select('id, email, is_super_admin, created_at').order('created_at', { ascending: true });
          return res.status(200).json(data || []);
        }
        
        await runMiddleware(req, res, upload.none());
        const { email, password } = req.body;

        if (req.method === 'POST') {
          verifySuperAdmin(adminUser);
          const hashedPassword = await bcrypt.hash(password, 10);
          const { data, error } = await supabase.from('admins').insert([{ email, password: hashedPassword, is_super_admin: false }]).select();
          if (error) throw error;
          return res.status(201).json({ success: true, admin: data[0] });
        }
        if (req.method === 'DELETE') {
          verifySuperAdmin(adminUser);
          const { data: targetAdmin } = await supabase.from('admins').select('email').eq('id', id).single();
          if (targetAdmin && targetAdmin.email === 'mr.prem2006@gmail.com') {
            return res.status(403).json({ error: 'Cannot remove the primary super admin.' });
          }
          const { error } = await supabase.from('admins').delete().eq('id', id);
          if (error) throw error;
          return res.status(200).json({ success: true, message: 'Admin removed from whitelist' });
        }
        break;
      }

      case 'reset-admin-password': {
        verifySuperAdmin(adminUser);
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
        await runMiddleware(req, res, upload.none());
        const { adminId, newPassword } = req.body;

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const { error } = await supabase.from('admins').update({ password: hashedPassword }).eq('id', adminId);
        if (error) throw error;
        return res.status(200).json({ success: true, message: 'Password reset successful' });
      }

      case 'vault-files': {
        verifySuperAdmin(adminUser);
        if (req.method === 'GET') {
          const { data } = await supabase.from('personal_files').select('*').order('created_at', { ascending: false });
          return res.status(200).json(data || []);
        }
        
        await runMiddleware(req, res, upload.none());
        const { file_name, file_url, category, description } = req.body;

        if (req.method === 'POST') {
          const encryptedUrl = encrypt(file_url);
          const { data, error } = await supabase.from('personal_files').insert([{ file_name, file_url: encryptedUrl, category, description, created_at: new Date().toISOString() }]).select();
          if (error) throw error;
          return res.status(201).json(data[0]);
        }
        if (req.method === 'PUT') {
          const encryptedUrl = encrypt(file_url);
          const { data, error } = await supabase.from('personal_files').update({ file_name, file_url: encryptedUrl, category, description }).eq('id', id).select();
          if (error) throw error;
          return res.status(200).json(data[0]);
        }
        if (req.method === 'DELETE') {
          const { error } = await supabase.from('personal_files').delete().eq('id', id);
          if (error) throw error;
          return res.status(200).json({ success: true });
        }
        break;
      }

      case 'open-vault-file': {
        verifySuperAdmin(adminUser);
        if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
        const { data, error } = await supabase.from('personal_files').select('file_url').eq('id', id).single();
        if (error || !data) return res.status(404).send('File not found');

        const decryptedUrl = decrypt(data.file_url);
        res.writeHead(302, { Location: decryptedUrl });
        return res.end();
      }

      case 'vault-credentials': {
        verifySuperAdmin(adminUser);
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
        await runMiddleware(req, res, upload.none());
        const { username, password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);
        const { error } = await supabase.from('access_users').upsert({ id: 1, username, encrypted_password: hashedPassword, created_at: new Date().toISOString() });
        if (error) throw error;
        return res.status(200).json({ success: true, message: 'Vault credentials updated successfully.' });
      }

      case 'messages': {
        if (req.method === 'GET') {
          const { data, count } = await supabase.from('messages').select('*', { count: 'exact' }).order('date', { ascending: false });
          return res.status(200).json({ messages: data || [], totalCount: count || 0 });
        }
        if (req.method === 'DELETE') {
          const { error } = await supabase.from('messages').delete().eq('id', id);
          if (error) throw error;
          return res.status(200).json({ success: true });
        }
        break;
      }

      case 'messages-detail': {
        if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
        const { data, error } = await supabase.from('messages').select('*').eq('id', id).single();
        if (error || !data) return res.status(404).json({ error: 'Message not found' });
        return res.status(200).json(data);
      }

      case 'stats': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
        await runMiddleware(req, res, upload.none());
        const { years_exp, projects_completed, startups_leadership } = req.body;

        await supabase.from('settings').upsert({ key: 'stats_years_exp', value: years_exp });
        await supabase.from('settings').upsert({ key: 'stats_projects_completed', value: projects_completed });
        await supabase.from('settings').upsert({ key: 'stats_startups_leadership', value: startups_leadership });

        return res.status(200).json({ success: true, message: 'Statistics updated successfully.' });
      }

      case 'reviews': {
        if (req.method === 'GET') {
          const { data } = await supabase.from('project_reviews').select('*, projects(title)').order('created_at', { ascending: false });
          return res.status(200).json(data || []);
        }
        if (req.method === 'DELETE') {
          const { error } = await supabase.from('project_reviews').delete().eq('id', id);
          if (error) throw error;
          return res.status(200).json({ success: true });
        }
        break;
      }

      case 'projects': {
        await runMiddleware(req, res, upload.none());
        const { title, description, live_url, github_url, tags, category, custom_slug } = req.body;
        const slug = custom_slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        if (req.method === 'POST') {
          const { data, error } = await supabase.from('projects').insert([{ title, description, live_url, github_url, tags, category, slug, created_at: new Date().toISOString() }]).select();
          if (error) throw error;
          return res.status(201).json(data[0]);
        }
        if (req.method === 'PUT') {
          const { data, error } = await supabase.from('projects').update({ title, description, live_url, github_url, tags, category, slug }).eq('id', id).select();
          if (error) throw error;
          return res.status(200).json(data[0]);
        }
        if (req.method === 'DELETE') {
          const { error } = await supabase.from('projects').delete().eq('id', id);
          if (error) throw error;
          return res.status(200).json({ success: true });
        }
        break;
      }

      case 'project-images-upload': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
        await runMiddleware(req, res, upload.array('images', 10));
        if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No images uploaded' });

        const imageData = req.files.map(file => ({
          project_id: id,
          image_url: file.path,
          alt_text: req.body.alt_text || 'Project Screenshot'
        }));

        const { data, error } = await supabase.from('project_images').insert(imageData).select();
        if (error) throw error;
        return res.status(201).json({ success: true, images: data });
      }

      case 'project-images': {
        await runMiddleware(req, res, upload.none());
        if (req.method === 'PUT') {
          const { alt_text } = req.body;
          const { error } = await supabase.from('project_images').update({ alt_text }).eq('id', id);
          if (error) throw error;
          return res.status(200).json({ success: true });
        }
        if (req.method === 'DELETE') {
          const { error } = await supabase.from('project_images').delete().eq('id', id);
          if (error) throw error;
          return res.status(200).json({ success: true });
        }
        break;
      }

      case 'certificates': {
        await runMiddleware(req, res, upload.single('certificate_image'));
        const { title, issuer, issue_date, credential_url, custom_slug } = req.body;
        const slug = custom_slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const updatePayload = { title, issuer, issue_date, credential_url, slug };
        if (req.file) updatePayload.image_url = req.file.path;

        if (req.method === 'POST') {
          if (!req.file) return res.status(400).json({ error: 'Certificate image is required' });
          const { data, error } = await supabase.from('certificates').insert([updatePayload]).select();
          if (error) throw error;
          return res.status(201).json(data[0]);
        }
        if (req.method === 'PUT') {
          const { data, error } = await supabase.from('certificates').update(updatePayload).eq('id', id).select();
          if (error) throw error;
          return res.status(200).json(data[0]);
        }
        if (req.method === 'DELETE') {
          const { error } = await supabase.from('certificates').delete().eq('id', id);
          if (error) throw error;
          return res.status(200).json({ success: true });
        }
        break;
      }

      case 'skills': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
        await runMiddleware(req, res, upload.none());
        const { skills } = req.body;

        const { error } = await supabase.from('settings').upsert({ key: 'portfolio_skills', value: typeof skills === 'string' ? skills : JSON.stringify(skills) });
        if (error) throw error;
        return res.status(200).json({ success: true, message: 'Skills updated successfully' });
      }

      case 'memorable-images': {
        await runMiddleware(req, res, upload.single('image'));
        const { title, description, custom_slug } = req.body;
        const slug = custom_slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const updatePayload = { title, description, slug };
        if (req.file) updatePayload.image_url = req.file.path;

        if (req.method === 'POST') {
          if (!req.file) return res.status(400).json({ error: 'Memory image is required' });
          const { data, error } = await supabase.from('memorable_images').insert([updatePayload]).select();
          if (error) throw error;
          return res.status(201).json(data[0]);
        }
        if (req.method === 'DELETE') {
          const { error } = await supabase.from('memorable_images').delete().eq('id', id);
          if (error) throw error;
          return res.status(200).json({ success: true });
        }
        break;
      }

      case 'send-notification': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
        await runMiddleware(req, res, upload.none());
        const { title, message, url } = req.body;
        if (!title || !message) return res.status(400).json({ error: 'Title and message are required fields.' });

        const result = await sendPushNotification({ title, message, url });
        return res.status(200).json({ success: true, result });
      }

      case 'media': {
        if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method Not Allowed' });
        const { data: media, error: fetchError } = await supabase.from('media_library').select('imagekit_file_id').eq('id', id).single();
        if (fetchError) throw fetchError;

        await imagekit.deleteFile(media.imagekit_file_id);
        const { error: deleteError } = await supabase.from('media_library').delete().eq('id', id);
        if (deleteError) throw deleteError;

        return res.status(200).json({ message: 'Media deleted successfully' });
      }

      default:
        return res.status(404).json({ error: 'Route not found' });
    }
  } catch (error) {
    console.error(`[Admin API Serverless Error] route=${route}:`, error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
