const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const moment = require('moment');
const slugify = require('slugify');

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

// Save matches data
async function saveMatches() {
  await fs.writeFile('./data/matches.json', JSON.stringify(matchesData, null, 2));
}

// Initialize data
loadMatches();

// GET all matches
router.get('/', async (req, res) => {
  try {
    await loadMatches();
    res.json({
      success: true,
      matches: matchesData,
      total: matchesData.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET matches by sport
router.get('/sport/:sport', async (req, res) => {
  try {
    await loadMatches();
    const { sport } = req.params;
    const sportMatches = matchesData.filter(match => 
      match.sport.toLowerCase() === sport.toLowerCase()
    );
    
    res.json({
      success: true,
      sport,
      matches: sportMatches,
      total: sportMatches.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET today's matches
router.get('/today', async (req, res) => {
  try {
    await loadMatches();
    const today = moment().format('YYYY-MM-DD');
    const todayMatches = matchesData.filter(match => 
      moment(match.date).format('YYYY-MM-DD') === today
    );
    
    res.json({
      success: true,
      date: today,
      matches: todayMatches,
      total: todayMatches.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET specific match
router.get('/:id', async (req, res) => {
  try {
    await loadMatches();
    const { id } = req.params;
    const match = matchesData.find(m => m.id === id);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }
    
    res.json({
      success: true,
      match
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST new match
router.post('/', async (req, res) => {
  try {
    await loadMatches();
    
    const {
      sport,
      teamA,
      teamB,
      competition,
      date,
      embedUrls = [],
      teamABadge = '',
      teamBBadge = ''
    } = req.body;
    
    // Validation
    if (!sport || !teamA || !teamB || !competition || !date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sport, teamA, teamB, competition, date'
      });
    }
    
    // Generate unique ID
    const id = `${sport}-${Date.now()}`;
    
    // Create match object
    const newMatch = {
      id,
      sport: sport.toLowerCase(),
      teamA,
      teamB,
      competition,
      date,
      embedUrls: Array.isArray(embedUrls) ? embedUrls : [embedUrls],
      teamABadge,
      teamBBadge,
      status: 'upcoming',
      createdAt: new Date().toISOString(),
      source: 'manual'
    };
    
    // Add to matches
    matchesData.push(newMatch);
    await saveMatches();
    
    // Generate SEO page
    const slug = slugify(`${teamA}-vs-${teamB}-live-${moment(date).format('YYYY-MM-DD')}`, {
      lower: true,
      strict: true
    });
    
    newMatch.slug = slug;
    
    // Generate HTML page
    await generateMatchPage(newMatch);
    
    res.json({
      success: true,
      match: newMatch,
      message: 'Match added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT update match
router.put('/:id', async (req, res) => {
  try {
    await loadMatches();
    
    const { id } = req.params;
    const matchIndex = matchesData.findIndex(m => m.id === id);
    
    if (matchIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }
    
    // Update match
    matchesData[matchIndex] = {
      ...matchesData[matchIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    await saveMatches();
    
    // Regenerate SEO page
    await generateMatchPage(matchesData[matchIndex]);
    
    res.json({
      success: true,
      match: matchesData[matchIndex],
      message: 'Match updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE match
router.delete('/:id', async (req, res) => {
  try {
    await loadMatches();
    
    const { id } = req.params;
    const matchIndex = matchesData.findIndex(m => m.id === id);
    
    if (matchIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }
    
    const match = matchesData[matchIndex];
    
    // Remove from array
    matchesData.splice(matchIndex, 1);
    await saveMatches();
    
    // Delete generated page
    if (match.slug) {
      try {
        await fs.unlink(`./generated/${match.slug}.html`);
      } catch (error) {
        console.log('Could not delete generated page:', error.message);
      }
    }
    
    res.json({
      success: true,
      message: 'Match deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate match page function
async function generateMatchPage(match) {
  try {
    const slug = match.slug || slugify(`${match.teamA}-vs-${match.teamB}-live-${moment(match.date).format('YYYY-MM-DD')}`, {
      lower: true,
      strict: true
    });
    
    match.slug = slug;
    
    // Read template
    const templatePath = path.join(__dirname, '..', 'views', 'match.html');
    let template = await fs.readFile(templatePath, 'utf8');
    
    // Replace placeholders
    template = template.replace(/\{\{match\.teamA\}\}/g, match.teamA);
    template = template.replace(/\{\{match\.teamB\}\}/g, match.teamB);
    template = template.replace(/\{\{match\.competition\}\}/g, match.competition);
    template = template.replace(/\{\{match\.date\}\}/g, moment(match.date).format('MMMM DD, YYYY'));
    template = template.replace(/\{\{match\.slug\}\}/g, slug);
    
    // Save generated page
    await fs.writeFile(`./generated/${slug}.html`, template);
    
    console.log(`Generated match page: ${slug}.html`);
  } catch (error) {
    console.error('Error generating match page:', error);
  }
}

module.exports = router;
