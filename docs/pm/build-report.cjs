// Builds docs/pm/status-report.html from docs/pm/report-data.json (made by compute.cjs).
// Static HTML with inline SVG charts, so it prints to PDF exactly as it looks.
// Re-run weekly: export the board, run compute.cjs, then this. See README in this folder.
const fs = require('fs');
const path = require('path');

const r = JSON.parse(fs.readFileSync(path.join(__dirname, 'report-data.json'), 'utf8'));
const RATE = 25; // assumed labor cost, $ per hour (see "Project cost")
const TODAY = '2026-11-18';
const DEADLINE = '2026-11-20';
const PEOPLE = ['Shreev', 'Juan S.', 'Juan F.'];
const COLOR = { Shreev: '#2a78d6', 'Juan S.': '#eb6834', 'Juan F.': '#1baf7a' };

const t = r.totals;
const fmt = (n) => (Math.round(n * 10) / 10).toLocaleString('en-US');
const money = (n) => `$${Math.round(n).toLocaleString('en-US')}`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const personTotal = Object.fromEntries(PEOPLE.map((p) => [p, r.sprints.reduce((s, sp) => s + r.hours[sp.name][p], 0)]));
const actualTotal = PEOPLE.reduce((s, p) => s + personTotal[p], 0);
const bac = t.scope * RATE; // budget at completion
const ev = t.completedEst * RATE; // earned value
const ac = actualTotal * RATE; // actual cost
const eacHours = actualTotal + t.remainingEst / t.cpi;
const eac = eacHours * RATE;
const pctDone = (t.completedEst / t.scope) * 100;

const final = r.sprints.at(-1);
const finalDaysElapsed = 3; // Nov 16, 17, 18
const finalVelocity = final.completedEst / finalDaysElapsed; // estimated hours finished per day
const daysToFinish = t.remainingEst / finalVelocity;
const weeks = (new Date(TODAY) - new Date('2026-09-14')) / (7 * 864e5);
const avgWeekly = t.completedEst / weeks;

// ---------- Burnup chart (one axis: estimated hours) ----------
function burnupSvg() {
  const W = 1000, H = 380, L = 56, R = 150, T = 34, B = 40;
  const days = r.burnup.map((d) => d.day);
  const x = (day) => L + ((new Date(day) - new Date(days[0])) / 864e5 / (days.length - 1)) * (W - L - R);
  const yMax = 200;
  const y = (v) => T + (1 - v / yMax) * (H - T - B);
  const step = (key) => {
    const pts = r.burnup.filter((d) => d[key] != null);
    let dpath = `M${x(pts[0].day)},${y(pts[0][key])}`;
    for (let i = 1; i < pts.length; i++) dpath += ` H${x(pts[i].day)} V${y(pts[i][key])}`;
    return { dpath, last: pts.at(-1) };
  };
  const scope = step('scope');
  const done = step('completed');
  const area = `${done.dpath} V${y(0)} H${x(r.burnup[0].day)} Z`;
  const bands = r.sprints.map((s, i) => {
    const x1 = x(s.start), x2 = x(s.end > days.at(-1) ? days.at(-1) : s.end) + (s.end > days.at(-1) ? 0 : (W - L - R) / (days.length - 1));
    const label = ['S1 · TE1', 'S2 · TE2', 'S2 · TE3', 'TE4', 'Sprint 3', 'Sprint 4', 'Sprint 5', 'Final'][i];
    return `<rect x="${x1}" y="${T}" width="${Math.max(0, x2 - x1)}" height="${H - T - B}" fill="${i % 2 ? '#f1f1ee' : '#fcfcfb'}"/>
      <text x="${(x1 + x2) / 2}" y="${T - 10}" text-anchor="middle" class="tick">${label}</text>`;
  }).join('');
  const grid = [0, 50, 100, 150, 200].map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="#e4e3df" stroke-width="1"/>
    <text x="${L - 8}" y="${y(v) + 4}" text-anchor="end" class="tick">${v}</text>`).join('');
  const months = ['2026-09-14', '2026-10-01', '2026-10-15', '2026-11-01', '2026-11-15'].map((d) => {
    const dt = new Date(d + 'T00:00:00Z');
    const lbl = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    return `<text x="${x(d)}" y="${H - B + 20}" text-anchor="middle" class="tick">${lbl}</text>`;
  }).join('');
  const todayX = x(TODAY);
  const deadlineX = x(DEADLINE);
  const fcEnd = { day: TODAY, v: t.completedEst + t.remainingEst };
  const forecastX = x(TODAY) + daysToFinish * ((W - L - R) / (days.length - 1));
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Burnup chart: total scope rises to ${fmt(t.scope)} estimated hours; completed work reaches ${fmt(t.completedEst)} hours on November 18, with the rest forecast to finish before the November 20 deadline.">
    ${bands}${grid}
    <text x="${L - 44}" y="${T + (H - T - B) / 2}" class="tick" transform="rotate(-90 ${L - 44} ${T + (H - T - B) / 2})" text-anchor="middle">Estimated hours</text>
    <path d="${area}" fill="#2a78d6" fill-opacity="0.12"/>
    <path d="${scope.dpath}" fill="none" stroke="#eb6834" stroke-width="2.5"/>
    <path d="${done.dpath}" fill="none" stroke="#2a78d6" stroke-width="2.5"/>
    <line x1="${todayX}" y1="${y(t.completedEst)}" x2="${forecastX}" y2="${y(fcEnd.v)}" stroke="#2a78d6" stroke-width="2.5" stroke-dasharray="6 5"/>
    <line x1="${todayX}" x2="${todayX}" y1="${T}" y2="${H - B}" stroke="#52514e" stroke-width="1" stroke-dasharray="3 3"/>
    <text x="${todayX - 6}" y="${H - B - 8}" text-anchor="end" class="tick">Today, Nov 18</text>
    <line x1="${deadlineX}" x2="${deadlineX}" y1="${T}" y2="${H - B}" stroke="#0b0b0b" stroke-width="1.5"/>
    <text x="${deadlineX + 6}" y="${H - B - 8}" class="tick">Deadline, Nov 20</text>
    ${months}
    <line x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}" stroke="#52514e" stroke-width="1"/>
    <text x="${W - R + 10}" y="${y(t.scope) - 6}" class="lbl">Total scope ${fmt(t.scope)} h</text>
    <text x="${W - R + 10}" y="${y(t.completedEst) + 22}" class="lbl">Completed ${fmt(t.completedEst)} h</text>
    <circle cx="${x(TODAY)}" cy="${y(t.completedEst)}" r="5" fill="#2a78d6" stroke="#fcfcfb" stroke-width="2"><title>Nov 18: ${fmt(t.completedEst)} of ${fmt(t.scope)} estimated hours completed</title></circle>
  </svg>`;
}

