import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, keywords, image, url, type = 'website', noindex = false, schema }) => {
  const siteTitle = "Prem Prasad Pradhan | Software Developer Portfolio";
  const defaultDescription = "Official portfolio of Prem Prasad Pradhan. A passionate Software Developer specializing in full-stack web development, AI automation, and professional UI/UX design.";
  const siteUrl = "https://mrprem.in/";
  // Default to the professional profile image
  const defaultImage = "https://res.cloudinary.com/dmy2piasa/image/upload/v1741356501/portfolio/profile_photo.jpg";

  const seoTitle = title ? `${title} | Prem Prasad Pradhan` : siteTitle;
  const seoDescription = description || defaultDescription;
  const seoImage = image || defaultImage;
  const seoUrl = url ? `${siteUrl}${url.startsWith('/') ? url.slice(1) : url}` : siteUrl;

  // Image Object Schema for Google Images (Professional Profile Image SEO)
  const imageObjectSchema = {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    "contentUrl": seoImage,
    "url": seoImage,
    "creator": {
      "@type": "Person",
      "name": "Prem Prasad Pradhan"
    },
    "description": "Official Professional Profile Photo of Prem Prasad Pradhan, Software Developer and Founder of Zenemoo.in.",
    "caption": "Prem Prasad Pradhan - Professional Software Developer Profile",
    "representativeOfPage": "True",
    "license": "https://mrprem.in/",
    "acquireLicensePage": "https://mrprem.in/#contact"
  };

  // Default Schema.org Person Data
  const defaultSchema = {
    "@context": "http://schema.org",
    "@type": "Person",
    "name": "Prem Prasad Pradhan",
    "alternateName": ["MR.PREM", "mrprem31", "Prem Prasad"],
    "url": "https://mrprem.in/",
    "image": defaultImage,
    "email": "prem@zenemoo.in",
    "description": "Professional Software Developer specializing in Full Stack Web Development and AI Solutions.",
    "jobTitle": "Software Developer",
    "gender": "male",
    "nationality": "Indian",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Berhampur",
      "addressRegion": "Odisha",
      "addressCountry": "India"
    },
    "sameAs": [
      "https://www.zenemoo.in/",
      "https://www.zenemoo.in/team/prem-prasad-pradhan",
      "https://github.com/MRPREM31",
      "https://linkedin.com/in/prem-prasad-pradhan-18472b295/",
      "https://youtube.com/@B.techPrem",
      "https://medium.com/@mr.prem"
    ],
    "worksFor": {
      "@type": "Organization",
      "name": "Zenemoo.in",
      "url": "https://www.zenemoo.in/"
    },
    "knowsAbout": ["Web Development", "React.js", "Node.js", "AI Automation", "Software Engineering"]
  };

  // Sitelinks Searchbox & Navigation Schema for Homepage
  const sitelinkSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": "https://mrprem.in/",
    "name": "MR.PREM Portfolio",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://mrprem.in/?s={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  // Navigation Menu Schema
  const navSchema = {
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    "name": [
      "Home",
      "GitHub Insights",
      "Memories",
      "Projects",
      "Contact"
    ],
    "url": [
      "https://mrprem.in/",
      "https://mrprem.in/github-insights",
      "https://mrprem.in/memories",
      "https://mrprem.in/#projects",
      "https://mrprem.in/#contact"
    ]
  };

  // Breadcrumb Schema for Sub-pages
  const breadcrumbSchema = url ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://mrprem.in/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": title || "Page",
        "item": `${siteUrl}${url}`
      }
    ]
  } : null;

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
        <>
          <script type="application/ld+json">
            {JSON.stringify(schema || defaultSchema)}
          </script>
          <script type="application/ld+json">
            {JSON.stringify(imageObjectSchema)}
          </script>
          {!url && (
            <>
              <script type="application/ld+json">{JSON.stringify(sitelinkSchema)}</script>
              <script type="application/ld+json">{JSON.stringify(navSchema)}</script>
            </>
          )}
          {breadcrumbSchema && (
            <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
          )}
        </>
      )}
    </Helmet>
  );
};

export default SEO;
