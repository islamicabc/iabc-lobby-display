// Shared fundraising rendering — ONE source of truth for the donut, the legend
// pills, the donate box and the full lobby slide. Both "Lobby Display.dc.html"
// and "Fundraising Graphics.dc.html" render from here, so a change to the slide
// shows up on the TV, in the shareable pie and in the shareable slide at once.
// Also holds the day/night colour tokens, so the exported graphics use exactly
// the palette the lobby screen uses.
(function () {
  // Inline var() references, matching the display's own palette object.
  const P = {
    ink: "var(--ink,#e9f1f7)", muted: "var(--muted,#8fa7bb)", ink5: "var(--ink5,#c4e4ff)",
    blue: "var(--blue,#52a6dc)", blueLt: "var(--blueLt,#7cc6ee)", gold: "var(--gold,#d8b25a)",
    line: "var(--line2,rgba(255,255,255,.09))", surf: "var(--surf2,rgba(255,255,255,.05))",
  };

  // Explicit night tokens (rather than relying on the inline var() fallbacks) so
  // the dark theme can be pushed harder than the original muted values.
  const NIGHT = { "--page":"#000d1c", "--bg1":"#00244a", "--bg2":"#005c9c", "--sidebar":"rgba(0,16,34,.54)",
    "--ink":"#ffffff", "--ink2":"#ffffff", "--ink3":"#e4f3ff", "--ink5":"#c4e4ff",
    "--muted":"#7dc2f5", "--muted2":"#9ad6ff", "--muted3":"#6ab4ee",
    "--blue":"#1aa7ff", "--blueLt":"#63ccff", "--gold":"#ffc61a", "--goldLt":"#ffd95c", "--goldDk":"#e5a800",
    "--red":"#ff6252", "--surf1":"rgba(0,145,255,.16)", "--surf2":"rgba(0,160,255,.21)",
    "--line1":"rgba(64,180,255,.36)", "--line2":"rgba(64,180,255,.36)", "--line3":"rgba(64,180,255,.24)",
    "--track":"rgba(0,22,46,.60)",
    "--dot":"rgba(120,200,255,.55)", "--hair":"rgba(64,180,255,.38)",
    "--green":"#22ff92", "--greenLn":"#00f279", "--greenBg":"rgba(0,242,121,.15)",
    "--nextCard":"rgba(0,150,255,.30)", "--nextLn":"rgba(26,167,255,.78)",
    "--rowHi":"rgba(0,160,255,.34)", "--rowHiLn":"rgba(26,167,255,.85)",
    "--chgText":"#ffd95c", "--chgHotText":"#fff3c2", "--chgBg":"rgba(255,198,26,.16)", "--chgHotBg":"rgba(255,150,40,.30)",
    "--chgChipBg":"rgba(255,198,26,.22)", "--chgChipLn":"rgba(255,198,26,.75)",
    "--chgHotChipBg":"rgba(255,160,50,.38)", "--chgHotChipLn":"rgba(255,205,90,.95)" };

  // Day theme: background is the logo blue #2a6ba4,
  // flat rather than gradient. Panels stay near-white with near-black ink.
  const DAY = { "--page":"#215a8c", "--bg1":"#215a8c", "--bg2":"#215a8c", "--sidebar":"rgba(255,255,255,.60)",
    "--ink":"#001427", "--ink2":"#000a14", "--ink3":"#002744", "--ink5":"#003a63",
    "--muted":"#00325a", "--muted2":"#003f6f", "--muted3":"#004d87",
    "--blue":"#00325a", "--blueLt":"#001f3a", "--gold":"#a06400", "--goldLt":"#c07a00", "--goldDk":"#845200",
    "--red":"#cc1100", "--surf1":"rgba(255,255,255,.56)", "--surf2":"rgba(255,255,255,.80)",
    "--line1":"rgba(0,90,160,.42)", "--line2":"rgba(0,90,160,.42)", "--line3":"rgba(0,90,160,.26)",
    "--track":"rgba(0,90,160,.24)",
    "--dot":"rgba(0,90,160,.50)", "--hair":"rgba(0,90,160,.44)",
    "--green":"#00764a", "--greenLn":"#00a866", "--greenBg":"rgba(0,168,102,.18)",
    "--nextCard":"rgba(255,255,255,.86)", "--nextLn":"rgba(0,114,198,.70)",
    "--rowHi":"rgba(255,255,255,.96)", "--rowHiLn":"rgba(0,114,198,.72)",
    "--chgText":"#7a3d00", "--chgHotText":"#8f1d00", "--chgBg":"rgba(255,196,84,.42)", "--chgHotBg":"rgba(255,140,90,.46)",
    "--chgChipBg":"rgba(255,196,84,.50)", "--chgChipLn":"rgba(150,80,0,.55)",
    "--chgHotChipBg":"rgba(255,150,95,.55)", "--chgHotChipLn":"rgba(150,40,0,.65)" };

  // Category totals with logged individual gifts folded in, plus the Balance slice.
  function slices(f) {
    const gifts = Array.isArray(f.donations) ? f.donations : [];
    const cats = (f.categories || []).map(c => ({
      label: c.label, color: c.color,
      amount: (Number(c.amount) || 0) + gifts.filter(g => g.category === c.label).reduce((s, g) => s + (Number(g.amount) || 0), 0),
    }));
    const loose = gifts.filter(g => !cats.some(c => c.label === g.category)).reduce((s, g) => s + (Number(g.amount) || 0), 0);
    if (cats.length && loose) cats[0].amount += loose;
    // Surplus carried over from the closed campaign lands in Cash.
    const carried = Number(f.carriedOver) || 0;
    if (carried) { const cash = cats.find(c => /cash/i.test(c.label)) || cats[0]; if (cash) cash.amount += carried; }
    cats.forEach(c => { c.amount = Math.round(c.amount); });
    const raised = cats.reduce((s, c) => s + c.amount, 0);
    const balance = Math.round(Math.max(0, f.goal - raised));
    return { cats, raised, balance, all: balance > 0 ? [...cats, { label: f.balanceLabel || "Balance", color: f.balanceColor || "#e8362a", amount: balance, isBalance: true }] : cats };
  }

  function donut(h, sl, total, size, center, hole, shadow) {
    const R = size / 2 - 6, RI = R * (hole || 0.6), cx = size / 2, cy = size / 2;
    const pt = (ang, rad) => [cx + rad * Math.cos(ang), cy + rad * Math.sin(ang)];
    const GAP = 0.014;   // radians of breathing room between slices
    let a0 = -Math.PI / 2;
    const arcs = [], pcts = [];
    sl.forEach((s, i) => {
      const frac = total ? s.amount / total : 0, a1 = a0 + frac * Math.PI * 2;
      const b0 = a0 + GAP / 2, b1 = Math.max(b0 + 0.001, a1 - GAP / 2), large = (b1 - b0) > Math.PI ? 1 : 0;
      const [ox0, oy0] = pt(b0, R), [ox1, oy1] = pt(b1, R), [ix1, iy1] = pt(b1, RI), [ix0, iy0] = pt(b0, RI);
      arcs.push(h("path", { key: "a" + i,
        d: `M ${ox0} ${oy0} A ${R} ${R} 0 ${large} 1 ${ox1} ${oy1} L ${ix1} ${iy1} A ${RI} ${RI} 0 ${large} 0 ${ix0} ${iy0} Z`,
        fill: s.color, opacity: 1 }));
      if (frac >= .075 && !s.isBalance) {
        const [lx, ly] = pt((b0 + b1) / 2, (R + RI) / 2);
        pcts.push(h("text", { key: "p" + i, x: lx, y: ly, textAnchor: "middle", dominantBaseline: "middle",
          fontSize: Math.round(size * 0.044), fontWeight: 800, fill: s.color === "#f4d924" ? "#5a4a00" : "#fff" }, Math.round(frac * 100) + "%"));
      }
      a0 = a1;
    });
    return h("div", { style: { position: "relative", width: size, height: size, flex: "none" } },
      h("svg", { viewBox: `0 0 ${size} ${size}`, width: size, height: size, style: { display: "block", filter: shadow || "drop-shadow(0 10px 22px rgba(0,0,0,.45))" } },
        h("circle", { cx, cy, r: (R + RI) / 2, fill: "none", stroke: "var(--surf2,rgba(255,255,255,.05))", strokeWidth: R - RI }),
        arcs, pcts),
      h("div", { style: { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", pointerEvents: "none" } }, center));
  }

  // RAISED / $total / of goal / % funded — the block that sits inside the ring.
  function centerBlock(h, f, sl, scale) {
    const k = scale || 1, pct = Math.min(100, (sl.raised / f.goal) * 100);
    return [
      h("div", { key: "a", style: { fontSize: 14 * k, letterSpacing: 2.5 * k + "px", color: P.muted, fontWeight: 700 } }, "RAISED"),
      h("div", { key: "b", style: { fontSize: 58 * k, fontWeight: 800, color: P.gold, fontVariantNumeric: "tabular-nums", marginTop: 6 * k, lineHeight: 1, letterSpacing: -1.5 * k + "px" } }, f.unit + Math.round(sl.raised).toLocaleString()),
      h("div", { key: "c", style: { fontSize: 21 * k, color: P.muted, marginTop: 8 * k } }, "of " + f.unit + Math.round(f.goal).toLocaleString()),
      h("div", { key: "d", style: { fontSize: 27 * k, fontWeight: 800, color: "var(--green,#9fe3bb)", marginTop: 10 * k } }, Math.round(pct) + "% funded"),
    ];
  }

  // The amount pills that sit beside the donut.
  function legend(h, sl, scale, grid) {
    const k = scale || 1;
    return h("div", { style: grid ? { display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 8 * k, width: "100%" } : { display: "flex", flexDirection: "column", gap: 13 * k, minWidth: 340 * k } },
      sl.all.map((s, i) => h("div", { key: i, style: { display: "flex", alignItems: "center", gap: 14 * k, padding: 11 * k + "px " + 16 * k + "px", borderRadius: 11 * k,
          background: s.isBalance ? "var(--red,#e8362a)" : "var(--surf2,rgba(255,255,255,.05))", border: s.isBalance ? "1px solid var(--red,#e8362a)" : "1px solid var(--line1,rgba(255,255,255,.08))", boxShadow: s.isBalance ? "0 " + 4 * k + "px " + 16 * k + "px rgba(0,0,0,.28)" : "none" } },
        h("div", { style: { width: 13 * k, height: 30 * k, borderRadius: 3 * k, background: s.isBalance ? "#ffffff" : s.color, flex: "none" } }),
        h("div", { style: { fontSize: 23 * k, fontWeight: s.isBalance ? 800 : 600, color: s.isBalance ? "#ffffff" : P.ink, flex: 1 } }, s.label),
        h("div", { style: { fontSize: (s.isBalance ? 28 : 25) * k, fontWeight: 800, color: s.isBalance ? "#ffffff" : P.ink, fontVariantNumeric: "tabular-nums" } }, "$" + s.amount.toLocaleString()))));
  }

  // Donut + pills, the pairing used on the slide and shared as its own graphic.
  // The centre type scales with the ring, so the total can never outgrow the hole.
  function pie(h, f, size, scale) {
    const sl = slices(f), d = size || 500, k = scale || d / 500;
    const ring = sl.raised > 0 ? sl.all : [];
    // f.stack: legend as a 2-column grid under the donut (narrow columns).
    return h("div", { style: { display: "flex", flexDirection: f.stack ? "column" : "row", alignItems: "center", gap: (f.stack ? 14 : 28) * k, flex: "none", width: f.stack ? "100%" : undefined } },
      donut(h, ring, f.goal, d, centerBlock(h, f, sl, k * (f.centerScale || 1)), f.hole), legend(h, sl, f.stack ? (f.legendScale || k) : k, !!f.stack));
  }

  // The sidebar thermometer: campaign + %, segmented bar, totals, colour chips.
  // Mirrors the markup in the lobby sidebar so the shared graphic is identical.
  function thermometer(h, f, scale) {
    const k = scale || 1, sl = slices(f), pct = Math.min(100, (sl.raised / f.goal) * 100);
    const money = (n) => n >= 1000 ? f.unit + Math.round(n / 1000) + "k" : f.unit + n.toLocaleString();
    const chips = sl.cats.map(c => ({ label: c.label, amount: money(c.amount), color: c.color }))
      .concat([{ label: f.balanceLabel || "Balance", amount: money(sl.balance), color: "var(--hair,rgba(255,255,255,.14))" }]);
    return h("div", { style: { background: "var(--surf2,rgba(255,255,255,.05))", border: "1px solid var(--line1,rgba(255,255,255,.08))", borderRadius: 12 * k, padding: 15 * k + "px " + 17 * k + "px" } },
      h("div", { style: { display: "flex", alignItems: "baseline", justifyContent: "space-between" } },
        h("span", { style: { fontSize: 15 * k, fontWeight: 700, color: P.ink } }, f.campaign),
        h("span", { style: { fontSize: 17 * k, fontWeight: 800, color: P.gold } }, Math.round(pct) + "%")),
      h("div", { style: { display: "flex", height: 13 * k, borderRadius: 7 * k, background: "var(--track,rgba(255,255,255,.1))", margin: 9 * k + "px 0 " + 7 * k + "px", overflow: "hidden" } },
        sl.cats.map((c, i) => h("div", { key: i, style: { height: "100%", width: ((c.amount / f.goal) * 100) + "%", background: c.color } }))),
      h("div", { style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 * k } },
        h("span", { style: { fontSize: 13 * k, color: P.muted } }, f.unit + sl.raised.toLocaleString() + " of " + f.unit + f.goal.toLocaleString()),
        h("span", { style: { fontSize: 13 * k, fontWeight: 700, color: P.ink5 } }, f.unit + sl.balance.toLocaleString() + " to go")),
      h("div", { style: { display: "flex", flexWrap: "wrap", gap: 4 * k + "px " + 12 * k + "px", marginTop: 9 * k, paddingTop: 8 * k, borderTop: "1px solid var(--line2,rgba(255,255,255,.09))" } },
        chips.map((c, i) => h("div", { key: i, style: { display: "flex", alignItems: "center", gap: 5 * k } },
          h("span", { style: { width: 8 * k, height: 8 * k, borderRadius: 2 * k, background: c.color, flex: "none" } }),
          h("span", { style: { fontSize: 11.5 * k, color: P.muted } }, c.label),
          h("span", { style: { fontSize: 11.5 * k, color: "var(--ink3,#cfdae4)", fontWeight: 700, fontVariantNumeric: "tabular-nums" } }, c.amount)))));
  }

  function donateBox(h, f, scale) {
    const k = scale || 1;
    return h("div", { style: { border: 4 * k + "px solid var(--greenLn,#5fd08a)", borderRadius: 14 * k, padding: 22 * k + "px " + 34 * k + "px", textAlign: "center", background: "var(--greenBg,rgba(95,208,138,.07))" } },
      h("div", { style: { fontFamily: "'Marcellus',serif", fontSize: 36 * k, lineHeight: 1.3 } }, f.donateText || "Donate via Zelle OR"),
      h("div", { style: { fontFamily: "'Marcellus',serif", fontSize: 36 * k, lineHeight: 1.3 } },
        "at ", h("span", { style: { textDecoration: "underline", color: "var(--green,#9fe3bb)" } }, f.donateUrl || "islamicabc.com/donate"), "!"),
      f.zelleInfo && h("div", { style: { fontSize: 19 * k, color: P.muted, marginTop: 10 * k } }, f.zelleInfo),
      h("div", { style: { fontSize: 26 * k, fontWeight: 600, color: P.ink5, marginTop: 14 * k, paddingTop: 12 * k, borderTop: "1px solid var(--line2,rgba(255,255,255,.14))", lineHeight: 1.35 } },
        f.pledgeText || "Already pledged? Please fulfill your pledge \u2014 the work continues only as the pledges come in."));
  }

  // What Phase 1 pays for, in the slot the note text used to occupy.
  function scopeList(h, f, scale) {
    const k = scale || 1, items = Array.isArray(f.scope) ? f.scope : [];
    if (!items.length) return h("div", { style: { fontSize: 19 * k, lineHeight: 1.35, color: P.muted, textWrap: "pretty" } }, f.note);
    return h("div", { style: { display: "flex", flexDirection: "column", gap: 7 * k, flex: "1 1 auto", minWidth: 250 * k } },
      h("div", { style: { fontSize: 15 * k, letterSpacing: 2 * k + "px", fontWeight: 800, color: P.gold } }, "THIS PHASE FUNDS"),
      items.map((s, i) => h("div", { key: i, style: { display: "flex", gap: 9 * k, alignItems: "flex-start" } },
        h("span", { style: { width: 7 * k, height: 7 * k, borderRadius: "50%", background: P.gold, flex: "none", marginTop: 8 * k } }),
        h("div", { style: { minWidth: 0 } },
          h("div", { style: { fontSize: 21 * k, fontWeight: 600, color: P.ink, lineHeight: 1.25 } }, s.label),
          s.sub && h("div", { style: { fontSize: 17 * k, color: P.ink5, lineHeight: 1.3, textWrap: "pretty" } }, s.sub)))));
  }

  // All four renderings ride along on the fundraising slide — the money and
  // what it builds belong on the same screen.
  const SHOTS = [
    { src: "assets/b4-floor1.png", cap: "Floor 1 \u00b7 Men's Musall\u0101, Gymnasium, & Cafeteria" },
  ];

  // The complete lobby fundraising slide. Donut is the hero on the left; the
  // four renderings stack down the right.
  //
  // Everything is expressed as a multiple of `scale`, which defaults to the
  // 1080px-tall lobby stage. The shareable export renders the same slide into a
  // shorter box, so it passes a smaller scale rather than letting a fixed-size
  // stack overflow and paint over the title.
  function slide(h, f, asset, scale) {
    const src = asset || ((s) => s), k = scale || 1;
    return h("div", { style: { display: "flex", gap: 30 * k, width: "100%", height: "100%", alignItems: "center", overflow: "hidden" } },
      h("div", { style: { flex: "1 1 0", minWidth: 0, height: "100%", minHeight: 0, display: "flex", flexDirection: "column", gap: 22 * k, alignItems: "center", justifyContent: "center", paddingBottom: 10 * k, overflow: "hidden" } },
        f.completedLine && h("div", { style: { flex: "none", alignSelf: "center", fontSize: 16 * k, fontWeight: 700, color: "var(--green,#9fe3bb)", background: "var(--greenBg,rgba(95,208,138,.07))",
          border: "1px solid var(--greenLn,#5fd08a)", borderRadius: 999, padding: 6 * k + "px " + 18 * k + "px", textWrap: "pretty", textAlign: "center" } }, f.completedLine),
        pie(h, f, Math.round(500 * k)),
        h("div", { style: { display: "flex", alignItems: "center", gap: 22 * k, flex: "none", justifyContent: "center", alignSelf: "stretch", minWidth: 0 } },
          h("div", { style: { flex: "0 1 auto", minWidth: 0 } }, donateBox(h, f, k)),
          h("div", { style: { display: "flex", alignItems: "center", gap: 16 * k, flex: "0 0 auto" } },
            h("div", { style: { background: "#fff", borderRadius: 12 * k, padding: 8 * k, flex: "none" } }, h("img", { src: src("assets/qr-donate.png"), style: { width: 112 * k, height: 112 * k, display: "block" } }))))),
      // Column width and the per-tile height cap both follow the number of
      // renderings, so a single plan grows into the space three tiles used.
      h("div", { style: { flex: "none", width: (SHOTS.length > 1 ? 250 : 390) * k, height: "100%", display: "flex", flexDirection: "column", gap: 14 * k, justifyContent: "center", overflow: "hidden" } },
        // Each slot is sized BY its image (height auto), so the caption sits
        // directly under the picture instead of under an empty contain-fit box.
        SHOTS.map((s, i) => h("div", { key: i, style: { flex: "0 1 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 * k } },
          h("img", { src: src(s.src), style: { width: "100%", height: "auto", maxHeight: (SHOTS.length > 1 ? 255 : 760) * k, objectFit: "contain", borderRadius: 8 * k, display: "block" } }),
          h("div", { style: { fontSize: (SHOTS.length > 1 ? 15 : 19) * k, color: P.ink5, textAlign: "center", textWrap: "pretty", flex: "none" } }, s.cap))),
        // Scope of work reads as a caption to the plan it describes.
        h("div", { style: { flex: "none", marginTop: 6 * k } }, scopeList(h, f, k))));
  }

  window.IABC_FUND = { P, DAY, NIGHT, slices, donut, centerBlock, legend, pie, thermometer, donateBox, scopeList, slide, SHOTS };
})();
