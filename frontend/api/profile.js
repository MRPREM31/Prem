import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { type } = req.query;

  try {
    if (type === 'resume') {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'resumeUrl')
        .single();

      return res.status(200).json({
        resumeUrl: data ? data.value : '/resume.pdf'
      });
    } else if (type === 'favicon') {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'faviconUrl')
        .single();

      return res.status(200).json({
        faviconUrl: data ? data.value : '/vite.svg'
      });
    } else {
      // Default to profile image
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'profileImage')
        .single();

      return res.status(200).json({
        imageUrl: data ? data.value : '/assets/profile.jpg'
      });
    }
  } catch (error) {
    console.error('Profile Serverless Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
