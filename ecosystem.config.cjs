module.exports = {
  apps: [
    {
      name: "pfspace-backend",
      cwd: "./backend",
      script: "src/index.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      }
    },
    {
      name: "pfspace-frontend",
      cwd: "./frontend",
      script: "serve",
      env: {
        PM2_SERVE_PATH: './dist',
        PM2_SERVE_PORT: 5173,
        PM2_SERVE_SPA: 'true',
        NODE_ENV: "production"
      }
    }
  ]
};
