"use client";

import { useEffect, useMemo, useState, Fragment } from "react";
import { Search, ChevronDown, Check, X, RotateCcw, Radio, MessageSquare } from "lucide-react";
import { LEADS, type Lead } from "@/data/leads";
import {
  statusInfo,
  showCreditState,
  creditLabel,
  geoNote,
  DISPUTE_REASONS,
  type DisputeRecord,
  type DisputeKey,
} from "@/lead-meta";

type FilterKey = "all" | "needs-review" | "auto-junk" | "likely-good";
type SortKey = "date" | "cat" | "type" | "charge" | "age" | "days" | "status";

const FMAP: Record<FilterKey, (l: Lead) => boolean> = {
  all: () => true,
  "needs-review": (l) => l.cls === "Needs review",
  "auto-junk": (l) => l.cls === "Auto-junk",
  "likely-good": (l) => l.cls === "Likely good",
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
    const dur = 900;
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

interface DisputeStore {
  [id: string]: DisputeRecord;
}

export default function AuditConsole({
  onToast,
  disputes,
  onDispute,
  onOpenLead,
}: {
  onToast: (msg: string, kind?: string) => void;
  disputes: DisputeStore;
  onDispute: (id: string, rec: DisputeRecord) => void;
  onOpenLead: (id: string) => void;
}) {
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

  const stats = useMemo(() => {
    const needs = LEADS.filter((l) => l.cls === "Needs review").length;
    const junk = LEADS.filter((l) => l.cls === "Auto-junk").length;
    const credited = LEADS.filter((l) => l.creditState === "CREDITED").reduce((s, l) => s + (l.charge ?? 0), 0);
    const charged = LEADS.reduce((s, l) => s + (l.charge ?? 0), 0);
    const missed = LEADS.filter((l) => statusInfo(l).tone === "missed").length;
    return [
      { label: "Needs review", value: needs, accent: false },
      { label: "Auto-junk", value: junk, accent: false },
      { label: "Missed", value: missed, warn: true },
      { label: "Credits recovered", value: credited, sub: "est", accent: true, currency: true },
      { label: "Charged (total)", value: charged, sub: `${LEADS.length} leads`, currency: true },
    ];
  }, []);

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
      <div className="stat-row">
        {stats.map((s) => (
          <div key={s.label} className={`stat ${s.warn ? "stat--warn" : ""} ${s.accent ? "stat--accent" : ""}`}>
            <span className="stat__label">{s.label}</span>
            <span className="stat__value">
              {s.currency ? <CountUp value={s.value} currency /> : <CountUp value={s.value} />}
            </span>
            {s.sub && <span className="stat__sub">{s.sub}</span>}
          </div>
        ))}
      </div>

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
                  <th
                    key={k}
                    className={`sortable ${sortKey === k ? "sorted" : ""} ${sortDir === "desc" ? "desc" : ""} ${["charge", "age", "days"].includes(k) ? "num" : ""}`}
                    onClick={() => toggleSort(k as SortKey)}
                  >
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
              const si = statusInfo(l);
              const cm = creditLabel(l);
              const daysTxt = l.window === "expired" ? "Expired" : `${l.days}d`;
              const isOpen = openIdx === LEADS.indexOf(l);
              const creditShown = showCreditState(l);
              return (
                <Fragment key={l.id}>
                  <FragmentRow
                    lead={l}
                    isOpen={isOpen}
                    onToggle={() => toggleRow(LEADS.indexOf(l))}
                    statusInfo={si}
                    cm={cm}
                    creditShown={creditShown}
                    daysTxt={daysTxt}
                    disputed={!!disputes[l.id]}
                  />
                  <ExpandedLead
                    lead={l}
                    disputes={disputes}
                    onDispute={onDispute}
                    onOpenLead={onOpenLead}
                    onToast={onToast}
                    open={isOpen}
                  />
                </Fragment>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={10} className="empty">No leads match this view.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* expanded detail rows are rendered inline inside <tbody> above */}
    </div>
  );
}

