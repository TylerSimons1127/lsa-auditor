"use client";

import { useEffect, useState } from "react";
import { X, Check, ChevronRight, ChevronLeft, Flag } from "lucide-react";
import { LEADS, type Lead } from "@/data/leads";
import { LeadDetailPanel } from "@/components/audit-console";
import { type DisputeRecord } from "@/lead-meta";

interface Props {
  onClose: () => void;
  disputes: { [id: string]: DisputeRecord };
  onDispute: (id: string, rec: DisputeRecord) => void;
  onToast: (msg: string, kind?: string) => void;
}

export default function WeeklyReview({ onClose, disputes, onDispute, onToast }: Props) {
  // Queue = leads still needing a human decision (the "Actionable" set).
  const queue = LEADS.filter((l) => l.cls === "Needs review" || l.cls === "Auto-junk" || l.cls === "Likely good");
  const [i, setI] = useState(0);
  const [done, setDone] = useState<{ kept: number; disputed: number; skipped: number }>({ kept: 0, disputed: 0, skipped: 0 });
  const [finished, setFinished] = useState(false);

  const lead: Lead | undefined = queue[i];

  const advance = (kind: "kept" | "disputed" | "skipped") => {
    setDone((d) => ({ ...d, [kind]: d[kind] + 1 }));
    if (i + 1 >= queue.length) setFinished(true);
    else setI((n) => n + 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (finished) return;
      if (e.key === "ArrowRight" || e.key === "Enter") advance("skipped");
      if (e.key === "ArrowLeft") setI((n) => Math.max(0, n - 1));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [i, finished]);

  if (finished) {
    return (
      <Overlay onClose={onClose}>
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
      </Overlay>
    );
  }

  return (
    <Overlay onClose={onClose}>
      <div className="review">
        <div className="review__bar">
          <span className="review__progress">Reviewing lead {i + 1} of {queue.length}</span>
          <span className="review__biz">Sunrise Home Services</span>
          <button className="review__x" onClick={onClose} aria-label="Close review"><X className="w-4 h-4" /></button>
        </div>

        <div className="review__body">
          {lead && (
            <LeadDetailPanel
              lead={lead}
              disputes={disputes}
              onDispute={(id, rec) => { onDispute(id, rec); onToast(`Flagged ${id} for dispute`, "info"); }}
              onToast={onToast}
              compact
            />
          )}
        </div>

        <div className="review__foot">
          <button className="act" onClick={() => { setI((n) => Math.max(0, n - 1)); }} disabled={i === 0}>
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>
          <button className="act act--accent" onClick={() => advance("kept")}>
            <Check className="w-3.5 h-3.5" /> Keep as good
          </button>
          <button className="act" onClick={() => advance("disputed")}>
            <Flag className="w-3.5 h-3.5" /> Flag for dispute
          </button>
          <button className="act act--ghost" onClick={() => advance("skipped")}>
            Skip <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Overlay>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="overlay__panel" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
