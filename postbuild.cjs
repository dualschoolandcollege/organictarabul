const fs = require('fs');
const path = require('path');

/*
  This postbuild script copies the generated `index.html` file to `404.html` in the
  `dist` directory. GitHub Pages serves a `404.html` file when a user visits a
  path that does not correspond to a physical file. Single‑page applications
  (SPAs) rely on client‑side routing, so a user directly navigating to
  `/product/123/some-product` will result in a 404 on GitHub Pages unless
  `404.html` exists and can bootstrap the application. Copying `index.html` to
  `404.html` ensures that any unknown route is served the same application
  entrypoint, enabling client‑side routing to handle the URL. Without this
  workaround, GitHub Pages would display a blank page or a 404 error for
  non‑root paths【529132389090501†L67-L110】.
*/
const distDir = path.resolve(__dirname, 'dist');
const srcFile = path.join(distDir, 'index.html');
const destFile = path.join(distDir, '404.html');

try {
  if (fs.existsSync(srcFile)) {
    fs.copyFileSync(srcFile, destFile);
    console.log(`Copied index.html to 404.html in ${distDir}`);
  } else {
    console.warn(`postbuild: ${srcFile} does not exist. Run 'npm run build' first.`);
  }
} catch (err) {
  console.error('postbuild error:', err);
}