function FragmentRow({
  lead, isOpen, onToggle, statusInfo, cm, creditShown, daysTxt, disputed,
}: {
  lead: Lead; isOpen: boolean; onToggle: () => void;
  statusInfo: { label: string; tone: string };
  cm: { cls: string; txt: string }; creditShown: boolean; daysTxt: string; disputed: boolean;
}) {
  const toneCls =
    statusInfo.tone === "resolved" ? "status--resolved" : statusInfo.tone === "missed" ? "status--warn" : statusInfo.tone === "actionable" ? "status--actionable" : "status--rated";
  return (
    <tr className={`row ${isOpen ? "open" : ""}`} onClick={onToggle}>
      <td className="date">{lead.date}</td>
      <td className="cat">{lead.cat}</td>
      <td className="type">{lead.type}</td>
      <td className="num charge">{fmtCharge(lead.charge)}</td>
      <td>
        <div className="cls">
          <b>{lead.cls}</b>
          <small>{lead.clsDetail.length > 38 ? lead.clsDetail.slice(0, 38) + "…" : lead.clsDetail}</small>
        </div>
      </td>
      <td>
        {creditShown ? <span className={`pill pill--${cm.cls}`}>{cm.txt}</span> : <span className="muted-dash">—</span>}
      </td>
      <td className="num">{lead.age}d</td>
      <td className="num"><span className={`days ${daysCls(daysTxt)}`}>{daysTxt}</span></td>
      <td>
        <span className={`status ${toneCls}`}>
          <span className="dot" />
          {statusInfo.label}{disputed ? " · disputed" : ""}
        </span>
      </td>
      <td><span className="chev"><ChevronDown className="w-3 h-3" /></span></td>
    </tr>
  );
}

// One clean unified panel — used inline, in the full-lead overlay, and in the review slideshow.
export function LeadDetailPanel({
  lead, disputes, onDispute, onToast, compact,
}: {
  lead: Lead;
  disputes: DisputeStore;
  onDispute: (id: string, rec: DisputeRecord) => void;
  onToast: (msg: string, kind?: string) => void;
  compact?: boolean;
}) {
  const cm = creditLabel(lead);
  const creditShown = showCreditState(lead);
  const geo = geoNote(lead);
  const winTxt = lead.window === "expired" ? "expired" : lead.window === "closing" ? "closing" : "open";
  const rec = disputes[lead.id];

  const rows: [string, React.ReactNode][] = [
    ["Credit state", creditShown ? <span className={`pill pill--${cm.cls}`}>{cm.txt}</span> : <span className="muted-dash">—</span>],
    ["Created", lead.created],
    ["Age / window", `${lead.age}d old · ${lead.days}d left (${winTxt})`],
    ["Lead type", lead.type],
    ["Source status", "ACTIVE"],
    ["Charged", <b key="c">{fmtCharge(lead.charge)}</b>],
    ["Credit amount", lead.creditState === "CREDITED" ? fmtCharge(lead.charge) : "—"],
    ["Contact", (lead.name ?? "—") + (lead.phone ? ` · ${lead.phone}` : "")],
    ["Review verdict", lead.verdict === "—" ? "—" : lead.verdict],
    ["Dispute reason", lead.dispute || "—"],
  ];

  return (
    <div className="panel">
      <div className="panel__rows">
        {rows.map(([k, v]) => (
          <div className="kv" key={k}>
            <span className="kv__k">{k}</span>
            <span className="kv__v">{v}</span>
          </div>
        ))}
        <div className="kv">
          <span className="kv__k">Classification</span>
          <span className="kv__v"><b>{lead.cls}</b> — {lead.clsDetail}</span>
        </div>
        <div className="kv">
          <span className="kv__k">Conversation</span>
          <span className="kv__v">
            <Conversation lead={lead} />
          </span>
        </div>
        {geo && (
          <div className="kv kv--note">
            <span className="kv__k">Note</span>
            <span className="kv__v geo-note">{geo}</span>
          </div>
        )}
      </div>

      {!compact && (
        <DisputeBox lead={lead} rec={rec} onDispute={onDispute} onToast={onToast} />
      )}

      <RawPayload lead={lead} />
    </div>
  );
}

function Conversation({ lead }: { lead: Lead }) {
  if (lead.type === "Call") {
    return (
      <div className="convo-audio">
        <span className="convo-tag"><Radio className="w-3 h-3" /> CALL</span>
        <span className="convo-meta">{lead.convo[1]}</span>
        <audio controls src={lead.recordingUrl || ""}>
          Your browser does not support audio playback.
        </audio>
        {!lead.recordingUrl && <span className="convo-none">No recording available.</span>}
      </div>
    );
  }
  return (
    <div className="convo-text">
      <span className="convo-tag"><MessageSquare className="w-3 h-3" /> MESSAGE</span>
      <p>{lead.convo[1]}</p>
      {lead.note && <p className="convo-note">{lead.note}</p>}
    </div>
  );
}

