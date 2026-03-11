export const runtime = "edge";

export async function GET() {
  return new Response(JSON.stringify({ t: Date.now() }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
