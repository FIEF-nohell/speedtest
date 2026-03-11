export const runtime = "edge";

const CHUNK_SIZE = 65536;
const TOTAL_SIZE = 25 * 1024 * 1024; // 25MB

export async function GET() {
  const chunk = new Uint8Array(CHUNK_SIZE);
  // Fill with random-ish data to prevent compression
  for (let i = 0; i < CHUNK_SIZE; i++) {
    chunk[i] = (i * 7 + 13) & 0xff;
  }

  let sent = 0;
  const stream = new ReadableStream({
    pull(controller) {
      if (sent >= TOTAL_SIZE) {
        controller.close();
        return;
      }
      const remaining = TOTAL_SIZE - sent;
      const toSend = Math.min(remaining, CHUNK_SIZE);
      controller.enqueue(chunk.slice(0, toSend));
      sent += toSend;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": TOTAL_SIZE.toString(),
      "Cache-Control": "no-store",
      "X-Content-Size": TOTAL_SIZE.toString(),
    },
  });
}
