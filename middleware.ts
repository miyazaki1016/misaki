import { NextRequest, NextResponse } from "next/server";

const CANONICAL_HOST = "misaki38-ai.com";
const PREVIEW_ONLY_PATHS = new Set([
  "/api/dev/relationship-naturalness",
]);

export function middleware(request: NextRequest) {
  const host =
    request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";

  if (
    host.endsWith(".vercel.app") &&
    !PREVIEW_ONLY_PATHS.has(request.nextUrl.pathname)
  ) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.host = CANONICAL_HOST;
    url.port = "";

    return NextResponse.redirect(url, 308);
  }

  // /api/chat は安全ラッパーを経由させる。
  // ラッパー側で「覚えてる？」系だけ history を空にしてから
  // 既存の app/api/chat/route.ts の POST を呼ぶ。
  if (request.nextUrl.pathname === "/api/chat") {
    const url = request.nextUrl.clone();
    url.pathname = "/api/chat-proxy";

    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
