export const fallbackGithub = {
  user: {
    login: 'MRPREM31',
    followers: 18,
    following: 22,
    avatar_url: 'https://res.cloudinary.com/dmy2piasa/image/upload/v1777986860/portfolio/xbb3bxhruzwwg69ezwbj.jpg'
  },
  stats: {
    totalStars: 14,
    totalRepos: 32,
    totalForks: 6,
    totalCommits: 450
  },
  lastUpdated: new Date().toISOString(),
  languageStats: [
    { name: 'JavaScript', value: 45 },
    { name: 'React', value: 25 },
    { name: 'Node.js', value: 15 },
    { name: 'Python', value: 10 },
    { name: 'CSS/HTML', value: 5 }
  ],
  recentActivity: [
    {
      id: 'act_1',
      type: 'PushEvent',
      repo: 'MRPREM31/mrprem-portfolio',
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'act_2',
      type: 'PushEvent',
      repo: 'MRPREM31/quantum-coders',
      created_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'act_3',
      type: 'PushEvent',
      repo: 'MRPREM31/DesiCrew-Helper',
      created_at: new Date(Date.now() - 172800000).toISOString()
    }
  ],
  topRepos: [
    {
      id: 'repo_1',
      name: 'mrprem-portfolio',
      url: 'https://github.com/MRPREM31/mrprem-portfolio',
      description: 'Hybrid Serverless production-grade resilient portfolio ecosystem built with React.js, Vite, and Supabase.',
      language: 'JavaScript',
      stars: 6,
      forks: 2
    },
    {
      id: 'repo_2',
      name: 'quantum-coders-suite',
      url: 'https://github.com/MRPREM31/quantum-coders-suite',
      description: 'The primary tech platform for Zenemoo.in startup tools and collaborative sandboxes.',
      language: 'JavaScript',
      stars: 4,
      forks: 2
    },
    {
      id: 'repo_3',
      name: 'desicrew-taskmanager',
      url: 'https://github.com/MRPREM31/desicrew-taskmanager',
      description: 'Automation utilities and task management scripts designed for operational agility.',
      language: 'Python',
      stars: 3,
      forks: 1
    },
    {
      id: 'repo_4',
      name: 'NIST-academic-hub',
      url: 'https://github.com/MRPREM31/NIST-academic-hub',
      description: 'Academic tools, notes distribution helper, and project submission templates.',
      language: 'HTML',
      stars: 2,
      forks: 1
    }
  ]
};

export default fallbackGithub;
