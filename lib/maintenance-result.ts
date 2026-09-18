// Browser-safe response classification; it has no control credentials or state.
export function maintenanceMessage(status: number, body: unknown): string | null {
  if (status !== 503 || !body || typeof body !== "object") return null;
  const result = body as { maintenance?: boolean; code?: string; error?: string };
  if (result.maintenance !== true || !["MAINTENANCE", "MAINTENANCE_UNAVAILABLE"].includes(result.code ?? "")) return null;
  return typeof result.error === "string" ? result.error : "メンテナンス中です。しばらくしてから再送してください。";
}
