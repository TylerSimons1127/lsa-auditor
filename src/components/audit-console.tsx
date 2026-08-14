"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, ChevronDown, Check, X, RotateCcw } from "lucide-react";
import { LEADS, type Lead } from "@/data/leads";

type FilterKey = "all" | "needs-review" | "auto-junk" | "likely-good" | "done" | "missed";
type SortKey = "date" | "cat" | "type" | "charge" | "credit" | "age" | "days" | "status";

const FMAP: Record<FilterKey, (l: Lead) => boolean> = {
  all: () => true,
  "needs-review": (l) => l.cls === "Needs review",
  "auto-junk": (l) => l.cls === "Auto-junk",
  "likely-good": (l) => l.cls === "Likely good",
  done: () => true,
  missed: () => false,
};

const STATUS_CLS: Record<string, string> = { green: "green", grey: "grey", blue: "blue" };
const CREDIT_MAP: Record<string, { cls: string; txt: string }> = {
  CREDITED: { cls: "credit", txt: "Credited" },
  PENDING: { cls: "pending", txt: "Pending" },
  NEW: { cls: "pending", txt: "Pending" },
  NOT_ELIGIBLE: { cls: "eligible", txt: "Cannot dispute" },
  NO_CREDIT: { cls: "none", txt: "Not refunded" },
};

const fmtCharge = (c: number | null) => (c == null ? "—" : `$${c.toFixed(2)}`);
const daysCls = (d: string) =>
  d === "Expired" ? "days--red" : Number(d.replace("d", "")) <= 7 ? "days--amber" : "days--calm";

function CountUp({ value, currency }: { value: number; currency?: boolean }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setV(value);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const dur = 1100;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setV(value * e);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{currency ? `$${v.toFixed(2)}` : Math.round(v)}</>;
}

