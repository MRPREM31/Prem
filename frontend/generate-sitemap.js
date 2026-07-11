import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = process.env.VITE_API_URL || 'https://prem-backend-9icx.onrender.com';

async function generateSitemapFile(filename) {
  try {
    console.log(`Fetching dynamic ${filename} from backend: ${API_URL}/${filename}...`);
    const res = await fetch(`${API_URL}/${filename}`);
    
    if (!res.ok) {
      throw new Error(`Backend returned status ${res.status}`);
    }
    
    const xml = await res.text();
    const outputPath = path.join(__dirname, 'public', filename);
    
    fs.writeFileSync(outputPath, xml);
    console.log(`✅ Successfully generated static ${filename} at ${outputPath}`);
  } catch (error) {
    console.error(`❌ Error generating static ${filename}:`, error.message);
  }
}

async function main() {
  await generateSitemapFile('sitemap-index.xml');
  await generateSitemapFile('sitemap.xml');
  await generateSitemapFile('image-sitemap.xml');
  console.log('Make sure the backend is running before building the frontend if you want fresh dynamically generated sitemaps.');
}

main();
