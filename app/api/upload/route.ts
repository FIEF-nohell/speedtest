export const runtime = "edge";

export async function POST(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) {
    return new Response("No body", { status: 400 });
  }

  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
  }

  return new Response(JSON.stringify({ bytes: totalBytes, t: Date.now() }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
