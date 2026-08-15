import { type Lead } from "@/data/leads";

// Creditable Google LSA feedback reasons (post-2024 automated survey).
// Google removed manual disputes; you submit a satisfaction rating + a specific reason.
// "Outside my service area" and "Wrong job type" are intentionally EXCLUDED — no longer creditable.
export type DisputeKey = "spam" | "solicitation" | "wrong-number" | "duplicate" | "other";

export interface DisputeReason {
  key: DisputeKey;
  label: string;
  requiresComment?: boolean;
}

export const DISPUTE_REASONS: DisputeReason[] = [
  { key: "spam", label: "Spam — obvious junk / robocall" },
  { key: "solicitation", label: "Solicitation — selling to the contractor, not a real customer" },
  { key: "wrong-number", label: "Wrong number — misdial, not a real inquiry" },
  { key: "duplicate", label: "Duplicate lead — same customer/number as an existing lead" },
  { key: "other", label: "Other — requires a comment", requiresComment: true },
];

export interface DisputeRecord {
  reason: DisputeKey;
  comment?: string;
}

// Display status derived from the lead's state.
//  - Disputed (flagged in this tool) -> red "Disputed" (pending Google, not yet resolved)
//  - Rated / kept as good          -> green "Rated"
//  - Resolved                     -> blue
//  - Out of area                 -> grey "Out of area" (not creditable, no action needed)
//  - Missed (expired window, nothing credited) -> red
//  - Actionable                  -> grey, neutral (decision not yet made)
//  - default                     -> green
export type StatusTone = "resolved" | "missed" | "actionable" | "rated" | "disputed";

export function statusInfo(l: Lead, disputed = false, rated = false): { label: string; tone: StatusTone } {
  if (disputed) return { label: "Disputed", tone: "disputed" };
  if (rated) return { label: "Rated", tone: "rated" };
  if (l.status === "Out of area") return { label: "Out of area", tone: "actionable" };
  if (l.status === "Resolved") return { label: "Resolved", tone: "resolved" };
  if (l.window === "expired" && l.creditState !== "CREDITED")
    return { label: "Missed", tone: "missed" };
  // A lead that still needs a human decision shows as Actionable (grey) — no compound label.
  if (l.cls === "Needs review" || l.cls === "Auto-junk" || l.cls === "Likely good")
    return { label: "Actionable", tone: "actionable" };
  return { label: l.status, tone: "rated" };
}

// Credit state is only meaningful once a lead is decided/disputed/resolved/missed.
// Actionable leads (not yet decided) and rated-good (nothing to refund) show blank.
export function showCreditState(l: Lead): boolean {
  const t = statusInfo(l).tone;
  if (t === "actionable") return false;
  if (t === "rated") return l.creditState === "CREDITED" || l.creditState === "NOT_ELIGIBLE";
  return true;
}

export function creditLabel(l: Lead): { cls: string; txt: string } {
  switch (l.creditState) {
    case "CREDITED":
      return { cls: "credit", txt: "Credited" };
    case "NOT_ELIGIBLE":
      return { cls: "eligible", txt: "Cannot dispute" };
    case "NO_CREDIT":
      return { cls: "none", txt: "Not refunded" };
    default:
      return { cls: "pending", txt: "Pending" };
  }
}

// Non-creditable geo/job notes — shown greyed, never as a selectable dispute reason.
export function geoNote(l: Lead): string | null {
  if (l.status === "Out of area") return "Out of area / wrong service — no longer creditable by Google; fix service-area settings instead.";
  return null;
}
