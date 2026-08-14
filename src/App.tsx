"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, RefreshCw, Check } from "lucide-react";
import LiquidMetalHero from "@/components/ui/liquid-metal-hero";
import AuditConsole from "@/components/audit-console";

const MARQUEE = "LSA AUDITOR · LOCAL SERVICES ADS · 30-DAY FEEDBACK WINDOWS · SUNRISE HOME SERVICES · ";

export default function App() {
  const [toasts, setToasts] = useState<{ id: number; msg: string; kind: string }[]>([]);
  const [progress, setProgress] = useState(0);

  const pushToast = (msg: string, kind = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
  };
  const dropToast = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(h > 0 ? (window.scrollY / h) * 100 : 0);
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* scroll progress */}
      <div className="progress" style={{ width: `${progress}%` }} />

      {/* topbar (mirrors original) */}
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark">
            <Check className="w-3.5 h-3.5" strokeWidth={2.4} />
          </span>
          <span className="brand__txt">
            <b>LSA Auditor</b>
            <span>Local Services Ads</span>
          </span>
        </div>
        <div className="topbar__spacer" />
        <span className="cid">
          <span className="live" />
          CID 1234567890 · synced 8/14/2026
        </span>
        <button className="topbtn" onClick={() => pushToast("Lead data refreshed", "info")}>
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </header>

      {/* fluid hero (badge/title/subtitle/CTAs from original overview) */}
      <LiquidMetalHero
        badge="Sunrise Home Services · Demo"
        title="Unrated Local Services leads at a glance."
        subtitle="Every lead, its 30-day feedback window, and whether a credit is recoverable — one fluid console."
        primaryCtaLabel="Jump to leads"
        secondaryCtaLabel="Refresh data"
        onPrimaryCtaClick={() => document.getElementById("console")?.scrollIntoView({ behavior: "smooth" })}
        onSecondaryCtaClick={() => pushToast("Lead data refreshed", "info")}
        features={["15 leads audited", "$45.00 recoverable", "0 need review"]}
      />

      {/* overview band: all-caught-up banner + stat strip (translucent over shader) */}
      <section className="relative z-10">
        <div className="container mx-auto px-5 lg:px-8 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="allclear"
          >
            <Check className="w-4 h-4" strokeWidth={3} />
            All caught up — nothing needs review
          </motion.div>
          <p className="head__meta mt-4">
            America/New_York · synced 8/14/2026, 12:46 AM · <span style={{ opacity: 0.7 }}>source: fixture</span>
          </p>
        </div>
      </section>

      {/* marquee (mirrors original) */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee__track">{Array(4).fill(<span>{MARQUEE}</span>)}</div>
      </div>

      {/* audit console: search / filters / sortable table / inline-expand detail / legend */}
      <section id="console" className="relative z-10 bg-background/70 backdrop-blur-xl border-t border-foreground/10 pt-16">
        <div className="container mx-auto px-5 lg:px-8 max-w-6xl">
          <div className="flex items-center gap-2 mb-6 text-foreground/70">
            <Activity className="w-4 h-4" />
            <span className="text-sm font-medium tracking-tight">Lead audit console</span>
          </div>
          <AuditConsole onToast={pushToast} />
        </div>
      </section>

      {/* footer (mirrors original) */}
      <footer className="relative z-10 bg-background/60 backdrop-blur-xl border-t border-foreground/10 text-center text-xs text-foreground/50 py-8">
        LSA Auditor · demo data (fixture) · <a href="#" className="hover:text-foreground">Privacy</a> ·{" "}
        <a href="#" className="hover:text-foreground">Terms</a>
      </footer>

      {/* toasts */}
      <div className="toasts">
        <AnimatePresence>
          {toasts.map((t) => (
            <ToastItem key={t.id} id={t.id} msg={t.msg} kind={t.kind} onDone={dropToast} />
          ))}
        </AnimatePresence>
      </div>
    </>
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
