import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import packageJson from "./package.json" with { type: "json" };

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  define: {
    __VERSION__: JSON.stringify(packageJson.version),
    // @ts-expect-error -- skip node types
    __DEV__: JSON.stringify(process.env.NODE_ENV !== "production"),
  },
});
