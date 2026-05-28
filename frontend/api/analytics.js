import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_here';

// In-memory GitHub cache (resets on lambda cold start — acceptable)
let githubCache = { data: null, lastFetched: null };

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

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { route } = req.query;

  try {
    switch (route) {
      // ─── GITHUB INSIGHTS ─────────────────────────────────────────────────────
      case 'github-stats': {
        const now = Date.now();
        const CACHE_DURATION = 10 * 60 * 1000; // 10 min

        if (githubCache.data && githubCache.lastFetched && (now - githubCache.lastFetched < CACHE_DURATION)) {
          return res.status(200).json(githubCache.data);
        }

        const username = 'MRPREM31';
        const headers = { 'User-Agent': 'Portfolio-Dashboard-2026' };
        if (process.env.GITHUB_TOKEN) headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;

        const [userRes, reposRes, eventsRes] = await Promise.all([
          fetch(`https://api.github.com/users/${username}`, { headers }),
          fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`, { headers }),
          fetch(`https://api.github.com/users/${username}/events/public?per_page=50`, { headers })
        ]);

        if (!userRes.ok) throw new Error('GitHub Profile Fetch Failed');

        const userData = await userRes.json();
        const reposData = await reposRes.json();
        const eventsData = await eventsRes.json();

        let totalStars = 0, totalForks = 0;
        const languages = {};
        const topRepos = reposData
          .filter(r => !r.fork)
          .sort((a, b) => (b.stargazers_count + b.forks_count) - (a.stargazers_count + a.forks_count))
          .slice(0, 6)
          .map(repo => {
            totalStars += repo.stargazers_count;
            totalForks += repo.forks_count;
            if (repo.language) languages[repo.language] = (languages[repo.language] || 0) + 1;
            return { id: repo.id, name: repo.name, description: repo.description, stars: repo.stargazers_count, forks: repo.forks_count, language: repo.language, url: repo.html_url, updated_at: repo.updated_at };
          });

        const totalRepos = reposData.length;
        const languageStats = Object.entries(languages)
          .map(([name, count]) => ({ name, value: Math.round((count / totalRepos) * 100) }))
          .sort((a, b) => b.value - a.value);

        const recentActivity = eventsData.slice(0, 10).map(e => ({ id: e.id, type: e.type, repo: e.repo.name, created_at: e.created_at, payload: e.payload }));

        const result = {
          user: { login: userData.login, name: userData.name, avatar: userData.avatar_url, bio: userData.bio, location: userData.location, followers: userData.followers, following: userData.following, public_repos: userData.public_repos, public_gists: userData.public_gists, created_at: userData.created_at },
          stats: { totalStars, totalForks, totalRepos: userData.public_repos },
          topRepos, languageStats, recentActivity,
          lastUpdated: new Date().toISOString()
        };

        githubCache = { data: result, lastFetched: now };
        return res.status(200).json(result);
      }

      // ─── VISITOR TRACKING ────────────────────────────────────────────────────
      case 'track-visitor': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
        const { sessionId, subscriptionStatus, subscriptionId, lastPromptTime, deviceBrowser } = req.body;
        const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
        const userAgent = req.headers['user-agent'] || '';

        let uniqueId;
        if (sessionId) {
          uniqueId = crypto.createHash('md5').update(sessionId).digest('hex');
        } else {
          const today = new Date().toISOString().split('T')[0];
          uniqueId = crypto.createHash('md5').update(`${ip}-${userAgent}-${today}`).digest('hex');
        }

        const upsertPayload = { unique_id: uniqueId, ip, user_agent: userAgent, visited_at: new Date().toISOString() };
        if (subscriptionStatus !== undefined) upsertPayload.subscription_status = subscriptionStatus;
        if (subscriptionId !== undefined) upsertPayload.subscription_id = subscriptionId;
        if (lastPromptTime !== undefined) upsertPayload.last_prompt_time = lastPromptTime;
        if (deviceBrowser !== undefined) upsertPayload.device_browser = deviceBrowser;

        const { error } = await supabase.from('visitors').upsert(upsertPayload, { onConflict: 'unique_id' });
        if (error) {
          if (error.code === '42703') {
            // Fallback: columns missing, use minimal fields
            const { error: fallbackErr } = await supabase.from('visitors').upsert({ unique_id: uniqueId, ip, user_agent: userAgent, visited_at: new Date().toISOString() }, { onConflict: 'unique_id' });
            if (fallbackErr) throw fallbackErr;
          } else if (error.code === '42P01') {
            return res.status(200).json({ success: false, message: 'Visitors table missing' });
          } else {
            throw error;
          }
        }
        return res.status(200).json({ success: true });
      }

      // ─── VISITOR STATS (PUBLIC) ───────────────────────────────────────────────
      case 'visitor-stats': {
        if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
        try {
          const { count } = await supabase.from('visitors').select('*', { count: 'exact', head: true });
          return res.status(200).json({ totalVisitors: count || 0 });
        } catch {
          return res.status(200).json({ totalVisitors: 0 });
        }
      }

      // ─── ADMIN: ALL VISITORS (PROTECTED) ────────────────────────────────────
      case 'admin-visitors': {
        if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
        try { verifyToken(req); } catch (e) { return res.status(401).json({ error: e.message }); }

        const { page = 1, limit = 5 } = req.query;
        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        const { data, count, error } = await supabase.from('visitors').select('*', { count: 'exact' }).order('visited_at', { ascending: false }).range(offset, offset + parseInt(limit, 10) - 1);
        if (error) throw error;
        return res.status(200).json({ visitors: data || [], totalCount: count || 0 });
      }

      default:
        return res.status(404).json({ error: 'Route not found' });
    }
  } catch (error) {
    console.error(`[Analytics API Error] route=${route}:`, error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
