// Web liveness endpoint (spec v2 §34.2). Always returns 200 if the web
// process is up; does not touch the database.
export function GET() {
  return new Response("ok", {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
