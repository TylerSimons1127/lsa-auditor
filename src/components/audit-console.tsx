"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ChevronDown, Check, X, RotateCcw, AlertTriangle, Trash2, Sparkles } from "lucide-react";
import { LEADS, type Lead } from "@/data/leads";

type FilterKey = "all" | "needs-review" | "auto-junk" | "likely-good";
type SortKey = "date" | "cat" | "type" | "charge" | "credit" | "age" | "days" | "status";

const FMAP: Record<FilterKey, (l: Lead) => boolean> = {
  all: () => true,
  "needs-review": (l) => l.cls === "Needs review",
  "auto-junk": (l) => l.cls === "Auto-junk",
  "likely-good": (l) => l.cls === "Likely good",
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
    if (reduce) { setV(value); return; }
    let raf = 0;
    const t0 = performance.now();
    const dur = 800;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setV(value * e);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{currency ? `$${v.toFixed(2)}` : Math.round(v).toLocaleString()}</>;
}

export default function AuditConsole({ onToast }: { onToast: (msg: string, kind?: string) => void }) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const stats = useMemo(() => {
    const junk = LEADS.filter((l) => l.cls === "Auto-junk");
    const credited = LEADS.filter((l) => l.creditState === "CREDITED").reduce((s, l) => s + (l.charge ?? 0), 0);
    const charged = LEADS.reduce((s, l) => s + (l.charge ?? 0), 0);
    const expiring = LEADS.filter((l) => l.window !== "expired" && l.days <= 7).length;
    const needsReview = LEADS.filter((l) => l.cls === "Needs review").length;
    return [
      { label: "Needs review", value: needsReview, sub: "action required", tone: "warn" as const },
      { label: "Auto-junk", value: junk.length, sub: `${fmtCharge(junk.reduce((s, l) => s + (l.charge ?? 0), 0))} blocked`, tone: "neutral" as const },
      { label: "Closing ≤7d", value: expiring, sub: "dispute window", tone: "warn" as const },
      { label: "Credits recovered", value: credited, sub: "est · Google decides", tone: "good" as const, currency: true },
      { label: "Charged (total)", value: charged, sub: `${LEADS.length} leads`, tone: "accent" as const, currency: true },
    ];
  }, []);

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
    else { setSortKey(k); setSortDir(k === "date" || k === "age" || k === "days" ? "desc" : "asc"); }
  };

  const toggleRow = (i: number) => setOpenIdx((cur) => (cur === i ? null : i));

  const counts = useMemo(
    () => ({
      all: LEADS.length,
      "needs-review": LEADS.filter(FMAP["needs-review"]).length,
      "auto-junk": LEADS.filter(FMAP["auto-junk"]).length,
      "likely-good": LEADS.filter(FMAP["likely-good"]).length,
    }),
    []
  );

  return (
    <div className="dash-inner">
      {/* summary tiles */}
      <div className="stat-row">
        {stats.map((s) => (
          <div key={s.label} className={`stat ${s.tone === "warn" ? "stat--warn" : s.tone === "good" ? "stat--good" : s.tone === "accent" ? "stat--accent" : ""}`}>
            <span className="stat__label">{s.label}</span>
            <span className="stat__value">{s.currency ? <CountUp value={s.value} currency /> : <CountUp value={s.value} />}</span>
            <span className="stat__sub">{s.sub}</span>
          </div>
        ))}
      </div>

      {/* controls */}
      <div className="controls">
        <div className="filters">
          {([
            ["all", "All"],
            ["needs-review", "Needs review"],
            ["auto-junk", "Auto-junk"],
            ["likely-good", "Likely good"],
          ] as [FilterKey, string][]).map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)} className={`filter ${filter === k ? "is-active" : ""}`}>
              {label}
              <span className="count">{counts[k]}</span>
            </button>
          ))}
        </div>
        <div className="search">
          <Search className="ic" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, category, id…" aria-label="Search leads" />
        </div>
      </div>

      {/* leads table */}
      <div className="table-wrap">
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
                  <th key={k} className={`sortable ${sortKey === k ? "sorted" : ""} ${sortDir === "desc" ? "desc" : ""} ${["charge", "age", "days"].includes(k) ? "num" : ""}`} onClick={() => toggleSort(k as SortKey)}>
                    {label} <span className="arrow">▲</span>
                  </th>
                ) : (
                  <th key={label || "blank"}>{label}</th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => {
              const cm = CREDIT_MAP[l.creditState] ?? { cls: "none", txt: "—" };
              const daysTxt = l.window === "expired" ? "Expired" : `${l.days}d`;
              const isOpen = openIdx === LEADS.indexOf(l);
              const tagCls = l.cls === "Needs review" ? "tag--needs" : l.cls === "Auto-junk" ? "tag--junk" : "tag--good";
              const TagIcon = l.cls === "Needs review" ? AlertTriangle : l.cls === "Auto-junk" ? Trash2 : Sparkles;
              return (
                <FragmentRow
                  key={l.id}
                  lead={l}
                  isOpen={isOpen}
                  onToggle={() => toggleRow(LEADS.indexOf(l))}
                  cm={cm}
                  daysTxt={daysTxt}
                  tagCls={tagCls}
                  TagIcon={TagIcon}
                  onToast={onToast}
                />
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={10} className="empty">No leads match this view.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FragmentRow({
  lead, isOpen, onToggle, cm, daysTxt, tagCls, TagIcon, onToast,
}: {
  lead: Lead; isOpen: boolean; onToggle: () => void;
  cm: { cls: string; txt: string }; daysTxt: string;
  tagCls: string; TagIcon: any; onToast: (msg: string, kind?: string) => void;
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
          <span className={`tag-pill ${tagCls}`}><TagIcon />{lead.cls}</span>
        </td>
        <td><span className={`badge badge--credit ${cm.cls}`} style={{ borderRadius: 6, padding: "3px 9px", fontSize: 11.5, fontWeight: 600 }}>{cm.txt}</span></td>
        <td className="num">{lead.age}d</td>
        <td className="num"><span className={`days ${daysCls(daysTxt)}`}>{daysTxt}</span></td>
        <td><span className={`status ${statusCls}`}><span className="dot" />{lead.status}</span></td>
        <td><span className="chev"><ChevronDown /></span></td>
      </tr>
      <tr className={`detail-row ${isOpen ? "open" : ""}`}>
        <td colSpan={10}>
          <div className="detail-wrap">
            <div className="detail-inner">
              <div className="detail-pad">
                <div className="detail-head">
                  <span className="detail-id">Lead {lead.googleLeadId}</span>
                  <div className="badges">
                    <span className={`badge badge--status ${STATUS_CLS[lead.statusTone] ?? ""}`}>{lead.status}{lead.statusTone === "grey" ? " (not creditable)" : ""}</span>
                    <span className={`tag-pill ${tagCls}`}><TagIcon />{lead.cls}</span>
                    <span className={`badge badge--credit ${cm.cls}`}>{cm.txt}</span>
                  </div>
                </div>
                <div className="cards">
                  <div className="card"><h3>Credit state</h3><p className="muted">{lead.creditLabel}</p></div>
                  <div className="card"><h3>Created</h3><p className="muted">{lead.created}</p></div>
                  <div className="card"><h3>Age / window</h3><p className="muted">{lead.age}d old · {lead.days}d left ({winTxt})</p></div>
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
                    <div className="convo"><span className="tag">{lead.convo[0]}</span><span>{lead.convo[1]}</span></div>
                    {lead.note && <p className="note-line">{lead.note}</p>}
                  </div>
                </div>
                <div className="detail-actions">
                  <button className="act act--accent" onClick={() => onToast(`Credit dispute opened for ${lead.googleLeadId}`, "info")}><RotateCcw />Open dispute</button>
                  <button className="act act--danger" onClick={() => onToast(`Marked ${lead.googleLeadId} as junk`, "warn")}><X />Mark as junk</button>
                  <button className="act" onClick={() => onToast("Lead kept as good", "ok")}><Check />Keep as good</button>
                </div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}
