import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    hmr: {
      host: "192.168.178.40",
      port: 8080,
    },
    middlewareMode: false,
    // SPA Routing Middleware
    middleware: [
      (req: any, res: any, next: any) => {
        // Leite alle Routes ohne Dateiendung zu index.html
        if (!req.url.includes(".") && !req.url.includes("node_modules")) {
          req.url = "/index.html";
        }
        next();
      },
    ],
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean
  ),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
