// PM2 Configuration for DOHSaving-Web
// Usage: pm2 start ecosystem.config.js
// ⚠️ ค่า DATABASE_URL, JWT_SECRET อยู่ในไฟล์ .env บน Server (ไม่ใส่ตรงนี้เพื่อความปลอดภัย)
module.exports = {
  apps: [{
    name: 'dohsaving-web',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: 'C:\\WebApps\\DOHSaving-Web',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    // Auto restart settings
    max_memory_restart: '1G',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,

    // Restart settings
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',

    // Windows specific settings
    kill_timeout: 5000,
    listen_timeout: 3000,
    shutdown_with_message: true
  }]
};
