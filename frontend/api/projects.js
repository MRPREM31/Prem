import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Safe CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { idOrSlug } = req.query;

  try {
    if (idOrSlug) {
      // Fetch Single Project Detail
      const isId = /^\d+$/.test(idOrSlug);
      let query = supabase.from('projects').select('*');
      if (isId) {
        query = query.eq('id', parseInt(idOrSlug, 10));
      } else {
        query = query.eq('slug', idOrSlug);
      }

      const { data: project, error: projectError } = await query.single();
      if (projectError || !project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Fetch dynamic images and reviews
      const { data: images } = await supabase
        .from('project_images')
        .select('*')
        .eq('project_id', project.id)
        .order('id', { ascending: true });

      const { data: reviews } = await supabase
        .from('project_reviews')
        .select('*')
        .eq('project_id', project.id)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false });

      const avgRating = (reviews && reviews.length > 0)
        ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length
        : 0;

      return res.status(200).json({
        ...project,
        images: images || [],
        reviews: reviews || [],
        avgRating: Number(avgRating).toFixed(1)
      });

    } else {
      // Fetch All Projects list
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('id', { ascending: false });

      if (projectsError) throw projectsError;

      const { data: images } = await supabase.from('project_images').select('*');
      const { data: reviews } = await supabase.from('project_reviews').select('project_id, rating').eq('is_hidden', false);

      const projectsWithDetails = (projects || []).map(p => {
        const pImages = images ? images.filter(img => img.project_id === p.id) : [];
        const pReviews = reviews ? reviews.filter(rev => rev.project_id === p.id) : [];
        const avgRating = pReviews.length > 0
          ? pReviews.reduce((acc, curr) => acc + curr.rating, 0) / pReviews.length
          : 0;

        return {
          ...p,
          images: pImages,
          avgRating: avgRating.toFixed(1),
          reviewCount: pReviews.length
        };
      });

      return res.status(200).json(projectsWithDetails);
    }
  } catch (error) {
    console.error('Projects Serverless Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
