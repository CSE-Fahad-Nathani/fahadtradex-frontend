import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pub = path.join(__dirname, "..", "public");
const src = path.join(pub, "logos", "logo-02.jpg");
const buf = fs.readFileSync(src);
const b64 = buf.toString("base64");

for (const name of ["app-icon-192.jpg", "app-icon-512.jpg", "apple-touch-icon.jpg", "favicon.jpg"]) {
  fs.copyFileSync(src, path.join(pub, name));
}

for (const f of ["app-icon.png", "apple-touch-icon.png", "favicon.ico.jpg"]) {
  const p = path.join(pub, f);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

const old = path.join(pub, "favicon.svg");
const backup = path.join(pub, "favicon.original.svg");
if (fs.existsSync(old) && !fs.existsSync(backup)) {
  fs.copyFileSync(old, backup);
}

const svg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<rect width="512" height="512" rx="96" fill="url(#p)"/>
<defs>
<pattern id="p" patternContentUnits="objectBoundingBox" width="1" height="1">
<use xlink:href="#img" width="1" height="1" preserveAspectRatio="xMidYMid slice"/>
</pattern>
<image id="img" width="1" height="1" preserveAspectRatio="xMidYMid slice" xlink:href="data:image/jpeg;base64,${b64}"/>
</defs>
</svg>`;

fs.writeFileSync(old, svg);

const manifest = {
  name: "FahadTradeX",
  short_name: "FahadTradeX",
  description: "Paper trading with live market data",
  start_url: "/",
  display: "standalone",
  background_color: "#0b0f19",
  theme_color: "#0b0f19",
  icons: [
    {
      src: "/app-icon-192.jpg",
      sizes: "192x192",
      type: "image/jpeg",
      purpose: "any",
    },
    {
      src: "/app-icon-512.jpg",
      sizes: "512x512",
      type: "image/jpeg",
      purpose: "any",
    },
    {
      src: "/app-icon-512.jpg",
      sizes: "512x512",
      type: "image/jpeg",
      purpose: "maskable",
    },
  ],
};

fs.writeFileSync(path.join(pub, "manifest.webmanifest"), JSON.stringify(manifest, null, 2));
console.log("Applied Neon Mint icon + manifest");
