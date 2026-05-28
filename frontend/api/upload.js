import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import ImageKit from 'imagekit';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import slugify from 'slugify';
import path from 'path';

// Disable Vercel's default body parser so Multer can parse multi-part uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_here';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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

const uploadCloudinary = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadMemory = multer({
  limits: { fileSize: 5 * 1024 * 1024 }
});

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

function verifyToken(req) {
  let token = req.headers['authorization'] || req.headers['Authorization'];
  if (!token && req.query.token) token = `Bearer ${req.query.token}`;
  if (!token) throw new Error('No token provided.');
  
  const tokenParts = token.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') throw new Error('Malformed token.');
  
  return jwt.verify(tokenParts[1], JWT_SECRET);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Verify Admin Authentication
  try {
    verifyToken(req);
  } catch (authErr) {
    return res.status(401).json({ error: authErr.message });
  }

  const { route } = req.query;

  try {
    switch (route) {
      case 'upload-profile': {
        await runMiddleware(req, res, uploadCloudinary.single('image'));
        if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

        const imageUrl = req.file.path; // Cloudinary URL
        const { error } = await supabase.from('settings').upsert({ key: 'profileImage', value: imageUrl });
        if (error) throw error;

        return res.status(200).json({ success: true, imageUrl, message: 'Profile image updated' });
      }

      case 'upload-navbar': {
        await runMiddleware(req, res, uploadCloudinary.single('navbar'));
        if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

        const imageUrl = req.file.path; // Cloudinary URL
        const { error } = await supabase.from('settings').upsert({ key: 'navbarImage', value: imageUrl });
        if (error) throw error;

        return res.status(200).json({ success: true, imageUrl, message: 'Navbar image updated' });
      }

      case 'upload-resume': {
        await runMiddleware(req, res, uploadCloudinary.single('resume'));
        if (!req.file) return res.status(400).json({ error: 'No resume uploaded' });

        const resumeUrl = req.file.path; // Cloudinary URL
        const { error } = await supabase.from('settings').upsert({ key: 'resumeUrl', value: resumeUrl });
        if (error) throw error;

        return res.status(200).json({ success: true, resumeUrl, message: 'Resume updated successfully' });
      }

      case 'upload-favicon': {
        await runMiddleware(req, res, uploadCloudinary.single('favicon'));
        if (!req.file) return res.status(400).json({ error: 'No favicon uploaded' });

        const faviconUrl = req.file.path; // Cloudinary URL
        const { error } = await supabase.from('settings').upsert({ key: 'faviconUrl', value: faviconUrl });
        if (error) throw error;

        return res.status(200).json({ success: true, faviconUrl, message: 'Favicon updated successfully' });
      }

      case 'upload-signature': {
        await runMiddleware(req, res, uploadCloudinary.single('signature'));
        if (!req.file) return res.status(400).json({ error: 'No signature uploaded' });

        const signatureUrl = req.file.path; // Cloudinary URL
        const { error } = await supabase.from('settings').upsert({ key: 'signatureUrl', value: signatureUrl });
        if (error) throw error;

        return res.status(200).json({ success: true, signatureUrl, message: 'Signature updated successfully' });
      }

      case 'upload-media': {
        await runMiddleware(req, res, uploadMemory.single('image'));
        const file = req.file;
        if (!file) return res.status(400).json({ error: 'No image provided' });

        const { name } = req.body;
        const slug = slugify(name || file.originalname, { lower: true, strict: true });

        // Upload directly to ImageKit
        const uploadResponse = await imagekit.upload({
          file: file.buffer,
          fileName: slug + path.extname(file.originalname),
          folder: '/portfolio_media'
        });

        const direct_image_url = `https://img.mrprem.in${uploadResponse.filePath}`;

        // Save to Supabase
        const { data, error } = await supabase
          .from('media_library')
          .insert([{
            name: name || file.originalname,
            slug: slug + '-' + Math.random().toString(36).substr(2, 5),
            url: uploadResponse.url,
            direct_image_url: direct_image_url,
            imagekit_file_id: uploadResponse.fileId,
            size: file.size,
            uploaded_by: 'Admin'
          }])
          .select()
          .single();

        if (error) throw error;
        return res.status(201).json(data);
      }

      default:
        return res.status(404).json({ error: 'Route not found' });
    }
  } catch (error) {
    console.error(`[Upload API Serverless Error] route=${route}:`, error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
