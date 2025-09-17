const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');
const multer = require('multer');
const slugify = require('slugify');
const moment = require('moment');

const router = express.Router();

// Load matches data
let matchesData = [];
async function loadMatches() {
  try {
    const data = await fs.readFile('./data/matches.json', 'utf8');
    matchesData = JSON.parse(data);
  } catch (error) {
    matchesData = [];
  }
}

// Initialize data
loadMatches();

// Overrides (extra servers for fetched matches)
const overridesPath = path.join(__dirname, '..', 'data', 'overrides.json');
let overridesData = [];
async function loadOverrides() {
  try {
    const data = await fs.readFile(overridesPath, 'utf8');
    overridesData = JSON.parse(data);
  } catch (e) {
    overridesData = [];
  }
}
async function saveOverrides() {
  await fs.writeFile(overridesPath, JSON.stringify(overridesData, null, 2));
}

// Multer storage for team logos
const logosDir = path.join(__dirname, '..', 'public', 'images', 'logos');
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      await fs.mkdir(logosDir, { recursive: true });
    } catch (e) {}
    cb(null, logosDir);
  },
  filename: function (req, file, cb) {
    const ext = (file.originalname && file.originalname.split('.').pop()) || 'png';
    const safe = (file.fieldname === 'teamALogo' ? 'teamA' : 'teamB') + '-' + Date.now();
    cb(null, `${safe}.${ext}`);
  }
});
const upload = multer({ storage });

// Template rendering function
async function renderTemplate(templateName, data) {
  try {
    const templatePath = path.join(__dirname, '..', 'views', `${templateName}.html`);
    const templateSource = await fs.readFile(templatePath, 'utf8');
    
    // Compile Handlebars template
    const template = handlebars.compile(templateSource);
    
    // Register helpers
    handlebars.registerHelper('eq', function(a, b) {
      return a === b;
    });
    
    // Render template with data
    return template(data);
  } catch (error) {
    console.error('Error rendering template:', error);
    throw error;
  }
}

// Admin dashboard
router.get('/', async (req, res) => {
  try {
    await loadMatches();
    
    const stats = {
      totalMatches: matchesData.length,
      matchesBySport: {},
      todayMatches: 0,
      upcomingMatches: 0
    };
    
    const today = new Date().toISOString().split('T')[0];
    
    matchesData.forEach(match => {
      // Count by sport
      if (!stats.matchesBySport[match.sport]) {
        stats.matchesBySport[match.sport] = 0;
      }
      stats.matchesBySport[match.sport]++;
      
      // Count today's matches
      if (match.date && match.date.startsWith(today)) {
        stats.todayMatches++;
      }
      
      // Count upcoming matches
      if (match.status === 'upcoming') {
        stats.upcomingMatches++;
      }
    });
    
    const html = await renderTemplate('admin', {
      stats,
      recentMatches: matchesData.slice(-10).reverse()
    });
    res.send(html);
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
    res.status(500).send('Error loading admin dashboard');
  }
});

// Add match form
router.get('/add-match', async (req, res) => {
  try {
    const html = await renderTemplate('add-match', {
      sports: ['football', 'basketball', 'baseball', 'rugby', 'tennis', 'ufc']
    });
    res.send(html);
  } catch (error) {
    console.error('Error loading add match form:', error);
    res.status(500).send('Error loading add match form');
  }
});

// Add extra server for fetched matches (by slug)
router.get('/add-server', async (req, res) => {
  try {
    await loadOverrides();
    const { slug = '' } = req.query || {};
    const html = await renderTemplate('add-server', { slug, error: null });
    res.send(html);
  } catch (error) {
    console.error('Error loading add server form:', error);
    res.status(500).send('Error loading add server form');
  }
});

router.post('/add-server', async (req, res) => {
  try {
    await loadOverrides();
    const { slug, embedUrls } = req.body;

    if (!slug || !embedUrls) {
      const html = await renderTemplate('add-server', {
        slug,
        error: 'Please provide both the match slug and at least one embed URL'
      });
      return res.send(html);
    }

    const urls = embedUrls.split('\n').map(u => u.trim()).filter(Boolean);
    const idx = overridesData.findIndex(o => o.slug === slug);
    const now = new Date().toISOString();
    if (idx >= 0) {
      overridesData[idx] = { ...overridesData[idx], embedUrls: urls, updatedAt: now };
    } else {
      overridesData.push({ slug, embedUrls: urls, createdAt: now, updatedAt: now });
    }
    await saveOverrides();

    res.redirect('/admin?success=Server links saved for match');
  } catch (error) {
    console.error('Error saving server override:', error);
    const html = await renderTemplate('add-server', {
      slug: req.body.slug,
      error: 'Error saving: ' + error.message
    });
    res.send(html);
  }
});

