import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_here';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const VAULT_JWT_SECRET = JWT_SECRET + "_vault";

// Simple in-memory tracker for vault logins (will reset on lambda cold start, which is standard & acceptable for Hobby)
const vaultLoginAttempts = {};

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

// Helper: JWT verification middleware logic
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { route } = req.query;

  try {
    switch (route) {
      case 'login': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

        // 1. Check admin whitelist
        const { data: admin, error } = await supabase.from('admins').select('*').eq('email', email).single();
        if (error) {
          if (error.code === '42P01') {
            return res.status(500).json({ error: 'Database Error: The admins table does not exist in Supabase.' });
          }

          // Bootstrap setup: if admins table is empty, allow auto-create on mr.prem2006@gmail.com
          const { count, error: countError } = await supabase.from('admins').select('*', { count: 'exact', head: true });
          if (!countError && count === 0 && email === 'mr.prem2006@gmail.com' && password === ADMIN_PASSWORD) {
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
        if (!passwordMatch) return res.status(401).json({ auth: false, error: 'Invalid password' });

        // 3. Generate token
        const token = jwt.sign(
          { id: admin.id, email: admin.email, isSuperAdmin: admin.is_super_admin },
          JWT_SECRET,
          { expiresIn: '8h' }
        );
        return res.status(200).json({ auth: true, token, email: admin.email });
      }

      case 'forgot-password': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
        const { email } = req.body;
        const { data: admin, error } = await supabase.from('admins').select('*').eq('email', email).single();
        if (error || !admin) return res.status(404).json({ error: 'Email not found in whitelist' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        const { error: updateError } = await supabase.from('admins').update({ reset_otp: otp, otp_expiry: expiry }).eq('email', email);
        if (updateError) throw updateError;

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

        await transporter.sendMail(mailOptions);
        return res.status(200).json({ success: true, message: 'OTP sent to your email' });
      }

      case 'verify-otp': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
        const { email, otp } = req.body;
        const { data: admin, error } = await supabase.from('admins').select('*').eq('email', email).single();
        if (error || !admin) return res.status(404).json({ error: 'Admin not found' });

        if (admin.reset_otp !== otp || new Date() > new Date(admin.otp_expiry)) {
          return res.status(400).json({ error: 'Invalid or expired OTP' });
        }
        return res.status(200).json({ success: true, message: 'OTP verified' });
      }

      case 'reset-password': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
        const { email, otp, newPassword } = req.body;
        const { data: admin, error } = await supabase.from('admins').select('*').eq('email', email).single();
        if (error || !admin) return res.status(404).json({ error: 'Admin not found' });

        if (admin.reset_otp !== otp || new Date() > new Date(admin.otp_expiry)) {
          return res.status(400).json({ error: 'Session expired. Please request a new OTP.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await supabase.from('admins').update({ password: hashedPassword, reset_otp: null, otp_expiry: null }).eq('email', email);
        return res.status(200).json({ success: true, message: 'Password reset successfully' });
      }

      case 'change-password': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
        
        let decodedToken;
        try {
          decodedToken = verifyToken(req);
        } catch (authErr) {
          return res.status(401).json({ error: authErr.message });
        }

        const { email, currentPassword, newPassword } = req.body;
        const { data: admin, error } = await supabase.from('admins').select('*').eq('email', email).single();
        if (error || !admin) return res.status(404).json({ error: 'Admin not found' });

        const match = await bcrypt.compare(currentPassword, admin.password);
        if (!match) return res.status(401).json({ error: 'Current password incorrect' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await supabase.from('admins').update({ password: hashedPassword }).eq('email', email);
        return res.status(200).json({ success: true, message: 'Password changed successfully' });
      }

      case 'vault-login': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
        const { username, password } = req.body;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';

        if (vaultLoginAttempts[ip] && vaultLoginAttempts[ip].count >= 5) {
          const timePassed = Date.now() - vaultLoginAttempts[ip].lastAttempt;
          if (timePassed < 15 * 60 * 1000) {
            return res.status(429).json({ error: 'Too many attempts. You are locked out for 15 minutes.' });
          } else {
            vaultLoginAttempts[ip] = { count: 0, lastAttempt: Date.now() };
          }
        }

        const { data: user, error } = await supabase.from('access_users').select('*').eq('username', username).single();
        if (error || !user) {
          vaultLoginAttempts[ip] = { count: (vaultLoginAttempts[ip]?.count || 0) + 1, lastAttempt: Date.now() };
          return res.status(401).json({ error: 'Nice try 😅 But this vault only opens for legends.' });
        }

        const validPassword = await bcrypt.compare(password, user.encrypted_password);
        if (!validPassword) {
          vaultLoginAttempts[ip] = { count: (vaultLoginAttempts[ip]?.count || 0) + 1, lastAttempt: Date.now() };
          return res.status(401).json({ error: 'Nice try 😅 But this vault only opens for legends.' });
        }

        delete vaultLoginAttempts[ip];
        await supabase.from('access_users').update({ last_login: new Date() }).eq('id', user.id);

        const token = jwt.sign({ id: user.id, username: user.username, role: 'vault_access' }, VAULT_JWT_SECRET, { expiresIn: '20m' });
        return res.status(200).json({ token, message: 'Welcome to the Secure Vault.' });
      }

      default:
        return res.status(404).json({ error: 'Route not found' });
    }
  } catch (error) {
    console.error(`[Auth API Serverless Error] route=${route}:`, error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
