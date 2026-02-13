const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'nutrition.db');
const db = new sqlite3.Database(dbPath);

console.log('Setting up database...');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS nutrition_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      food_name TEXT NOT NULL,
      calories REAL DEFAULT 0,
      protein REAL DEFAULT 0,
      carbs REAL DEFAULT 0,
      fat REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_nutrition_date ON nutrition_entries(date)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_nutrition_meal ON nutrition_entries(meal_type)`);

  db.run(`
    CREATE TABLE IF NOT EXISTS oura_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      readiness_score INTEGER,
      sleep_score INTEGER,
      activity_score INTEGER,
      steps INTEGER,
      total_calories REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_oura_date ON oura_scores(date)`);

  db.run(`
    CREATE TABLE IF NOT EXISTS oura_workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      activity TEXT,
      calories REAL,
      duration INTEGER,
      distance REAL,
      start_time TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_workouts_date ON oura_workouts(date)`);

  db.run(`
    CREATE TABLE IF NOT EXISTS weight_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      weight REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_weight_date ON weight_log(date)`);

  db.run(`
    CREATE TABLE IF NOT EXISTS hydration_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      cups INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_hydration_date ON hydration_log(date)`);

  db.run(`
    CREATE TABLE IF NOT EXISTS food_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      food_name TEXT NOT NULL,
      calories REAL DEFAULT 0,
      protein REAL DEFAULT 0,
      carbs REAL DEFAULT 0,
      fat REAL DEFAULT 0,
      last_used TEXT DEFAULT CURRENT_TIMESTAMP,
      use_count INTEGER DEFAULT 1
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error setting up database:', err);
    } else {
      console.log('✅ Database setup complete!');
      console.log(`📁 Database location: ${dbPath}`);
    }
    db.close();
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_food_name ON food_history(food_name)`);
});