// Handle add match form submission
router.post('/add-match', upload.fields([{ name: 'teamALogo' }, { name: 'teamBLogo' }]), async (req, res) => {
  try {
    await loadMatches();
    
    const {
      sport,
      teamA,
      teamB,
      competition,
      date,
      time,
      embedUrls,
      teamABadge,
      teamBBadge
    } = req.body;
    
    // Validation
    if (!sport || !teamA || !teamB || !competition || !date) {
      const html = await renderTemplate('add-match', {
        sports: ['football', 'basketball', 'baseball', 'rugby', 'tennis', 'ufc'],
        error: 'Please fill in all required fields',
        formData: req.body
      });
      return res.send(html);
    }
    
    // Combine date and time
    const fullDate = time ? `${date}T${time}` : date;
    
    // Generate unique ID
    const id = `${sport}-${Date.now()}`;
    
    // Determine logo URLs if files uploaded
    let uploadedTeamALogo = '';
    let uploadedTeamBLogo = '';
    try {
      if (req.files && req.files.teamALogo && req.files.teamALogo[0]) {
        uploadedTeamALogo = `/images/logos/${req.files.teamALogo[0].filename}`;
      }
      if (req.files && req.files.teamBLogo && req.files.teamBLogo[0]) {
        uploadedTeamBLogo = `/images/logos/${req.files.teamBLogo[0].filename}`;
      }
    } catch (e) {}

    // Create match object
    const newMatch = {
      id,
      sport: sport.toLowerCase(),
      teamA,
      teamB,
      competition,
      date: fullDate,
      embedUrls: embedUrls ? embedUrls.split('\n').filter(url => url.trim()) : [],
      teamABadge: uploadedTeamALogo || teamABadge,
      teamBBadge: uploadedTeamBLogo || teamBBadge,
      status: 'upcoming',
      createdAt: new Date().toISOString(),
    source: 'admin'
    };
    
    // Generate SEO-friendly slug
    newMatch.slug = slugify(`${teamA}-vs-${teamB}-live-${moment(fullDate).format('YYYY-MM-DD')}`, {
      lower: true,
      strict: true
    });
    
    // Add to matches
    matchesData.push(newMatch);
    await fs.writeFile('./data/matches.json', JSON.stringify(matchesData, null, 2));
    
    res.redirect('/admin?success=Match added successfully');
  } catch (error) {
    console.error('Error adding match:', error);
    const html = await renderTemplate('add-match', {
      sports: ['football', 'basketball', 'baseball', 'rugby', 'tennis', 'ufc'],
      error: 'Error adding match: ' + error.message,
      formData: req.body
    });
    res.send(html);
  }
});

// Edit match form
router.get('/edit-match/:id', async (req, res) => {
  try {
    await loadMatches();
    
    const { id } = req.params;
    const match = matchesData.find(m => m.id === id);
    
    if (!match) {
      return res.status(404).send('Match not found');
    }
    
    const html = await renderTemplate('edit-match', {
      match,
      sports: ['football', 'basketball', 'baseball', 'rugby', 'tennis', 'ufc']
    });
    res.send(html);
  } catch (error) {
    console.error('Error loading edit match form:', error);
    res.status(500).send('Error loading edit match form');
  }
});