export default function AuditConsole({ onToast }: { onToast: (msg: string, kind?: string) => void }) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const rows = useMemo(() => {
    let r = LEADS.filter(FMAP[filter]);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(
        (l) =>
          (l.name ?? "").toLowerCase().includes(q) ||
          l.cat.toLowerCase().includes(q) ||
          l.googleLeadId.toLowerCase().includes(q) ||
          l.cls.toLowerCase().includes(q) ||
          l.type.toLowerCase().includes(q)
      );
    }
    return [...r].sort((a, b) => {
      let va: any, vb: any;
      switch (sortKey) {
        case "charge": va = a.charge ?? 0; vb = b.charge ?? 0; break;
        case "age": va = a.age; vb = b.age; break;
        case "days": va = a.window === "expired" ? -1 : a.days; vb = b.window === "expired" ? -1 : b.days; break;
        case "credit": va = a.creditLabel; vb = b.creditLabel; break;
        default: va = (a as any)[sortKey]; vb = (b as any)[sortKey];
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filter, search, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir(k === "date" || k === "age" || k === "days" ? "desc" : "asc");
    }
  };

  const toggleRow = (i: number) => {
    setOpenIdx((cur) => (cur === i ? null : i));
  };

  const stats = [
    { label: "Needs review", value: 0, sub: "this week's pile" },
    { label: "Auto-junk", value: 0, sub: "$0.00 charged" },
    { label: "Missed", value: 0, sub: "$0.00 lost", warn: true },
    { label: "Credits recovered", value: 45, sub: "est · Google decides", accent: true, currency: true },
    { label: "Charged (total)", value: 522, sub: "0 likely good · 15 done", currency: true },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-5 lg:px-8 pb-24">
      {/* stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 * i, ease: [0.16, 1, 0.3, 1] }}
            className={`glass tile ${s.warn ? "tile--warn" : ""} ${s.accent ? "tile--accent" : ""}`}
          >
            <div className="tile__label">{s.label}</div>
            <div className={`tile__value ${s.accent ? "" : ""}`}>
              {s.currency ? <CountUp value={s.value} currency /> : <CountUp value={s.value} />}
            </div>
            <div className="tile__sub">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* controls */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Every lead, one view.</h2>
          <p className="text-foreground/60 font-mono text-sm mt-1">
            {rows.length} of {LEADS.length} leads · click a row to expand
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, category, id…"
            className="glass-input"
            aria-label="Search leads"
          />
        </div>
      </div>

      {/* filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {([
          ["all", "All"],
          ["needs-review", "Needs review"],
          ["auto-junk", "Auto-junk"],
          ["likely-good", "Likely good"],
          ["done", "Done"],
          ["missed", "Missed"],
        ] as [FilterKey, string][]).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`filter ${filter === k ? "is-active" : ""}`}
          >
            {label}
            <span className="count">{k === "all" ? LEADS.length : k === "done" ? LEADS.length : rows.filter(FMAP[k]).length}</span>
          </button>
        ))}
      </div>

      {/* table */}
      <div className="glass table-shell overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              {([
                ["date", "Date"],
                ["cat", "Category"],
                ["type", "Type"],
                ["charge", "Charged"],
                ["", "Classification"],
                ["credit", "Credit state"],
                ["age", "Age"],
                ["days", "Days left"],
                ["status", "Status"],
                ["", ""],
              ] as [SortKey | "", string][]).map(([k, label]) =>
                k ? (
                  <th
                    key={k}
                    className={`sortable cursor-pointer select-none ${sortKey === k ? "sorted" : ""} ${sortDir === "desc" ? "desc" : ""} ${["charge", "age", "days"].includes(k) ? "num" : ""}`}
                    onClick={() => toggleSort(k as SortKey)}
                  >
                    {label} <span className="arrow">▲</span>
                  </th>
                ) : (
                  <th key={label || "blank"} className={label ? "" : ""}>
                    {label}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => {
              const cm = CREDIT_MAP[l.creditState] ?? { cls: "none", txt: "—" };
              const daysTxt = l.window === "expired" ? "Expired" : `${l.days}d`;
              const isOpen = openIdx === LEADS.indexOf(l);
              return (
                <FragmentRow
                  key={l.id}
                  lead={l}
                  isOpen={isOpen}
                  onToggle={() => toggleRow(LEADS.indexOf(l))}
                  cm={cm}
                  daysTxt={daysTxt}
                  onToast={onToast}
                />
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center text-foreground/50 py-10">
                  No leads match this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="legend mt-4">
        <span><span className="sw" style={{ background: "var(--accent)" }} />Amber = closing (≤7 days)</span>
        <span><span className="sw" style={{ background: "var(--danger)" }} />Red = missed / dispute</span>
        <span><span className="sw" style={{ background: "var(--good)" }} />Green = resolved / good</span>
      </div>
    </div>
  );
}

function FragmentRow({
  lead,
  isOpen,
  onToggle,
  cm,
  daysTxt,
  onToast,
}: {
  lead: Lead;
  isOpen: boolean;
  onToggle: () => void;
  cm: { cls: string; txt: string };
  daysTxt: string;
  onToast: (msg: string, kind?: string) => void;
}) {
  const statusCls = lead.status === "Resolved" ? "status--resolved" : lead.status === "Out of area" ? "status--warn" : "status--rated";
  const winTxt = lead.window === "expired" ? "expired" : lead.window === "closing" ? "closing" : "open";
  const verdict = lead.verdict === "—" ? "—" : lead.verdict === "good" ? "good" : lead.verdict === "dispute" ? "dispute" : lead.verdict;

  return (
    <>
      <tr className={`row ${isOpen ? "open" : ""}`} onClick={onToggle}>
        <td className="date">{lead.date}</td>
        <td className="cat">{lead.cat}</td>
        <td className="type">{lead.type}</td>
        <td className="num charge">{fmtCharge(lead.charge)}</td>
        <td>
          <div className="cls">
            <b>{lead.cls}</b>
            <small>{lead.clsDetail}</small>
          </div>
        </td>
        <td>
          <span className={`pill pill--${cm.cls}`}>{cm.txt}</span>
        </td>
        <td className="num">{lead.age}d</td>
        <td className="num">
          <span className={`days ${daysCls(daysTxt)}`}>{daysTxt}</span>
        </td>
        <td>
          <span className={`status ${statusCls}`}>
            <span className="dot" />
            {lead.status}
          </span>
        </td>
        <td>
          <span className="chev">
            <ChevronDown className="w-3 h-3" />
          </span>
        </td>
      </tr>
      <tr className={`detail-row ${isOpen ? "open" : ""}`}>
        <td colSpan={10}>
          <div className="detail-wrap">
            <div className="detail-inner">
              <div className="detail-pad">
                <div className="detail-head">
                  <span className="detail-id">Lead {lead.googleLeadId}</span>
                  <div className="badges">
                    <span className={`badge badge--status ${STATUS_CLS[lead.statusTone] ?? ""}`}>
                      {lead.status}
                      {lead.statusTone === "grey" ? " (not creditable)" : ""}
                    </span>
                    <span className="badge badge--cls">{lead.cls}</span>
                    <span className={`badge badge--credit ${cm.cls}`}>{cm.txt}</span>
                  </div>
                </div>
                <div className="cards">
                  <div className="card"><h3>Credit state</h3><p className="muted">{lead.creditLabel}</p></div>
                  <div className="card"><h3>Created</h3><p className="muted">{lead.created}</p></div>
                  <div className="card"><h3>Age / window</h3><p className="muted">{lead.age} days old · {lead.days} left ({winTxt})</p></div>
                  <div className="card"><h3>Lead type</h3><p className="muted">{lead.type}</p></div>
                  <div className="card"><h3>Source status</h3><p className="muted">ACTIVE</p></div>
                  <div className="card"><h3>Charged</h3><p className="big">{fmtCharge(lead.charge)}</p></div>
                  <div className="card"><h3>Credit amount</h3><p className="muted">{lead.creditState === "CREDITED" ? fmtCharge(lead.charge) : "—"}</p></div>
                  <div className="card"><h3>Contact</h3><p className="muted">{(lead.name ?? "—") + (lead.phone ? ` · ${lead.phone}` : "")}</p></div>
                  <div className="card"><h3>Review verdict</h3><p className="muted">{verdict}</p></div>
                  <div className="card"><h3>Dispute reason</h3><p className="muted">{lead.dispute || "—"}</p></div>
                  <div className="card wide"><h3>Classification</h3><p>{lead.clsDetail}</p></div>
                  <div className="card wide">
                    <h3>Conversation</h3>
                    <div className="convo">
                      <span className="tag">{lead.convo[0]}</span>
                      <span>{lead.convo[1]}</span>
                    </div>
                    {lead.note && <p className="note-line">{lead.note}</p>}
                  </div>
                  <div className="card wide">
                    <h3>Raw payload</h3>
                    <pre className="raw">{JSON.stringify(lead, null, 2)}</pre>
                  </div>
                </div>
                <div className="detail-actions">
                  <button className="act act--accent" onClick={() => onToast(`Credit dispute opened for ${lead.googleLeadId}`, "info")}>
                    <RotateCcw className="w-3.5 h-3.5" /> Open dispute
                  </button>
                  <button className="act act--danger" onClick={() => onToast(`Marked ${lead.googleLeadId} as junk`, "warn")}>
                    <X className="w-3.5 h-3.5" /> Mark as junk
                  </button>
                  <button className="act" onClick={() => onToast("Lead kept as good", "ok")}>
                    <Check className="w-3.5 h-3.5" /> Keep as good
                  </button>
                </div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}
