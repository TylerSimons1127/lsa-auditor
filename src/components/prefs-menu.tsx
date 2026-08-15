"use client";

import { useEffect, useRef, useState } from "react";
import { Settings, Check, X } from "lucide-react";
import { type Prefs, ACCENTS } from "@/prefs";

interface Props {
  prefs: Prefs;
  update: <K extends keyof Prefs>(k: K, v: Prefs[K]) => void;
  reset: () => void;
}

const SEG = (opts: [string, string][]) => opts;

export default function PrefsMenu({ prefs, update, reset }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <div className="prefs" ref={ref}>
      <button className="topbtn" onClick={() => setOpen((o) => !o)} aria-label="Options">
        <Settings className="w-3.5 h-3.5" />
        Options
      </button>

      {open && (
        <div className="prefs__panel" role="dialog" aria-label="Dashboard options">
          <div className="prefs__head">
            <span>Display &amp; data options</span>
            <button className="prefs__x" onClick={() => setOpen(false)} aria-label="Close">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="prefs__body">
            {/* Theme */}
            <Field label="Theme">
              <Seg
                value={prefs.theme}
                onChange={(v) => update("theme", v as Prefs["theme"])}
                opts={SEG([["light", "Light"], ["dark", "Dark"]])}
              />
            </Field>

            {/* Accent */}
            <Field label="Accent color">
              <div className="swatches">
                {(Object.keys(ACCENTS) as (keyof typeof ACCENTS)[]).map((k) => {
                  const a = ACCENTS[k];
                  const active = prefs.accent === k;
                  return (
                    <button
                      key={k}
                      className={`swatch ${active ? "is-active" : ""}`}
                      title={a.label}
                      onClick={() => update("accent", k)}
                      style={{ background: `hsl(${a.h} ${a.s}% ${a.l}%)` }}
                    >
                      {active && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* Font */}
            <Field label="Font">
              <Seg
                value={prefs.font}
                onChange={(v) => update("font", v as Prefs["font"])}
                opts={SEG([["inter", "Inter"], ["grotesk", "Grotesk"], ["system", "System"], ["mono", "Mono"]])}
              />
            </Field>

            {/* Density */}
            <Field label="Density">
              <Seg
                value={prefs.density}
                onChange={(v) => update("density", v as Prefs["density"])}
                opts={SEG([["comfortable", "Comfortable"], ["compact", "Compact"]])}
              />
            </Field>

            {/* Default filter */}
            <Field label="Open on filter">
              <Seg
                value={prefs.defaultFilter}
                onChange={(v) => update("defaultFilter", v as Prefs["defaultFilter"])}
                opts={SEG([["all", "All"], ["needs-review", "Needs review"], ["auto-junk", "Auto-junk"], ["likely-good", "Likely good"]])}
              />
            </Field>

            {/* Date format */}
            <Field label="Date format">
              <Seg
                value={prefs.dateFormat}
                onChange={(v) => update("dateFormat", v as Prefs["dateFormat"])}
                opts={SEG([["iso", "2026-08-14"], ["us", "08/14/26"], ["eu", "14.08.26"], ["relative", "3d ago"]])}
              />
            </Field>

            {/* Currency */}
            <Field label="Currency">
              <Seg
                value={prefs.currency}
                onChange={(v) => update("currency", v as Prefs["currency"])}
                opts={SEG([["USD", "USD $"], ["EUR", "EUR €"], ["GBP", "GBP £"], ["none", "None"]])}
              />
            </Field>

            {/* Number format */}
            <Field label="Number format">
              <Seg
                value={prefs.numberFormat}
                onChange={(v) => update("numberFormat", v as Prefs["numberFormat"])}
                opts={SEG([["en", "1,234.5"], ["eu", "1.234,5"]])}
              />
            </Field>

            {/* Toggles */}
            <div className="prefs__toggles">
              <Toggle label="Animations" on={prefs.animations} onClick={() => update("animations", !prefs.animations)} />
              <Toggle label="Compact stat tiles" on={prefs.compactStats} onClick={() => update("compactStats", !prefs.compactStats)} />
              <Toggle label="Row striping" on={prefs.rowStripes} onClick={() => update("rowStripes", !prefs.rowStripes)} />
              <Toggle label="Accent on rows" on={prefs.accentRows} onClick={() => update("accentRows", !prefs.accentRows)} />
            </div>
          </div>

          <div className="prefs__foot">
            <button className="prefs__reset" onClick={reset}>Reset to defaults</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="prefs__field">
      <span className="prefs__label">{label}</span>
      <div className="prefs__control">{children}</div>
    </div>
  );
}

function Seg({ value, onChange, opts }: { value: string; onChange: (v: string) => void; opts: [string, string][] }) {
  return (
    <div className="seg">
      {opts.map(([v, label]) => (
        <button key={v} className={`seg__btn ${value === v ? "is-active" : ""}`} onClick={() => onChange(v)}>
          {label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button className={`toggle ${on ? "is-on" : ""}`} onClick={onClick} role="switch" aria-checked={on}>
      <span className="toggle__track"><span className="toggle__knob" /></span>
      <span className="toggle__label">{label}</span>
    </button>
  );
}
