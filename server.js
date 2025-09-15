const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const axios = require('axios');
const handlebars = require('handlebars');

const app = express();
const PORT = process.env.PORT || 3000;

// Advanced Security Headers for 11/10 SEO
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://kt.restowelected.com", "https://np.mournersamoa.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      frameSrc: ["'self'", "https:", "http:"],
      connectSrc: ["'self'", "https:", "http:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      preconnect: ["https://fonts.googleapis.com", "https://fonts.gstatic.com"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  // Advanced security headers
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  // Performance headers
  dnsPrefetchControl: { allow: true },
  frameguard: { action: 'deny' }
}));

// Advanced compression for Core Web Vitals
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Cache control for static assets
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1y',
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    if (path.endsWith('.css') || path.endsWith('.js')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  }
}));

// Serve service worker from root
app.get('/sw.js', (req, res) => {
    res.set('Content-Type', 'application/javascript');
    res.set('Service-Worker-Allowed', '/');
    res.sendFile(path.join(__dirname, 'sw.js'));
});

// Serve custom ad protection service worker
app.get('/sw-custom.js', (req, res) => {
    res.set('Content-Type', 'application/javascript');
    res.set('Service-Worker-Allowed', '/');
    res.sendFile(path.join(__dirname, 'sw-custom.js'));
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Import routes
const matchRoutes = require('./routes/matches');
const adminRoutes = require('./routes/admin');

// Use routes
app.use('/api/matches', matchRoutes);
app.use('/admin', adminRoutes);

// Streamed.pk API integration
const STREAMED_API_BASE = 'https://streamed.pk/api';

// Streamed.pk API only - no local data
let sportsData = [];

// SEO Configuration
const seoConfig = {
  siteName: 'ArenaStreams',
  siteDescription: 'Watch live sports streaming online free. Football, Basketball, Tennis, UFC, Rugby, Baseball live streams in HD quality.',
  siteUrl: 'https://arenastreams.com',
  defaultImage: 'https://arenastreams.com/images/og-default.jpg',
  twitterHandle: '@ArenaStreams',
  sports: {
    football: {
      name: 'Football',
      description: 'Watch football live streams online free. Premier League, Champions League, La Liga, Serie A, Bundesliga matches.',
      keywords: 'football live stream, soccer streaming, premier league live, champions league stream, football matches online',
      image: 'https://arenastreams.com/images/football-og.jpg'
    },
    basketball: {
      name: 'Basketball',
      description: 'Watch basketball live streams online free. NBA games, college basketball, international basketball matches.',
      keywords: 'basketball live stream, NBA streaming, basketball games live, NBA live stream free',
      image: 'https://arenastreams.com/images/basketball-og.jpg'
    },
    tennis: {
      name: 'Tennis',
      description: 'Watch tennis live streams online free. Grand Slam tournaments, ATP, WTA matches, Wimbledon, US Open.',
      keywords: 'tennis live stream, tennis streaming, grand slam live, Wimbledon live stream',
      image: 'https://arenastreams.com/images/tennis-og.jpg'
    },
    ufc: {
      name: 'UFC',
      description: 'Watch UFC live streams online free. MMA fights, UFC events, boxing matches, combat sports.',
      keywords: 'UFC live stream, MMA streaming, UFC fights live, MMA fights free',
      image: 'https://arenastreams.com/images/ufc-og.jpg'
    },
    rugby: {
      name: 'Rugby',
      description: 'Watch rugby live streams online free. Six Nations, Rugby World Cup, Premiership, international rugby.',
      keywords: 'rugby live stream, rugby streaming, six nations live, rugby world cup stream',
      image: 'https://arenastreams.com/images/rugby-og.jpg'
    },
    baseball: {
      name: 'Baseball',
      description: 'Watch baseball live streams online free. MLB games, World Series, baseball matches, baseball streaming.',
      keywords: 'baseball live stream, MLB streaming, baseball games live, MLB live stream free',
      image: 'https://arenastreams.com/images/baseball-og.jpg'
    }
  }
};

// Initialize sports data from API only
async function initializeData() {
  try {
    console.log('🔄 Initializing with Streamed.pk API only...');
    
    // Fetch sports from streamed.pk API
    await fetchSportsFromAPI();
    
    console.log(`✅ Initialized with ${sportsData.length} sports from Streamed.pk`);
  } catch (error) {
    console.error('Error initializing data:', error);
  }
}

// Fetch sports from streamed.pk API
async function fetchSportsFromAPI() {
  try {
    console.log('🔄 Fetching sports from Streamed.pk API...');
    
    const sportsResponse = await axios.get(`${STREAMED_API_BASE}/sports`, {
      timeout: 10000
    });
    
    if (sportsResponse.data && Array.isArray(sportsResponse.data)) {
      sportsData = sportsResponse.data;
      console.log(`📊 Found ${sportsData.length} sports:`, sportsData.map(s => s.name || s).join(', '));
    }
  } catch (error) {
    console.log('⚠️ Could not fetch sports list, using default sports');
    sportsData = [
      { name: 'football', displayName: 'Football' },
      { name: 'basketball', displayName: 'Basketball' },
      { name: 'tennis', displayName: 'Tennis' },
      { name: 'ufc', displayName: 'UFC' },
      { name: 'rugby', displayName: 'Rugby' },
      { name: 'baseball', displayName: 'Baseball' }
    ];
  }
}

// Template rendering function
async function renderTemplate(templateName, data) {
  try {
    const templatePath = path.join(__dirname, 'views', `${templateName}.html`);
    const templateContent = await require('fs').promises.readFile(templatePath, 'utf8');
    const template = handlebars.compile(templateContent);
    return template(data);
  } catch (error) {
    console.error(`Error rendering template ${templateName}:`, error);
    throw error;
  }
}

// Homepage route - API only with advanced SEO
app.get('/', async (req, res) => {
  try {
    const html = await renderTemplate('homepage', {
      sports: sportsData.map(s => s.name || s),
      seo: {
        title: `${seoConfig.siteName} - Live Sports Streaming | Football, Basketball, Tennis, UFC`,
        description: seoConfig.siteDescription,
        keywords: 'live sports streaming, football live stream, basketball streaming, tennis live, UFC fights, rugby streaming, baseball live',
        canonical: seoConfig.siteUrl,
        ogTitle: `${seoConfig.siteName} - Live Sports Streaming`,
        ogDescription: seoConfig.siteDescription,
        ogImage: seoConfig.defaultImage,
        twitterCard: 'summary_large_image',
        twitterTitle: `${seoConfig.siteName} - Live Sports Streaming`,
        twitterDescription: seoConfig.siteDescription,
        twitterImage: seoConfig.defaultImage
      }
    });
    
    res.send(html);
  } catch (error) {
    console.error('Error rendering homepage:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Sport-specific routes with advanced SEO
Object.keys(seoConfig.sports).forEach(sport => {
  const sportConfig = seoConfig.sports[sport];
  
  app.get(`/${sport}`, async (req, res) => {
    try {
      console.log(`🔄 Rendering ${sport} page...`);
      console.log(`📊 Sport config:`, sportConfig);
      
      const templateData = {
        sport: sportConfig,
        seo: {
          title: `${sportConfig.name} Live Streams | ${seoConfig.siteName} - Free ${sportConfig.name} Streaming`,
          description: sportConfig.description,
          keywords: sportConfig.keywords,
          canonical: `${seoConfig.siteUrl}/${sport}`,
          ogTitle: `${sportConfig.name} Live Streams | ${seoConfig.siteName}`,
          ogDescription: sportConfig.description,
          ogImage: sportConfig.image,
          twitterCard: 'summary_large_image',
          twitterTitle: `${sportConfig.name} Live Streams | ${seoConfig.siteName}`,
          twitterDescription: sportConfig.description,
          twitterImage: sportConfig.image
        }
      };
      
      console.log(`📝 Template data prepared for ${sport}`);
      const html = await renderTemplate(`${sport}`, templateData);
      console.log(`✅ Successfully rendered ${sport} page`);
      res.send(html);
    } catch (error) {
      console.error(`❌ Error rendering ${sport} page:`, error);
      console.error(`❌ Error details:`, error.message);
      console.error(`❌ Error stack:`, error.stack);
      res.status(500).send(`Internal Server Error: ${error.message}`);
    }
  });
});

// Match page route - fetch real data from Streamed.pk
app.get('/match/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    console.log(`🔍 Loading match page for slug: ${slug}`);
    
    // Try to find the match by searching through all sports
    let matchData = null;
    const sports = ['football', 'basketball', 'tennis', 'ufc', 'rugby', 'baseball'];
    
    for (const sport of sports) {
      try {
        const response = await axios.get(`${STREAMED_API_BASE}/matches/${sport}`, {
          timeout: 10000
        });
        
        let matches = [];
        if (response.data.value && Array.isArray(response.data.value)) {
          matches = response.data.value;
        } else if (Array.isArray(response.data)) {
          matches = response.data;
        }
        
        // Look for a match that matches our slug (try ID first, then title-based slug)
        const foundMatch = matches.find(match => {
          // Try direct ID match first
          if (match.id === slug) {
            return true;
          }
          
          // Try slug-based matching
          let homeTeam = 'Team A';
          let awayTeam = 'Team B';
          
          if (match.teams && match.teams.home && match.teams.away) {
            homeTeam = match.teams.home.name || 'Team A';
            awayTeam = match.teams.away.name || 'Team B';
          } else if (match.title) {
            if (match.title.includes(' vs ')) {
              const titleParts = match.title.split(' vs ');
              if (titleParts.length === 2) {
                homeTeam = titleParts[0].trim();
                awayTeam = titleParts[1].trim();
              }
            } else {
              homeTeam = match.title;
              awayTeam = 'vs Opponent';
            }
          }
          
          // Handle date for slug generation
          let dateStr;
          if (match.date && match.date > 0) {
            dateStr = new Date(match.date).toISOString().split('T')[0];
          } else {
            dateStr = new Date().toISOString().split('T')[0];
          }
          
          const expectedSlug = `${homeTeam}-vs-${awayTeam}-live-${dateStr}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
          return expectedSlug === slug;
        });
        
        if (foundMatch) {
          console.log(`✅ Found match: ${foundMatch.title} (${foundMatch.id})`);
          
          // Process the match data
          let homeTeam = 'Team A';
          let awayTeam = 'Team B';
          let teamABadge = '';
          let teamBBadge = '';
          
          if (foundMatch.teams && foundMatch.teams.home && foundMatch.teams.away) {
            homeTeam = foundMatch.teams.home.name || 'Team A';
            awayTeam = foundMatch.teams.away.name || 'Team B';
            teamABadge = foundMatch.teams.home.badge ? `https://streamed.pk/api/images/badge/${foundMatch.teams.home.badge}.webp` : '';
            teamBBadge = foundMatch.teams.away.badge ? `https://streamed.pk/api/images/badge/${foundMatch.teams.away.badge}.webp` : '';
          } else if (foundMatch.title) {
            if (foundMatch.title.includes(' vs ')) {
              const titleParts = foundMatch.title.split(' vs ');
              if (titleParts.length === 2) {
                homeTeam = titleParts[0].trim();
                awayTeam = titleParts[1].trim();
              }
            } else {
              homeTeam = foundMatch.title;
              awayTeam = 'vs Opponent';
            }
          }
          
          // Handle date
          let matchDate;
          if (foundMatch.date && foundMatch.date > 0) {
            matchDate = new Date(foundMatch.date).toISOString();
          } else {
            const now = new Date();
            now.setHours(now.getHours() + 2);
            matchDate = now.toISOString();
          }
          
          matchData = {
            id: foundMatch.id,
            teamA: homeTeam,
            teamB: awayTeam,
            competition: foundMatch.title || `${sport.charAt(0).toUpperCase() + sport.slice(1)} Match`,
            date: matchDate,
            slug: slug,
            teamABadge: teamABadge,
            teamBBadge: teamBBadge,
            status: foundMatch.date && foundMatch.date > 0 ? 'upcoming' : 'upcoming',
            poster: foundMatch.poster ? `https://streamed.pk/api/images/poster/${foundMatch.poster}` : '',
            popular: foundMatch.popular || false,
            sources: foundMatch.sources || [],
            category: foundMatch.category || sport,
            sport: sport
          };
          break;
        }
      } catch (error) {
        console.log(`⚠️ Could not search ${sport} matches:`, error.message);
      }
    }
    
    if (!matchData) {
      console.log(`❌ No match found for slug: ${slug}`);
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Match Not Found</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>Match Not Found</h1>
          <p>The match you're looking for doesn't exist or has expired.</p>
          <a href="/" style="color: #ffcc00;">← Back to Home</a>
        </body>
        </html>
      `);
    }
    
    console.log(`📊 Rendering match page for: ${matchData.teamA} vs ${matchData.teamB}`);
    
    const html = await renderTemplate('match', {
      match: matchData
    });
    
    res.send(html);
  } catch (error) {
    console.error('Error rendering match page:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Sport page routes
app.get('/football', async (req, res) => {
  try {
    const html = await renderTemplate('football', {});
    res.send(html);
  } catch (error) {
    console.error('Error rendering football page:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/basketball', async (req, res) => {
  try {
    const html = await renderTemplate('basketball', {});
    res.send(html);
  } catch (error) {
    console.error('Error rendering basketball page:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/tennis', async (req, res) => {
  try {
    const html = await renderTemplate('tennis', {});
    res.send(html);
  } catch (error) {
    console.error('Error rendering tennis page:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/ufc', async (req, res) => {
  try {
    const html = await renderTemplate('ufc', {});
    res.send(html);
  } catch (error) {
    console.error('Error rendering UFC page:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/rugby', async (req, res) => {
  try {
    const html = await renderTemplate('rugby', {});
    res.send(html);
  } catch (error) {
    console.error('Error rendering rugby page:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/baseball', async (req, res) => {
  try {
    const html = await renderTemplate('baseball', {});
    res.send(html);
  } catch (error) {
    console.error('Error rendering baseball page:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Streamed.pk API proxy endpoints
app.get('/api/streamed/sports', async (req, res) => {
  try {
    const response = await axios.get(`${STREAMED_API_BASE}/sports`, {
      timeout: 10000
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching sports:', error);
    res.status(500).json({ error: 'Failed to fetch sports' });
  }
});

app.get('/api/streamed/matches/:sport', async (req, res) => {
  try {
    const { sport } = req.params;
    const response = await axios.get(`${STREAMED_API_BASE}/matches/${sport}`, {
      timeout: 15000
    });
    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching ${sport} matches:`, error);
    res.status(500).json({ error: `Failed to fetch ${sport} matches` });
  }
});

app.get('/api/streamed/matches/:sport/popular', async (req, res) => {
  try {
    const { sport } = req.params;
    const response = await axios.get(`${STREAMED_API_BASE}/matches/${sport}/popular`, {
      timeout: 15000
    });
    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching popular ${sport} matches:`, error);
    res.status(500).json({ error: `Failed to fetch popular ${sport} matches` });
  }
});

app.get('/api/streamed/matches/all', async (req, res) => {
  try {
    const response = await axios.get(`${STREAMED_API_BASE}/matches/all`, {
      timeout: 15000
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching all matches:', error);
    res.status(500).json({ error: 'Failed to fetch all matches' });
  }
});

app.get('/api/streamed/matches/all/popular', async (req, res) => {
  try {
    const response = await axios.get(`${STREAMED_API_BASE}/matches/all/popular`, {
      timeout: 15000
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching popular matches:', error);
    res.status(500).json({ error: 'Failed to fetch popular matches' });
  }
});

app.get('/api/streamed/matches/all-today', async (req, res) => {
  try {
    const response = await axios.get(`${STREAMED_API_BASE}/matches/all-today`, {
      timeout: 15000
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching today\'s matches:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s matches' });
  }
});

app.get('/api/streamed/matches/all-today/popular', async (req, res) => {
  try {
    const response = await axios.get(`${STREAMED_API_BASE}/matches/all-today/popular`, {
      timeout: 15000
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching popular today\'s matches:', error);
    res.status(500).json({ error: 'Failed to fetch popular today\'s matches' });
  }
});

app.get('/api/streamed/matches/live', async (req, res) => {
  try {
    const response = await axios.get(`${STREAMED_API_BASE}/matches/live`, {
      timeout: 15000
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching live matches:', error);
    res.status(500).json({ error: 'Failed to fetch live matches' });
  }
});

app.get('/api/streamed/matches/live/popular', async (req, res) => {
  try {
    const response = await axios.get(`${STREAMED_API_BASE}/matches/live/popular`, {
      timeout: 15000
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching popular live matches:', error);
    res.status(500).json({ error: 'Failed to fetch popular live matches' });
  }
});

app.get('/api/streamed/stream/:source/:id', async (req, res) => {
  try {
    const { source, id } = req.params;
    const response = await axios.get(`${STREAMED_API_BASE}/stream/${source}/${id}`, {
      timeout: 10000
    });
    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching stream ${source}/${id}:`, error);
    res.status(500).json({ error: 'Failed to fetch stream' });
  }
});

app.get('/api/streamed/images/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const response = await axios.get(`${STREAMED_API_BASE}/images/${type}/${id}`, {
      timeout: 10000,
      responseType: 'stream'
    });
    
    res.set({
      'Content-Type': response.headers['content-type'] || 'image/webp',
      'Cache-Control': 'public, max-age=3600'
    });
    
    response.data.pipe(res);
  } catch (error) {
    console.error(`Error fetching image ${type}/${id}:`, error);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

// Sitemap route
app.get('/sitemap.xml', async (req, res) => {
  try {
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://arenasports.com/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://arenasports.com/football</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://arenasports.com/basketball</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://arenasports.com/tennis</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://arenasports.com/ufc</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://arenasports.com/rugby</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://arenasports.com/baseball</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`;
    
    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Additional sitemaps for 11/10 SEO
app.get('/sitemap-sports.xml', async (req, res) => {
  try {
    const sports = ['football', 'basketball', 'tennis', 'ufc', 'rugby', 'baseball'];
    const urls = sports.map(sport => ({
      loc: `https://arenasports.com/${sport}`,
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
      priority: '0.9'
    }));
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
    
    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Error generating sports sitemap:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/sitemap-images.xml', async (req, res) => {
  try {
    const images = [
      { loc: 'https://arenasports.com/images/football-og.jpg', caption: 'Football Live Streaming' },
      { loc: 'https://arenasports.com/images/basketball-og.jpg', caption: 'Basketball Live Streaming' },
      { loc: 'https://arenasports.com/images/tennis-og.jpg', caption: 'Tennis Live Streaming' },
      { loc: 'https://arenasports.com/images/ufc-og.jpg', caption: 'UFC Live Streaming' },
      { loc: 'https://arenasports.com/images/rugby-og.jpg', caption: 'Rugby Live Streaming' },
      { loc: 'https://arenasports.com/images/baseball-og.jpg', caption: 'Baseball Live Streaming' }
    ];
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://arenasports.com/</loc>
    <image:image>
      <image:loc>${images[0].loc}</image:loc>
      <image:caption>${images[0].caption}</image:caption>
    </image:image>
  </url>
${images.slice(1).map(img => `  <url>
    <loc>https://arenasports.com/</loc>
    <image:image>
      <image:loc>${img.loc}</image:loc>
      <image:caption>${img.caption}</image:caption>
    </image:image>
  </url>`).join('\n')}
</urlset>`;
    
    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Error generating image sitemap:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Advanced Robots.txt route
app.get('/robots.txt', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Sitemap location
Sitemap: ${seoConfig.siteUrl}/sitemap.xml

# Additional sitemaps for different content types
Sitemap: ${seoConfig.siteUrl}/sitemap-sports.xml
Sitemap: ${seoConfig.siteUrl}/sitemap-matches.xml`);
});

// Initialize data and start server
initializeData().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 ArenaStreams server running on port ${PORT}`);
    console.log(`📱 Homepage: http://localhost:${PORT}`);
    console.log(`⚽ Football: http://localhost:${PORT}/football`);
    console.log(`🏀 Basketball: http://localhost:${PORT}/basketball`);
    console.log(`🎾 Tennis: http://localhost:${PORT}/tennis`);
    console.log(`🥊 UFC: http://localhost:${PORT}/ufc`);
    console.log(`🏉 Rugby: http://localhost:${PORT}/rugby`);
    console.log(`⚾ Baseball: http://localhost:${PORT}/baseball`);
    console.log(`🔧 Admin: http://localhost:${PORT}/admin`);
    console.log(`📊 API: http://localhost:${PORT}/api/streamed/sports`);
  });
});