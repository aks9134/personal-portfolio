import type { CSSProperties } from "react";
import type { Job } from "@/lib/resume";

// Experience drawn as a shop schedule: one hatched bar per job on a real time axis, the job still running in
// stamp blue with an open end. The dates are parsed from the resume strings, so the bars can't drift from the text.
// The list underneath is the real content; the bars are a picture of it (aria-hidden).
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function month(s: string, fallbackYear?: number) {
  const [mon, year] = s.trim().split(/\s+/);
  const y = year ? Number(year) : fallbackYear;
  const m = MONTHS.indexOf(mon);
  if (m < 0 || !y) throw new Error(`Unreadable resume date: "${s}"`);
  return y * 12 + m;
}

// "Sep 2023 - Sep 2024", "Jan - May 2025", "Jun 2025 - present" -> [start, end) in months since year 0.
export function span(dates: string, now = new Date()) {
  const [a, b] = dates.split(" - ");
  const live = b.trim() === "present";
  const end = live ? now.getFullYear() * 12 + now.getMonth() + 1 : month(b) + 1;
  const start = month(a, live ? undefined : Math.floor((end - 1) / 12));
  return { start, end, live };
}

export function Schedule({ jobs }: { jobs: readonly Job[] }) {
  // "Mechanical Design Engineer since Mar 2026" puts a witness mark on the bar where the role changed.
  const rows = [...jobs]
    .map((j) => {
      const since = j.title.match(/since (\w{3} \d{4})/)?.[1];
      return { ...j, ...span(j.dates), mark: since ? month(since) : null };
    })
    .sort((x, y) => x.start - y.start);
  const from = Math.min(...rows.map((r) => r.start)) - 2;
  const to = Math.max(...rows.map((r) => r.end)) + 2;
  const at = (m: number) => `${(((m - from) / (to - from)) * 100).toFixed(3)}%`;
  const years: number[] = [];
  for (let y = Math.ceil(from / 12); y * 12 <= to; y++) years.push(y);
  const quarters: number[] = [];
  for (let q = Math.ceil(from / 3) * 3; q <= to; q += 3) if (q % 12) quarters.push(q);

  return (
    <div className="mt-8">
      <ol className="grid gap-y-5">
        {rows.map((r, i) => (
          <li key={r.org} className="grid gap-x-8 gap-y-2 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:items-center">
            <div>
              <p className="font-bold leading-tight">{r.org}</p>
              <p className="text-sm text-ink-2">
                {r.title}. <span className="whitespace-nowrap tabular-nums">{r.dates}</span>
              </p>
            </div>
            <div aria-hidden className="relative h-7">
              {years.map((y) => (
                <span key={y} className="absolute inset-y-[-0.625rem] w-px bg-rule-soft" style={{ left: at(y * 12) }} />
              ))}
              <span
                className={`bar absolute inset-y-0 ${r.live ? "bar-live" : ""}`}
                style={{ left: at(r.start), width: `calc(${at(r.end)} - ${at(r.start)})`, "--n": i } as CSSProperties}
              >
                {r.mark && (
                  <span
                    className="absolute -inset-y-1.5 w-[2.5px] bg-stamp"
                    style={{ left: `${(((r.mark - r.start) / (r.end - r.start)) * 100).toFixed(2)}%` }}
                  />
                )}
              </span>
            </div>
          </li>
        ))}
      </ol>
      {/* The axis: year marks with the quarters between them, like the scale along a drawing's border. */}
      <div aria-hidden className="mt-3 md:grid md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:gap-x-8">
        <span className="hidden md:block" />
        <div className="relative h-8 border-t-[1.5px] border-ink">
          {quarters.map((q) => (
            <span key={q} className="absolute top-0 h-1.5 w-px bg-ink" style={{ left: at(q) }} />
          ))}
          {years.map((y) => (
            <span key={y} className="absolute top-0 flex h-3 w-[1.5px] bg-ink" style={{ left: at(y * 12) }}>
              <span className="absolute left-1.5 top-2 text-xs font-bold tabular-nums">{y}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
