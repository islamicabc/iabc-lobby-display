(function () {
"use strict";
// NOTE: loaded as a PLAIN script (not an ES module) so the standalone
// single-file export can inline it. It publishes its data on window at the
// bottom of the file. Do not add "export" keywords back.
// ============================================================================
//  GOOGLE SHEET LOADER
//  ---------------------------------------------------------------------------
//  Reads the public "IABC Lobby Display — Content" sheet and overlays whatever
//  it finds onto content.js. Anything missing or unreadable falls back to
//  content.js, so a broken cell or an internet outage can never blank the TV.
//
//  The sheet has one tab; every row starts with a Type word:
//    SETTING       | CampaignId | b4-interior-p1   <- must match content.js
//    SETTING       | Campaign | Building 4 Interior — Phase 1
//    SETTING       | Goal     | 500000
//    CATEGORY      | Cash     | 275570      | #0f9d58
//    ANNOUNCEMENT  | Title    | Body        | YES
//    EVENT         | 2026-08-26 | First Day of School
//    HIJRI         | 2026-07-16 | Safar     | 1448
//    SLIDE         | welcome  |             |             |          | YES | 12
//    REFLECTION    | وقل رب زدني علما | And say: My Lord… | Qur'an — Ţā-Hā 20:114 | سورة طه ٢٠:١١٤ | YES
//    SLIDE         | web      | Admissions  | https://... | 1920x1080 | YES | 20
//    SLIDE         | image    | Live Steps  | https://... |          | YES
//    SLIDE         | grid     | Building #4 | url1;url2   | cap1;cap2 | YES
//    SLIDE         | scope    | Phase 1     | plan.png    | HVAC;Plumbing | YES | 18 | Musalla;Lobby | FLOOR 1
//  DONATION rows are ignored on purpose — donor names live only in the
//  private donations sheet and must never reach a published file.
//
//  SLIDE rows control the rotation: the order of the rows IS the order on
//  screen, and column F (YES/NO) turns a slide on or off without deleting it.
//  Column G is that slide's own time on screen in seconds — leave it blank to
//  use SETTING | Rotation (or 10 seconds if that is not set either).
//  If the sheet has no SLIDE rows at all, the slides in content.js are used.
//
//  REFLECTION rows replace the whole āyāt/aḥādīth list when present: A = Arabic,
//  B = English translation, C = source, D = source in Arabic, F = YES/NO. Keep
//  them alternating āyah → ḥadīth, and mark partial quotations with … on the cut
//  side. If there are no REFLECTION rows, the 48 in content.js are used.
//  (REMINDER is accepted as an alias for REFLECTION.)
// ============================================================================

// Minimal RFC-4180 CSV parser (handles quoted fields, embedded commas/newlines).
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const num = (v) => { const n = Number(String(v).replace(/[$,\s]/g, "")); return isFinite(n) ? n : null; };
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// Google Sheets turns a typed 2026-11-11 into a date cell, and the CSV export
// then says 11/11/2026 — normalize any of those forms back to YYYY-MM-DD.
function isoDate(s) {
  const t = String(s || "").trim();
  let m = t.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2,"0")}-${m[3].padStart(2,"0")}`;
  m = t.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
  if (m) { const y = m[3].length === 2 ? "20" + m[3] : m[3]; return `${y}-${m[1].padStart(2,"0")}-${m[2].padStart(2,"0")}`; }
  const d = new Date(t);
  if (!isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  return t;
}

function prettyDate(s) {
  s = isoDate(s);
  const m = String(s).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return String(s).trim();
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  if (isNaN(d.getTime())) return String(s).trim();
  const wd = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()];
  return `${wd}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

// Builds a partial config from the sheet's CSV. Returns null if nothing usable.
function configFromCSV(csvText, baseCfg) {
  const rows = parseCSV(csvText).map(r => r.map(c => String(c || "").trim()));
  if (!rows.length) return null;

  const settings = {}, cats = [], anns = [], events = [], hijri = [], slides = [], reminders = [];
  let sawReflection = false;   // true if the sheet mentions a reflection slide at all
  const mentioned = [];        // every SLIDE row, shown or not, so a pinned slide set to NO stays off
  for (const r of rows) {
    const type = (r[0] || "").toUpperCase();
    const a = r[1] || "", b = r[2] || "", c = r[3] || "";
    if (type === "SETTING" && a) settings[a.toLowerCase()] = b;
    else if (type === "CATEGORY" && a && num(b) !== null) cats.push({ label: a, amount: num(b), color: c || "#0f9d58" });
    else if (type === "ANNOUNCEMENT" && a && !/^no$/i.test(c)) anns.push({ title: a, body: b });
    else if (type === "EVENT" && a && b) events.push({ raw: isoDate(a), date: prettyDate(a), title: b });
    // HIJRI | greg date | month name | year | month name in Arabic (optional)
    else if (type === "HIJRI" && a && b) hijri.push({ greg: isoDate(a), label: b, year: num(c) || 1448, labelAr: r[4] || "" });
    else if (type === "SLIDE" && a) {
      if (a.toLowerCase() === "reflection") sawReflection = true;
      mentioned.push({ type: a.toLowerCase(), src: r[3] || "" });
      // The announcements slide was retired from the rotation. Old sheets still
      // carry its SLIDE row, so it is dropped here rather than requiring an edit
      // to the live sheet. Delete this line to bring the slide back.
      if (a.toLowerCase() === "announcements") continue;
      const s = slideFromRow(r); if (s) slides.push(s);
    }
    // REFLECTION | arabic | english | source | source in Arabic | YES/NO
    else if ((type === "REFLECTION" || type === "REFLECTIONS" || type === "REMINDER") && a && b && !/^no$/i.test(r[5] || ""))
      reminders.push({ arabic: a, text: b, source: c, sourceArabic: r[4] || "" });
  }

  const out = {};
  const f = { ...baseCfg.fundraising };
  // Guard against a sheet still filled with a CLOSED campaign's rows, without
  // demanding any new row in the normal case:
  //   • SETTING | CampaignId present -> it must match content.js fundraising.id
  //   • otherwise -> trusted, UNLESS its Campaign name matches a campaign in
  //     content.js pastCampaigns (i.e. the sheet was never switched over)
  const wantId = (baseCfg.fundraising && baseCfg.fundraising.id) || "";
  const sheetId = (settings.campaignid || "").trim();
  const norm = (v) => String(v || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
  const closed = (baseCfg.pastCampaigns || []).some(p =>
    (settings.campaign && norm(p.campaign) === norm(settings.campaign)) ||
    (sheetId && norm(p.id) === norm(sheetId)));
  const fundOk = sheetId ? norm(sheetId) === norm(wantId) : !closed;
  if (!fundOk) console.warn('[lobby] The sheet still names a closed campaign' +
    (settings.campaign ? ' ("' + settings.campaign + '")' : "") +
    " \u2014 ignoring its fundraising rows until it is switched to the current one.");
  if (fundOk) {
  if (settings.campaign) f.campaign = settings.campaign;
  if (num(settings.goal)) f.goal = num(settings.goal);
  if (settings.donateurl) f.donateUrl = settings.donateurl;
  if (settings.zelleinfo) f.zelleInfo = settings.zelleinfo;
  if (settings.note) f.note = settings.note;
  const keep = cats.filter(c => !/^adv(anced|\.)?\s*tuition$/i.test(String(c.label).trim()));
  if (keep.length) f.categories = keep;
  }
  f.donations = [];                      // never sourced from the public sheet
  out.fundraising = f;

  if (slides.length) {
    // The reflection slide is part of the display's purpose, so it is added when
    // the sheet's SLIDE rows never mention it. Put a row with NO in the Show
    // column to switch it off deliberately.
    if (!sawReflection) {
      const at = slides.findIndex(s => s.type === "announcements");
      slides.splice(at >= 0 ? at + 1 : slides.length, 0, { type: "reflection" });
    }
    // The fundraising, flier and milestone slides were merged into one milestone
    // slide. A sheet still listing "fundraising" gets the merged slide there.
    if ((baseCfg.slides || []).some(x => x.type === "milestone")) {
      for (let i = slides.length - 1; i >= 0; i--) if (slides[i].type === "milestone") slides.splice(i, 1);
      const at = slides.findIndex(x => x.type === "fundraising");
      const baseMs = (baseCfg.slides || []).find(x => x.type === "milestone") || {};
      if (at >= 0) slides[at] = { ...slides[at], type: "milestone", seconds: slides[at].seconds > 0 ? slides[at].seconds : baseMs.seconds };
      if (!mentioned.some(m => m.type === "fundraising" || m.type === "milestone")) slides.push({ ...baseMs });
      else if (at < 0 && mentioned.some(m => m.type === "milestone" && false)) {}
    }
    // content.js slides marked pinned (e.g. an event flier) always show, just
    // before the fundraising ask, unless the sheet already lists the same image.
    for (const base of ((baseCfg && baseCfg.slides) || []).filter(s => s.pinned)) {
      if (mentioned.some(m => base.src ? m.src === base.src : m.type === base.type)) continue;
      const at = slides.findIndex(s => s.type === "fundraising");
      slides.splice(at >= 0 ? at : slides.length, 0, base);
    }
    out.slides = slides;
  }
  if (reminders.length) out.reminders = reminders;
  if (num(settings.rotation)) out.rotationSeconds = num(settings.rotation);
  if (anns.length) out.announcements = anns;
  // Sheet HIJRI rows are MERGED with content.js anchors (deduped by date, sheet
  // wins on a shared date) — otherwise a sheet missing the newest sighting drags
  // the display back to last month.
  if (hijri.length) {
    const seen = {};
    const all = [...(baseCfg && baseCfg.hijriMonthStarts || []), ...hijri];
    for (const a of all) if (a && a.greg) seen[a.greg] = a;
    out.hijriMonthStarts = Object.keys(seen).sort().map(k => seen[k]);
  }
  if (events.length) {
    // Drop events whose date has already passed; keep the soonest four.
    const today = new Date(); today.setHours(0, 0, 0, 0);
    out.events = events
      .filter(e => { const d = new Date(e.raw + "T00:00:00"); return isNaN(d.getTime()) || d >= today; })
      .sort((x, y) => String(x.raw).localeCompare(String(y.raw)))
      .slice(0, 4)
      .map(e => ({ date: e.date, title: e.title }));
  }
  return out;
}

// Turns one SLIDE row into a slide object. Column F = YES/NO (blank means YES),
// column G = seconds on screen for this slide only (blank = the global setting).
// Row shape: SLIDE | type | title | source | options | show | seconds
function slideFromRow(r) {
  const kind = (r[1] || "").toLowerCase();
  const title = r[2] || "", source = r[3] || "", opts = r[4] || "", show = r[5] || "";
  if (/^no$/i.test(show)) return null;
  const secs = num(r[6]);
  const withSecs = (s) => { if (s && secs > 0) s.seconds = secs; return s; };

  if (kind === "welcome" || kind === "announcements" || kind === "fundraising" || kind === "reflection" || kind === "milestone")
    return withSecs({ type: kind });

  if (kind === "image") {
    if (!source) return null;
    return withSecs({ type: "image", title, src: source, caption: opts || undefined });
  }

  if (kind === "web") {
    if (!source) return null;
    const s = { type: "web", title, url: source, aspect: 1920 / 1080, zoom: 1 };
    // options cell accepts "1180x690" (render size) and/or "zoom 1.2"
    const size = opts.match(/(\d{3,5})\s*[x×]\s*(\d{3,5})/);
    if (size) { s.nw = +size[1]; s.nh = +size[2]; s.aspect = +size[1] / +size[2]; }
    const z = opts.match(/zoom\s*([\d.]+)/i);
    if (z && +z[1] > 0) s.zoom = +z[1];
    return withSecs(s);
  }

  if (kind === "grid") {
    const srcs = source.split(";").map(v => v.trim()).filter(Boolean);
    if (!srcs.length) return null;
    const caps = opts.split(";").map(v => v.trim());
    return withSecs({ type: "grid", title, images: srcs.map((src, i) => {
      const [cap, sub] = (caps[i] || "").split("—").map(v => (v || "").trim());
      return { src, caption: cap || undefined, subcaption: sub || undefined };
    }) });
  }

  // SLIDE | scope | title | image url | scope items (;) | show | secs | rooms (;) | caption
  if (kind === "scope") {
    const list = (v) => String(v || "").split(";").map(x => x.trim()).filter(Boolean);
    return withSecs({ type: "scope", title, src: source || undefined,
      items: list(opts), rooms: list(r[7]), caption: r[8] || undefined });
  }

  if (kind === "html") return source ? withSecs({ type: "html", title, html: source }) : null;
  return null;
}

// The last CSV that parsed cleanly is kept on the display machine, so a dropped
// connection (or a router reboot overnight) keeps showing the most recent
// fundraising totals instead of silently reverting to the numbers baked into
// content.js. Only the raw sheet text is stored — it is replayed through
// configFromCSV against the current content.js, so edits to this project still
// take effect while offline.
// The cache is stamped with the campaign id it belongs to. When a new campaign
// starts (content.js fundraising.id changes) the old campaign's cached totals
// are discarded rather than shown during the first offline moment.
const CACHE_KEY = "iabc.sheetCSV";

function readCache(campaignId) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (!o || typeof o.csv !== "string") return null;
    if (campaignId && o.campaignId !== campaignId) return null;
    return o;
  } catch (e) { return null; }
}

