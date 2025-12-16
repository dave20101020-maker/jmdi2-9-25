/**
 * Auth0 JWT Verification Middleware (additive)
 *
 * - Enabled only when ENABLE_AUTH0 === "true"
 * - Verifies Authorization: Bearer <token> against Auth0 JWKS
 * - On success, attaches decoded token payload to req.user
 * - On failure, responds 401
 */

let joseImportPromise;
let cachedJwks;
let cachedJwksDomain;

function normalizeAuth0Domain(domain) {
  if (!domain) return "";
  return String(domain)
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/g, "");
}

function getAuth0Issuer(domain) {
  return `https://${domain}/`;
}

function getAuth0JwksUrl(domain) {
  return new URL(`https://${domain}/.well-known/jwks.json`);
}

async function getJose() {
  if (!joseImportPromise) {
    joseImportPromise = import("jose");
  }
  return joseImportPromise;
}

function getCachedJwks(jose, domain) {
  if (!cachedJwks || cachedJwksDomain !== domain) {
    cachedJwksDomain = domain;
    cachedJwks = jose.createRemoteJWKSet(getAuth0JwksUrl(domain));
  }
  return cachedJwks;
}

export async function auth0JwtMiddleware(req, res, next) {
  if (process.env.ENABLE_AUTH0 !== "true") {
    return next();
  }

  const domain = normalizeAuth0Domain(process.env.AUTH0_DOMAIN);
  const audience = process.env.AUTH0_AUDIENCE;

  const authHeader = req.headers?.authorization;
  if (
    !domain ||
    !audience ||
    !authHeader ||
    !authHeader.startsWith("Bearer ")
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const jose = await getJose();
    const jwks = getCachedJwks(jose, domain);

    const { payload } = await jose.jwtVerify(token, jwks, {
      issuer: getAuth0Issuer(domain),
      audience,
    });

    req.user = payload;
    return next();
  } catch (_error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export default auth0JwtMiddleware;
