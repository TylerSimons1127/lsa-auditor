"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Check, Flag } from "lucide-react";
import { LEADS, type Lead } from "@/data/leads";
import { LeadDetailPanel, DisputeForm } from "@/components/audit-console";
import { type DisputeRecord, type DisputeKey } from "@/lead-meta";

interface Props {
  onClose: () => void;
  disputes: { [id: string]: DisputeRecord };
  onDispute: (id: string, rec: DisputeRecord) => void;
  onToast: (msg: string, kind?: string) => void;
  rated: { [id: string]: true };
  onRated: (id: string) => void;
}

export default function WeeklyReview({ onClose, disputes, onDispute, onToast, rated, onRated }: Props) {
  // Queue = leads still needing a human decision (the "Actionable" set).
  const queue = LEADS.filter((l) => l.cls === "Needs review" || l.cls === "Auto-junk" || l.cls === "Likely good");
  const [i, setI] = useState(0);
  const [done, setDone] = useState<{ kept: number; disputed: number; skipped: number }>({ kept: 0, disputed: 0, skipped: 0 });
  const [finished, setFinished] = useState(false);
  const [flagging, setFlagging] = useState(false);

  const lead: Lead | undefined = queue[i];

  const advance = (kind: "kept" | "disputed" | "skipped") => {
    setDone((d) => ({ ...d, [kind]: d[kind] + 1 }));
    setFlagging(false);
    if (i + 1 >= queue.length) setFinished(true);
    else setI((n) => n + 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (finished || flagging) return;
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (typing) return;
      if (e.key === "ArrowRight") advance("skipped");
      if (e.key === "ArrowLeft") setI((n) => Math.max(0, n - 1));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [i, finished, flagging]);

  if (finished) {
    return (
      <div className="review-page">
        <header className="review-page__bar">
          <button className="backbtn" onClick={onClose}><ChevronLeft className="w-4 h-4" /> Back</button>
          <span className="review-page__title">Weekly review</span>
        </header>
        <div className="review-page__body">
          <div className="review__summary">
            <div className="review__sum-head">Weekly review complete</div>
            <div className="review__sum-grid">
              <div><b>{done.kept}</b><span>Kept as good</span></div>
              <div><b>{done.disputed}</b><span>Flagged for dispute</span></div>
              <div><b>{done.skipped}</b><span>Skipped</span></div>
              <div><b>{queue.length}</b><span>Reviewed total</span></div>
            </div>
            <button className="act act--accent" onClick={onClose}><Check className="w-3.5 h-3.5" /> Done</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="review-page">
      <header className="review-page__bar">
        <button className="backbtn" onClick={onClose}><ChevronLeft className="w-4 h-4" /> Back</button>
        <span className="review-page__title">Weekly review</span>
        <span className="review-page__progress">Reviewing lead {i + 1} of {queue.length}</span>
      </header>

      <div className="review-page__body">
        <div className="review review--page">
          <div className="review__biz">Sunrise Home Services</div>

          <div className="review__body">
            {lead && (
              <LeadDetailPanel
                lead={lead}
                disputes={disputes}
                onDispute={onDispute}
                onToast={onToast}
                rated={rated}
                onRated={onRated}
                mode="review"
              />
            )}
          </div>

          <div className="review__foot">
            <button className="act" onClick={() => setI((n) => Math.max(0, n - 1))} disabled={i === 0}>
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <button className="act act--accent" onClick={() => { if (lead) { onRated(lead.id); onToast(`Lead ${lead.googleLeadId} kept as good`, "ok"); } advance("kept"); }}>
              <Check className="w-3.5 h-3.5" /> Keep as good
            </button>
            <button className={`act act--danger ${flagging ? "is-active" : ""}`} onClick={() => setFlagging((f) => !f)}>
              <Flag className="w-3.5 h-3.5" /> Flag for dispute
            </button>
            <button className="act act--ghost" onClick={() => advance("skipped")}>
              Skip <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {flagging && (
            <DisputeForm
              onSubmit={(reason: DisputeKey, comment?: string) => {
                if (!lead) return;
                onDispute(lead.id, { reason, comment });
                onToast(`Flagged ${lead.googleLeadId} for dispute — saved locally`, "info");
                advance("disputed");
              }}
              onCancel={() => setFlagging(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}