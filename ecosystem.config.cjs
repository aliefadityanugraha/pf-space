module.exports = {
  apps: [
    {
      name: "pfspace-backend",
      cwd: "./backend",
      script: "src/index.js",
      instances: "max",
      exec_mode: "cluster",
      env_file: "./.env",
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "500M",
      error_file: "./logs/backend-error.log",
      out_file: "./logs/backend-out.log",
      merge_logs: true,
      max_restarts: 10,
      restart_delay: 4000,
    },
    {
      name: "pfspace-frontend",
      cwd: "./frontend",
      script: "node_modules/.bin/serve",
      args: "dist -l 5173 -s --cors",
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "200M",
      error_file: "./logs/frontend-error.log",
      out_file: "./logs/frontend-out.log",
      merge_logs: true,
    },
  ],
};
