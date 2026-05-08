import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for this project. When deploying to GitHub Pages or any host
// that serves files from a subdirectory (for example, `https://username.github.io/repo/`),
// asset paths need to be relative to the current directory. Setting `base` to
// `'./'` ensures that the built JavaScript, CSS and image assets are referenced
// relatively (e.g. `./assets/index-abcd1234.js`) rather than from the root
// (`/assets/index-abcd1234.js`). Without this, GitHub Pages would load a blank
// page because it attempts to fetch resources from the root of the domain.
export default defineConfig({
  plugins: [react()],
  base: './'
});