import "server-only";
import type { AffiliateProgramContent } from "@/lib/api";
import { sampleAffiliateProgram } from "@/lib/landing-sample";

const serverApiBaseUrl = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export async function getAffiliateProgram(useSamplePreview = false): Promise<AffiliateProgramContent | null> {
  if (useSamplePreview) return sampleAffiliateProgram;

  try {
    const response = await fetch(`${serverApiBaseUrl}/api/v1/affiliate-program`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    return response.json() as Promise<AffiliateProgramContent>;
  } catch {
    return null;
  }
}
