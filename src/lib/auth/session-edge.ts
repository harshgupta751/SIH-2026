export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  departmentId: string | null;
  departmentCode: string | null;
  citizenId: string | null;
};

const SESSION_COOKIE = 'mahasetu_session';

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error('SESSION_SECRET must be set to a string of at least 16 characters');
  }
  return s;
}

function bytesToB64url(bytes: Uint8Array): string {
  let str = '';
  bytes.forEach((b) => {
    str += String.fromCharCode(b);
  });
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlToBytes(input: string): Uint8Array {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((input.length + 3) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function sign(payloadB64: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payloadB64));
  return bytesToB64url(new Uint8Array(sig));
}

export async function parseSessionTokenEdge(token: string): Promise<SessionUser | null> {
  try {
    const [payloadB64, sig] = token.split('.');
    if (!payloadB64 || !sig) return null;
    const expected = await sign(payloadB64);
    const a = b64urlToBytes(sig);
    const b = b64urlToBytes(expected);
    if (a.length !== b.length) return null;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
    if (diff !== 0) return null;
    const json = new TextDecoder().decode(b64urlToBytes(payloadB64));
    const data = JSON.parse(json);
    if (!data?.id || !data?.exp || data.exp < Date.now()) return null;
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      departmentId: data.departmentId ?? null,
      departmentCode: data.departmentCode ?? null,
      citizenId: data.citizenId ?? null,
    };
  } catch {
    return null;
  }
}

export async function getSessionFromCookieHeaderEdge(cookieHeader: string | null): Promise<SessionUser | null> {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(';')
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${SESSION_COOKIE}=`));
  if (!match) return null;
  const token = decodeURIComponent(match.slice(SESSION_COOKIE.length + 1));
  return parseSessionTokenEdge(token);
}
