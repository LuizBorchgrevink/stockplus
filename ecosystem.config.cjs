// PM2: reinicia StockPlus si se cae y lo arranca con el sistema.
// Uso: npx pm2 start ecosystem.config.cjs
// Una sola instancia: el rate limit y las sesiones se guardan en memoria.
module.exports = {
  apps: [
    {
      name: 'stockplus',
      cwd: './backend',
      script: 'src/app.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      time: true,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
