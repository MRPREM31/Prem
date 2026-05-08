/**
 * Helper to apply Cloudinary auto-optimization transformations.
 * f_auto: best format (WebP/AVIF)
 * q_auto: best quality/size balance
 * w_auto: responsive width (when combined with other Cloudinary setup, 
 * but here we use it as a hint or use a fixed width if needed)
 */
export const optimizeCloudinaryUrl = (url, width = 'auto') => {
  if (!url || !url.includes('cloudinary.com')) return url;
  
  // If it's already optimized, don't double up
  if (url.includes('/upload/f_auto,q_auto')) return url;

  const transformation = `f_auto,q_auto,w_${width}`;
  
  if (url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/${transformation}/`);
  }
  
  return url;
};
