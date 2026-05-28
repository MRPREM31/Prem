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

  const { idOrSlug } = req.query;

  try {
    if (idOrSlug) {
      const isId = /^\d+$/.test(idOrSlug);
      let query = supabase.from('memorable_images').select('*');
      if (isId) {
        query = query.or(`id.eq.${parseInt(idOrSlug, 10)},slug.eq.${idOrSlug}`);
      } else {
        query = query.eq('slug', idOrSlug);
      }

      const { data, error } = await query.single();
      if (error || !data) {
        return res.status(404).json({ error: 'Memory not found' });
      }

      return res.status(200).json(data);
    } else {
      const { data, error } = await supabase
        .from('memorable_images')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      return res.status(200).json(data || []);
    }
  } catch (error) {
    console.error('Memories Serverless Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
