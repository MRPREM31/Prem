require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const dns = require('dns');

// Force IPv4 for email connections (Fixes Render ENETUNREACH IPv6 issue)
dns.setDefaultResultOrder('ipv4first');
const supabase = require('./supabase');
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const Groq = require('groq-sdk');
const app = express();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const PREM_KNOWLEDGE = `
Core Identity:
Full Name: Prem Prasad Pradhan (Known as MR.PREM / MRPREM31).
Role: Software Developer, Founder of QuantumCoders Tech Lab & Data Solutions, and Startup-minded Creator.
Education Journey:
- Early Education: Saraswati Sishu Mandir.
- Schooling: Odisha Adarsha Vidyalaya (OAV).
- Higher Secondary: Nalanda Shree Higher Secondary School.
- B.Tech: Currently pursuing B.Tech at NIST University, Berhampur (2023-Present).
Location: Odisha, India.
Goal: To build scalable startup-level products and companies and become a highly successful developer brand.

Technical Arsenal:
- Programming: HTML5, CSS3, JavaScript (ES6+), React.js, Node.js, Express.js, MongoDB, Supabase, Python, C/C++.
- Design & UI: Glassmorphism UI, Tailwind CSS, Canva, Responsive SaaS-style layouts.
- AI & Advanced: Groq AI APIs, LLaMA Models, AI Chatbot Systems, GitHub API Integrations.
- Tools: Git, GitHub, Cloudinary, Multer, Nodemailer.

Professional Experience:
- Team Lead & Vendor @ DesiCrew: Managed AI data projects, coordinated remote teams, handled reporting and mentoring.
- Founder @ QuantumCoders: Building AI-powered digital solutions and startup ecosystems.

Major Projects:
- AI Medical Diagnostics System: An AI healthcare platform using specialist agents for medical report analysis.
- Adarsha Pathasala Website: Modern AI-enabled educational site with enquiry automation.
- Productivity Dashboard: Smart platform with weather, clock, calculator, and personalization.
- STEM Quest: Gamified learning platform for rural education (Smart India Hackathon).
- FarmQuest: Gamified sustainable farming platform for rural farmers.
- GitHub Insights: Advanced developer analytics dashboard (Live on this portfolio).

Prem's Vision: Prem focuses on combining technology, creativity, and automation into professional digital products with real-world impact.
`;

// --- VAULT ENCRYPTION CONFIG ---
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'prem_vault_default_secret_32_chars'; // Must be 32 chars for aes-256
// Ensure key is 32 bytes
const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest('base64').substr(0, 32);
const iv = Buffer.alloc(16, 0); // Using a fixed IV for this simple implementation

function encrypt(text) {
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(text) {
  try {
    // If it's already a URL (not hex), return as is (fallback for existing data)
    if (text.startsWith('http')) return text;
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return text; // Return original if decryption fails (likely old data)
  }
}

console.log("Email user loaded:", process.env.EMAIL_USER ? "YES" : "NO");

// Nodemailer Transporter Configuration (Forced IPv4 for Render)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // TLS
  family: 4, // Force IPv4
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify SMTP Connection on Startup
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP Connection Error:', error);
  } else {
    console.log('SMTP Server is ready to take our messages');
  }
});

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
  let token = req.headers['authorization'];
  
  // Also check query params for "open in new tab" scenarios
  if (!token && req.query.token) {
    token = `Bearer ${req.query.token}`;
  }

  if (!token) return res.status(403).json({ error: 'No token provided.' });
  
  const tokenParts = token.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(403).json({ error: 'Malformed token.' });
  }

  jwt.verify(tokenParts[1], JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Session expired. Please login again.' });
    req.user = decoded;
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
    res.status(201).json({ success: true, id: (data && data.length > 0) ? data[0].id : null });
  } catch (error) {
    console.error('Supabase Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const bcrypt = require('bcryptjs');

// API: Admin Login (Email Whitelist System)
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // 1. Check if email exists in whitelist (admins table)
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      // Check if the table even exists (PostgREST error code 42P01 is "undefined_table")
      if (error.code === '42P01') {
        return res.status(500).json({ 
          error: 'Database Error: The "admins" table does not exist in Supabase. Please create it to enable the new security system.' 
        });
      }

      // If table is empty, try bootstrap login
      const { count, error: countError } = await supabase.from('admins').select('*', { count: 'exact', head: true });
      
      if (!countError && count === 0 && email === 'mr.prem2006@gmail.com' && password === ADMIN_PASSWORD) {
        // First time setup: Auto-create the super admin
        const hashedPassword = await bcrypt.hash(password, 10);
        await supabase.from('admins').insert([{ email, password: hashedPassword, is_super_admin: true }]);
        
        const token = jwt.sign({ id: email, email, isSuperAdmin: true }, JWT_SECRET, { expiresIn: '8h' });
        return res.json({ auth: true, token, email });
      }

      if (!admin) {
        return res.status(401).json({ auth: false, error: 'Unauthorized Access: Email not in whitelist' });
      }
    }

    // 2. Verify password
    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      return res.status(401).json({ auth: false, error: 'Invalid password' });
    }

    // 3. Generate token
    const token = jwt.sign(
      { id: admin.id, email: admin.email, isSuperAdmin: admin.is_super_admin }, 
      JWT_SECRET, 
      { expiresIn: '8h' }
    );

    res.json({ auth: true, token, email: admin.email });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// API: Get Admin Whitelist (Protected)
