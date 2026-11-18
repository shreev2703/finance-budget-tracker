// Reads the board and issue exports and prints the numbers for the PM report as JSON.
const board = require(process.argv[2]).items;
const issues = Object.fromEntries(require(process.argv[3]).map((i) => [i.number, i]));

const PEOPLE = { shreev2703: 'Shreev', jsol1s: 'Juan S.', 'Juan-Flores-Cortes': 'Juan F.' };
// Shared tickets with hours: credited to whoever's commits did the work.
const CREDIT = { 85: 'jsol1s', 94: 'shreev2703' };
const ITERS = [
  ['Sprint 1 · TE1', '2026-09-14', '2026-09-20'],
  ['Sprint 2 · TE2', '2026-09-21', '2026-09-27'],
  ['Sprint 2 · TE3', '2026-09-28', '2026-10-04'],
  ['TE4', '2026-10-05', '2026-10-18'],
  ['Sprint 3', '2026-10-19', '2026-10-25'],
  ['Sprint 4', '2026-10-26', '2026-11-01'],
  ['Sprint 5 (class Sprint #4)', '2026-11-02', '2026-11-15'],
  ['Final Sprint (class Sprint #5)', '2026-11-16', '2026-11-20'],
];

const items = board
  .filter((x) => x.content?.number)
  .map((x) => {
    const i = issues[x.content.number];
    return {
      n: x.content.number,
      title: x.content.title,
      status: x.status,
      iteration: x.iteration?.title,
      est: Number(x['estimated Time (hrs)'] ?? 0),
      act: x['actual Time (hrs)'] == null ? null : Number(x['actual Time (hrs)']),
      assignees: x.assignees ?? [],
      created: i.createdAt.slice(0, 10),
      closed: i.closedAt ? i.closedAt.slice(0, 10) : null,
      done: x.status === 'Done',
    };
  });

// Hours by person and sprint.
const hours = {};
const estByPerson = {};
for (const [name] of ITERS) {
  hours[name] = { Shreev: 0, 'Juan S.': 0, 'Juan F.': 0 };
  estByPerson[name] = { Shreev: 0, 'Juan S.': 0, 'Juan F.': 0 };
}
for (const it of items) {
  if (!hours[it.iteration]) throw new Error(`#${it.n} has iteration ${it.iteration}`);
  const owners = CREDIT[it.n] ? [CREDIT[it.n]] : it.assignees;
  const share = 1 / owners.length;
  for (const login of owners) {
    estByPerson[it.iteration][PEOPLE[login]] += it.est * share;
    if (it.act != null) hours[it.iteration][PEOPLE[login]] += it.act * share;
  }
}

// Sprint totals.
const sprints = ITERS.map(([name, start, end]) => {
  const inSprint = items.filter((it) => it.iteration === name);
  const done = inSprint.filter((it) => it.done);
  return {
    name, start, end,
    tickets: inSprint.length,
    doneTickets: done.length,
    planned: inSprint.reduce((s, it) => s + it.est, 0),
    completedEst: done.reduce((s, it) => s + it.est, 0),
    actual: inSprint.reduce((s, it) => s + (it.act ?? 0), 0),
  };
});

// Burnup: every day from the first sprint to the end of the final one.
const days = [];
for (let d = new Date('2026-09-14T00:00:00Z'); d <= new Date('2026-11-20T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1)) {
  days.push(d.toISOString().slice(0, 10));
}
const today = '2026-11-18';
const burnup = days.map((day) => ({
  day,
  scope: items.filter((it) => it.created <= day).reduce((s, it) => s + it.est, 0),
  completed: day > today ? null : items.filter((it) => it.done && it.closed && it.closed <= day).reduce((s, it) => s + it.est, 0),
}));

const total = items.reduce((s, it) => s + it.est, 0);
const doneItems = items.filter((it) => it.done);
const completedEst = doneItems.reduce((s, it) => s + it.est, 0);
const actualDone = doneItems.reduce((s, it) => s + (it.act ?? 0), 0);
const remaining = items.filter((it) => !it.done);
const remainingEst = remaining.reduce((s, it) => s + it.est, 0);

console.log(JSON.stringify({
  hours, estByPerson, sprints, burnup,
  totals: {
    tickets: items.length, done: doneItems.length, open: remaining.length,
    scope: total, completedEst, actualDone, remainingEst,
    cpi: completedEst / actualDone,
  },
  remaining: remaining.map((it) => ({ n: it.n, title: it.title, status: it.status, est: it.est, who: it.assignees.map((a) => PEOPLE[a]) })),
  overruns: doneItems.filter((it) => it.act != null && it.act !== it.est).map((it) => ({ n: it.n, title: it.title, est: it.est, act: it.act })),
}, null, 1));
