import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000';

async function generateSitemap() {
  try {
    console.log(`Fetching dynamic sitemap from backend: ${API_URL}/sitemap.xml...`);
    const res = await fetch(`${API_URL}/sitemap.xml`);
    
    if (!res.ok) {
      throw new Error(`Backend returned status ${res.status}`);
    }
    
    const xml = await res.text();
    const outputPath = path.join(__dirname, 'public', 'sitemap.xml');
    
    fs.writeFileSync(outputPath, xml);
    console.log(`✅ Successfully generated static sitemap at ${outputPath}`);
  } catch (error) {
    console.error('❌ Error generating static sitemap:', error.message);
    console.log('Make sure the backend is running before building the frontend.');
  }
}

generateSitemap();
