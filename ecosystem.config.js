module.exports = {
  apps: [
    {
      name: 'gpti-site',
      script: 'npm',
      args: 'run dev',
      cwd: '/opt/gpti/gpti-site',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/gpti-site-error.log',
      out_file: '/var/log/pm2/gpti-site-out.log',
      log_file: '/var/log/pm2/gpti-site-combined.log',
      time: true
    }
  ]
};
