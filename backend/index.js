require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const supabase = require('./supabase');
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const app = express();

app.use(cors());
app.use(express.json());

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer Storage for Cloudinary
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

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_here';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ error: 'No token provided.' });
  
  const tokenParts = token.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(403).json({ error: 'Malformed token.' });
  }

  jwt.verify(tokenParts[1], JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Session expired. Please login again.' });
    req.userId = decoded.id;
    next();
  });
};

// API: Submit Contact Form
// API: Submit Contact Form
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([{ name, email, message, date: new Date().toISOString() }])
      .select();

    if (error) throw error;
    res.status(201).json({ success: true, id: data ? data[0].id : null });
  } catch (error) {
    console.error('Supabase Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Admin Login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ id: 1, username }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ auth: true, token });
  } else {
    res.status(401).json({ auth: false, error: 'Invalid credentials' });
  }
});

// API: Get Messages (Protected)
app.get('/api/admin/messages', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Supabase Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Delete Message (Protected)
app.get('/api/admin/messages/:id', verifyToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Supabase Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Get Profile Image Path
app.get('/api/profile-image', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'profileImage')
      .single();

    res.json({ imageUrl: data ? data.value : '/assets/profile.jpg' });
  } catch (error) {
    console.error('Supabase Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Upload Profile Image (Protected)
app.post('/api/admin/upload-profile', verifyToken, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
  
  const imageUrl = req.file.path; // Cloudinary URL
  
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'profileImage', value: imageUrl });

    if (error) throw error;
    res.json({ success: true, imageUrl, message: 'Profile image updated' });
  } catch (error) {
    console.error('Supabase Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Get Resume Path
app.get('/api/resume', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'resumeUrl')
      .single();

    res.json({ resumeUrl: data ? data.value : '/resume.pdf' });
  } catch (error) {
    console.error('Supabase Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Upload Resume (Protected)
app.post('/api/admin/upload-resume', verifyToken, upload.single('resume'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No resume uploaded' });
  
  const resumeUrl = req.file.path; // Cloudinary URL
  
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'resumeUrl', value: resumeUrl });

    if (error) throw error;
    res.json({ success: true, resumeUrl, message: 'Resume updated' });
  } catch (error) {
    console.error('Supabase Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- PROJECTS APIs ---

// API: Get All Projects
app.get('/api/projects', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Supabase Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Get Single Project
app.get('/api/projects/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (data) {
      res.json(data);
    } else {
      res.status(404).json({ error: 'Project not found' });
    }
  } catch (error) {
    console.error('Supabase Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Create Project (Protected)
app.post('/api/admin/projects', verifyToken, async (req, res) => {
  const { title, description, tags, link, github, pptLink } = req.body;
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert([{ title, description, tags, link, github, pptLink }])
      .select();

    if (error) throw error;
    res.status(201).json({ success: true, id: data[0].id });
  } catch (error) {
    console.error('Supabase Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Update Project (Protected)
app.put('/api/admin/projects/:id', verifyToken, async (req, res) => {
  const { title, description, tags, link, github, pptLink } = req.body;
  try {
    const { error } = await supabase
      .from('projects')
      .update({ title, description, tags, link, github, pptLink })
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Supabase Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Delete Project (Protected)
app.delete('/api/admin/projects/:id', verifyToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Supabase Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- FAVICON APIs ---

// API: Get Favicon Path
app.get('/api/favicon', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'faviconUrl')
      .single();

    res.json({ faviconUrl: data ? data.value : '/vite.svg' });
  } catch (error) {
    console.error('Supabase Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Upload Favicon (Protected)
app.post('/api/admin/upload-favicon', verifyToken, upload.single('favicon'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No favicon uploaded' });
  
  const faviconUrl = req.file.path; // Cloudinary URL
  
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'faviconUrl', value: faviconUrl });

    if (error) throw error;
    res.json({ success: true, faviconUrl, message: 'Favicon updated' });
  } catch (error) {
    console.error('Supabase Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- CERTIFICATES APIs ---

// API: Get All Certificates
app.get('/api/certificates', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Supabase Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Get Single Certificate
app.get('/api/certificates/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (data) {
      res.json(data);
    } else {
      res.status(404).json({ error: 'Certificate not found' });
    }
  } catch (error) {
    console.error('Supabase Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Create Certificate (Protected)
app.post('/api/admin/certificates', verifyToken, upload.single('certificate_image'), async (req, res) => {
  const { title, description, date } = req.body;
  if (!req.file) return res.status(400).json({ error: 'Image is required' });
  
  const imageUrl = req.file.path; // Cloudinary URL
  
  try {
    const { data, error } = await supabase
      .from('certificates')
      .insert([{ title, description, date, image: imageUrl }])
      .select();

    if (error) throw error;
    res.status(201).json({ success: true, id: data[0].id });
  } catch (error) {
    console.error('Supabase Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Update Certificate (Protected)
app.put('/api/admin/certificates/:id', verifyToken, upload.single('certificate_image'), async (req, res) => {
  const { title, description, date } = req.body;
  const updateData = { title, description, date };
  
  if (req.file) {
    updateData.image = req.file.path;
  }
  
  try {
    const { error } = await supabase
      .from('certificates')
      .update(updateData)
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Supabase Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Delete Certificate (Protected)
app.delete('/api/admin/certificates/:id', verifyToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('certificates')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Supabase Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
