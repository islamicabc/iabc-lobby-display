(function () {
"use strict";
// NOTE: loaded as a PLAIN script (not an ES module) so the standalone
// single-file export can inline it. It publishes its data on window at the
// bottom of the file. Do not add "export" keywords back.
// ============================================================================
//  IABC LOBBY DISPLAY — CONTENT CONFIG
//  ---------------------------------------------------------------------------
//  This is the ONE file to edit for day-to-day changes. No code knowledge
//  needed — just change the text/numbers between the quotes.
//
//   • Change fundraising  -> edit the `fundraising` block (first one below).
//   • Add an announcement -> add an item to `announcements`.
//   • Add an event        -> add an item to `events`.
//   • Add a rotating slide -> add an item to `slides` (see the types below).
//   • Change how long each slide shows -> `rotationSeconds`.
//   • New Islamic month announced -> add a line to `hijriMonthStarts`.
//
//  Prayer times come from prayer-data.js (jamā'ah) and adhan-times.js
//  (adhān / prayer-beginning times) — those don't need routine edits.
// ============================================================================

const config = {

  // ---- LIVE CONTENT FROM GOOGLE SHEETS -------------------------------------
  //  The display reads the public "IABC Lobby Display — Content" sheet every
  //  few minutes and overlays fundraising totals, announcements, events and
  //  Hijri month starts on top of what's in this file. Everything below stays
  //  as the fallback — if the sheet is unreachable or a cell is broken, the
  //  display quietly uses these values instead.
  //  Set sheetId to "" to ignore the sheet entirely and use only this file.
  sheetId: "1fAtnWIXexnDhzWdJZtKw4EnWwlPL77yeIgYZ0h9kloM",
  sheetRefreshMinutes: 10,

  // How many seconds each rotating slide stays on screen.
  rotationSeconds: 10,

  // ==========================================================================
  //  ⬇⬇⬇  FUNDRAISING — THE ONLY NUMBERS YOU NEED TO TOUCH  ⬇⬇⬇
  //  --------------------------------------------------------------------------
  //  The pie chart, the percentage, the "$X to go" balance and the sidebar bar
  //  are ALL calculated from the four `amount` numbers below. You never compute
  //  a total or a balance yourself.
  //
  //  TO UPDATE AFTER A DONATION — pick either way:
  //
  //   (A) Simple: change the `amount` on the matching line.
  //       e.g. a $5,000 cash gift arrives → Cash 275570 becomes 280570.
  //
  //   (B) Keep a log: leave the amounts alone and add one line to `donations`
  //       at the bottom of this block:
  //          { amount: 5000, category: "Cash", from: "Ahmad family" },
  //       The chart adds it to that category automatically, and you keep a
  //       running record of who gave what.
  //
  //  Then save the file and reload the display. Nothing else to change.
  // ==========================================================================
  //  THE CURRENT CAMPAIGN. Live numbers come from the Google Sheet (SETTING
  //  Campaign / Goal / Note rows + CATEGORY rows). What is below is only the
  //  offline fallback, so keep the campaign name and goal in sync with the
  //  sheet and leave the amounts at 0 — the sheet supplies the real totals.
  //
  //  `id` identifies the campaign. Change it when a NEW campaign starts and the
  //  display throws away the cached totals from the previous one instead of
  //  briefly showing last campaign's numbers while offline.
  fundraising: {
    id:       "b4-interior-p1",
    campaign: "Building 4 Interior \u2014 Phase 1",
    goal:     500000,
    unit:     "$",
    note:     "Funding HVAC, plumbing, electrical, insulation, and Floor 1 finishing.",

    //  Small line above the pie crediting the phase that just finished.
    //  Set to "" to hide it.
    completedLine: "Previous phase complete: Building 4 Shell ($500K) \u2014 Jaz\u0101kum All\u0101hu khayran",

    //  What Phase 1 pays for. Shown as a list on the fundraising slide.
    scope: [
      { label: "HVAC systems (Floor 1)" },
      { label: "Rough plumbing" },
      { label: "Rough electrical" },
      { label: "Insulation" },
      { label: "Floor 1 finishing", sub: "Mu\u1e63all\u0101, bathrooms, cafeteria, gymnasium" },
    ],

    //  Surplus carried over from the previous campaign. Added into the Cash
    //  bucket, so it counts toward this campaign's total. Leave at 0 if the
    //  sheet's Cash row already includes it.
    carriedOver: 0,

    //  Interim target shown as its own pie on the graphics page. Same gifts,
    //  smaller goal, so progress reads clearly before the full campaign does.
    milestone: { goal: 250000, label: "September \u2013 December 2026",
      // Fundraising dinner from the flier, shown on the milestone slide.
      // Remove (or set to null) after the dinner.
      dinner: {
        title: "Fundraising Dinner",
        date: "Saturday, November 14, 2026",
        time: "4:45 PM (Maghrib)",
        speaker: "Sh. Karim Abu Zaid",
        speakerSub: "Imam, Colorado Muslim Community Center",
        place: "IABC Center \u00b7 613 Sunset Rd, Burlington, NJ",
        tickets: ["$50 per family", "$20 per person"],
        until: "2026-11-14",
      } },
    donateText: "Donate via Zelle OR",
    donateUrl:  "islamicabc.com/donate",
    zelleInfo:  "Zelle: donate@islamicabc.com",

    //  Amounts stay 0 here — the sheet's CATEGORY rows fill them in.
    categories: [
      { label: "Cash",             amount: 0, color: "#0f9d58" },
      { label: "Pledges",          amount: 0, color: "#3fb6e8" },
      { label: "Loans",            amount: 0, color: "#f28b20" },
    ],

    //  Balance (the red slice) = goal minus the amounts above. Automatic.
    balanceLabel: "Balance",
    balanceColor: "#b7c8d6",

    //  Optional running log of individual gifts (added on top of the amounts).
    donations: [
      // { amount: 1000, category: "Cash",    from: "The Rahman Family" },
    ],
  },

  // ---- CLOSED CAMPAIGNS (archive — nothing on screen reads these) ----------
  //  Kept so the final numbers are never lost. To bring one back on screen,
  //  copy its block over `fundraising` above (and clear the sheet's CATEGORY
  //  rows, or the sheet will overwrite the amounts again).
  pastCampaigns: [
    {
      id:       "building-4-shell",
      campaign: "Building #4 Shell",
      closed:   "2026-09-04",          // final numbers as of this date
      goal:     500000,
      unit:     "$",
      note:     "Help us complete the shell of Building #4 — the next phase of our campus.",
      categories: [
        { label: "Cash",             amount: 275570, color: "#0f9d58" },
        { label: "Pledges",          amount: 51177,  color: "#3fb6e8" },
        { label: "Advanced Tuition", amount: 111807, color: "#f4d924" },
        { label: "Loans",            amount: 10000,  color: "#f28b20" },
      ],
      balanceLabel: "Balance",
      balanceColor: "#e8362a",
    },
  ],

  // ---- ANNOUNCEMENTS -------------------------------------------------------
  // Shown as a rotating slide. Add / remove items freely.
  announcements: [
    { title: "New Building Under Construction",
      body: "Alhamdulillah — our new masjid & school building is taking shape. Watch this space for updates." },
    { title: "Classroom Seats Filling Fast",
      body: "Several grades are at or near capacity for 2026–2027. See the live seat availability on this screen." },
    { title: "Live Near the Masjid",
      body: "Homes for sale minutes from IABC. Pray every salah in congregation & raise your children among Muslims." },
  ],

  // ---- UPCOMING EVENTS (sidebar/strip) -------------------------------------
  events: [
    { date: "Wed, Aug 26", title: "First Day of School 2026–27" },
  ],

  // ---- REMINDER OF THE MOMENT (rotates in bottom strip) -------------------
  //  arabic       = the ayah/hadith in Arabic (shown large)
  //  text         = English translation
  //  source       = full reference in English
  //  sourceArabic = full reference in Arabic
  //
  //  48 reminders: 24 ayat and 24 ahadith, strictly alternating (ayah first),
  //  paired by theme so each ayah is followed by a hadith on the same subject.
  //  Written for EVERYONE who walks through the lobby -- students, parents,
  //  teachers, musallis, Jumu'ah congregants, visitors.
  //
  //  TWO RULES, PLEASE KEEP THEM:
  //   1. AHADITH MUST BE SAHIH -- graded sahih with no difference among the
  //      scholars of hadith. Most below are from Sahih al-Bukhari or Sahih
  //      Muslim, which need no grading note. Anything from the Sunan (Abu
  //      Dawud, Tirmidhi, Nasa'i, Ibn Majah) is included ONLY where the sahih
  //      grading is agreed upon, and its source line ends with "· Sahih" so the
  //      grading is visible on screen. If a narration is disputed -- hasan to
  //      one scholar and sahih to another -- leave it out, however famous it is.
  //   2. PARTIAL QUOTATIONS ARE MARKED WITH "..." on the side that is cut --
  //      at the start if the quote begins mid-verse or mid-hadith, at the end
  //      if it continues, on both sides if both. A quote with no "..." is the
  //      complete verse or the complete statement of the Prophet (peace be
  //      upon him). The Arabic and the English are marked to match.
  //  If you add one, add its pair too so the alternation holds.
  reminders: [
    // 1 -- ayah -- salah
    { arabic: "…إِنَّ الصَّلَاةَ تَنْهَىٰ عَنِ الْفَحْشَاءِ وَالْمُنْكَرِ…",
      text: "…Indeed, prayer restrains from immorality and wrongdoing…",
      source: "Qur'an — Al-'Ankabūt 29:45", sourceArabic: "سورة العنكبوت ٢٩:٤٥" },
    // 2 -- hadith -- salah
    { arabic: "…أَيُّ الْعَمَلِ أَحَبُّ إِلَى اللَّهِ؟ قَالَ: الصَّلاَةُ عَلَى وَقْتِهَا…",
      text: "…Which deed is most beloved to Allah? He said: Prayer at its proper time…",
      source: "Ṣaḥīḥ al-Bukhārī 527", sourceArabic: "صحيح البخاري ٥٢٧" },
    // 3 -- ayah -- knowledge
    { arabic: "…وَقُلْ رَبِّ زِدْنِي عِلْمًا",
      text: "…And say: My Lord, increase me in knowledge.",
      source: "Qur'an — Ṭā-Hā 20:114", sourceArabic: "سورة طه ٢٠:١١٤" },
    // 4 -- hadith -- knowledge
    { arabic: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ",
      text: "The best among you are those who learn the Qur'an and teach it.",
      source: "Ṣaḥīḥ al-Bukhārī 5027", sourceArabic: "صحيح البخاري ٥٠٢٧" },
    // 5 -- ayah -- parents
    { arabic: "وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ وَبِالْوَالِدَيْنِ إِحْسَانًا…",
      text: "Your Lord has decreed that you worship none but Him, and that you be good to parents…",
      source: "Qur'an — Al-Isrā' 17:23", sourceArabic: "سورة الإسراء ١٧:٢٣" },
    // 6 -- hadith -- mercy
    { arabic: "مَنْ لاَ يَرْحَمُ لاَ يُرْحَمُ",
      text: "Whoever shows no mercy will be shown no mercy.",
      source: "Ṣaḥīḥ al-Bukhārī 5997", sourceArabic: "صحيح البخاري ٥٩٩٧" },
    // 7 -- ayah -- brotherhood
    { arabic: "إِنَّمَا الْمُؤْمِنُونَ إِخْوَةٌ…",
      text: "The believers are but brothers…",
      source: "Qur'an — Al-Ḥujurāt 49:10", sourceArabic: "سورة الحجرات ٤٩:١٠" },
    // 8 -- hadith -- brotherhood
    { arabic: "لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
      text: "None of you truly believes until he loves for his brother what he loves for himself.",
      source: "Ṣaḥīḥ al-Bukhārī 13", sourceArabic: "صحيح البخاري ١٣" },
    // 9 -- ayah -- justice & excellence
    { arabic: "إِنَّ اللَّهَ يَأْمُرُ بِالْعَدْلِ وَالْإِحْسَانِ وَإِيتَاءِ ذِي الْقُرْبَىٰ…",
      text: "Indeed, Allah commands justice, excellence, and giving to relatives…",
      source: "Qur'an — An-Naḥl 16:90", sourceArabic: "سورة النحل ١٦:٩٠" },
    // 10 -- hadith -- character
    { arabic: "إِنَّ مِنْ أَخْيَرِكُمْ أَحْسَنَكُمْ أَخْلاَقًا",
      text: "Indeed, the best of you are those best in character.",
      source: "Ṣaḥīḥ al-Bukhārī 6035", sourceArabic: "صحيح البخاري ٦٠٣٥" },
    // 11 -- ayah -- patience
    { arabic: "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
      text: "O you who believe, seek help through patience and prayer. Indeed, Allah is with the patient.",
      source: "Qur'an — Al-Baqarah 2:153", sourceArabic: "سورة البقرة ٢:١٥٣" },
    // 12 -- hadith -- ease
    { arabic: "إِنَّ الدِّينَ يُسْرٌ…",
      text: "Indeed, this religion is ease…",
      source: "Ṣaḥīḥ al-Bukhārī 39", sourceArabic: "صحيح البخاري ٣٩" },
    // 13 -- ayah -- hardship
    { arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
      text: "Indeed, with hardship comes ease.",
      source: "Qur'an — Ash-Sharḥ 94:6", sourceArabic: "سورة الشرح ٩٤:٦" },
    // 14 -- hadith -- anger
    { arabic: "…أَوْصِنِي. قَالَ: لاَ تَغْضَبْ…",
      text: "…Advise me. He said: Do not become angry…",
      source: "Ṣaḥīḥ al-Bukhārī 6116", sourceArabic: "صحيح البخاري ٦١١٦" },
    // 15 -- ayah -- gratitude
    { arabic: "…لَئِنْ شَكَرْتُمْ لَأَزِيدَنَّكُمْ…",
      text: "…If you are grateful, I will surely increase you…",
      source: "Qur'an — Ibrāhīm 14:7", sourceArabic: "سورة إبراهيم ١٤:٧" },
    // 16 -- hadith -- charity
    { arabic: "مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ…",
      text: "Charity does not decrease wealth…",
      source: "Ṣaḥīḥ Muslim 2588", sourceArabic: "صحيح مسلم ٢٥٨٨" },
    // 17 -- ayah -- charity
    { arabic: "مَثَلُ الَّذِينَ يُنْفِقُونَ أَمْوَالَهُمْ فِي سَبِيلِ اللَّهِ كَمَثَلِ حَبَّةٍ أَنْبَتَتْ سَبْعَ سَنَابِلَ…",
      text: "The example of those who spend their wealth in the way of Allah is like a seed that grows seven spikes…",
      source: "Qur'an — Al-Baqarah 2:261", sourceArabic: "سورة البقرة ٢:٢٦١" },
    // 18 -- hadith -- ongoing charity
    { arabic: "إِذَا مَاتَ الإِنْسَانُ انْقَطَعَ عَنْهُ عَمَلُهُ إِلاَّ مِنْ ثَلاَثَةٍ إِلاَّ مِنْ صَدَقَةٍ جَارِيَةٍ أَوْ عِلْمٍ يُنْتَفَعُ بِهِ أَوْ وَلَدٍ صَالِحٍ يَدْعُو لَهُ",
      text: "When a person dies his deeds come to an end, except three: ongoing charity, knowledge benefited from, or a righteous child who prays for him.",
      source: "Ṣaḥīḥ Muslim 1631", sourceArabic: "صحيح مسلم ١٦٣١" },
    // 19 -- ayah -- the masjid
    { arabic: "إِنَّمَا يَعْمُرُ مَسَاجِدَ اللَّهِ مَنْ آمَنَ بِاللَّهِ وَالْيَوْمِ الْآخِرِ…",
      text: "The mosques of Allah are only to be maintained by those who believe in Allah and the Last Day…",
      source: "Qur'an — At-Tawbah 9:18", sourceArabic: "سورة التوبة ٩:١٨" },
    // 20 -- hadith -- community
    { arabic: "الْمُؤْمِنُ لِلْمُؤْمِنِ كَالْبُنْيَانِ يَشُدُّ بَعْضُهُ بَعْضًا",
      text: "The believer to the believer is like a building — each part strengthens the other.",
      source: "Ṣaḥīḥ al-Bukhārī 481", sourceArabic: "صحيح البخاري ٤٨١" },
    // 21 -- ayah -- cooperation
    { arabic: "…وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ…",
      text: "…And cooperate with one another in righteousness and piety…",
      source: "Qur'an — Al-Mā'idah 5:2", sourceArabic: "سورة المائدة ٥:٢" },
    // 22 -- hadith -- neighbors
    { arabic: "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيُكْرِمْ جَارَهُ",
      text: "Whoever believes in Allah and the Last Day, let him honor his neighbor.",
      source: "Ṣaḥīḥ al-Bukhārī 6019", sourceArabic: "صحيح البخاري ٦٠١٩" },
    // 23 -- ayah -- remembrance
    { arabic: "…أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
      text: "…Verily, in the remembrance of Allah do hearts find rest.",
      source: "Qur'an — Ar-Ra'd 13:28", sourceArabic: "سورة الرعد ١٣:٢٨" },
    // 24 -- hadith -- consistency
    { arabic: "أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ",
      text: "The most beloved of deeds to Allah are those done consistently, even if small.",
      source: "Ṣaḥīḥ al-Bukhārī 6464", sourceArabic: "صحيح البخاري ٦٤٦٤" },
    // 25 -- ayah -- du'a
    { arabic: "…ادْعُونِي أَسْتَجِبْ لَكُمْ…",
      text: "…Call upon Me; I will respond to you…",
      source: "Qur'an — Ghāfir 40:60", sourceArabic: "سورة غافر ٤٠:٦٠" },
    // 26 -- hadith -- seeking knowledge
    { arabic: "…وَمَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ…",
      text: "…Whoever treads a path in search of knowledge, Allah makes easy for him a path to Paradise…",
      source: "Ṣaḥīḥ Muslim 2699", sourceArabic: "صحيح مسلم ٢٦٩٩" },
    // 27 -- ayah -- taqwa
    { arabic: "…وَمَنْ يَتَّقِ اللَّهَ يَجْعَلْ لَهُ مَخْرَجًا",
      text: "…And whoever fears Allah — He will make for him a way out.",
      source: "Qur'an — Aṭ-Ṭalāq 65:2", sourceArabic: "سورة الطلاق ٦٥:٢" },
    // 28 -- hadith -- kindness
    { arabic: "كُلُّ مَعْرُوفٍ صَدَقَةٌ",
      text: "Every act of kindness is charity.",
      source: "Ṣaḥīḥ al-Bukhārī 6021", sourceArabic: "صحيح البخاري ٦٠٢١" },
    // 29 -- ayah -- hope in Allah's mercy
    { arabic: "…لَا تَقْنَطُوا مِنْ رَحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا…",
      text: "…Do not despair of the mercy of Allah. Indeed, Allah forgives all sins…",
      source: "Qur'an — Az-Zumar 39:53", sourceArabic: "سورة الزمر ٣٩:٥٣" },
    // 30 -- hadith -- speech
    { arabic: "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ",
      text: "Whoever believes in Allah and the Last Day, let him speak good or remain silent.",
      source: "Ṣaḥīḥ al-Bukhārī 6018", sourceArabic: "صحيح البخاري ٦٠١٨" },
    // 31 -- ayah -- true nobility
    { arabic: "…إِنَّ أَكْرَمَكُمْ عِنْدَ اللَّهِ أَتْقَاكُمْ…",
      text: "…Indeed, the most noble of you in the sight of Allah is the most righteous of you…",
      source: "Qur'an — Al-Ḥujurāt 49:13", sourceArabic: "سورة الحجرات ٤٩:١٣" },
    // 32 -- hadith -- what Allah looks at
    { arabic: "…إِنَّ اللَّهَ لاَ يَنْظُرُ إِلَى صُوَرِكُمْ وَأَمْوَالِكُمْ وَلَكِنْ يَنْظُرُ إِلَى قُلُوبِكُمْ وَأَعْمَالِكُمْ…",
      text: "…Allah does not look at your appearance or your wealth, but He looks at your hearts and your deeds…",
      source: "Ṣaḥīḥ Muslim 2564", sourceArabic: "صحيح مسلم ٢٥٦٤" },
    // 33 -- ayah -- every small deed counts
    { arabic: "فَمَنْ يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًا يَرَهُ",
      text: "So whoever does an atom's weight of good will see it.",
      source: "Qur'an — Az-Zalzalah 99:7", sourceArabic: "سورة الزلزلة ٩٩:٧" },
    // 34 -- hadith -- what fills the scale
    { arabic: "…وَالْحَمْدُ لِلَّهِ تَمْلَأُ الْمِيزَانَ…",
      text: "…And 'al-ḥamdu lillāh' fills the scale…",
      source: "Ṣaḥīḥ Muslim 223", sourceArabic: "صحيح مسلم ٢٢٣" },
    // 35 -- ayah -- knowledge and awe of Allah
    { arabic: "…إِنَّمَا يَخْشَى اللَّهَ مِنْ عِبَادِهِ الْعُلَمَاءُ…",
      text: "…It is only those with knowledge among His servants who stand in awe of Allah…",
      source: "Qur'an — Fāṭir 35:28", sourceArabic: "سورة فاطر ٣٥:٢٨" },
    // 36 -- hadith -- understanding of the religion
    { arabic: "مَنْ يُرِدِ اللَّهُ بِهِ خَيْرًا يُفَقِّهْهُ فِي الدِّينِ",
      text: "Whoever Allah intends good for, He gives him understanding of the religion.",
      source: "Ṣaḥīḥ al-Bukhārī 71", sourceArabic: "صحيح البخاري ٧١" },
    // 37 -- ayah -- gentleness
    { arabic: "…فَبِمَا رَحْمَةٍ مِنَ اللَّهِ لِنْتَ لَهُمْ…",
      text: "…So by mercy from Allah, you were gentle with them…",
      source: "Qur'an — Āli 'Imrān 3:159", sourceArabic: "سورة آل عمران ٣:١٥٩" },
    // 38 -- hadith -- sincere counsel
    { arabic: "الدِّينُ النَّصِيحَةُ…",
      text: "The religion is sincere counsel…",
      source: "Ṣaḥīḥ Muslim 55", sourceArabic: "صحيح مسلم ٥٥" },
    // 39 -- ayah -- no soul is overburdened
    { arabic: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا…",
      text: "Allah does not burden a soul beyond that it can bear…",
      source: "Qur'an — Al-Baqarah 2:286", sourceArabic: "سورة البقرة ٢:٢٨٦" },
    // 40 -- hadith -- do what you are able
    { arabic: "…وَإِذَا أَمَرْتُكُمْ بِأَمْرٍ فَأْتُوا مِنْهُ مَا اسْتَطَعْتُمْ",
      text: "…And when I command you with something, do of it as much as you are able.",
      source: "Ṣaḥīḥ al-Bukhārī 7288", sourceArabic: "صحيح البخاري ٧٢٨٨" },
    // 41 -- ayah -- mercy
    { arabic: "…إِنَّ رَحْمَةَ اللَّهِ قَرِيبٌ مِنَ الْمُحْسِنِينَ",
      text: "…Indeed, the mercy of Allah is near to those who do good.",
      source: "Qur'an — Al-A'rāf 7:56", sourceArabic: "سورة الأعراف ٧:٥٦" },
    // 42 -- hadith -- mercy
    { arabic: "الرَّاحِمُونَ يَرْحَمُهُمُ الرَّحْمَنُ ارْحَمُوا مَنْ فِي الأَرْضِ يَرْحَمْكُمْ مَنْ فِي السَّمَاءِ",
      text: "The merciful are shown mercy by the Most Merciful. Be merciful to those on the earth, and the One in the heaven will be merciful to you.",
      source: "Sunan Abī Dāwūd 4941 · Ṣaḥīḥ", sourceArabic: "سنن أبي داود ٤٩٤١ · صحيح" },
    // 43 -- ayah -- character
    { arabic: "وَإِنَّكَ لَعَلَىٰ خُلُقٍ عَظِيمٍ",
      text: "And indeed, you are of a great moral character.",
      source: "Qur'an — Al-Qalam 68:4", sourceArabic: "سورة القلم ٦٨:٤" },
    // 44 -- hadith -- character
    { arabic: "مَا مِنْ شَيْءٍ أَثْقَلُ فِي الْمِيزَانِ مِنْ حُسْنِ الْخُلُقِ",
      text: "Nothing is heavier on the scale than good character.",
      source: "Sunan Abī Dāwūd 4799 · Ṣaḥīḥ", sourceArabic: "سنن أبي داود ٤٧٩٩ · صحيح" },
    // 45 -- ayah -- parents
    { arabic: "وَاخْفِضْ لَهُمَا جَنَاحَ الذُّلِّ مِنَ الرَّحْمَةِ…",
      text: "And lower to them the wing of humility out of mercy…",
      source: "Qur'an — Al-Isrā' 17:24", sourceArabic: "سورة الإسراء ١٧:٢٤" },
    // 46 -- hadith -- young and old
    { arabic: "لَيْسَ مِنَّا مَنْ لَمْ يَرْحَمْ صَغِيرَنَا وَيَعْرِفْ شَرَفَ كَبِيرِنَا",
      text: "He is not one of us who does not show mercy to our young and know the honor due to our elders.",
      source: "Sunan Abī Dāwūd 4943 · Ṣaḥīḥ", sourceArabic: "سنن أبي داود ٤٩٤٣ · صحيح" },
    // 47 -- ayah -- gratitude
    { arabic: "…أَنِ اشْكُرْ لِي وَلِوَالِدَيْكَ…",
      text: "…Be grateful to Me and to your parents…",
      source: "Qur'an — Luqmān 31:14", sourceArabic: "سورة لقمان ٣١:١٤" },
    // 48 -- hadith -- gratitude
    { arabic: "مَنْ لَا يَشْكُرُ النَّاسَ لَا يَشْكُرُ اللَّهَ",
      text: "Whoever does not thank people does not thank Allah.",
      source: "Sunan Abī Dāwūd 4811 · Ṣaḥīḥ", sourceArabic: "سنن أبي داود ٤٨١١ · صحيح" },
  ],

  // ---- WEATHER (auto, no key needed) — Burlington, NJ ----------------------
  weather: { lat: 40.0715, lon: -74.8646, label: "Burlington, NJ" },

  // ---- HIJRI CALENDAR (moon-sighting based) --------------------------------
  //  The Hijri date on screen is anchored to CONFIRMED moon sightings, NOT a
  //  fixed arithmetic calendar. Source: Central Hilal Committee of North
  //  America (hilalcommittee.org) / Chicago Hilal (chicagohilal.org).
  //
  //  EACH MONTH, when the committee announces the new month, add ONE line
  //  below: the Gregorian date the Islamic month STARTED, its name, and the
  //  Hijri year. The display counts forward from the most recent entry, so
  //  the date stays correct as long as you keep this list up to date.
  hijriMonthStarts: [
    { greg: "2026-06-16", label: "Muharram", labelAr: "محرم", year: 1448 },
    { greg: "2026-07-16", label: "Safar",    labelAr: "صفر",  year: 1448 },
    // Hilal sighted the evening of Aug 13, 2026 → 1 Rabī' al-Awwal = Aug 14.
    { greg: "2026-08-14", label: "Rabī' al-Awwal", labelAr: "ربيع الأول", year: 1448 },
    // Sighted the evening of Sep 12, 2026 → 1 Rabī' ath-Thānī = Sep 13.
    { greg: "2026-09-13", label: "Rabī' ath-Thānī", labelAr: "ربيع الثاني", year: 1448 },
    // { greg: "2026-08-15", label: "Rabiʻ al-Awwal", labelAr: "ربيع الأول", year: 1448 },
  ],

  // ---- ROTATING SLIDES -----------------------------------------------------
  //  Each slide is one object. Reorder / add / remove freely.
  //  Types:
  //    { type:"welcome" }                         intro / logo splash
  //    { type:"announcements" }                   pulls from `announcements` above
  //    { type:"fundraising" }                     big thermometer + donate QR
  //    { type:"image",  title, src, caption }     a full picture (put file in assets/)
  //    { type:"gallery", title, images:[...] }    slideshow of pictures
  //    { type:"web",    title, url, aspect }      LIVE website, refreshed each time
  //                                               aspect = width/height of the page
  //    { type:"html",   title, html }             any custom HTML you paste in
  slides: [
    // Fundraiser-only for now. Reflections rotate in the bottom strip instead.
    // { type: "welcome" },
    // { type: "image", title: "Live Steps from the Masjid", src: "assets/homes-near-masjid.png" },
    // The one fundraising slide: $250K milestone + $500K goal + scope + dinner.
    // A sheet "SLIDE | fundraising" row shows this same slide.
    { type: "milestone", seconds: 40 },
  ],
};


window.IABC_CONTENT = { config: config };
})();
