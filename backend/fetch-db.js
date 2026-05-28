const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://ewmctubyyukkzckyqzsq.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseKey) {
  console.error('SUPABASE_KEY is missing from environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching database data from Supabase...');
  try {
    const { data: projects } = await supabase.from('projects').select('*').order('id', { ascending: false });
    const { data: project_images } = await supabase.from('project_images').select('*');
    const { data: project_reviews } = await supabase.from('project_reviews').select('*').eq('is_hidden', false);
    const { data: certificates } = await supabase.from('certificates').select('*').order('id', { ascending: false });
    const { data: settings } = await supabase.from('settings').select('*');
    const { data: memories } = await supabase.from('memorable_images').select('*').order('id', { ascending: false });

    const dbData = {
      projects,
      project_images,
      project_reviews,
      certificates,
      settings,
      memories
    };

    fs.writeFileSync(
      path.join(__dirname, 'db_dump.json'),
      JSON.stringify(dbData, null, 2)
    );
    console.log('Data dumped to db_dump.json successfully!');
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

run();
