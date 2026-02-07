/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://gpti.example.com',
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  sitemapSize: 7000,
  changefreq: 'daily',
  priority: 0.7,
  exclude: ['/api/*', '/admin/*', '/_next/*', '/static/*'],
  
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/_next/', '/static/'],
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
    ],
    additionalSitemaps: [
      'https://gpti.example.com/sitemap-countries.xml',
      'https://gpti.example.com/sitemap-indicators.xml',
    ],
  },
  
  transform: async (config, path) => {
    // Priorités personnalisées par chemin
    let priority = 0.7;
    let changefreq = 'daily';
    
    if (path === '/') {
      priority = 1.0;
      changefreq = 'daily';
    } else if (path.startsWith('/rankings')) {
      priority = 0.9;
      changefreq = 'daily';
    } else if (path.startsWith('/country/')) {
      priority = 0.8;
      changefreq = 'weekly';
    } else if (path.startsWith('/methodology')) {
      priority = 0.6;
      changefreq = 'monthly';
    }
    
    return {
      loc: path,
      changefreq,
      priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    };
  },
};
