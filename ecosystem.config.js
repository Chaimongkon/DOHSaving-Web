// PM2 Configuration for DOHSaving-Web
// Usage: pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "dohsaving-web",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      cwd: "./",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // Log settings
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "./logs/error.log",
      out_file: "./logs/output.log",
      merge_logs: true,
    },
  ],
};
