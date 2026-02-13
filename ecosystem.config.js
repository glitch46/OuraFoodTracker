module.exports = {
  apps: [{
    name: 'nutrition-server',
    script: 'server.js',
    cwd: '/home/chad/.openclaw/workspace/nutrition-tracker-local',
    
    // Restart behavior
    restart_delay: 3000,          // Wait 3 seconds between restarts
    max_restarts: 10,             // Max restarts within time window
    min_uptime: 5000,             // Must run 5 seconds to count as "started"
    
    // Don't auto-restart on clean exit
    autorestart: true,
    
    // Kill signal and timeouts
    kill_timeout: 5000,           // 5 seconds to gracefully shutdown
    wait_ready: false,
    listen_timeout: 10000,
    
    // Environment
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      HOST: '0.0.0.0'
    },
    
    // Logging
    error_file: '/home/chad/.pm2/logs/nutrition-server-error.log',
    out_file: '/home/chad/.pm2/logs/nutrition-server-out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    
    // Watch for file changes (disabled in prod)
    watch: false,
    ignore_watch: ['node_modules', 'nutrition.db', 'logs']
  }]
};
