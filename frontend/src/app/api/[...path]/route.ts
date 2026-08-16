import { NextRequest, NextResponse } from "next/server";

const serverApiBaseUrl = (process.env.API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");
const frontendOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const hopByHopHeaders = new Set(["connection", "content-encoding", "content-length", "keep-alive", "transfer-encoding"]);

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxyApiRequest(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { path } = await context.params;
  const upstreamUrl = new URL(`/api/${path.map(segment => encodeURIComponent(segment)).join("/")}`, serverApiBaseUrl);
  upstreamUrl.search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");
  headers.set("origin", frontendOrigin);

  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();
  const response = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body,
    cache: "no-store",
    redirect: "manual",
    signal: request.signal
  });

  const responseHeaders = new Headers();
  for (const [key, value] of response.headers) {
    if (!hopByHopHeaders.has(key.toLowerCase()) && key.toLowerCase() !== "set-cookie") {
      responseHeaders.set(key, value);
    }
  }

  for (const cookie of response.headers.getSetCookie?.() ?? []) {
    responseHeaders.append("set-cookie", cookie);
  }

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders
  });
}

export const GET = proxyApiRequest;
export const HEAD = proxyApiRequest;
export const OPTIONS = proxyApiRequest;
export const POST = proxyApiRequest;
export const PUT = proxyApiRequest;
export const PATCH = proxyApiRequest;
export const DELETE = proxyApiRequest;
