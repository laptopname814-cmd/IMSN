const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const config = require('./config');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
// Serve the assect folder from parent directory
app.use('/assect', express.static(path.join(__dirname, '..', 'assect')));

let records = [];

async function ensureDataDir() {
  const dataDir = path.dirname(config.DATA_FILE);
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    // ignore if already exists
  }
}

async function loadRecords() {
  try {
    const content = await fs.readFile(config.DATA_FILE, 'utf8');
    records = JSON.parse(content);
  } catch (error) {
    records = [];
  }
  return records;
}

async function saveRecords() {
  await ensureDataDir();
  await fs.writeFile(config.DATA_FILE, JSON.stringify(records, null, 2), 'utf8');
}

async function initDb() {
  await ensureDataDir();
  await loadRecords();
}

function addRecord(payload) {
  const id = records.length > 0 ? Math.max(...records.map(r => r.id)) + 1 : 1;
  const record = {
    id,
    payload,
    created_at: new Date().toISOString()
  };
  records.push(record);
  return id;
}

function getRecords() {
  return records.sort((a, b) => b.id - a.id);
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.post('/save', async (req, res) => {
  const data = req.body;
  if (!data || Object.keys(data).length === 0) {
    return res.status(400).json({ status: 'error', message: 'JSON body required.' });
  }

  try {
    const recordId = addRecord(data);
    await saveRecords();
    return res.json({ 
      status: 'saved', 
      record_id: recordId, 
      saved_at: new Date().toISOString() 
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

app.get('/records', async (req, res) => {
  try {
    const result = getRecords();
    return res.json({ status: 'ok', records: result });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

app.get('/status', (req, res) => {
  res.json({
    status: 'running',
    data_file: config.DATA_FILE,
    backup_folder: config.BACKUP_DIR,
    total_records: records.length
  });
});

module.exports = { app, initDb, loadRecords, saveRecords };
