require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cron = require('node-cron');
const { exec } = require('child_process');
const { promisify } = require('util');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Database setup
const db = new sqlite3.Database(path.join(__dirname, 'nutrition.db'));

// Promisify database methods
const dbRun = promisify(db.run.bind(db));
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.headers.authorization) {
    console.log('  ⚠️  Authorization header present:', req.headers.authorization.substring(0, 20) + '...');
  }
  next();
});

// Serve static HTML with no-cache headers - Default to space lean tracker
app.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'nutrition-tracker-space-lean.html'));
});

// Alternative endpoint with cache-busting
app.get('/fresh', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, '..', 'nutrition-tracker_V2.html'));
});

// Debug page
app.get('/debug', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, '..', 'nutrition-tracker_V2_debug.html'));
});

// Design mockup pages
app.get('/mockup_v1', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, 'mockup_animated_v1.html'));
});

app.get('/mockup_v2', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, 'mockup_animated_v2.html'));
});

app.get('/mockup_v3', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, 'mockup_animated_v3.html'));
});

// Space themed nutrition tracker (lean production version with API)
app.get('/space', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, 'nutrition-tracker-space-lean.html'));
});

// Space mockup (static demo)
app.get('/space-mockup', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, 'nutrition-tracker-space.html'));
});

// Lean space tracker (production)
app.get('/lean', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, '..', 'nutrition-tracker-space-lean.html'));
});

// AI Mastery Bootcamp Dashboard
app.get('/learn', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, '..', 'ai-mastery-dashboard.html'));
});

// ============================================================
// NUTRITION ENTRIES ENDPOINTS
// ============================================================

