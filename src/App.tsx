"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import AuditConsole, { LeadDetailPanel } from "@/components/audit-console";
import WeeklyReview from "@/components/review";
import { LEADS, type Lead } from "@/data/leads";
import { type DisputeRecord } from "@/lead-meta";

export default function App() {
  const [toasts, setToasts] = useState<{ id: number; msg: string; kind: string }[]>([]);
  const [disputes, setDisputes] = useState<{ [id: string]: DisputeRecord }>({});
  const [rated, setRated] = useState<{ [id: string]: true }>({});
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);

  const pushToast = (msg: string, kind = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
  };
  const dropToast = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  const onDispute = (id: string, rec: DisputeRecord) => setDisputes((d) => ({ ...d, [id]: rec }));
  const onRated = (id: string) => setRated((r) => ({ ...r, [id]: true }));

  const openLead = LEADS.find((l) => l.id === openLeadId) as Lead | undefined;
  const reviewCount = LEADS.filter((l) => l.cls === "Needs review" || l.cls === "Auto-junk" || l.cls === "Likely good").length;

  if (reviewing) {
    return (
      <WeeklyReview onClose={() => setReviewing(false)} disputes={disputes} onDispute={onDispute} onToast={pushToast} rated={rated} onRated={onRated} />
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark"><Check className="w-3.5 h-3.5" strokeWidth={2.4} /></span>
          <span className="brand__txt">
            <b>LSA Auditor</b>
            <span>Sunrise Home Services</span>
          </span>
        </div>
        <div className="topbar__spacer" />
        <button className="review-pill" onClick={() => setReviewing(true)}>
          Weekly review: {reviewCount} leads →
        </button>
        <span className="cid">
          <span className="live" />
          CID 1234567890 · synced 8/14/2026, 12:46 AM
        </span>
        <button className="topbtn" onClick={() => pushToast("Lead data refreshed", "info")}>Refresh</button>
      </header>

      <main className="dash">
        <AuditConsole
          onToast={pushToast}
          disputes={disputes}
          onDispute={onDispute}
          rated={rated}
          onRated={onRated}
          onOpenLead={setOpenLeadId}
        />
      </main>

      {openLead && (
        <div className="overlay" onClick={() => setOpenLeadId(null)}>
          <div className="overlay__panel overlay__panel--wide" onClick={(e) => e.stopPropagation()}>
            <div className="fullpage">
              <div className="fullpage__bar">
                <span className="detail-id">Lead {openLead.googleLeadId}</span>
                <button className="review__x" onClick={() => setOpenLeadId(null)} aria-label="Close"><X className="w-4 h-4" /></button>
              </div>
              <div className="fullpage__body">
                <LeadDetailPanel lead={openLead} disputes={disputes} onDispute={onDispute} onToast={pushToast} rated={rated} onRated={onRated} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="toasts">
        <AnimatePresence>
          {toasts.map((t) => (
            <ToastItem key={t.id} id={t.id} msg={t.msg} kind={t.kind} onDone={dropToast} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ToastItem({ id, msg, kind, onDone }: { id: number; msg: string; kind: string; onDone: (id: number) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDone(id), 2600);
    return () => clearTimeout(t);
  }, [id, onDone]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 14, scale: 0.96 }}
      transition={{ duration: 0.4, ease: [0.34, 1.4, 0.5, 1] }}
      className={`toast toast--${kind}`}
    >
      <span className="ic"><Check className="w-3 h-3" strokeWidth={3} /></span>
      <span>{msg}</span>
    </motion.div>
  );
}
