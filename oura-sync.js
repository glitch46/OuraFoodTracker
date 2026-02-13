require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { promisify } = require('util');

const OURA_TOKEN = process.env.OURA_TOKEN;
const db = new sqlite3.Database(path.join(__dirname, 'nutrition.db'));

// Promisify database methods
const dbRun = promisify(db.run.bind(db));
const dbGet = promisify(db.get.bind(db));

if (!OURA_TOKEN) {
  console.error('❌ OURA_TOKEN not found in .env file');
  process.exit(1);
}

async function fetchOuraData(endpoint, params = {}) {
  const url = new URL(`https://api.ouraring.com/v2/usercollection/${endpoint}`);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${OURA_TOKEN}`
    }
  });

  if (!response.ok) {
    throw new Error(`Oura API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function syncDailyScores(date) {
  console.log(`Syncing daily scores for ${date}...`);

  try {
    // Oura API works better with date ranges for activity data
    const startDate = new Date(date);
    startDate.setDate(startDate.getDate() - 2);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    // Fetch all data in bulk ranges
    const [readinessData, sleepData, activityData] = await Promise.all([
      fetchOuraData('daily_readiness', { start_date: startStr, end_date: endStr }),
      fetchOuraData('daily_sleep', { start_date: startStr, end_date: endStr }),
      fetchOuraData('daily_activity', { start_date: startStr, end_date: endStr })
    ]);

    // Find data for target date
    const readiness = readinessData.data.find(r => r.day === date);
    const sleep = sleepData.data.find(s => s.day === date);
    const activity = activityData.data.find(a => a.day === date);

    // Use active_calories (exercise calories) instead of total_calories (metabolic + exercise)
    const calories = activity?.active_calories || null;

    // Check if entry exists
    const existing = await dbGet('SELECT * FROM oura_scores WHERE date = ?', [date]);

    if (existing) {
      await dbRun(
        `UPDATE oura_scores SET readiness_score = ?, sleep_score = ?, activity_score = ?, steps = ?, total_calories = ?
         WHERE date = ?`,
        [
          readiness?.score || null,
          sleep?.score || null,
          activity?.score || null,
          activity?.steps || null,
          calories,
          date
        ]
      );
    } else {
      await dbRun(
        `INSERT INTO oura_scores (date, readiness_score, sleep_score, activity_score, steps, total_calories)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          date,
          readiness?.score || null,
          sleep?.score || null,
          activity?.score || null,
          activity?.steps || null,
          calories
        ]
      );
    }

    console.log(`✅ Daily scores synced: R=${readiness?.score} S=${sleep?.score} A=${activity?.score} Steps=${activity?.steps} ActiveCal=${calories}`);
  } catch (error) {
    console.error('Error syncing daily scores:', error.message);
  }
}

// Convert camelCase activity names to readable format
function formatActivityName(activity) {
  if (!activity) return 'Workout';
  // Insert space before capitals and capitalize first letter
  return activity
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

async function syncWorkouts(date) {
  console.log(`Syncing workouts for ${date}...`);

  try {
    const workoutsData = await fetchOuraData('workout', { start_date: date, end_date: date });

    if (!workoutsData.data || workoutsData.data.length === 0) {
      console.log('No workouts found for this date');
      return;
    }

    // Delete existing workouts for this date
    await dbRun('DELETE FROM oura_workouts WHERE date = ?', [date]);

    // Insert new workouts
    let count = 0;
    for (const workout of workoutsData.data) {
      // Calculate duration from start/end times if not provided
      let duration = workout.duration || 0;
      if (!duration && workout.start_datetime && workout.end_datetime) {
        const start = new Date(workout.start_datetime);
        const end = new Date(workout.end_datetime);
        duration = Math.round((end - start) / 1000); // duration in seconds
      }

      await dbRun(
        `INSERT INTO oura_workouts (date, activity, calories, duration, distance, start_time)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          date,
          formatActivityName(workout.activity),
          workout.calories || 0,
          duration,
          workout.distance || 0,
          workout.start_datetime || null
        ]
      );
      count++;
    }

    console.log(`✅ ${count} workout(s) synced: ${workoutsData.data.map(w => `${w.activity}(${w.calories}cal)`).join(', ')}`);
  } catch (error) {
    console.error('Error syncing workouts:', error.message);
  }
}

async function main() {
  // Get yesterday's date (data is typically available the next day)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];

  console.log('🔄 Starting Oura Ring sync...');
  console.log(`📅 Target date: ${dateStr}`);

  await syncDailyScores(dateStr);
  await syncWorkouts(dateStr);

  console.log('✅ Oura sync complete!');
  db.close();
}

main().catch(error => {
  console.error('Fatal error:', error);
  db.close();
  process.exit(1);
});
