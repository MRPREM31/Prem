import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, keywords, image, url, type = 'website', noindex = false, schema }) => {
  const siteTitle = "Prem Prasad Pradhan | Software Developer Portfolio";
  const defaultDescription = "Official portfolio of Prem Prasad Pradhan. A passionate Software Developer specializing in full-stack web development.";
  const siteUrl = "https://mrprem.in/";
  const defaultImage = "https://mrprem.in/og-image.png";

  const seoTitle = title ? `${title} | Prem Prasad Pradhan` : siteTitle;
  const seoDescription = description || defaultDescription;
  const seoImage = image || defaultImage;
  const seoUrl = url ? `${siteUrl}${url}` : siteUrl;

  // Default Schema.org Person Data
  const defaultSchema = {
    "@context": "http://schema.org",
    "@type": "Person",
    "name": "Prem Prasad Pradhan",
    "url": "https://mrprem.in/",
    "image": "https://mrprem.in/og-image.png",
    "sameAs": [
      "https://github.com/MRPREM31",
      "https://linkedin.com/in/mrprem31",
      "https://instagram.com/mr.prem_31"
    ],
    "jobTitle": "Software Developer",
    "worksFor": {
      "@type": "Organization",
      "name": "NIST University"
    }
  };

  return (
    <Helmet>
      {/* General Meta Tags */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={seoUrl} />

      {/* Open Graph Tags */}
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={seoImage} />
      <meta property="og:url" content={seoUrl} />
      <meta property="og:type" content={type} />

      {/* Twitter Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={seoImage} />

      {/* Structured Data */}
      {!noindex && (
        <script type="application/ld+json">
          {JSON.stringify(schema || defaultSchema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
