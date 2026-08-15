"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, RefreshCw } from "lucide-react";
import AuditConsole from "@/components/audit-console";
import PrefsMenu from "@/components/prefs-menu";
import { usePrefs } from "@/usePrefs";

export default function App() {
  const { prefs, update, reset } = usePrefs();
  const [toasts, setToasts] = useState<{ id: number; msg: string; kind: string }[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncedAt, setSyncedAt] = useState<Date>(new Date());
  const [refreshKey, setRefreshKey] = useState(0);

  const pushToast = (msg: string, kind = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
  };
  const dropToast = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  const onRefresh = () => {
    if (syncing) return;
    setSyncing(true);
    setTimeout(() => {
      setSyncedAt(new Date());
      setRefreshKey((k) => k + 1);
      setSyncing(false);
      pushToast("Lead data synced", "info");
    }, 1100);
  };

  const stamp = syncedAt.toLocaleString("en-US", { month: "numeric", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

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
        <span className="cid">
          <span className="live" />
          CID 1234567890 · synced {stamp}
        </span>
        <PrefsMenu prefs={prefs} update={update} reset={reset} />
        <button className={`topbtn ${syncing ? "is-syncing" : ""}`} onClick={onRefresh} disabled={syncing}>
          <RefreshCw className="w-3.5 h-3.5" />
          {syncing ? "Syncing…" : "Refresh"}
        </button>
      </header>

      <main className="dash">
        <AuditConsole key={refreshKey} prefs={prefs} onToast={pushToast} />
      </main>

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