// Handle edit match form submission
router.post('/edit-match/:id', upload.fields([{ name: 'teamALogo' }, { name: 'teamBLogo' }]), async (req, res) => {
  try {
    await loadMatches();
    
    const { id } = req.params;
    const matchIndex = matchesData.findIndex(m => m.id === id);
    
    if (matchIndex === -1) {
      return res.status(404).send('Match not found');
    }
    
    const {
      sport,
      teamA,
      teamB,
      competition,
      date,
      time,
      embedUrls,
      teamABadge,
      teamBBadge,
      status
    } = req.body;
    
    // Update match
    const fullDate = time ? `${date}T${time}` : date;
    
    // Determine logo URLs if files uploaded
    let uploadedTeamALogo = '';
    let uploadedTeamBLogo = '';
    try {
      if (req.files && req.files.teamALogo && req.files.teamALogo[0]) {
        uploadedTeamALogo = `/images/logos/${req.files.teamALogo[0].filename}`;
      }
      if (req.files && req.files.teamBLogo && req.files.teamBLogo[0]) {
        uploadedTeamBLogo = `/images/logos/${req.files.teamBLogo[0].filename}`;
      }
    } catch (e) {}

    matchesData[matchIndex] = {
      ...matchesData[matchIndex],
      sport: sport.toLowerCase(),
      teamA,
      teamB,
      competition,
      date: fullDate,
      embedUrls: embedUrls ? embedUrls.split('\n').filter(url => url.trim()) : [],
      teamABadge: uploadedTeamALogo || teamABadge || matchesData[matchIndex].teamABadge,
      teamBBadge: uploadedTeamBLogo || teamBBadge || matchesData[matchIndex].teamBBadge,
      status: status || 'upcoming',
    updatedAt: new Date().toISOString()
    };
    
    // Regenerate slug if key fields changed
    matchesData[matchIndex].slug = slugify(`${teamA}-vs-${teamB}-live-${moment(fullDate).format('YYYY-MM-DD')}`, {
      lower: true,
      strict: true
    });
    
    await fs.writeFile('./data/matches.json', JSON.stringify(matchesData, null, 2));
    
    res.redirect('/admin?success=Match updated successfully');
  } catch (error) {
    console.error('Error updating match:', error);
    res.status(500).send('Error updating match');
  }
});

// Delete match
router.post('/delete-match/:id', async (req, res) => {
  try {
    await loadMatches();
    
    const { id } = req.params;
    const matchIndex = matchesData.findIndex(m => m.id === id);
    
    if (matchIndex === -1) {
      return res.status(404).send('Match not found');
    }
    
    const match = matchesData[matchIndex];
    
    // Remove from array
    matchesData.splice(matchIndex, 1);
    await fs.writeFile('./data/matches.json', JSON.stringify(matchesData, null, 2));
    
    // Delete generated page
    if (match.slug) {
      try {
        await fs.unlink(`./generated/${match.slug}.html`);
      } catch (error) {
        console.log('Could not delete generated page:', error.message);
      }
    }
    
    res.redirect('/admin?success=Match deleted successfully');
  } catch (error) {
    console.error('Error deleting match:', error);
    res.status(500).send('Error deleting match');
  }
});

// Regenerate all match pages
router.post('/regenerate-pages', async (req, res) => {
  try {
    await loadMatches();
    
    let regenerated = 0;
    
    for (const match of matchesData) {
      try {
        // Generate slug if not exists
        if (!match.slug) {
          const slugify = require('slugify');
          const moment = require('moment');
          match.slug = slugify(`${match.teamA}-vs-${match.teamB}-live-${moment(match.date).format('YYYY-MM-DD')}`, {
            lower: true,
            strict: true
          });
        }
        
        // Read template
        const templatePath = path.join(__dirname, '..', 'views', 'match.html');
        let template = await fs.readFile(templatePath, 'utf8');
        
        // Replace placeholders
        template = template.replace(/\{\{match\.teamA\}\}/g, match.teamA);
        template = template.replace(/\{\{match\.teamB\}\}/g, match.teamB);
        template = template.replace(/\{\{match\.competition\}\}/g, match.competition);
        template = template.replace(/\{\{match\.date\}\}/g, require('moment')(match.date).format('MMMM DD, YYYY'));
        template = template.replace(/\{\{match\.slug\}\}/g, match.slug);
        
        // Save generated page
        await fs.writeFile(`./generated/${match.slug}.html`, template);
        regenerated++;
      } catch (error) {
        console.error(`Error regenerating page for match ${match.id}:`, error);
      }
    }
    
    // Save updated matches with slugs
    await fs.writeFile('./data/matches.json', JSON.stringify(matchesData, null, 2));
    
    res.redirect(`/admin?success=${regenerated} match pages regenerated successfully`);
  } catch (error) {
    console.error('Error regenerating pages:', error);
    res.status(500).send('Error regenerating pages');
  }
});

module.exports = router;
