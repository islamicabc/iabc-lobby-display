// Student fundraising leaderboard — drives the TV's pie ↔ top-10 rotation and
// the "Full Leaderboard" artboard.
//
// LIVE: paste the published-CSV link of the Google Sheet "Leaderboard" tab
// below (File → Share → Publish to web → Leaderboard → CSV). Columns, header
// in row 1: Rank, Student, Family tickets, Individual tickets, Donations, Total points.
// The sheet is the source of truth — Rank and Total points are used as given.
// It is fetched on load and every 60 s; a failed fetch keeps the last good pull
// (saved in this browser), or the snapshot below if there has never been one.
var LEADERBOARD_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS1tMWtCGYaBJD4Fq5ZwwZRLRZ2fsMezcK4euHHIBxwuVBLboKzWOSd3XirxbdfYrViZ1P6OMeaVLuv/pub?gid=822672524&single=true&output=csv";

(function () {
  if (window.IABC_LEADERBOARD) return;   // already set up (script evaluated twice)
  const REFRESH_MS = 60000, CACHE_KEY = "iabc.leaderboard.v2";

  // Snapshot used until the sheet link is set (or if it has never loaded).
  // r = rank, n = student, f = family tickets, i = individual tickets, d = donations ($), p = total points
  const SNAPSHOT_AS_OF = "";
  const SNAPSHOT = [
  ].map(([r, n, f, i, d, p]) => ({ r, n, f, i, d, p }));

  const POINTS = { family: 50, individual: 20, dollar: 1 };
  const num = (v) => { const x = parseFloat(String(v == null ? "" : v).replace(/[$,\s]/g, "")); return isFinite(x) ? x : null; };
  const money = (v) => "$" + (Math.round(v) === v ? v.toLocaleString() : v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

  let rows = SNAPSHOT, asOf = SNAPSHOT_AS_OF, source = "snapshot";

  // ---- CSV ----
  function parseCSV(text) {
    const out = []; let row = [], cell = "", q = false;
    for (let k = 0; k < text.length; k++) {
      const c = text[k];
      if (q) { if (c === '"') { if (text[k + 1] === '"') { cell += '"'; k++; } else q = false; } else cell += c; }
      else if (c === '"') q = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[k + 1] === "\n") k++; row.push(cell); out.push(row); row = []; cell = ""; }
      else cell += c;
    }
    if (cell || row.length) { row.push(cell); out.push(row); }
    return out;
  }

  // Header names are matched loosely, so "Family Tickets" / "family" both work.
  function rowsFromCSV(text) {
    const t = parseCSV(text).filter(r => r.some(c => String(c).trim()));
    if (t.length < 2) return null;
    const head = t[0].map(h => String(h).toLowerCase().replace(/[^a-z]/g, ""));
    const col = (...keys) => head.findIndex(h => keys.some(k => h.indexOf(k) === 0));
    const ci = { r: col("rank"), n: col("student", "name"), f: col("family"), i: col("individual"), d: col("donation"), p: col("totalpoints", "points", "total") };
    if (ci.n < 0) return null;
    const list = t.slice(1).map(c => ({
      r: ci.r >= 0 ? num(c[ci.r]) : null, n: String(c[ci.n] || "").trim(),
      f: num(c[ci.f]) || 0, i: num(c[ci.i]) || 0, d: num(c[ci.d]) || 0, p: ci.p >= 0 ? num(c[ci.p]) : null,
    })).filter(r => r.n);
    return list.length ? list : null;
  }

  function stamp(d) { return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + ", " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); }
  function publish() { try { window.dispatchEvent(new Event("iabc-leaderboard")); } catch (e) {} }

  function useCSV(text, at, src) {
    const list = rowsFromCSV(text);
    if (!list) return false;
    rows = list; asOf = stamp(new Date(at)); source = src;
    publish();
    return true;
  }

  async function refresh() {
    if (!LEADERBOARD_CSV_URL) return;
    try {
      const url = LEADERBOARD_CSV_URL + (LEADERBOARD_CSV_URL.includes("?") ? "&" : "?") + "_=" + Date.now();
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const text = await res.text();
      const at = Date.now();
      if (useCSV(text, at, "live")) { try { localStorage.setItem(CACHE_KEY, JSON.stringify({ url: LEADERBOARD_CSV_URL, at, csv: text })); } catch (e) {} }
    } catch (e) { /* keep last good data */ }
  }

  if (LEADERBOARD_CSV_URL) {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (c && c.url === LEADERBOARD_CSV_URL && c.csv) useCSV(c.csv, c.at, "cache");
    } catch (e) {}
    refresh();
    setInterval(refresh, REFRESH_MS);
  }

  // Every student, ordered by points. Points come from the sheet (computed only
  // when blank). Rank is DENSE and derived from points — 1, 2, 3, 4, 4, 5 —
  // so equal points share a number and numbers never skip. The sheet's Rank column
  // is ignored for display because its skipping ranks (7, 7, 7, 10) confused people.
  function ranked() {
    const list = rows.map(r => {
      const pts = r.p != null ? Math.round(r.p) : Math.round(r.f * POINTS.family + r.i * POINTS.individual + r.d * POINTS.dollar);
      return { name: r.n, f: r.f, i: r.i, d: r.d, dStr: money(r.d), pts, ptsStr: pts.toLocaleString() };
    });
    // Ties are listed alphabetically by LAST name (the last word of the name).
    const last = (n) => { const p = String(n).trim().split(/\s+/); return (p[p.length - 1] + " " + p.join(" ")).toLowerCase(); };
    list.sort((a, b) => b.pts - a.pts || last(a.name).localeCompare(last(b.name)));
    let rank = 0;
    list.forEach((r, k) => { if (!k || r.pts !== list[k - 1].pts) rank++; r.rank = rank; });
    const count = {};
    list.forEach(r => { count[r.rank] = (count[r.rank] || 0) + 1; });
    list.forEach((r, k) => { r.tied = count[r.rank] > 1; r.rankStr = String(r.rank);
      r.tieFirst = r.tied && (!k || list[k - 1].rank !== r.rank);
      r.tieLast = r.tied && (k === list.length - 1 || list[k + 1].rank !== r.rank); });
    // Display name: last name shortened to an initial ("Abdul Ahad H."). The sheet may
    // abbreviate Abdul Ahad as "A. Ahad", so restore it. If two students would end up
    // with the same short name, both keep their full last name.
    const fullName = (n) => String(n).trim().replace(/^A\.\s*Ahad\b/i, "Abdul Ahad").replace(/^Mirzoyahyoxon\b/i, "Yahyo");
    const abbr = (n) => { const p = n.split(/\s+/); return p.length < 2 ? n : (/^muhammad$/i.test(p[0]) ? p[0] : p.slice(0, -1).join(" ")) + " " + p[p.length - 1].charAt(0).toUpperCase() + "."; };
    const shortCount = {};
    list.forEach(r => { const s = abbr(fullName(r.name)).toLowerCase(); shortCount[s] = (shortCount[s] || 0) + 1; });
    list.forEach(r => { const full = fullName(r.name), s = abbr(full); r.short = shortCount[s.toLowerCase()] > 1 ? full : s; });
    return list;
  }

  // As many students (points > 0) as fit in n rows, never splitting a tie group.
  function top(n) {
    const list = ranked().filter(r => r.pts > 0), out = [];
    n = n || 10;
    for (let k = 0; k < list.length; ) {
      let j = k; while (j < list.length && list[j].rank === list[k].rank) j++;
      if (out.length && out.length + (j - k) > n) break;
      out.push(...list.slice(k, j)); k = j;
    }
    return out;
  }

  window.IABC_LEADERBOARD = {
    POINTS, ranked, top, refresh,
    // Top-three row tints: gold, silver, bronze.
    MEDALS: {
      1: { emoji: "\u{1F947}", badge: "linear-gradient(135deg,#fff6c2 0%,#ffd84a 28%,#e6a400 55%,#fff0a0 75%,#c98a00 100%)", row: "linear-gradient(100deg,rgba(255,214,60,.42) 0%,rgba(255,244,190,.55) 30%,rgba(255,198,26,.30) 60%,rgba(255,226,120,.45) 100%)", line: "rgba(214,150,0,.9)", glow: "0 0 10px rgba(255,200,40,.55)" },
      2: { emoji: "\u{1F948}", badge: "linear-gradient(135deg,#ffffff 0%,#dfe6ec 28%,#9eacb8 55%,#f4f7fa 75%,#8a98a6 100%)", row: "linear-gradient(100deg,rgba(200,212,224,.45) 0%,rgba(255,255,255,.60) 30%,rgba(180,194,208,.36) 60%,rgba(230,236,242,.52) 100%)", line: "rgba(130,148,166,.95)", glow: "0 0 10px rgba(200,215,230,.6)" },
      3: { emoji: "\u{1F949}", badge: "linear-gradient(135deg,#ffe0c2 0%,#e8a066 28%,#b0652a 55%,#f5c49a 75%,#8f4c1a 100%)", row: "linear-gradient(100deg,rgba(215,140,70,.40) 0%,rgba(255,215,175,.52) 30%,rgba(205,127,50,.30) 60%,rgba(240,180,130,.44) 100%)", line: "rgba(170,95,30,.9)", glow: "0 0 10px rgba(220,140,70,.5)" },
    },
    get asOf() { return asOf; }, get source() { return source; }, get rows() { return rows; },
    rule: "50 pts / family ticket \u00b7 20 / individual ticket \u00b7 1 point per dollar raised",
  };
})();
