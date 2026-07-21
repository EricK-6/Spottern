import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// VITE_API_BASE (set at build/deploy time) points the app at the deployed
// API Gateway. Left unset, the app runs in demo mode against bundled sample
// data — so the dashboard always renders, backend or not.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 }
});
