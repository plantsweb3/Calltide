const encoder = new TextEncoder();

async function hmacSign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function hmacVerify(data: string, signature: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const sigBytes = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
  return crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(data));
}

export async function generateMagicLink(
  businessId: string,
  email: string,
  appUrl: string,
  secret: string,
): Promise<string> {
  const payload = btoa(JSON.stringify({
    businessId,
    email,
    exp: Date.now() + 15 * 60 * 1000, // 15 minutes
  }));
  const signature = await hmacSign(payload, secret);
  const token = `${payload}.${signature}`;
  return `${appUrl}/api/dashboard/auth/verify?token=${encodeURIComponent(token)}`;
}

export async function verifyMagicToken(
  token: string,
  secret: string,
): Promise<{ businessId: string; email: string } | null> {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return null;

  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);

  const valid = await hmacVerify(payload, signature, secret);
  if (!valid) return null;

  try {
    const data = JSON.parse(atob(payload));
    if (data.exp < Date.now()) return null;
    return { businessId: data.businessId, email: data.email };
  } catch {
    return null;
  }
}

export async function signClientCookie(
  businessId: string,
  secret: string,
): Promise<string> {
  const payload = btoa(JSON.stringify({
    businessId,
    iat: Date.now(),
  }));
  const signature = await hmacSign(payload, secret);
  return `${payload}.${signature}`;
}

export async function verifyClientCookie(
  cookie: string,
  secret: string,
): Promise<string | null> {
  const lastDot = cookie.lastIndexOf(".");
  if (lastDot === -1) return null;

  const payload = cookie.slice(0, lastDot);
  const signature = cookie.slice(lastDot + 1);

  const valid = await hmacVerify(payload, signature, secret);
  if (!valid) return null;

  try {
    const data = JSON.parse(atob(payload));
    return data.businessId ?? null;
  } catch {
    return null;
  }
}