function writeCache(csv, campaignId) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ csv: csv, at: Date.now(), campaignId: campaignId || "" }));
  } catch (e) {}
}

// Fetches the sheet and returns a merged config. On any failure it falls back to
// the cached sheet, and only then to content.js.
async function loadSheetConfig(baseCfg) {
  const id = baseCfg.sheetId;
  if (!id) return baseCfg;
  const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&headers=0&t=${Date.now()}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const csv = await res.text();
    const patch = configFromCSV(csv, baseCfg);
    if (!patch) throw new Error("no usable rows");
    writeCache(csv, baseCfg.fundraising && baseCfg.fundraising.id);
    return { ...baseCfg, ...patch, sheetSource: "live", sheetAt: Date.now() };
  } catch (e) {
    const cached = readCache(baseCfg.fundraising && baseCfg.fundraising.id);
    if (cached) {
      const patch = configFromCSV(cached.csv, baseCfg);
      if (patch) {
        console.warn("[lobby] Google Sheet unavailable — using last saved copy:", e.message);
        return { ...baseCfg, ...patch, sheetSource: "cache", sheetAt: cached.at };
      }
    }
    console.warn("[lobby] Google Sheet unavailable — using content.js:", e.message);
    return { ...baseCfg, sheetSource: "local", sheetAt: null };
  }
}


window.IABC_SHEET = { parseCSV: parseCSV, configFromCSV: configFromCSV, loadSheetConfig: loadSheetConfig, readCache: readCache };
})();
