# Inventory Database Server

A complete, self-contained Node.js server with automatic backups and a web interface.

## Features

✓ **Web Interface** — HTML/CSS/JavaScript UI to save and view records  
✓ **Local JSON Storage** — No database installation required  
✓ **Automatic Backups** — Every 30 minutes

## Quick Start

1. Open PowerShell in this folder:
   ```powershell
   cd "c:\Users\Sher Asli\Desktop\inventory managment system\database_server"
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Start the server:
   ```powershell
   npm start
   ```

4. Open your browser:
   ```
   http://localhost:5000
   ```

## Web Interface

Open `http://localhost:5000` in your browser to use the HTML/CSS/JavaScript frontend.

## API Endpoints

- `GET /` — serves the frontend page
- `POST /save` — save JSON payload into MySQL
- `GET /records` — read saved records
- `GET /status` — server and database info

## Backup behavior

- Creates project backups into `backups/project`
- Creates JSON snapshots into `backups/snapshots`
- Runs every 30 minutes automatically while the server is running

## Notes

- The server automatically creates the MySQL database and `records` table.
- If Node.js is not installed, install it first from https://nodejs.org/
