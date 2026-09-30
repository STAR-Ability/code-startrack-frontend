export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Process liveness only. Backend/data readiness is deliberately independent.
export function GET() {
  return Response.json(
    { status: "ok" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
