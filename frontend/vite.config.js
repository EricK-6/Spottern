import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// VITE_API_BASE (set at build/deploy time) points the app at the deployed
// API Gateway. Left unset, the app runs in demo mode against bundled sample
// data, so the dashboard always renders, backend or not.
//
// VITE_BASE sets the public path. S3 serves the site at the root ("/"), while
// GitHub Pages serves it under "/Spottern/". Build for Pages with:
//   VITE_BASE=/Spottern/ npm run build
export default defineConfig({
  base: process.env.VITE_BASE || "/",
  plugins: [react()],
  server: { port: 5173 }
});
