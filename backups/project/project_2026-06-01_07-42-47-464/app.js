const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const config = require('./config');
const backupService = require('./backup_service');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
// Serve the assect folder from parent directory
app.use('/assect', express.static(path.join(__dirname, '..', 'assect')));
// Serve the whole project root (so the root `index.html` and its local assets are available)
app.use('/app', express.static(path.join(__dirname, '..')));

// Route to serve the root index.html at /app
app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

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

// Manual backup endpoint
app.post('/backup', async (req, res) => {
  try {
    const result = await backupService.manualBackup();
    if (result.status === 'ok') return res.json({ status: 'ok', message: 'Backup completed' });
    return res.status(500).json({ status: 'error', message: result.message || 'Backup failed' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// User management using records with payload.type === 'user'
app.get('/users', async (req, res) => {
  try {
    const users = records.filter(r => r.payload && r.payload.type === 'user').map(r => ({ id: r.id, ...r.payload }));
    return res.json({ status: 'ok', users });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

app.post('/users', async (req, res) => {
  const data = req.body;
  if (!data || !data.name || !data.password) {
    return res.status(400).json({ status: 'error', message: 'name and password required' });
  }
  try {
    data.type = 'user';
    const id = addRecord(data);
    await saveRecords();
    return res.json({ status: 'created', id });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

app.put('/users/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const data = req.body;
  try {
    const idx = records.findIndex(r => r.id === id && r.payload && r.payload.type === 'user');
    if (idx === -1) return res.status(404).json({ status: 'error', message: 'User not found' });
    // Prevent changing type
    const updated = { ...records[idx].payload, ...data, type: 'user' };
    records[idx].payload = updated;
    await saveRecords();
    return res.json({ status: 'ok' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

app.post('/users/:id/change-password', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { password } = req.body;
  if (!password) return res.status(400).json({ status: 'error', message: 'password required' });
  try {
    const idx = records.findIndex(r => r.id === id && r.payload && r.payload.type === 'user');
    if (idx === -1) return res.status(404).json({ status: 'error', message: 'User not found' });
    records[idx].payload.password = password;
    await saveRecords();
    return res.json({ status: 'ok' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// Update password via PUT /users/:id/password
app.put('/users/:id/password', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { password } = req.body;
  if (!password) return res.status(400).json({ status: 'error', message: 'password required' });
  try {
    const idx = records.findIndex(r => r.id === id && r.payload && r.payload.type === 'user');
    if (idx === -1) return res.status(404).json({ status: 'error', message: 'User not found' });
    records[idx].payload.password = password;
    await saveRecords();
    return res.json({ status: 'ok' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// Delete user
app.delete('/users/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const idx = records.findIndex(r => r.id === id && r.payload && r.payload.type === 'user');
    if (idx === -1) return res.status(404).json({ status: 'error', message: 'User not found' });
    records.splice(idx, 1);
    await saveRecords();
    return res.json({ status: 'ok' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = { app, initDb, loadRecords, saveRecords };
