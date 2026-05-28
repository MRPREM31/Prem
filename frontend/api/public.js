import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- ONESIGNAL PUSH NOTIFICATION UTILITY ---
async function sendPushNotification({ title, message, url }) {
  const appId = process.env.ONESIGNAL_APP_ID || '454dcf3b-18c2-4b30-bf85-b43b67161d92';
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!apiKey || apiKey === 'your_onesignal_rest_api_key') {
    console.warn(`[OneSignal REST API] ONESIGNAL_REST_API_KEY is not defined. Simulating push notification.`);
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

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.errors ? data.errors.join(', ') : 'OneSignal API Error');
    }
    return data;
  } catch (err) {
    console.error('[OneSignal REST API] Failed to send push notification:', err.message);
    throw err;
  }
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { route, idOrSlug, id, slug } = req.query;

  try {
    switch (route) {
      case 'profile-image': {
        const { data } = await supabase.from('settings').select('value').eq('key', 'profileImage').single();
        return res.status(200).json({ imageUrl: data ? data.value : '/assets/profile.jpg' });
      }

      case 'profile-image-direct': {
        const { data } = await supabase.from('settings').select('value').eq('key', 'profileImage').single();
        const imageUrl = data && data.value ? (data.value.startsWith('http') ? data.value : `https://mrprem.in${data.value}`) : 'https://mrprem.in/assets/profile.jpg';
        res.writeHead(302, { Location: imageUrl });
        return res.end();
      }

      case 'navbar-image': {
        const { data } = await supabase.from('settings').select('value').eq('key', 'navbarImage').single();
        return res.status(200).json({ imageUrl: data ? data.value : 'https://res.cloudinary.com/dmy2piasa/image/upload/v1778143422/portfolio/1778143422301-Prem.jpg' });
      }

      case 'resume': {
        const { data } = await supabase.from('settings').select('value').eq('key', 'resumeUrl').single();
        return res.status(200).json({ resumeUrl: data ? data.value : '/resume.pdf' });
      }

      case 'favicon': {
        const { data } = await supabase.from('settings').select('value').eq('key', 'faviconUrl').single();
        return res.status(200).json({ faviconUrl: data ? data.value : '/vite.svg' });
      }

      case 'signature': {
        const { data } = await supabase.from('settings').select('value').eq('key', 'signatureUrl').single();
        return res.status(200).json({ signatureUrl: data ? data.value : 'https://res.cloudinary.com/dmy2piasa/image/upload/v1777992215/portfolio/1777992215540-prem-signature.png' });
      }

      case 'skills': {
        const { data } = await supabase.from('settings').select('value').eq('key', 'portfolio_skills').single();
        if (!data) return res.status(200).json([]);
        return res.status(200).json(JSON.parse(data.value));
      }

      case 'certificates': {
        if (idOrSlug) {
          const isId = /^\d+$/.test(idOrSlug);
          let query = supabase.from('certificates').select('*');
          if (isId) {
            query = query.or(`id.eq.${parseInt(idOrSlug, 10)},slug.eq.${idOrSlug}`);
          } else {
            query = query.eq('slug', idOrSlug);
          }
          const { data, error } = await query.single();
          if (error || !data) return res.status(404).json({ error: 'Certificate not found' });
          return res.status(200).json(data);
        } else {
          const { data } = await supabase.from('certificates').select('*').order('id', { ascending: false });
          return res.status(200).json(data || []);
        }
      }

      case 'memories': {
        if (idOrSlug) {
          const isId = /^\d+$/.test(idOrSlug);
          let query = supabase.from('memorable_images').select('*');
          if (isId) {
            query = query.or(`id.eq.${parseInt(idOrSlug, 10)},slug.eq.${idOrSlug}`);
          } else {
            query = query.eq('slug', idOrSlug);
          }
          const { data, error } = await query.single();
          if (error || !data) return res.status(404).json({ error: 'Memory not found' });
          return res.status(200).json(data);
        } else {
          const { data } = await supabase.from('memorable_images').select('*').order('id', { ascending: false });
          return res.status(200).json(data || []);
        }
      }

      case 'stats': {
        const { data } = await supabase.from('settings').select('key, value').in('key', ['stats_years_exp', 'stats_projects_completed', 'stats_startups_leadership']);
        const stats = { years_exp: '2+', projects_completed: '11+', startups_leadership: '2' };
        if (data) {
          data.forEach(item => {
            if (item.key === 'stats_years_exp') stats.years_exp = item.value;
            if (item.key === 'stats_projects_completed') stats.projects_completed = item.value;
            if (item.key === 'stats_startups_leadership') stats.startups_leadership = item.value;
          });
        }
        return res.status(200).json(stats);
      }

      case 'maintenance-status': {
        const { data } = await supabase.from('maintenance_settings').select('*').eq('id', 1).single();
        const settings = data || { maintenance_enabled: false };
        const now = new Date();
        const start = settings.start_time ? new Date(settings.start_time) : null;
        const end = settings.end_time ? new Date(settings.end_time) : null;
        const active = settings.maintenance_enabled && (!start || now >= start) && (!end || now <= end);
        return res.status(200).json({ maintenanceActive: active, settings });
      }

      case 'projects': {
        if (idOrSlug) {
          const isId = /^\d+$/.test(idOrSlug);
          let query = supabase.from('projects').select('*');
          if (isId) {
            query = query.eq('id', parseInt(idOrSlug, 10));
          } else {
            query = query.eq('slug', idOrSlug);
          }
          const { data: project, error } = await query.single();
          if (error || !project) return res.status(404).json({ error: 'Project not found' });

          const { data: images } = await supabase.from('project_images').select('*').eq('project_id', project.id).order('id', { ascending: true });
          const { data: reviews } = await supabase.from('project_reviews').select('*').eq('project_id', project.id).eq('is_hidden', false).order('created_at', { ascending: false });
          const avgRating = (reviews && reviews.length > 0) ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length : 0;

          return res.status(200).json({ ...project, images: images || [], reviews: reviews || [], avgRating: Number(avgRating).toFixed(1) });
        } else {
          const { data: projects } = await supabase.from('projects').select('*').order('id', { ascending: false });
          const { data: images } = await supabase.from('project_images').select('*');
          const { data: reviews } = await supabase.from('project_reviews').select('project_id, rating').eq('is_hidden', false);

          const projectsWithDetails = (projects || []).map(p => {
            const pImages = images ? images.filter(img => img.project_id === p.id) : [];
            const pReviews = reviews ? reviews.filter(rev => rev.project_id === p.id) : [];
            const avgRating = pReviews.length > 0 ? pReviews.reduce((acc, curr) => acc + curr.rating, 0) / pReviews.length : 0;
            return { ...p, images: pImages, avgRating: avgRating.toFixed(1), reviewCount: pReviews.length };
          });
          return res.status(200).json(projectsWithDetails);
        }
      }

      case 'media': {
        const { search } = req.query;
        let query = supabase.from('media_library').select('*').order('upload_date', { ascending: false });
        if (search) query = query.ilike('name', `%${search}%`);
        const { data, error } = await query;
        if (error) throw error;
        return res.status(200).json(data || []);
      }

      case 'media-slug': {
        const { data, error } = await supabase.from('media_library').select('*').eq('slug', slug).single();
        if (error || !data) return res.status(404).json({ error: 'Media not found' });
        return res.status(200).json(data);
      }

      case 'contact': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
        const { name, email, message } = req.body;
        if (!name || !email || !message) return res.status(400).json({ error: 'All fields are required' });

        const { data, error } = await supabase.from('messages').insert([{ name, email, message, date: new Date().toISOString() }]).select();
        if (error) throw error;
        return res.status(201).json({ success: true, id: (data && data.length > 0) ? data[0].id : null });
      }

      case 'reviews': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
        const { rating, review_text, reviewer_name, reviewer_role } = req.body;
        if (!rating || !review_text || !reviewer_name) return res.status(400).json({ error: 'Rating, review text and name are required' });

        const { data, error } = await supabase.from('project_reviews').insert([{ project_id: parseInt(id, 10), rating: parseInt(rating, 10), review_text, reviewer_name, reviewer_role: reviewer_role || 'Visitor', is_hidden: false, created_at: new Date().toISOString() }]).select();
        if (error) throw error;
        return res.status(201).json({ success: true, review: data[0] });
      }

      case 'send-public': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
        const { title, message, url } = req.body;
        if (!title || !message) return res.status(400).json({ error: 'Title and message are required' });

        const isTitleValid = title.toLowerCase().includes('live') || title.toLowerCase().includes('maintenance') || title.toLowerCase().includes('portfolio');
        const isMessageValid = message.toLowerCase().includes('maintenance') || message.toLowerCase().includes('live') || message.toLowerCase().includes('explore') || message.toLowerCase().includes('complete');
        if (!isTitleValid || !isMessageValid) return res.status(403).json({ error: 'Abuse Blocked: This endpoint is restricted strictly to maintenance completion announcements.' });

        const result = await sendPushNotification({ title, message, url });
        return res.status(200).json({ success: true, result });
      }

      default:
        return res.status(404).json({ error: 'Route not found' });
    }
  } catch (error) {
    console.error(`[Public API Serverless Error] route=${route}:`, error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
