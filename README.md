# Helix Protocol

## 📋 Overview

This is a complete local nutrition tracking system that:
- Runs on your home network
- Syncs with your Oura Ring daily at 11:55 PM
- Tracks nutrition, hydration, and weight
- Accessible from any device on your local network
- No cloud dependencies (runs entirely local)

## 🚀 Quick Start Deployment Guide

### Step 1: Install Node.js (if not already installed)

1. Download Node.js from: https://nodejs.org/
2. Choose the LTS version (Long Term Support)
3. Run the installer and follow the prompts
4. Verify installation by opening Command Prompt and typing:
   ```
   node --version
   npm --version
   ```

### Step 2: Navigate to Project Directory

Open Command Prompt (Windows Key + R, type `cmd`, press Enter) and run:

```bash
cd C:\Users\MainUser\.openclaw\workspace\nutrition-tracker-local
```

### Step 3: Install Dependencies

```bash
npm install
```

This will install:
- Express (web server)
- CORS (cross-origin requests)
- better-sqlite3 (database)
- node-cron (scheduled tasks)
- dotenv (environment variables)

### Step 4: Setup Database

```bash
npm run setup
```

You should see:
```
✅ Database setup complete!
📁 Database location: C:\Users\MainUser\.openclaw\workspace\nutrition-tracker-local\nutrition.db
```

### Step 5: Test Oura Sync (Optional)

```bash
npm run sync-oura
```

This will sync yesterday's Oura data. You should see:
```
🔄 Starting Oura Ring sync...
📅 Target date: 2026-02-03
✅ Daily scores synced: R=69 S=89 A=95 Steps=7129
✅ 3 workout(s) synced
✅ Oura sync complete!
```

### Step 6: Start the Server

```bash
npm start
```

You should see output like:
```
📅 Scheduled Oura sync at 11:55 PM daily

🎉 Chad's Calorie Confessional Server Started!
=====================================
📡 Local: http://localhost:3000
📱 Network: http://192.168.1.XXX:3000
=====================================
```

**IMPORTANT:** Copy the Network URL (the one that starts with 192.168...) - you'll need this!

### Step 7: Configure the HTML File

1. Open `C:\Users\MainUser\.openclaw\workspace\nutrition-tracker_V2.html` in a text editor (Notepad, VS Code, etc.)
2. Find this line near the top of the `<script>` section:
   ```javascript
   const API_BASE = 'http://localhost:3000/api/v1';
   ```
3. Replace `localhost` with your Network IP address from Step 6. For example:
   ```javascript
   const API_BASE = 'http://192.168.1.100:3000/api/v1';
   ```
4. Save the file

### Step 8: Open the Dashboard

1. Double-click `C:\Users\MainUser\.openclaw\workspace\nutrition-tracker_V2.html`
2. It should open in your default browser
3. You should see "● Connected" in the top-right corner (green)

## 📱 Access from Other Devices

### On Other Computers (Windows/Mac/Linux):
1. Copy the HTML file to the device
2. Make sure it has the correct Network IP in the API_BASE line
3. Open the HTML file in a browser

### On Phones/Tablets:
1. Copy the HTML file to your device (via email, cloud storage, etc.)
2. Open in Safari (iOS) or Chrome (Android)
3. Or set up a simple file server (see Advanced section below)

## 🔄 Automatic Oura Sync

The server automatically syncs Oura data every day at 11:55 PM. It will:
- Fetch readiness, sleep, and activity scores
- Fetch steps and calories burned
- Fetch all workouts for the day
- Store everything in the local database

No manual action required!

## 🎯 Using the Dashboard

### Drag & Drop Food Items
1. Drag items from "Quick Add from History" on the right
2. Drop them into Breakfast, Lunch, Dinner, or Snacks
3. The macros update automatically

### Hydration Tracker
- Click **+** to add a cup of water
- Click **-** to remove a cup
- Data saves automatically per day

### Weight Log
1. Enter your weight in pounds
2. Click "Log"
3. History shows below with dates

### Date Navigation
- Click **← Previous** or **Next →** to change dates
- Or use keyboard **Arrow Left** / **Arrow Right**
- Each date has separate data

