const fs = require("fs");
const path = require("path");

const size = 100 * 1024 * 1024; // 100MB
const chunkSize = 1024 * 1024; // 1MB writes
const outPath = path.join(__dirname, "..", "public", "payload.bin");

fs.mkdirSync(path.dirname(outPath), { recursive: true });

const fd = fs.openSync(outPath, "w");
const buf = Buffer.alloc(chunkSize);
for (let i = 0; i < chunkSize; i++) buf[i] = (i * 7 + 13) & 0xff;

for (let written = 0; written < size; written += chunkSize) {
  fs.writeSync(fd, buf);
}
fs.closeSync(fd);

console.log(`Created ${size / 1024 / 1024}MB payload at ${outPath}`);
