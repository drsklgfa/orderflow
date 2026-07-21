import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FORWARDED_HEADERS = ['accept', 'authorization', 'content-type', 'cookie', 'idempotency-key', 'user-agent', 'x-csrf-token'];

type RouteContext = { params: Promise<{ path: string[] }> };

function apiBaseUrl(raw: string): string {
  const base = raw.trim().replace(/\/+$/, '');
  return base.endsWith('/api/v1') ? base : `${base}/api/v1`;
}

async function proxy(request: NextRequest, context: RouteContext): Promise<Response> {
  const { path } = await context.params;
  const configuredBase = process.env.INTERNAL_API_URL;
  if (!configuredBase) {
    return Response.json(
      { code: 'API_URL_NOT_CONFIGURED', message: 'INTERNAL_API_URL não configurada.' },
      { status: 500 },
    );
  }

  const target = `${apiBaseUrl(configuredBase)}/${path.map(encodeURIComponent).join('/')}${request.nextUrl.search}`;
  const headers = new Headers();
  for (const name of FORWARDED_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set('x-forwarded-host', request.nextUrl.host);
  headers.set('x-forwarded-proto', request.nextUrl.protocol.replace(':', ''));

  const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body,
      redirect: 'manual',
      cache: 'no-store',
      signal: controller.signal,
    });

    const responseHeaders = new Headers();
    for (const name of ['content-type', 'cache-control', 'location']) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    responseHeaders.set('cache-control', 'no-store');

    const setCookies = (upstream.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.() ?? [];
    for (const cookie of setCookies) responseHeaders.append('set-cookie', cookie);

    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return Response.json(
      { code: 'API_UNAVAILABLE', message: 'A API está temporariamente indisponível.' },
      { status: 502, headers: { 'cache-control': 'no-store' } },
    );
  } finally {
    clearTimeout(timeout);
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
