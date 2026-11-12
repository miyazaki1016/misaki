import { ACCEPT_NEW_ANONYMOUS_RECOVERY } from "../../../../lib/recovery-admission-policy";

export const dynamic = "force-dynamic";
export function GET() {
  return Response.json({ accepting: ACCEPT_NEW_ANONYMOUS_RECOVERY }, {
    headers: { "Cache-Control": "no-store, max-age=0", "CDN-Cache-Control": "no-store", "Vercel-CDN-Cache-Control": "no-store" },
  });
}
