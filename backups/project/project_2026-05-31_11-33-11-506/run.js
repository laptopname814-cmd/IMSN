const { app, initDb } = require('./app');
const { startBackupLoop } = require('./backup_service');

const PORT = 5000;

(async () => {
  try {
    console.log('🚀 Starting Inventory Database Server...\n');
    
    await initDb();
    console.log('✓ Database initialized\n');
    
    startBackupLoop();
    
    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ Open your browser and visit: http://localhost:${PORT}\n`);
    });
  } catch (error) {
    console.error('❌ Startup error:', error.message || error);
    process.exit(1);
  }
})();
