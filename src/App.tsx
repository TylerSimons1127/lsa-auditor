"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { LiquidMetal, liquidMetalPresets } from "@paper-design/shaders-react";
import AuditConsole from "@/components/audit-console";

export default function App() {
  const [toasts, setToasts] = useState<{ id: number; msg: string; kind: string }[]>([]);

  const pushToast = (msg: string, kind = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
  };
  const dropToast = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <div className="app-shell">
      {/* fixed fluid backdrop — full-bleed, subtle matte liquid metal */}
      <div className="app-bg" aria-hidden="true">
        <LiquidMetal
          {...liquidMetalPresets[0]}
          shape="none"
          fit="cover"
          colorBack="hsl(0, 0%, 100%)"
          repetition={3}
          softness={0.7}
          distortion={0.35}
          style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0 }}
        />
      </div>

      {/* top bar — thin, tool-grade (no hero) */}
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark">
            <Check className="w-3.5 h-3.5" strokeWidth={2.4} />
          </span>
          <span className="brand__txt">
            <b>LSA Auditor</b>
            <span>Sunrise Home Services</span>
          </span>
        </div>
        <div className="topbar__spacer" />
        <span className="cid">
          <span className="live" />
          CID 1234567890 · synced 8/14/2026, 12:46 AM
        </span>
        <button className="topbtn" onClick={() => pushToast("Lead data refreshed", "info")}>
          Refresh
        </button>
      </header>

      {/* single-screen dashboard body */}
      <main className="dash">
        <AuditConsole onToast={pushToast} />
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
      <span className="ic">
        <Check className="w-3 h-3" strokeWidth={3} />
      </span>
      <span>{msg}</span>
    </motion.div>
  );
}
