import type { Config } from "tailwindcss";

const config: Config = {
  // Tailwind v4 uses CSS-based configuration (see src/app/globals.css)
  // This file is kept for shadcn/ui CLI compatibility only
  content: [
    "./src/**/*.{ts,tsx}",
  ],
};

export default config;