function DisputeBox({
  lead, rec, onDispute, onToast,
}: {
  lead: Lead; rec?: DisputeRecord;
  onDispute: (id: string, r: DisputeRecord) => void;
  onToast: (msg: string, kind?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<DisputeKey | "">(rec?.reason ?? "");
  const [comment, setComment] = useState(rec?.comment ?? "");

  if (rec) {
    const r = DISPUTE_REASONS.find((x) => x.key === rec.reason);
    return (
      <div className="dispute">
        <div className="dispute__filed">
          <Check className="w-3.5 h-3.5" />
          Flagged for dispute — <b>{r?.label}</b>
          {rec.comment ? ` · "${rec.comment}"` : ""}
          <span className="dispute__note">Saved in this tool — not yet sent to Google</span>
        </div>
      </div>
    );
  }

  const needsComment = DISPUTE_REASONS.find((x) => x.key === reason)?.requiresComment;
  const canSubmit = !!reason && (!needsComment || comment.trim().length > 0);

  return (
    <div className="dispute">
      {!open ? (
        <div className="detail-actions">
          <button className="act act--accent" onClick={() => setOpen(true)}>
            <RotateCcw className="w-3.5 h-3.5" /> Flag for dispute
          </button>
          <button className="act act--danger" onClick={() => onToast(`Marked ${lead.googleLeadId} as junk`, "warn")}>
            <X className="w-3.5 h-3.5" /> Mark as junk
          </button>
          <button className="act" onClick={() => onToast(`Lead ${lead.googleLeadId} kept as good`, "ok")}>
            <Check className="w-3.5 h-3.5" /> Keep as good
          </button>
        </div>
      ) : (
        <div className="dispute__form">
          <div className="dispute__title">Why is this lead invalid? (Google only credits specific reasons)</div>
          <div className="dispute__opts">
            {DISPUTE_REASONS.map((r) => (
              <button
                key={r.key}
                className={`dispute__opt ${reason === r.key ? "is-active" : ""}`}
                onClick={() => setReason(r.key)}
              >
                {r.label}
              </button>
            ))}
          </div>
          {needsComment && (
            <textarea
              className="dispute__comment"
              placeholder="Required — explain the issue…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          )}
          <div className="dispute__actions">
            <button
              className="act act--accent"
              disabled={!canSubmit}
              onClick={() => {
                if (!reason) return;
                onDispute(lead.id, { reason, comment: comment.trim() || undefined });
                onToast(`Flagged ${lead.googleLeadId} for dispute — saved locally`, "info");
                setOpen(false);
              }}
            >
              <Check className="w-3.5 h-3.5" /> Submit flag
            </button>
            <button className="act" onClick={() => setOpen(false)}>Cancel</button>
          </div>
          <span className="dispute__note">Saved in this tool — not yet sent to Google</span>
        </div>
      )}
    </div>
  );
}

function RawPayload({ lead }: { lead: Lead }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rawp">
      <button className="rawp__toggle" onClick={() => setOpen((o) => !o)}>
        {open ? "Hide raw payload" : "Show raw payload"}
      </button>
      {open && <pre className="raw">{JSON.stringify(lead, null, 2)}</pre>}
    </div>
  );
}

// Inline expanded row wrapper (rendered inside <tbody>)
function ExpandedLead({
  lead, disputes, onDispute, onOpenLead, onToast, open,
}: {
  lead: Lead; disputes: DisputeStore;
  onDispute: (id: string, rec: DisputeRecord) => void;
  onOpenLead: (id: string) => void; onToast: (msg: string, kind?: string) => void;
  open: boolean;
}) {
  return (
    <tr className={`detail-row ${open ? "open" : ""}`}>
      <td colSpan={10}>
        <div className="detail-wrap">
          <div className="detail-inner">
            <div className="detail-pad">
              <div className="detail-head">
                <span className="detail-id">Lead {lead.googleLeadId}</span>
                <button className="open-full" onClick={() => onOpenLead(lead.id)}>
                  Open full lead page →
                </button>
              </div>
              <LeadDetailPanel lead={lead} disputes={disputes} onDispute={onDispute} onToast={onToast} />
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}