// ---------- Hours by person per sprint (stacked bars, one axis) ----------
function hoursSvg() {
  const W = 1000, H = 330, L = 56, R = 20, T = 20, B = 70;
  const n = r.sprints.length;
  const slot = (W - L - R) / n;
  const bw = slot * 0.56;
  const yMax = 40;
  const y = (v) => T + (1 - v / yMax) * (H - T - B);
  const grid = [0, 10, 20, 30, 40].map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="#e4e3df"/>
    <text x="${L - 8}" y="${y(v) + 4}" text-anchor="end" class="tick">${v}</text>`).join('');
  const bars = r.sprints.map((s, i) => {
    let acc = 0;
    const cx = L + slot * i + (slot - bw) / 2;
    const segs = PEOPLE.map((p) => {
      const v = r.hours[s.name][p];
      if (!v) return '';
      const y0 = y(acc), y1 = y(acc + v);
      acc += v;
      return `<rect x="${cx}" y="${y1}" width="${bw}" height="${Math.max(0, y0 - y1 - 2)}" rx="2" fill="${COLOR[p]}"><title>${esc(s.name)}: ${p} ${fmt(v)} h</title></rect>`;
    }).join('');
    const short = ['S1 · TE1', 'S2 · TE2', 'S2 · TE3', 'TE4', 'Sprint 3', 'Sprint 4', 'Sprint 5', 'Final'][i];
    const dates = new Date(s.start + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    return `${segs}<text x="${cx + bw / 2}" y="${y(acc) - 6}" text-anchor="middle" class="lbl">${fmt(acc)}</text>
      <text x="${cx + bw / 2}" y="${H - B + 20}" text-anchor="middle" class="tick">${short}</text>
      <text x="${cx + bw / 2}" y="${H - B + 38}" text-anchor="middle" class="tick">${dates}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Actual hours per sprint, stacked by person. Totals by sprint: ${r.sprints.map((s) => fmt(s.actual)).join(', ')}.">
    ${grid}
    <text x="${L - 44}" y="${T + (H - T - B) / 2}" class="tick" transform="rotate(-90 ${L - 44} ${T + (H - T - B) / 2})" text-anchor="middle">Actual hours</text>
    ${bars}
    <line x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}" stroke="#52514e"/>
  </svg>`;
}

const legend = (items) => `<div class="legend">${items.map(([label, color, dashed]) =>
  `<span><i style="background:${dashed ? 'transparent' : color};border-top:${dashed ? `3px dashed ${color}` : '0'};height:${dashed ? '0' : '12px'}"></i>${label}</span>`).join('')}</div>`;

const hoursRows = r.sprints.map((s) => `<tr><td>${esc(s.name)}<br><span class="muted">${s.start.slice(5)} to ${s.end.slice(5)}</span></td>${PEOPLE.map((p) => `<td class="num">${fmt(r.hours[s.name][p])}</td>`).join('')}<td class="num"><b>${fmt(s.actual)}</b></td><td class="num">${fmt(s.planned)}</td><td class="num">${s.doneTickets} / ${s.tickets}</td></tr>`).join('');

const remainingRows = r.remaining.map((it) => `<tr><td>#${it.n}</td><td>${esc(it.title)}</td><td>${it.who.join(', ')}</td><td>${esc(it.status)}</td><td class="num">${fmt(it.est)}</td></tr>`).join('');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>LedgerLogic Project Status</title>
<style>
  :root { --ink:#17251f; --muted:#52514e; --line:#e4e3df; --paper:#fcfcfb; --accent:#18754b; }
  @page { size: Letter; margin: 0.6in; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--paper); color: var(--ink); font: 14px/1.5 "Segoe UI", Arial, sans-serif; }
  main { max-width: 1000px; margin: 0 auto; padding: 32px 16px 48px; }
  h1 { font-size: 28px; margin: 0 0 4px; }
  h2 { font-size: 20px; margin: 32px 0 8px; break-after: avoid; }
  h3 { font-size: 15px; margin: 16px 0 4px; }
  p, li { color: var(--ink); }
  .muted { color: var(--muted); font-size: 12px; }
  .sub { color: var(--muted); margin: 0 0 20px; }
  .tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .tile { border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; background: #fff; }
  .tile b { display: block; font-size: 26px; line-height: 1.2; }
  .tile span { color: var(--muted); font-size: 12px; }
  .ok { color: var(--accent); }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 4px; font-size: 13px; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--line); vertical-align: top; }
  th { font-size: 12px; color: var(--muted); font-weight: 600; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  tfoot td { font-weight: 700; border-top: 2px solid var(--ink); }
  figure { margin: 8px 0 0; break-inside: avoid; }
  figcaption { color: var(--muted); font-size: 12px; margin-top: 4px; }
  svg .tick { font-size: 12px; fill: var(--muted); }
  svg .lbl { font-size: 13px; fill: var(--ink); font-weight: 600; }
  .legend { display: flex; gap: 18px; flex-wrap: wrap; font-size: 12px; color: var(--muted); margin: 6px 0; }
  .legend i { display: inline-block; width: 18px; margin-right: 6px; vertical-align: middle; border-radius: 2px; }
  .callout { border-left: 4px solid var(--accent); background: #f1f8f3; padding: 10px 14px; border-radius: 6px; }
  .risk { border-left-color: #b07a06; background: #fff8e6; }
  .avoid-break { break-inside: avoid; }
  @media (max-width: 700px) { .tiles { grid-template-columns: 1fr 1fr; } }
</style>
</head>
<body>
<main>
<h1>LedgerLogic: Project Status Report</h1>
<p class="sub">Team Undefined (Juan Solis, Shreev Babu, Juan Flores) · CSC 3100 · Data as of ${TODAY.slice(5).replace('-', '/')}/2026 from the GitHub project board · Final sprint ends Fri, Nov 20</p>

<div class="tiles">
  <div class="tile"><b>${fmt(pctDone)}%</b><span>of estimated scope done (${fmt(t.completedEst)} of ${fmt(t.scope)} h; ${t.done} of ${t.tickets} tickets)</span></div>
  <div class="tile"><b class="ok">On schedule</b><span>forecast finish Nov 19 to 20, deadline Nov 20 (risks below)</span></div>
  <div class="tile"><b>${money(ac)}</b><span>labor cost to date (${fmt(actualTotal)} h × $${RATE}/h); forecast ${money(eac)} at completion</span></div>
  <div class="tile"><b>${fmt(t.remainingEst)} h</b><span>left in ${t.open} open tickets</span></div>
</div>

<h2>1. Actual hours for each person, each sprint</h2>
<p>From the <b>Actual Time (hrs)</b> field on every ticket, grouped by the new <b>Iteration</b> field. A ticket with two owners is split evenly, except where one person did the work (credited to the commit author: #85 Supabase switch to Juan S., #94 Plaid to Shreev).</p>
<table>
  <thead><tr><th>Sprint</th>${PEOPLE.map((p) => `<th class="num">${p}</th>`).join('')}<th class="num">Actual</th><th class="num">Estimated</th><th class="num">Tickets done</th></tr></thead>
  <tbody>${hoursRows}</tbody>
  <tfoot><tr><td>Total</td>${PEOPLE.map((p) => `<td class="num">${fmt(personTotal[p])}</td>`).join('')}<td class="num">${fmt(actualTotal)}</td><td class="num">${fmt(t.scope)}</td><td class="num">${t.done} / ${t.tickets}</td></tr></tfoot>
</table>
<figure>
  ${legend(PEOPLE.map((p) => [p, COLOR[p]]))}
  ${hoursSvg()}
  <figcaption>Actual hours per sprint, stacked by person. Sprint 5 is the class’s Sprint #4 (Nov 2–15); the Final Sprint is the class’s Sprint #5 and is still in progress.</figcaption>
</figure>

<h2>2. Burnup: completed work vs. total scope</h2>
<figure>
  ${legend([['Total scope (estimated hours of every ticket created so far)', '#eb6834'], ['Completed (estimated hours of closed tickets)', '#2a78d6'], ['Forecast at the final sprint’s pace', '#2a78d6', true]])}
  ${burnupSvg()}
  <figcaption>Scope rises when tickets are added; completed rises when they close. Both use estimated hours, so the gap between the lines is the work left. Early sprints step up late because those tickets were entered and closed on GitHub after the work (Sep 30).</figcaption>
</figure>

<h2>3. Are we on schedule?</h2>
<div class="callout">
<p><b>Yes.</b> ${fmt(pctDone)}% of the scope is done with two working days left, and every user story (US-01 to US-09, plus the stretch goal US-10) is built, tested, and merged. ${fmt(t.remainingEst)} estimated hours remain.</p>
</div>
<ul>
  <li><b>Scope grew ${fmt(final.planned)} h in the final sprint</b> (Nov 16): fixing the tests the Supabase switch broke, all four TE7 test levels, account settings, the Plaid bank import, deployment, and the final documents. ${fmt(final.completedEst)} h of that is already done.</li>
  <li><b>Every sprint before this one finished all of its tickets.</b> Estimates have held: ${fmt(t.completedEst)} estimated hours took ${fmt(actualTotal)} actual hours (cost performance index ${t.cpi.toFixed(2)}). The biggest miss was #44 (transactions page: 2 h estimated, 5 h actual).</li>
  <li><b>Workload is uneven.</b> ${fmt(personTotal.Shreev)} of ${fmt(actualTotal)} hours (${Math.round((personTotal.Shreev / actualTotal) * 100)}%) are Shreev’s; Juan S. and Juan F. logged none in the final sprint so far. To rebalance, Shreev took over the test fixes and the stretch goal, while Juan S. owns deployment and Juan F. the TE5 review. A Thursday check-in moves anything not started to whoever is free.</li>
</ul>
<div class="callout risk avoid-break">
<p><b>Risks to the Nov 20 finish</b></p>
<ul>
  <li><b>Deployment (#93, 3 h, Juan S.) hasn’t started.</b> If it slips, the app is still fully usable locally and in demo mode, but the SRD has no public URL.</li>
  <li><b>The team’s Supabase connection string</b> is only on Juan S.’s laptop. Until it is shared, nobody else can run the app against the live database (#87).</li>
  <li><b>TE5 reviews (#65, #66, 1.5 h)</b> are unstarted. Small, but they are graded.</li>
</ul>
</div>

<h2>4. When will the project be complete?</h2>
<p>We forecast from velocity: estimated hours completed per day.</p>
<ul>
  <li><b>Final-sprint pace:</b> ${fmt(final.completedEst)} h in 3 days, about ${fmt(finalVelocity)} h/day. At that pace the remaining ${fmt(t.remainingEst)} h take about ${fmt(daysToFinish)} days, which means <b>Thursday, Nov 19</b>, one day before the deadline.</li>
  <li><b>Whole-project pace:</b> ${fmt(t.completedEst)} h over ${fmt(weeks)} weeks, about ${fmt(avgWeekly)} h/week. At that slower pace the remaining work takes under a week, but the deadline caps it: anything not done Friday is dropped, not delayed.</li>
  <li><b>Forecast: complete on Fri, Nov 20</b>, if Juan S. deploys and shares the database by Thursday. If not, those two items ship without a public URL, and everything graded still lands on time.</li>
</ul>

<h2>5. What does the project cost?</h2>
<p>The only real cost is our time. We price it at an assumed <b>$${RATE}/hour</b>, a typical student developer rate; a different rate scales every number in the same proportion.</p>
<table class="avoid-break">
  <thead><tr><th>Measure</th><th class="num">Hours</th><th class="num">Cost</th><th>Meaning</th></tr></thead>
  <tbody>
    <tr><td>Budget at completion (BAC)</td><td class="num">${fmt(t.scope)}</td><td class="num">${money(bac)}</td><td>Every ticket’s estimate</td></tr>
    <tr><td>Earned value (EV)</td><td class="num">${fmt(t.completedEst)}</td><td class="num">${money(ev)}</td><td>Estimate of the work finished</td></tr>
    <tr><td>Actual cost (AC)</td><td class="num">${fmt(actualTotal)}</td><td class="num">${money(ac)}</td><td>Hours actually logged</td></tr>
    <tr><td>Estimate at completion (EAC)</td><td class="num">${fmt(eacHours)}</td><td class="num">${money(eac)}</td><td>AC + remaining work ÷ CPI</td></tr>
    <tr><td>Infrastructure</td><td class="num">—</td><td class="num">$0</td><td>GitHub, Supabase, Plaid sandbox, and hosting all on free tiers</td></tr>
  </tbody>
</table>
<p>By person to date: ${PEOPLE.map((p) => `${p} ${fmt(personTotal[p])} h (${money(personTotal[p] * RATE)})`).join(' · ')}. The project is forecast to finish about ${money(Math.abs(eac - bac))} ${eac >= bac ? 'over' : 'under'} budget (${fmt(Math.abs(eacHours - t.scope))} h), which is within normal estimating error.</p>

<h2>6. How we report, and what we changed on the board</h2>
<ul>
  <li><b>Source of truth:</b> the GitHub project “Finance Budget Tracker Board.” Every ticket has an owner, an <b>Estimated Time (hrs)</b>, an <b>Actual Time (hrs)</b> once done, a status, and a milestone.</li>
  <li><b>New field: Iteration.</b> We added a dated Iteration field with all eight sprints (start date and length) and set it on all ${t.tickets} tickets. That lets GitHub group hours by sprint and draw the burnup over real dates. The old Sprint labels had no dates, and four tickets had none.</li>
  <li><b>Fixed on the board:</b> tickets with no sprint (#22, #40, #85, #94) now have one; the leftover TE5 reviews (#65, #66) moved into the final sprint; the finished bank-import ticket (#94) moved to Done; finished milestones were closed.</li>
  <li><b>Charts in GitHub:</b> the board’s Insights tab can show the same two charts live: <i>Burn up</i> filtered to all items, and a bar chart with X-axis = Iteration, group by Assignees, Y-axis = sum of Actual Time (hrs).</li>
  <li><b>Weekly cadence:</b> at the end of each sprint, the PM exports the board, re-runs <code>docs/pm/compute.cjs</code> and <code>build-report.cjs</code>, and brings this page to the retro: are we on schedule, when will we finish, what has it cost.</li>
</ul>

<h2>7. Work remaining</h2>
<table>
  <thead><tr><th>Ticket</th><th>Task</th><th>Owner</th><th>Status</th><th class="num">Est. h</th></tr></thead>
  <tbody>${remainingRows}</tbody>
  <tfoot><tr><td colspan="4">Total remaining</td><td class="num">${fmt(t.remainingEst)}</td></tr></tfoot>
</table>

<h2>Data notes</h2>
<ul class="muted">
  <li>Hours are what each person entered on GitHub. On Nov 16 and 18 we filled in 13 done tickets that had no actual time with their estimates (and 0 h for #70, a rehearsal that didn’t happen), so those tickets show no estimating error by construction and the CPI is somewhat flattering.</li>
  <li>Scope and completion dates come from each ticket’s GitHub created and closed dates.</li>
  <li>Totals: ${t.tickets} tickets, ${t.done} done, ${t.open} open.</li>
</ul>
</main>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, 'status-report.html'), html);
console.log('wrote status-report.html');
