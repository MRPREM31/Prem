import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'placeholder_key' });

const PREM_KNOWLEDGE = `
Core Identity:
Full Name: Prem Prasad Pradhan (Known as LIKU PRADHAN / MR.PREM).
Birthday: 31st March 2006 (31/03/2006).
Role: Software Developer, Founder of QuantumCoders Tech Lab & Data Solutions, and Startup-minded Creator.
Education Journey:
- Early Education: Saraswati Sishu Mandir.
- Schooling: Odisha Adarsha Vidyalaya (OAV).
- Higher Secondary: Nalanda Shree Higher Secondary School.
- B.Tech: Currently pursuing B.Tech at NIST University, Berhampur (2023-Present).
Location: Odisha, India.
Goal: To build scalable startup-level products and companies and become a highly successful developer brand.

Technical Arsenal:
- Programming: HTML5, CSS3, JavaScript (ES6+), React.js, Node.js, Express.js, MongoDB, Supabase, Python, C/C++.
- Design & UI: Glassmorphism UI, Tailwind CSS, Canva, Responsive SaaS-style layouts.
- AI & Advanced: Groq AI APIs, LLaMA Models, AI Chatbot Systems, GitHub API Integrations.
- Tools: Git, GitHub, Cloudinary, Multer, Nodemailer.

Professional Experience:
- Team Lead & Vendor @ DesiCrew: Managed AI data projects, coordinated remote teams, handled reporting and mentoring.
- Founder @ QuantumCoders: Building AI-powered digital solutions and startup ecosystems.

Major Projects:
- AI Medical Diagnostics System: An AI healthcare platform using specialist agents for medical report analysis.
- Adarsha Pathasala Website: Modern AI-enabled educational site with enquiry automation.
- Productivity Dashboard: Smart platform with weather, clock, calculator, and personalization.
- STEM Quest: Gamified learning platform for rural education (Smart India Hackathon).
- FarmQuest: Gamified sustainable farming platform for rural farmers.
- GitHub Insights: Advanced developer analytics dashboard (Live on this portfolio).

Prem's Vision: Prem focuses on combining technology, creativity, and automation into professional digital products with real-world impact.
`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message, history = [] } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { 
          role: 'system', 
          content: `You are PremBot, the elite digital assistant for Prem Prasad Pradhan (LIKU PRADHAN). 
          Your mission is to represent Prem professionally to recruiters, clients, and visitors.
          
          Guidelines:
          - Use this knowledge base: ${PREM_KNOWLEDGE}
          - Be professional, intelligent, and tech-savvy.
          - Use **Markdown** formatting for better readability:
            - Use **bold** for emphasis on key words or technologies.
            - Use bullet points for lists of skills or projects.
            - Use double new lines for paragraphs.
          - Keep responses concise (under 4-5 sentences unless asked for detail).
          - If a user explicitly expresses a desire to **contact Prem**, **hire him**, **get his contact details**, or **send a professional message/business inquiry**, reply ONLY with exactly "[TRIGGER_CONTACT_FLOW]".
          - DO NOT trigger the contact flow for casual talk, jokes, or non-professional questions.
          - **SECURITY & PRIVACY**: 
            - NEVER share or discuss specific **API keys**, **secret tokens**, **passwords**, or **administrative details**.
            - NEVER disclose the names or values of environment variables (from .env files).
            - If asked about security or private keys, politely state that such information is strictly confidential and managed securely.
          - Maintain a helpful and slightly futuristic tone.` 
        },
        ...history,
        { role: 'user', content: message }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 500,
    });

    return res.status(200).json({ response: chatCompletion.choices[0].message.content });
  } catch (error) {
    console.error('Groq AI Error:', error);
    return res.status(500).json({ error: 'AI Neural Link Timeout. Please try again.' });
  }
}