// Get nutrition entries for a specific date
app.get('/api/v1/entries/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const entries = await dbAll('SELECT * FROM nutrition_entries WHERE date = ? ORDER BY created_at', [date]);
    res.json({ date, entries });
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add nutrition entry
app.post('/api/v1/entries/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { meal_type, food_name, calories, protein, carbs, fat } = req.body;

    // Validate required fields
    if (!meal_type || !food_name) {
      return res.status(400).json({ 
        error: 'meal_type and food_name are required',
        received: { meal_type, food_name }
      });
    }

    // Use callback-based approach to get lastID
    const insertResult = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO nutrition_entries (date, meal_type, food_name, calories, protein, carbs, fat)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [date, meal_type, food_name, calories || 0, protein || 0, carbs || 0, fat || 0],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });

    // Update food history
    const historyCheck = await dbGet('SELECT * FROM food_history WHERE food_name = ?', [food_name]);
    if (historyCheck) {
      await dbRun(
        'UPDATE food_history SET use_count = use_count + 1, last_used = CURRENT_TIMESTAMP WHERE food_name = ?',
        [food_name]
      );
    } else {
      await dbRun(
        `INSERT INTO food_history (food_name, calories, protein, carbs, fat)
         VALUES (?, ?, ?, ?, ?)`,
        [food_name, calories || 0, protein || 0, carbs || 0, fat || 0]
      );
    }

    res.json({ success: true, id: insertResult.id });
  } catch (error) {
    console.error('Error adding entry:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete nutrition entry
app.delete('/api/v1/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await dbRun('DELETE FROM nutrition_entries WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// FOOD HISTORY ENDPOINTS
// ============================================================

// Get recent food history
app.get('/api/v1/food-history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const foods = await dbAll('SELECT * FROM food_history ORDER BY last_used DESC LIMIT ?', [limit]);
    res.json({ foods });
  } catch (error) {
    console.error('Error fetching food history:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// OURA ENDPOINTS
// ============================================================

// Get Oura scores for a specific date
app.get('/api/v1/oura/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const scores = await dbGet('SELECT * FROM oura_scores WHERE date = ?', [date]);
    console.log(`📊 Oura query for ${date}:`, scores);
    res.json(scores || {});
  } catch (error) {
    console.error('Error fetching Oura scores:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save Oura scores for a specific date
app.post('/api/v1/oura/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { readiness_score, sleep_score, activity_score, steps } = req.body;
    
    // Check if entry exists
    const existing = await dbGet('SELECT * FROM oura_scores WHERE date = ?', [date]);
    
    if (existing) {
      await dbRun(
        `UPDATE oura_scores SET 
         readiness_score = ?, sleep_score = ?, activity_score = ?, steps = ?
         WHERE date = ?`,
        [readiness_score, sleep_score, activity_score, steps, date]
      );
    } else {
      await dbRun(
        `INSERT INTO oura_scores 
         (date, readiness_score, sleep_score, activity_score, steps) 
         VALUES (?, ?, ?, ?, ?)`,
        [date, readiness_score, sleep_score, activity_score, steps]
      );
    }
    
    res.json({ success: true, date });
  } catch (error) {
    console.error('Error saving Oura scores:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Oura workouts for a specific date
app.get('/api/v1/oura/:date/workouts', async (req, res) => {
  try {
    const { date } = req.params;
    const workouts = await dbAll('SELECT * FROM oura_workouts WHERE date = ? ORDER BY start_time', [date]);
    res.json({ workouts });
  } catch (error) {
    console.error('Error fetching workouts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save Oura workouts for a specific date
app.post('/api/v1/oura/:date/workouts', async (req, res) => {
  try {
    const { date } = req.params;
    const { workouts } = req.body;
    
    if (!Array.isArray(workouts)) {
      return res.status(400).json({ error: 'workouts must be an array' });
    }
    
    // Delete existing workouts for this date first
    await dbRun('DELETE FROM oura_workouts WHERE date = ?', [date]);
    
    // Insert new workouts
    for (const workout of workouts) {
      await dbRun(
        `INSERT INTO oura_workouts 
         (date, activity, start_time, calories, distance, duration) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          date,
          workout.activity || 'Workout',
          workout.start_time || null,
          workout.calories || 0,
          workout.distance || 0,
          workout.duration || 0
        ]
      );
    }
    
    res.json({ success: true, date, count: workouts.length });
  } catch (error) {
    console.error('Error saving Oura workouts:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// HYDRATION ENDPOINTS
// ============================================================

// Get hydration for a specific date
app.get('/api/v1/hydration/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const hydration = await dbGet('SELECT * FROM hydration_log WHERE date = ?', [date]);
    res.json(hydration || { date, cups: 0 });
  } catch (error) {
    console.error('Error fetching hydration:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update hydration
app.post('/api/v1/hydration/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { cups } = req.body;

    // Check if entry exists
    const existing = await dbGet('SELECT * FROM hydration_log WHERE date = ?', [date]);
    
    if (existing) {
      await dbRun(
        'UPDATE hydration_log SET cups = ?, updated_at = CURRENT_TIMESTAMP WHERE date = ?',
        [cups, date]
      );
    } else {
      await dbRun(
        'INSERT INTO hydration_log (date, cups) VALUES (?, ?)',
        [date, cups]
      );
    }
    
    res.json({ success: true, date, cups });
  } catch (error) {
    console.error('Error updating hydration:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// WEIGHT LOG ENDPOINTS
// ============================================================

// Get weight history
app.get('/api/v1/weight', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const weights = await dbAll('SELECT * FROM weight_log ORDER BY date DESC, created_at DESC LIMIT ?', [limit]);
    res.json({ weights });
  } catch (error) {
    console.error('Error fetching weight history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add weight entry
app.post('/api/v1/weight', async (req, res) => {
  try {
    const { date, weight } = req.body;
    const result = await dbRun('INSERT INTO weight_log (date, weight) VALUES (?, ?)', [date, weight]);
    res.json({ success: true, id: result.lastID });
  } catch (error) {
    console.error('Error adding weight:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// Debug endpoint
app.get('/api/debug/oura/:date', async (req, res) => {
  try {
    const { date } = req.params;
    console.log(`[DEBUG] Testing query for date: ${date}`);
    const scores = await dbGet('SELECT * FROM oura_scores WHERE date = ?', [date]);
    console.log(`[DEBUG] Query returned:`, JSON.stringify(scores));
    res.json({ date, scores, rawScore: scores });
  } catch (error) {
    console.error('[DEBUG] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// SCHEDULED TASKS
// ============================================================

// Schedule Oura sync at 11:55 PM daily
cron.schedule('55 23 * * *', () => {
  console.log('⏰ Running scheduled Oura sync at 11:55 PM...');
  exec('node oura-sync.js', { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Oura sync error:', error);
      return;
    }
    console.log('✅ Oura sync output:', stdout);
    if (stderr) console.error('Oura sync stderr:', stderr);
  });
});

// Schedule Oura sync at 10:00 AM daily
cron.schedule('0 10 * * *', () => {
  console.log('⏰ Running scheduled Oura sync at 10:00 AM...');
  exec('node oura-sync.js', { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Oura sync error:', error);
      return;
    }
    console.log('✅ Oura sync output:', stdout);
    if (stderr) console.error('Oura sync stderr:', stderr);
  });
});

// Schedule Oura sync at 10:00 PM daily
cron.schedule('0 22 * * *', () => {
  console.log('⏰ Running scheduled Oura sync at 10:00 PM...');
  exec('node oura-sync.js', { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Oura sync error:', error);
      return;
    }
    console.log('✅ Oura sync output:', stdout);
    if (stderr) console.error('Oura sync stderr:', stderr);
  });
});

console.log('📅 Scheduled Oura sync at 10:00 AM, 10:00 PM, and 11:55 PM daily');

// ============================================================
// SERVER STARTUP WITH CRASH RECOVERY
// ============================================================

let server;
let isShuttingDown = false;

function startServer(retryCount = 0) {
  const maxRetries = 5;
  const retryDelay = 2000; // 2 seconds between retries
  
  server = app.listen(PORT, HOST, () => {
    const addresses = [];
    const networkInterfaces = require('os').networkInterfaces();
    
    Object.keys(networkInterfaces).forEach((interfaceName) => {
      networkInterfaces[interfaceName].forEach((iface) => {
        if (iface.family === 'IPv4' && !iface.internal) {
          addresses.push(iface.address);
        }
      });
    });

    console.log('\n🎉 Chad\'s Calorie Confessional Server Started!');
    console.log('=====================================');
    console.log(`📡 Local: http://localhost:${PORT}`);
    addresses.forEach(addr => {
      console.log(`📱 Network: http://${addr}:${PORT}`);
    });
    console.log('=====================================\n');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`⚠️ Port ${PORT} is busy. Attempt ${retryCount + 1}/${maxRetries}`);
      
      if (retryCount < maxRetries) {
        // Try to kill the process holding the port
        exec(`fuser -k ${PORT}/tcp 2>/dev/null || lsof -ti:${PORT} | xargs kill -9 2>/dev/null`, (error) => {
          console.log(`🔄 Retrying in ${retryDelay/1000}s...`);
          setTimeout(() => startServer(retryCount + 1), retryDelay);
        });
      } else {
        console.error('❌ Max retries exceeded. Exiting cleanly for PM2 restart.');
        process.exit(1);
      }
    } else {
      console.error('❌ Server error:', err);
      process.exit(1);
    }
  });
}

// Start the server
startServer();

// Global crash protection - log but DON'T crash for non-fatal errors
process.on('uncaughtException', (err) => {
  console.error('🔥 Uncaught Exception:', err);
  // Only exit if it's a fatal error (like EADDRINUSE which is handled above)
  if (err.code === 'EADDRINUSE') {
    // Already handled by server.on('error')
    return;
  }
  // Log but continue for other errors - most are recoverable
  console.error('⚠️ Continuing despite error...');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't crash - just log and continue
});

// Graceful shutdown handler
function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log(`\n👋 Received ${signal}. Shutting down gracefully...`);
  
  // Give the server 5 seconds to close
  const forceExitTimeout = setTimeout(() => {
    console.log('⚠️ Force closing after timeout');
    process.exit(0);
  }, 5000);
  
  if (server) {
    server.close(() => {
      console.log('✅ HTTP server closed');
      db.close((err) => {
        if (err) console.error('DB close error:', err);
        else console.log('✅ Database closed');
        clearTimeout(forceExitTimeout);
        process.exit(0);
      });
    });
  } else {
    clearTimeout(forceExitTimeout);
    process.exit(0);
  }
}

// Handle various shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGHUP', () => gracefulShutdown('SIGHUP'));
