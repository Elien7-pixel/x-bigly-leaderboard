// Vercel Edge Middleware — HTTP Basic Auth gate for the whole site.
// Credentials come from environment variables set in the Vercel dashboard:
//   SITE_USER     (optional, defaults to "admin")
//   SITE_PASSWORD (required)
//
// Runs at the edge before any page or asset is served. Returns a 401 challenge
// until the visitor supplies the correct username/password.

export const config = {
  // Protect everything except Vercel's internal routes.
  matcher: ["/((?!_vercel).*)"],
};

export default function middleware(request) {
  const expectedUser = process.env.SITE_USER || "admin";
  const expectedPass = process.env.SITE_PASSWORD;

  // If no password is configured, fail closed so the site is never left open.
  if (!expectedPass) {
    return new Response("Site password not configured.", { status: 503 });
  }

  const header = request.headers.get("authorization");
  if (header) {
    const [scheme, encoded] = header.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = atob(encoded);
      const sep = decoded.indexOf(":");
      const user = decoded.slice(0, sep);
      const pass = decoded.slice(sep + 1);
      if (user === expectedUser && pass === expectedPass) {
        return; // Authorized — continue to the requested resource.
      }
    }
  }

  return new Response("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Restricted", charset="UTF-8"',
    },
  });
}