## 🛠️ Troubleshooting

### Server won't start
- Make sure port 3000 is not in use by another program
- Try changing the PORT in `.env` file to 3001 or 8080
- Run `npm install` again

### "Disconnected" status in dashboard
- Check that the server is running (see Step 6)
- Verify the API_BASE URL in the HTML file matches your server IP
- Check your firewall isn't blocking port 3000

### Oura sync fails
- Verify OURA_TOKEN in `.env` file is correct
- Check internet connection (needed for Oura API)
- Try running `npm run sync-oura` manually to see errors

### No data showing
- Make sure server is running
- Check browser console for errors (F12 → Console tab)
- Verify database was created (`nutrition.db` should exist)

## 🔒 Security Notes

- This server runs on your LOCAL NETWORK only
- No authentication by default (safe for home use)
- To add password protection, uncomment AUTH_TOKEN in `.env` and modify server code
- Firewall should block external access automatically

## 📂 File Structure

```
nutrition-tracker-local/
├── server.js           # Main API server
├── oura-sync.js        # Oura Ring sync script
├── setup-db.js         # Database initialization
├── package.json        # Dependencies
├── .env                # Configuration (Oura token, port)
├── nutrition.db        # SQLite database (created after setup)
└── README.md           # This file

C:\Users\MainUser\.openclaw\workspace\
└── nutrition-tracker_V2.html   # Dashboard HTML file
```

## 🚀 Advanced: Keep Server Running 24/7

### Option 1: Windows Task Scheduler (Recommended)
1. Press Windows Key + R
2. Type `taskschd.msc` and press Enter
3. Click "Create Basic Task"
4. Name: "Nutrition Tracker Server"
5. Trigger: "When the computer starts"
6. Action: "Start a program"
7. Program: `C:\Program Files\nodejs\node.exe`
8. Arguments: `C:\Users\MainUser\.openclaw\workspace\nutrition-tracker-local\server.js`
9. Start in: `C:\Users\MainUser\.openclaw\workspace\nutrition-tracker-local`
10. Finish and test by restarting your computer

### Option 2: PM2 Process Manager
```bash
npm install -g pm2
cd C:\Users\MainUser\.openclaw\workspace\nutrition-tracker-local
pm2 start server.js --name nutrition-tracker
pm2 startup  # Configure to start on boot
pm2 save     # Save configuration
```

### Option 3: Simple Batch File
Create `start-server.bat` with:
```batch
@echo off
cd C:\Users\MainUser\.openclaw\workspace\nutrition-tracker-local
node server.js
pause
```
Double-click to start server anytime.

## 📊 Database Backup

Your data is stored in `nutrition.db`. To backup:
```bash
copy nutrition.db nutrition.db.backup
```

To restore:
```bash
copy nutrition.db.backup nutrition.db
```

## 🔧 Configuration Options

Edit `.env` file to change:
- `PORT`: Server port (default: 3000)
- `HOST`: Bind address (default: 0.0.0.0 = all interfaces)
- `OURA_TOKEN`: Your Oura API token
- `AUTH_TOKEN`: Optional password protection (leave blank for now)

## 📞 API Endpoints

For integration or debugging:

- `GET /api/v1/entries/:date` - Get nutrition entries
- `POST /api/v1/entries/:date` - Add nutrition entry
- `DELETE /api/v1/entries/:id` - Delete entry
- `GET /api/v1/oura/:date` - Get Oura scores
- `GET /api/v1/oura/:date/workouts` - Get workouts
- `GET /api/v1/hydration/:date` - Get hydration
- `POST /api/v1/hydration/:date` - Update hydration
- `GET /api/v1/weight` - Get weight history
- `POST /api/v1/weight` - Log weight
- `GET /api/v1/food-history` - Get recent foods
- `GET /api/health` - Server health check

## 🎉 That's It!

Your nutrition tracker is now running locally on your home network. The server will automatically sync Oura data every night at 11:55 PM. Access the dashboard from any device on your network by opening the HTML file!

---

**Questions?** Check the Troubleshooting section or review server logs in the Command Prompt window.
