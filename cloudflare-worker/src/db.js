/**
 * Direct Supabase Rest Query Helpers
 * Avoids loading the full @supabase/supabase-js library inside Cloudflare Workers
 * for optimal performance, lower memory usage, and zero cold starts.
 */

import { parseImageUrl } from './utils.js';

async function callSupabase(env, path, options = {}, retries = 3, delay = 100) {
  const url = `${env.SUPABASE_URL}/rest/v1/${path}`;
  const headers = {
    'apikey': env.SUPABASE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...options.headers
  };

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      if (response.ok) {
        if (response.status === 204) return null;
        const data = await response.json();
        if (options.returnWithCount) {
          const contentRange = response.headers.get('content-range');
          let count = 0;
          if (contentRange) {
            const parts = contentRange.split('/');
            if (parts.length > 1) {
              count = parseInt(parts[1], 10);
            }
          }
          return { data, count };
        }
        return data;
      }

      if (response.status >= 500 && i < retries - 1) {
        await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
        continue;
      }

      const errorText = await response.text();
      throw new Error(`Supabase REST Error (${response.status}): ${errorText}`);
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
    }
  }
}


/**
 * Fetch all projects, including related images and aggregate reviews
 */
export async function dbGetProjects(env) {
  // Query projects (ordered by id desc)
  const projects = await callSupabase(env, 'projects?select=*&order=id.desc');
  
  // Query all project images
  const images = await callSupabase(env, 'project_images?select=*');

  // Query project reviews (retrieve project_id and rating for aggregates)
  const reviews = await callSupabase(env, 'project_reviews?select=project_id,rating');

  // Map aggregates to projects
  return projects.map(p => {
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
}

/**
 * Fetch a single project by ID or Slug, along with its specific images and reviews
 */
export async function dbGetProjectByIdOrSlug(env, idOrSlug) {
  const isId = /^\d+$/.test(idOrSlug);
  const filterQuery = isId ? `id=eq.${idOrSlug}` : `slug=eq.${idOrSlug}`;
  
  // Fetch matching project
  const projects = await callSupabase(env, `projects?select=*&${filterQuery}`);
  if (!projects || projects.length === 0) {
    return null;
  }
  const project = projects[0];

  // Fetch images and reviews for this specific project
  const [images, reviews] = await Promise.all([
    callSupabase(env, `project_images?select=*&project_id=eq.${project.id}&order=id.asc`),
    callSupabase(env, `project_reviews?select=*&project_id=eq.${project.id}&is_hidden=eq.false&order=created_at.desc`)
  ]);

  const avgRating = (reviews && reviews.length > 0)
    ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length
    : 0;

  return {
    ...project,
    images: images || [],
    reviews: reviews || [],
    avgRating: avgRating.toFixed(1)
  };
}

/**
 * Fetch all public reviews across all projects
 */
export async function dbGetPublicReviews(env) {
  // PostgREST handles joins naturally if foreign keys are configured in schema
  // Fallback: Get reviews and projects, then join them locally
  const [reviews, projects] = await Promise.all([
    callSupabase(env, 'project_reviews?select=*&is_hidden=eq.false&order=created_at.desc'),
    callSupabase(env, 'projects?select=id,title')
  ]);

  return reviews.map(rev => {
    const proj = projects ? projects.find(p => p.id === rev.project_id) : null;
    return {
      ...rev,
      projects: proj ? { title: proj.title } : null
    };
  });
}

/**
 * Insert a new message (Contact Form)
 */
export async function dbInsertMessage(env, messageData) {
  const payload = {
    name: messageData.name,
    email: messageData.email,
    message: messageData.message,
    date: new Date().toISOString()
  };

  const options = {
    method: 'POST',
    headers: {
      'Prefer': 'return=representation'
    },
    body: payload
  };

  const results = await callSupabase(env, 'messages', options);
  return results && results.length > 0 ? results[0] : null;
}

/**
 * Upsert visitor analytics row
 */
export async function dbUpsertVisitor(env, visitorData) {
  const options = {
    method: 'POST',
    headers: {
      'Prefer': 'resolution=merge-duplicates,return=representation'
    },
    body: visitorData
  };

  const results = await callSupabase(env, 'visitors', options);
  return results && results.length > 0 ? results[0] : null;
}

/**
 * Test connectivity for health checks
 */
export async function dbTestConnection(env) {
  // Query 1 row from projects just to test database roundtrip
  await callSupabase(env, 'projects?select=id&limit=1');
  return true;
}

/**
 * Upsert dynamic setting in Supabase
 */
export async function dbSaveSetting(env, key, value) {
  const options = {
    method: 'POST',
    headers: {
      'Prefer': 'resolution=merge-duplicates,return=representation'
    },
    body: { key, value }
  };
  return callSupabase(env, 'settings', options);
}

/**
 * Insert dynamic certificate in Supabase
 */
export async function dbInsertCertificate(env, certData) {
  const options = {
    method: 'POST',
    headers: {
      'Prefer': 'return=representation'
    },
    body: certData
  };
  return callSupabase(env, 'certificates', options);
}

/**
 * Update dynamic certificate in Supabase
 */
export async function dbUpdateCertificate(env, id, certData) {
  const options = {
    method: 'PATCH',
    headers: {
      'Prefer': 'return=representation'
    },
    body: certData
  };
  return callSupabase(env, `certificates?id=eq.${id}`, options);
}

/**
 * Insert dynamic memorable image in Supabase
 */
export async function dbInsertMemorableImage(env, imgData) {
  const options = {
    method: 'POST',
    headers: {
      'Prefer': 'return=representation'
    },
    body: imgData
  };
  return callSupabase(env, 'memorable_images', options);
}

/**
 * Insert multiple project images in Supabase
 */
export async function dbInsertProjectImages(env, images) {
  const options = {
    method: 'POST',
    headers: {
      'Prefer': 'return=representation'
    },
    body: images // Array of images
  };
  return callSupabase(env, 'project_images', options);
}

/**
 * Insert dynamic media library CDN item in Supabase
 */
export async function dbInsertMediaLibrary(env, mediaData) {
  const options = {
    method: 'POST',
    headers: {
      'Prefer': 'return=representation'
    },
    body: mediaData
  };
  return callSupabase(env, 'media_library', options);
}

/**
 * Fetch all certificates sorted by id descending
 */
export async function dbGetCertificates(env) {
  return callSupabase(env, 'certificates?select=*&order=id.desc');
}

/**
 * Fetch a single certificate by id or slug
 */
export async function dbGetCertificateByIdOrSlug(env, idOrSlug) {
  const isId = /^\d+$/.test(idOrSlug);
  const filterQuery = isId ? `id=eq.${idOrSlug}` : `slug=eq.${idOrSlug}`;
  const certificates = await callSupabase(env, `certificates?select=*&${filterQuery}`);
  return certificates && certificates.length > 0 ? certificates[0] : null;
}

/**
 * Fetch a setting record by key
 */
export async function dbGetSetting(env, key) {
  const results = await callSupabase(env, `settings?select=*&key=eq.${key}`);
  return results && results.length > 0 ? results[0] : null;
}

/**
 * Fetch messages paginated and return total count
 */
export async function dbGetMessagesPaginated(env, page, limit) {
  const offset = (page - 1) * limit;
  const options = {
    headers: {
      'Prefer': 'count=exact'
    },
    returnWithCount: true
  };
  return callSupabase(env, `messages?select=*&order=id.desc&limit=${limit}&offset=${offset}`, options);
}

/**
 * Fetch visitors paginated and return total count
 */
export async function dbGetVisitorsPaginated(env, page, limit) {
  const offset = (page - 1) * limit;
  const options = {
    headers: {
      'Prefer': 'count=exact'
    },
    returnWithCount: true
  };
  return callSupabase(env, `visitors?select=*&order=visited_at.desc&limit=${limit}&offset=${offset}`, options);
}

/**
 * Fetch all setting records
 */
export async function dbGetAllSettings(env) {
  return callSupabase(env, 'settings?select=*');
}

/**
 * Fetch all memorable images
 */
export async function dbGetMemorableImages(env) {
  return callSupabase(env, 'memorable_images?select=*&order=id.desc');
}

/**
 * Fetch all media library records
 */
export async function dbGetMediaLibrary(env) {
  const records = await callSupabase(env, 'media_library?select=*&order=upload_date.desc');
  if (!records || records.length === 0) return [];

  // Filter records that need migration: either url doesn't match the new extension branded scheme OR direct_image_url is empty
  const unmigrated = records.filter(r => {
    const originalUrl = r.direct_image_url || r.url || '';
    if (!originalUrl || originalUrl.startsWith('https://mrprem.in/cdn/')) return false;
    const { slug, ext } = parseImageUrl(originalUrl);
    const targetBrandedUrl = `https://mrprem.in/cdn/${slug}.${ext}`;
    return r.slug !== slug || r.url !== targetBrandedUrl || !r.direct_image_url;
  });

  if (unmigrated.length > 0) {
    for (const r of unmigrated) {
      const originalUrl = r.direct_image_url || r.url || '';
      if (!originalUrl || originalUrl.startsWith('https://mrprem.in/cdn/')) continue;
      const { slug, ext } = parseImageUrl(originalUrl);
      const targetBrandedUrl = `https://mrprem.in/cdn/${slug}.${ext}`;

      try {
        await callSupabase(env, `media_library?id=eq.${r.id}`, {
          method: 'PATCH',
          body: {
            slug,
            url: targetBrandedUrl,
            direct_image_url: originalUrl
          }
        });
        // Update local object in-place so returned value matches database
        r.slug = slug;
        r.url = targetBrandedUrl;
        r.direct_image_url = originalUrl;
      } catch (err) {
        console.error(`Failed to migrate media record ${r.id}:`, err.message);
      }
    }
  }
  return records;
}

export async function dbGetMediaBySlug(env, slug) {
  const results = await callSupabase(env, `media_library?select=*&slug=eq.${encodeURIComponent(slug)}`);
  return results && results.length > 0 ? results[0] : null;
}

/**
 * Delete a media library record by ID
 */
export async function dbDeleteMediaLibrary(env, id) {
  return callSupabase(env, `media_library?id=eq.${id}`, { method: 'DELETE' });
}



