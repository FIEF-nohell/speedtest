const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const publicDir = path.join(__dirname, "..", "public");
fs.mkdirSync(publicDir, { recursive: true });

const files = [
  { name: "payload-10mb.bin", size: 10 * 1024 * 1024 },
  { name: "payload-50mb.bin", size: 50 * 1024 * 1024 },
  { name: "payload-250mb.bin", size: 250 * 1024 * 1024 },
];

const chunkSize = 1024 * 1024; // 1MB writes

for (const { name, size } of files) {
  const outPath = path.join(publicDir, name);
  const fd = fs.openSync(outPath, "w");
  for (let written = 0; written < size; written += chunkSize) {
    // Truly random data — resists gzip/brotli compression
    const buf = crypto.randomBytes(chunkSize);
    fs.writeSync(fd, buf);
  }
  fs.closeSync(fd);
  console.log(`Created ${size / 1024 / 1024}MB → ${name}`);
}
