const path = require('path');

module.exports = {
  BASE_DIR: __dirname,
  DATA_FILE: path.join(__dirname, 'data', 'records.json'),
  BACKUP_DIR: path.join(__dirname, 'backups')
};
