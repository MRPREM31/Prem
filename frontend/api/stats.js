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

  try {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['stats_years_exp', 'stats_projects_completed', 'stats_startups_leadership']);

    const stats = {
      years_exp: '2+',
      projects_completed: '11+',
      startups_leadership: '2'
    };

    if (data && !error) {
      data.forEach(item => {
        if (item.key === 'stats_years_exp') stats.years_exp = item.value;
        if (item.key === 'stats_projects_completed') stats.projects_completed = item.value;
        if (item.key === 'stats_startups_leadership') stats.startups_leadership = item.value;
      });
    }

    return res.status(200).json(stats);
  } catch (error) {
    console.error('Stats Serverless Error:', error);
    return res.status(200).json({
      years_exp: '2+',
      projects_completed: '11+',
      startups_leadership: '2'
    });
  }
}