app.get('/api/admin/whitelist', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('id, email, is_super_admin, created_at')
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Add Admin to Whitelist (Protected, Super Admin Only)
app.post('/api/admin/whitelist', verifyToken, async (req, res) => {
  const { email, password } = req.body;
  
  // Verify if requester is super admin (decoded from token)
  // Note: For now we'll allow any logged in admin if they match the primary email
  // but a robust check uses the token payload.
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const { data, error } = await supabase
      .from('admins')
      .insert([{ email, password: hashedPassword, is_super_admin: false }])
      .select();

    if (error) throw error;
    res.status(201).json({ success: true, admin: data[0] });
  } catch (error) {
    res.status(500).json({ error: 'Could not add admin. Email might already exist.' });
  }
});

// API: Remove Admin from Whitelist (Protected, Super Admin Only)
app.delete('/api/admin/whitelist/:id', verifyToken, async (req, res) => {
  try {
    // Prevent deleting oneself
    const { data: targetAdmin } = await supabase.from('admins').select('email').eq('id', req.params.id).single();
    if (targetAdmin && targetAdmin.email === 'mr.prem2006@gmail.com') {
      return res.status(403).json({ error: 'Cannot remove the primary super admin.' });
    }

    const { error } = await supabase
      .from('admins')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true, message: 'Admin removed from whitelist' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Reset Another Admin's Password (Protected, Super Admin Only)
app.post('/api/admin/reset-admin-password', verifyToken, async (req, res) => {
  const { adminId, newPassword } = req.body;
  
  // Security Check: Only allow primary super admin to reset others' passwords
  // 'email' is in req.user from verifyToken
  if (req.user.email !== 'mr.prem2006@gmail.com') {
    return res.status(403).json({ error: 'Unauthorized: Only the primary Super Admin can reset passwords.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const { error } = await supabase
      .from('admins')
      .update({ password: hashedPassword })
      .eq('id', adminId);

    if (error) throw error;
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- PERSONAL VAULT SYSTEM (SUPER ADMIN ONLY) ---

// Middleware for Vault Access
const verifySuperAdmin = (req, res, next) => {
  if (req.user && req.user.email === 'mr.prem2006@gmail.com') {
    next();
  } else {
    res.status(403).json({ error: 'Access Denied: Personal Vault is only for the Primary Super Admin.' });
  }
};

// API: Get Vault Files
app.get('/api/admin/vault-files', verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('personal_files')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Add Vault File
app.post('/api/admin/vault-files', verifyToken, verifySuperAdmin, async (req, res) => {
  const { title, file_url, category } = req.body;
  try {
    const encryptedUrl = encrypt(file_url);
    const { data, error } = await supabase
      .from('personal_files')
      .insert([{ title, file_url: encryptedUrl, category: category || 'Other' }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Update Vault File
app.put('/api/admin/vault-files/:id', verifyToken, verifySuperAdmin, async (req, res) => {
  const { title, file_url, category } = req.body;
  try {
    const encryptedUrl = encrypt(file_url);
    const { data, error } = await supabase
      .from('personal_files')
      .update({ title, file_url: encryptedUrl, category })
      .eq('id', req.params.id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Delete Vault File
app.delete('/api/admin/vault-files/:id', verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from('personal_files')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Securely Open Vault File (Redirect)
app.get('/api/admin/open-vault-file/:id', verifyToken, verifySuperAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('personal_files')
      .select('file_url')
      .eq('id', req.params.id)
      .single();

    if (error || !data) throw new Error('File not found');
    
    const decryptedUrl = decrypt(data.file_url);
    res.redirect(decryptedUrl);
  } catch (error) {
    res.status(404).send('File not found or unauthorized.');
  }
});

// --- FORGOT PASSWORD & OTP SYSTEM ---

// API: Request Password Reset OTP
app.post('/api/admin/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const { data: admin, error } = await supabase.from('admins').select('*').eq('email', email).single();
    if (error || !admin) {
      return res.status(404).json({ error: 'Email not found in whitelist' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const { error: updateError } = await supabase
      .from('admins')
      .update({ reset_otp: otp, otp_expiry: expiry })
      .eq('email', email);

    if (updateError) {
      if (updateError.code === '42703') {
        return res.status(500).json({ 
          error: 'Database Error: Missing "reset_otp" or "otp_expiry" columns in the admins table. Please add them in Supabase.' 
        });
      }
      throw updateError;
    }

    const mailOptions = {
      from: `"Prem Portfolio Admin" <${process.env.EMAIL_USER || 'mr.prem2006@gmail.com'}>`,
      to: email,
      subject: 'Your Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #6366f1; text-align: center;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password. Use the code below to proceed. This code is valid for <strong>10 minutes</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e1b4b; background: #f3f4f6; padding: 10px 20px; border-radius: 5px;">${otp}</span>
          </div>
          <p>If you did not request this, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666; text-align: center;">This is an automated message from your Portfolio Admin System.</p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: 'OTP sent to your email' });
    } catch (mailError) {
      console.error('Nodemailer Error:', mailError);
      res.status(500).json({ 
        error: `Email Error: Failed to send OTP. Please check if EMAIL_USER and EMAIL_PASS are correct in your environment variables. Details: ${mailError.message}` 
      });
    }
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// API: Verify OTP
app.post('/api/admin/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const { data: admin, error } = await supabase.from('admins').select('*').eq('email', email).single();
    if (error || !admin) return res.status(404).json({ error: 'Admin not found' });

    if (admin.reset_otp !== otp || new Date() > new Date(admin.otp_expiry)) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    res.json({ success: true, message: 'OTP verified' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Reset Password
app.post('/api/admin/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const { data: admin, error } = await supabase.from('admins').select('*').eq('email', email).single();
    if (error || !admin) return res.status(404).json({ error: 'Admin not found' });

    if (admin.reset_otp !== otp || new Date() > new Date(admin.otp_expiry)) {
      return res.status(400).json({ error: 'Session expired. Please request a new OTP.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await supabase.from('admins').update({ 
      password: hashedPassword, 
      reset_otp: null, 
      otp_expiry: null 
    }).eq('email', email);

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Change Password (Inside Dashboard - Protected)
app.post('/api/admin/change-password', verifyToken, async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;
  try {
    const { data: admin, error } = await supabase.from('admins').select('*').eq('email', email).single();
    if (error || !admin) return res.status(404).json({ error: 'Admin not found' });

    const match = await bcrypt.compare(currentPassword, admin.password);
    if (!match) return res.status(401).json({ error: 'Current password incorrect' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await supabase.from('admins').update({ password: hashedPassword }).eq('email', email);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Get Messages (Protected, with Pagination)
app.get('/api/admin/messages', verifyToken, async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const { data, error, count } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .order('id', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) throw error;
    res.json({ messages: data, totalCount: count });
  } catch (error) {
    console.error('Supabase Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Get Message Detail (Protected)
app.get('/api/admin/messages/detail/:id', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Supabase Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Delete Message (Protected)
app.delete('/api/admin/messages/:id', verifyToken, async (req, res) => {
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

// API: Direct Profile Image Redirect (for GitHub README)
app.get('/api/profile-image/direct', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'profileImage')
      .single();

    if (data && data.value) {
      // If it's a Cloudinary URL, it's already full. 
      // If it's a local path (old system), we prepend the site URL.
      const imageUrl = data.value.startsWith('http') 
        ? data.value 
        : `https://mrprem.in${data.value}`;
      res.redirect(imageUrl);
    } else {
      res.redirect('https://mrprem.in/assets/profile.jpg');
    }
  } catch (error) {
    res.redirect('https://mrprem.in/assets/profile.jpg');
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

// API: Get Navbar Image Path
app.get('/api/navbar-image', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'navbarImage')
      .single();

    res.json({ imageUrl: data ? data.value : '/assets/profile.jpg' });
  } catch (error) {
    console.error('Supabase Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Upload Navbar Image (Protected)
app.post('/api/admin/upload-navbar', verifyToken, upload.single('navbar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
  const imageUrl = req.file.path;
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'navbarImage', value: imageUrl });

    if (error) throw error;
    res.json({ success: true, imageUrl, message: 'Navbar image updated' });
  } catch (error) {
    console.error('Supabase Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Get Portfolio Stats
app.get('/api/stats', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['stats_years_exp', 'stats_projects_completed', 'stats_startups_leadership']);

    if (error) throw error;
    
    const stats = {
      years_exp: '2+',
      projects_completed: '10+',
      startups_leadership: '2'
    };
    
    if (data) {
      data.forEach(item => {
        if (item.key === 'stats_years_exp') stats.years_exp = item.value;
        if (item.key === 'stats_projects_completed') stats.projects_completed = item.value;
        if (item.key === 'stats_startups_leadership') stats.startups_leadership = item.value;
      });
    }
    
    res.json(stats);
  } catch (error) {
    console.error('Supabase Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Update Portfolio Stats (Protected)
app.post('/api/admin/stats', verifyToken, async (req, res) => {
  const { years_exp, projects_completed, startups_leadership } = req.body;
  try {
    const statsData = [
      { key: 'stats_years_exp', value: years_exp },
      { key: 'stats_projects_completed', value: projects_completed },
      { key: 'stats_startups_leadership', value: startups_leadership }
    ];
    
    const { error } = await supabase
      .from('settings')
      .upsert(statsData);

    if (error) throw error;
    res.json({ success: true, message: 'Stats updated' });
  } catch (error) {
    console.error('Supabase Error:', error);
    res.status(500).json({ error: error.message });
  }
});
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
    res.status(201).json({ success: true, id: (data && data.length > 0) ? data[0].id : null });
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
  const faviconUrl = req.file.path;
  try {
    const { error } = await supabase.from('settings').upsert({ key: 'faviconUrl', value: faviconUrl });
    if (error) throw error;
    res.json({ success: true, faviconUrl, message: 'Favicon updated' });
  } catch (error) {
    console.error('Supabase Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Get Signature Path
app.get('/api/signature', async (req, res) => {
  try {
    const { data, error } = await supabase.from('settings').select('value').eq('key', 'signatureUrl').single();
    res.json({ signatureUrl: data ? data.value : '' });
  } catch (error) {
    console.error('Supabase Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Upload Signature (Protected)
app.post('/api/admin/upload-signature', verifyToken, upload.single('signature'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No signature uploaded' });
  const signatureUrl = req.file.path;
  try {
    const { error } = await supabase.from('settings').upsert({ key: 'signatureUrl', value: signatureUrl });
    if (error) throw error;
    res.json({ success: true, signatureUrl, message: 'Signature updated' });
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
    res.status(201).json({ success: true, id: (data && data.length > 0) ? data[0].id : null });
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

// --- SKILLS APIs ---

// API: Get All Skills (from settings)
app.get('/api/skills', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'portfolio_skills')
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows found"
    
    if (data) {
      res.json(JSON.parse(data.value));
    } else {
      // Return default skills if none found in DB
      const defaultSkills = [
        {
          title: 'Languages',
          icon: 'FaCode',
          skills: [
            { name: 'C', icon: 'SiC' },
            { name: 'C++', icon: 'SiCplusplus' },
            { name: 'Python', icon: 'FaPython' },
            { name: 'JavaScript', icon: 'FaJs' }
          ]
        },
        {
          title: 'Technologies',
          icon: 'FaLaptopCode',
          skills: [
            { name: 'HTML', icon: 'FaHtml5' },
            { name: 'CSS', icon: 'FaCss3Alt' },
            { name: 'React', icon: 'FaReact' },
            { name: 'Node.js', icon: 'FaNodeJs' },
            { name: 'Flask', icon: 'FaFlask' },
            { name: 'APIs', icon: 'FaPlug' }
          ]
        },
        {
          title: 'Tools',
          icon: 'FaTools',
          skills: [
            { name: 'GitHub', icon: 'FaGithub' },
            { name: 'Android Studio', icon: 'FaMobileAlt' },
            { name: 'Google Apps Script', icon: 'FaFileCode' }
          ]
        },
        {
          title: 'Other',
          icon: 'FaDatabase',
          skills: [
            { name: 'DBMS', icon: 'FaDatabase' },
            { name: 'Canva (Design)', icon: 'FaPaintBrush' },
            { name: 'AI/Data Annotation', icon: 'FaBrain' }
          ]
        }
      ];
      res.json(defaultSkills);
    }
  } catch (error) {
    console.error('Supabase Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Update Skills (Protected)
app.post('/api/admin/skills', verifyToken, async (req, res) => {
  const skillsData = req.body;
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'portfolio_skills', value: JSON.stringify(skillsData) });

    if (error) throw error;
    res.json({ success: true, message: 'Skills updated' });
  } catch (error) {
    console.error('Supabase Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- MEMORABLE IMAGES APIs ---

// API: Get All Memorable Images
app.get('/api/memorable-images', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('memorable_images')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Supabase Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Create Memorable Image (Protected)
app.post('/api/admin/memorable-images', verifyToken, upload.single('image'), async (req, res) => {
  const { title } = req.body;
  if (!req.file) return res.status(400).json({ error: 'Image is required' });
  
  const imageUrl = req.file.path; // Cloudinary URL
  
  // Note: width and height are available on req.file in some multer-storage-cloudinary versions
  // We handle it safely here.
  let aspectRatio = 'landscape';
  if (req.file.width && req.file.height) {
    aspectRatio = req.file.width >= req.file.height ? 'landscape' : 'portrait';
  }
  
  try {
    const { data, error } = await supabase
      .from('memorable_images')
      .insert([{ 
        title: title || 'Untitled Memory', 
        image_url: imageUrl, 
        aspect_ratio: aspectRatio,
        upload_date: new Date().toISOString() 
      }])
      .select();

    if (error) throw error;
    res.status(201).json({ success: true, id: (data && data.length > 0) ? data[0].id : null });
  } catch (error) {
    console.error('Supabase Error:', error);
    res.status(500).json({ error: `Database Error: ${error.message}` });
  }
});

// API: Delete Memorable Image (Protected)
app.delete('/api/admin/memorable-images/:id', verifyToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('memorable_images')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Supabase Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- VISITOR ANALYTICS ---

// API: Track Visitor
app.post('/api/track-visitor', async (req, res) => {
  const { sessionId } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];
  
  try {
    // Unique ID: Use sessionId from frontend if available, else fallback to IP+UA hash
    let uniqueId;
    if (sessionId) {
      uniqueId = crypto.createHash('md5').update(sessionId).digest('hex');
    } else {
      const today = new Date().toISOString().split('T')[0];
      uniqueId = crypto.createHash('md5').update(`${ip}-${userAgent}-${today}`).digest('hex');
    }

    const { error } = await supabase
      .from('visitors')
      .upsert(
        { unique_id: uniqueId, ip, user_agent: userAgent, visited_at: new Date().toISOString() },
        { onConflict: 'unique_id' }
      );

    if (error) {
      if (error.code === '42P01') {
        console.warn('Visitors table missing in Supabase. Analytics disabled.');
        return res.status(200).json({ success: false, message: 'Table missing' });
      }
      throw error;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Visitor Tracking Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// API: Get Visitor Stats
app.get('/api/visitor-stats', async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('visitors')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    
    // Return real count starting from 0
    res.json({ totalVisitors: count || 0 });
  } catch (error) {
    // If table doesn't exist, return 0
    res.json({ totalVisitors: 0 });
  }
});

// Global Error Handler (Prevents HTML error pages)
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected server error occurred.'
  });
});

// --- GITHUB INSIGHTS API ---
let githubCache = {
  data: null,
  lastFetched: null
};

app.get('/api/github-stats', async (req, res) => {
  const now = Date.now();
  const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  if (githubCache.data && githubCache.lastFetched && (now - githubCache.lastFetched < CACHE_DURATION)) {
    return res.json(githubCache.data);
  }

  try {
    const username = 'MRPREM31';
    const headers = {
      'User-Agent': 'Portfolio-Dashboard-2026'
    };
    
    // Add token if exists in ENV for higher rate limits
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    // Fetch User Profile, Repos, and Events in parallel
    const [userRes, reposRes, eventsRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`, { headers }),
      fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`, { headers }),
      fetch(`https://api.github.com/users/${username}/events/public?per_page=50`, { headers })
    ]);

    if (!userRes.ok) throw new Error('GitHub Profile Fetch Failed');
    
    const userData = await userRes.json();
    const reposData = await reposRes.json();
    const eventsData = await eventsRes.json();

    // 1. Process Repository Stats
    let totalStars = 0;
    let totalForks = 0;
    const languages = {};
    const topRepos = reposData
      .filter(repo => !repo.fork)
      .sort((a, b) => (b.stargazers_count + b.forks_count) - (a.stargazers_count + a.forks_count))
      .slice(0, 6)
      .map(repo => {
        totalStars += repo.stargazers_count;
        totalForks += repo.forks_count;
        if (repo.language) {
          languages[repo.language] = (languages[repo.language] || 0) + 1;
        }
        return {
          id: repo.id,
          name: repo.name,
          description: repo.description,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language,
          url: repo.html_url,
          updated_at: repo.updated_at
        };
      });

    // 2. Process Language Stats
    const totalRepos = reposData.length;
    const languageStats = Object.entries(languages)
      .map(([name, count]) => ({
        name,
        value: Math.round((count / totalRepos) * 100)
      }))
      .sort((a, b) => b.value - a.value);

    // 3. Process Recent Activity
    const recentActivity = eventsData
      .slice(0, 10)
      .map(event => ({
        id: event.id,
        type: event.type,
        repo: event.repo.name,
        created_at: event.created_at,
        payload: event.payload
      }));

    const result = {
      user: {
        login: userData.login,
        name: userData.name,
        avatar: userData.avatar_url,
        bio: userData.bio,
        location: userData.location,
        followers: userData.followers,
        following: userData.following,
        public_repos: userData.public_repos,
        public_gists: userData.public_gists,
        created_at: userData.created_at
      },
      stats: {
        totalStars,
        totalForks,
        totalRepos: userData.public_repos
      },
      topRepos,
      languageStats,
      recentActivity,
      lastUpdated: new Date().toISOString()
    };

    githubCache = {
      data: result,
      lastFetched: now
    };

    res.json(result);
  } catch (error) {
    console.error('GitHub API Error:', error);
    res.status(500).json({ error: 'Failed to fetch GitHub insights' });
  }
});

// --- AI CHATBOT (PREMBOT) ---
app.post('/api/chat', async (req, res) => {
  const { message, history = [] } = req.body;
  
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { 
          role: 'system', 
          content: `You are PremBot, the elite digital assistant for Prem Prasad Pradhan (MR.PREM). 
          Your mission is to represent Prem professionally to recruiters, clients, and visitors.
          
          Guidelines:
          - Use this knowledge base: ${PREM_KNOWLEDGE}
          - Be professional, intelligent, and tech-savvy.
          - Use **Markdown** formatting for better readability:
            - Use **bold** for emphasis on key words or technologies.
            - Use bullet points for lists of skills or projects.
            - Use double new lines for paragraphs.
          - Keep responses concise (under 4-5 sentences unless asked for detail).
          - If a user explicitly expresses a desire to **contact Prem**, **hire him**, **get his contact details**, or **send a professional message/business inquiry**, reply ONLY with exactly "[TRIGGER_CONTACT_FLOW]".
          - DO NOT trigger the contact flow for casual talk, jokes, or non-professional questions.
          - **SECURITY & PRIVACY**: 
            - NEVER share or discuss specific **API keys**, **secret tokens**, **passwords**, or **administrative details**.
            - NEVER disclose the names or values of environment variables (from .env files).
            - If asked about security or private keys, politely state that such information is strictly confidential and managed securely.
          - Maintain a helpful and slightly futuristic tone.` 
        },
        ...history,
        { role: 'user', content: message }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 500,
    });

    res.json({ response: chatCompletion.choices[0].message.content });
  } catch (error) {
    console.error('Groq AI Error:', error);
    res.status(500).json({ error: 'AI Neural Link Timeout. Please try again.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
