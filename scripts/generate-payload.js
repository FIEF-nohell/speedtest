const fs = require("fs");
const path = require("path");

const publicDir = path.join(__dirname, "..", "public");
fs.mkdirSync(publicDir, { recursive: true });

const files = [
  { name: "payload-10mb.bin", size: 10 * 1024 * 1024 },
  { name: "payload-50mb.bin", size: 50 * 1024 * 1024 },
  { name: "payload-250mb.bin", size: 250 * 1024 * 1024 }, // generated locally, not in git
];

const chunkSize = 1024 * 1024; // 1MB writes
const buf = Buffer.alloc(chunkSize);
for (let i = 0; i < chunkSize; i++) buf[i] = (i * 7 + 13) & 0xff;

for (const { name, size } of files) {
  const outPath = path.join(publicDir, name);
  const fd = fs.openSync(outPath, "w");
  for (let written = 0; written < size; written += chunkSize) {
    fs.writeSync(fd, buf);
  }
  fs.closeSync(fd);
  console.log(`Created ${size / 1024 / 1024}MB → ${name}`);
}
