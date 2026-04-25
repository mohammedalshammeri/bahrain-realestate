module.exports = {
  apps: [
    {
      name: "bphub-backend",
      cwd: "./bahrain-realestate-backend",
      script: "dist/src/index.js",
      interpreter: "node",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 8000,
      },
    },
    {
      name: "bphub-admin",
      cwd: "./bahrain-realestate-frontend-admin-dashboard",
      script: ".next/standalone/server.js",
      interpreter: "node",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        HOSTNAME: "127.0.0.1",
      },
    },
  ],
};