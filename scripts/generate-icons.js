const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const publicDir = path.join(__dirname, "..", "app");
const publicRoot = path.join(__dirname, "..", "public");

// Minimal speed gauge icon: dark bg, cyan arc + needle
const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="108" fill="#0a0a0f"/>

  <!-- Outer subtle ring -->
  <circle cx="256" cy="272" r="160" fill="none" stroke="#ffffff" stroke-opacity="0.06" stroke-width="12"/>

  <!-- Speed arc (bottom half open) — cyan gradient -->
  <path d="M 128 272 A 128 128 0 1 1 384 272" fill="none" stroke="#00d4ff" stroke-width="16" stroke-linecap="round" stroke-opacity="0.9"/>

  <!-- Tick marks on the arc -->
  <line x1="140" y1="196" x2="155" y2="208" stroke="#ffffff" stroke-opacity="0.25" stroke-width="4" stroke-linecap="round"/>
  <line x1="176" y1="156" x2="186" y2="172" stroke="#ffffff" stroke-opacity="0.25" stroke-width="4" stroke-linecap="round"/>
  <line x1="256" y1="134" x2="256" y2="152" stroke="#ffffff" stroke-opacity="0.25" stroke-width="4" stroke-linecap="round"/>
  <line x1="336" y1="156" x2="326" y2="172" stroke="#ffffff" stroke-opacity="0.25" stroke-width="4" stroke-linecap="round"/>
  <line x1="372" y1="196" x2="357" y2="208" stroke="#ffffff" stroke-opacity="0.25" stroke-width="4" stroke-linecap="round"/>

  <!-- Needle pointing upper-right (fast!) -->
  <line x1="256" y1="272" x2="348" y2="184" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>

  <!-- Center dot -->
  <circle cx="256" cy="272" r="12" fill="#00d4ff"/>
  <circle cx="256" cy="272" r="6" fill="#0a0a0f"/>

  <!-- Subtle glow behind needle tip -->
  <circle cx="348" cy="184" r="20" fill="#00d4ff" opacity="0.15"/>
</svg>
`.trim();

async function generate() {
  const svgBuffer = Buffer.from(svgIcon);

  // favicon.ico (32x32 PNG used as ICO)
  await sharp(svgBuffer).resize(32, 32).png().toFile(path.join(publicRoot, "favicon.ico"));
  console.log("Created favicon.ico (32x32)");

  // favicon.svg
  fs.writeFileSync(path.join(publicRoot, "favicon.svg"), svgIcon);
  console.log("Created favicon.svg");

  // Apple touch icon
  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(publicRoot, "apple-touch-icon.png"));
  console.log("Created apple-touch-icon.png (180x180)");

  // PWA icons
  for (const size of [192, 512]) {
    await sharp(svgBuffer).resize(size, size).png().toFile(path.join(publicRoot, `icon-${size}.png`));
    console.log(`Created icon-${size}.png`);
  }

  // OG image (1200x630)
  const ogSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#0a0a0f"/>
  <g transform="translate(460, 75) scale(0.55)">
    ${svgIcon.replace(/<\/?svg[^>]*>/g, "").replace(/rx="108"/, "")}
  </g>
  <text x="600" y="520" text-anchor="middle" font-family="monospace" font-size="48" fill="white" opacity="0.8" letter-spacing="8">SPEED TEST</text>
  <text x="600" y="570" text-anchor="middle" font-family="monospace" font-size="20" fill="white" opacity="0.3" letter-spacing="6">LATENCY · DOWNLOAD</text>
</svg>`.trim();

  await sharp(Buffer.from(ogSvg)).resize(1200, 630).png().toFile(path.join(publicRoot, "og.png"));
  console.log("Created og.png (1200x630)");
}

generate().catch(console.error);
