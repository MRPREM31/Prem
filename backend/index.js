require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { dbPromise, setupDatabase } = require('./database');
const multer = require('multer');
const path = require('path');
const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const fs = require('fs');
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    if (file.fieldname === 'resume') {
      cb(null, 'Prem_Prasad_Pradhan_cv.pdf');
    } else if (file.fieldname === 'image') {
      cb(null, 'Prem_Prasad_Pradhan_Image' + path.extname(file.originalname));
    } else if (file.fieldname === 'favicon') {
      cb(null, 'favicon' + path.extname(file.originalname));
    } else {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }
});
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf|ico|svg/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype) || file.mimetype === 'application/pdf' || file.mimetype.includes('svg');
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only .png, .jpg, .jpeg, .pdf, .ico, and .svg formats allowed!'));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_here';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Initialize DB
setupDatabase();

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ error: 'No token provided.' });
  
  const tokenParts = token.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(403).json({ error: 'Malformed token.' });
  }

  jwt.verify(tokenParts[1], JWT_SECRET, (err, decoded) => {
    if (err) return res.status(500).json({ error: 'Failed to authenticate token.' });
    req.userId = decoded.id;
    next();
  });
};

// API: Submit Contact Form
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const db = await dbPromise;
    const date = new Date().toISOString();
    await db.run(
      'INSERT INTO messages (name, email, message, date) VALUES (?, ?, ?, ?)',
      [name, email, message, date]
    );
    res.status(201).json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Internal server error' });
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
    const db = await dbPromise;
    const messages = await db.all('SELECT * FROM messages ORDER BY id DESC');
    res.json(messages);
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Delete Message (Protected)
app.delete('/api/admin/messages/:id', verifyToken, async (req, res) => {
  try {
    const db = await dbPromise;
    await db.run('DELETE FROM messages WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Get Profile Image Path
app.get('/api/profile-image', async (req, res) => {
  try {
    const db = await dbPromise;
    const setting = await db.get('SELECT value FROM settings WHERE key = ?', ['profileImage']);
    res.json({ imageUrl: setting ? setting.value : '/assets/profile.jpg' });
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Upload Profile Image (Protected)
app.post('/api/admin/upload-profile', verifyToken, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }
  
  const imageUrl = `/uploads/${req.file.filename}`;
  
  try {
    const db = await dbPromise;
    await db.run(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
      ['profileImage', imageUrl, imageUrl]
    );
    res.json({ success: true, imageUrl, message: 'Profile image updated' });
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Get Resume Path
app.get('/api/resume', async (req, res) => {
  try {
    const db = await dbPromise;
    const setting = await db.get('SELECT value FROM settings WHERE key = ?', ['resumeUrl']);
    res.json({ resumeUrl: setting ? setting.value : '/resume.pdf' });
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Upload Resume (Protected)
app.post('/api/admin/upload-resume', verifyToken, upload.single('resume'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No resume uploaded' });
  }
  
  const resumeUrl = `/uploads/${req.file.filename}`;
  
  try {
    const db = await dbPromise;
    await db.run(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
      ['resumeUrl', resumeUrl, resumeUrl]
    );
    res.json({ success: true, resumeUrl, message: 'Resume updated' });
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- PROJECTS APIs ---

// API: Get All Projects
app.get('/api/projects', async (req, res) => {
  try {
    const db = await dbPromise;
    const projects = await db.all('SELECT * FROM projects ORDER BY id DESC');
    res.json(projects);
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Get Single Project
app.get('/api/projects/:id', async (req, res) => {
  try {
    const db = await dbPromise;
    const project = await db.get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    if (project) {
      res.json(project);
    } else {
      res.status(404).json({ error: 'Project not found' });
    }
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Create Project (Protected)
app.post('/api/admin/projects', verifyToken, async (req, res) => {
  const { title, description, tags, link, github, pptLink } = req.body;
  try {
    const db = await dbPromise;
    const result = await db.run(
      'INSERT INTO projects (title, description, tags, link, github, pptLink) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, tags, link, github, pptLink]
    );
    res.status(201).json({ success: true, id: result.lastID });
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Update Project (Protected)
app.put('/api/admin/projects/:id', verifyToken, async (req, res) => {
  const { title, description, tags, link, github, pptLink } = req.body;
  try {
    const db = await dbPromise;
    await db.run(
      'UPDATE projects SET title = ?, description = ?, tags = ?, link = ?, github = ?, pptLink = ? WHERE id = ?',
      [title, description, tags, link, github, pptLink, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Delete Project (Protected)
app.delete('/api/admin/projects/:id', verifyToken, async (req, res) => {
  try {
    const db = await dbPromise;
    await db.run('DELETE FROM projects WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- FAVICON APIs ---

// API: Get Favicon Path
app.get('/api/favicon', async (req, res) => {
  try {
    const db = await dbPromise;
    const setting = await db.get('SELECT value FROM settings WHERE key = ?', ['faviconUrl']);
    res.json({ faviconUrl: setting ? setting.value : '/vite.svg' });
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Upload Favicon (Protected)
app.post('/api/admin/upload-favicon', verifyToken, upload.single('favicon'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No favicon uploaded' });
  }
  
  const faviconUrl = `/uploads/${req.file.filename}`;
  
  try {
    const db = await dbPromise;
    await db.run(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
      ['faviconUrl', faviconUrl, faviconUrl]
    );
    res.json({ success: true, faviconUrl, message: 'Favicon updated' });
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- CERTIFICATES APIs ---

// API: Get All Certificates
app.get('/api/certificates', async (req, res) => {
  try {
    const db = await dbPromise;
    const certificates = await db.all('SELECT * FROM certificates ORDER BY id DESC');
    res.json(certificates);
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Get Single Certificate
app.get('/api/certificates/:id', async (req, res) => {
  try {
    const db = await dbPromise;
    const certificate = await db.get('SELECT * FROM certificates WHERE id = ?', [req.params.id]);
    if (certificate) {
      res.json(certificate);
    } else {
      res.status(404).json({ error: 'Certificate not found' });
    }
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Create Certificate (Protected)
app.post('/api/admin/certificates', verifyToken, upload.single('certificate_image'), async (req, res) => {
  const { title, description, date } = req.body;
  if (!req.file) return res.status(400).json({ error: 'Image is required' });
  
  const imageUrl = `/uploads/${req.file.filename}`;
  
  try {
    const db = await dbPromise;
    const result = await db.run(
      'INSERT INTO certificates (title, description, date, image) VALUES (?, ?, ?, ?)',
      [title, description, date, imageUrl]
    );
    res.status(201).json({ success: true, id: result.lastID });
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Update Certificate (Protected)
app.put('/api/admin/certificates/:id', verifyToken, upload.single('certificate_image'), async (req, res) => {
  const { title, description, date } = req.body;
  
  try {
    const db = await dbPromise;
    if (req.file) {
      const imageUrl = `/uploads/${req.file.filename}`;
      await db.run(
        'UPDATE certificates SET title = ?, description = ?, date = ?, image = ? WHERE id = ?',
        [title, description, date, imageUrl, req.params.id]
      );
    } else {
      await db.run(
        'UPDATE certificates SET title = ?, description = ?, date = ? WHERE id = ?',
        [title, description, date, req.params.id]
      );
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Delete Certificate (Protected)
app.delete('/api/admin/certificates/:id', verifyToken, async (req, res) => {
  try {
    const db = await dbPromise;
    await db.run('DELETE FROM certificates WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
