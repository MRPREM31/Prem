import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const defaultSkills = [
  {
    title: 'Programming Languages',
    icon: 'FaCode',
    skills: [
      { name: 'C', icon: 'FaCode' },
      { name: 'C++', icon: 'FaCode' },
      { name: 'Python', icon: 'FaPython' },
      { name: 'HTML', icon: 'FaHtml5' },
      { name: 'CSS', icon: 'FaCss3Alt' }
    ]
  },
  {
    title: 'Technologies',
    icon: 'FaLaptopCode',
    skills: [
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
      { name: 'Google Apps Script', icon: 'FaCode' }
    ]
  },
  {
    title: 'Other Skills',
    icon: 'FaLightbulb',
    skills: [
      { name: 'DBMS', icon: 'FaDatabase' },
      { name: 'Canva', icon: 'FaPaintBrush' },
      { name: 'AI/Data Annotation', icon: 'FaBrain' }
    ]
  }
];

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
      .select('value')
      .eq('key', 'portfolio_skills')
      .single();

    if (error || !data) {
      return res.status(200).json(defaultSkills);
    }

    return res.status(200).json(JSON.parse(data.value));
  } catch (error) {
    console.error('Skills Serverless Error:', error);
    return res.status(200).json(defaultSkills); // Safe fallback
  }
}
