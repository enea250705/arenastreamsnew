const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const MATCHES_FILE = path.join(DATA_DIR, 'matches.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize matches file if it doesn't exist
if (!fs.existsSync(MATCHES_FILE)) {
  fs.writeFileSync(MATCHES_FILE, JSON.stringify([], null, 2));
}

function loadMatches() {
  try {
    const data = fs.readFileSync(MATCHES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading matches:', error.message);
    return [];
  }
}

function saveMatches(matches) {
  try {
    fs.writeFileSync(MATCHES_FILE, JSON.stringify(matches, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving matches:', error.message);
    return false;
  }
}

function addMatch(newMatch) {
  const matches = loadMatches();
  matches.push(newMatch);
  return saveMatches(matches);
}

function updateMatch(id, updatedMatch) {
  const matches = loadMatches();
  const index = matches.findIndex(match => match.id === id);
  if (index !== -1) {
    matches[index] = { ...matches[index], ...updatedMatch };
    return saveMatches(matches);
  }
  return false;
}

function deleteMatch(id) {
  const matches = loadMatches();
  const filteredMatches = matches.filter(match => match.id !== id);
  return saveMatches(filteredMatches);
}

function getMatchById(id) {
  const matches = loadMatches();
  return matches.find(match => match.id === id);
}

function getMatchBySlug(slug) {
  const matches = loadMatches();
  return matches.find(match => match.slug === slug);
}

module.exports = {
  loadMatches,
  saveMatches,
  addMatch,
  updateMatch,
  deleteMatch,
  getMatchById,
  getMatchBySlug
};
