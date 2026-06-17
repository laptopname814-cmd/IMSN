const fs = require('fs').promises;
const path = require('path');
const config = require('./config');

const BACKUP_ROOT = config.BACKUP_DIR;
const PROJECT_BACKUP_DIR = path.join(BACKUP_ROOT, 'project');
const SNAPSHOT_DIR = path.join(BACKUP_ROOT, 'snapshots');
const DATA_BACKUP_DIR = path.join(BACKUP_ROOT, 'data');
const INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

const IGNORE_NAMES = new Set(['backups', 'node_modules', '.git', '.vscode', '__pycache__', '.gitignore', 'public']);

async function ensureDir(folder) {
  try {
    await fs.mkdir(folder, { recursive: true });
  } catch (error) {
    // ignore
  }
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').split('Z')[0];
}

async function copyDirectory(src, dest) {
  await ensureDir(dest);
  const items = await fs.readdir(src, { withFileTypes: true });
  
  for (const item of items) {
    if (IGNORE_NAMES.has(item.name)) {
      continue;
    }
    const sourcePath = path.join(src, item.name);
    const destPath = path.join(dest, item.name);
    
    if (item.isDirectory()) {
      await copyDirectory(sourcePath, destPath);
    } else if (item.isFile()) {
      try {
        await fs.copyFile(sourcePath, destPath);
      } catch (error) {
        // skip if file can't be copied
      }
    }
  }
}

async function backupProject() {
  try {
    const target = path.join(PROJECT_BACKUP_DIR, `project_${timestamp()}`);
    await copyDirectory(__dirname, target);
    console.log(`✓ Project backup created: ${target}`);
  } catch (error) {
    console.error('Project backup error:', error.message);
  }
}

async function backupData() {
  try {
    const target = path.join(DATA_BACKUP_DIR, `data_${timestamp()}.json`);
    const content = await fs.readFile(config.DATA_FILE, 'utf8');
    await ensureDir(DATA_BACKUP_DIR);
    await fs.writeFile(target, content, 'utf8');
    console.log(`✓ Data backup created: ${target}`);
  } catch (error) {
    console.error('Data backup error:', error.message);
  }
}

async function backupSnapshot() {
  try {
    const content = await fs.readFile(config.DATA_FILE, 'utf8');
    const data = JSON.parse(content);
    await ensureDir(SNAPSHOT_DIR);
    const outputFile = path.join(SNAPSHOT_DIR, `snapshot_${timestamp()}.json`);
    await fs.writeFile(outputFile, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✓ Data snapshot created: ${outputFile}`);
  } catch (error) {
    console.error('Snapshot error:', error.message);
  }
}

async function runBackupLoop() {
  console.log('⏰ Automatic backup service started. Backups every 30 minutes.');
  
  while (true) {
    try {
      await backupProject();
      await backupData();
      await backupSnapshot();
      console.log('✓ Backup cycle completed.\n');
    } catch (error) {
      console.error('Backup cycle error:', error.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, INTERVAL_MS));
  }
}

module.exports = { startBackupLoop: () => runBackupLoop() };
