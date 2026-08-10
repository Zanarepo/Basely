2. The Verdict: The "Linear-Asana-Notion Hybrid"Don't clone just one. The modern high-converting standard combines Linear’s micro-interactions, Notion’s modular sectioning, and Asana’s conversion structure.Here is the exact structural blueprint to build:[ TOP NAV: Minimal logo + "Sign In" + High-contrast Primary CTA ]
                         │
[ SECTION 1: THE HYBRID HERO ] ──► (Linear Aesthetic + Notion Tabs)
                         │
[ SECTION 2: TRUST & PROOF ]   ──► (Asana Grid Strategy)
                         │
[ SECTION 3: BENTO FEATURE GRID ] ► (Linear Dark / Notion Modular Layout)
                         │
[ SECTION 4: INTERACTIVE DEMO ] ──► (Linear Micro-UI + Asana Use Cases)
                         │
[ SECTION 5: PRICING & FINAL CTA ]
3. Best Components to IncorporateA. Steal from Linear: The Hero Section & Micro-UIDark Mode Hero Frame: Use dark background aesthetics (#0B0C10 or #08090A) paired with subtle glowing borders. This creates focus around your product UI.  Shortcut Teaser / Micro-Animations: Show tiny, isolated actions (e.g., press Cmd + K, auto-triage an issue, or drag a card). Visualizing speed builds trust faster than reading paragraphs.Bento Grid Layout: For feature highlights, avoid standard 3-column text blocks. Build a Bento Box (asymmetrical grid boxes with mixed visual components).B. Steal from Notion: The Interactive Feature SwitcherModular Tab Switcher: Build an interactive tab component directly below the main header:[ For Ops ] | [ For Devs ] | [ For Managers ]Clicking a tab swaps out the embedded app screenshot smoothly without page reloads. This keeps the page clean while demonstrating versatility.Warmth through Accent Details: Add subtle hand-drawn icons or warm badges alongside clean typography so dark mode doesn't feel sterile.C. Steal from Asana: Conversion Architecture & Trust SignalsHigh-Contrast "Floating" CTA Bar: Asana excels at persistent CTAs. Keep a "Start Free Trial" button locked to the header or floating at the bottom on mobile.  Quantitative Proof Cards: Match feature claims directly with impact metrics (e.g., "Reduce sprint overhead by 40%" or "Set up in under 5 minutes").Technical Stack RecommendationTo achieve this exact visual fidelity without sacrificing performance:Framework: Next.js (React) or WebflowStyling: Tailwind CSS (built-in utilities for glowing borders, dark mode switches, and responsive bento grids)Animations: Framer Motion (for Linear-style micro-interactions and smooth scroll-triggered entrances)Component Kit: Radix UI / Shadcn (for clean tab switchers, dialogs, and tooltips)

<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Waymark — The project platform that shows its work</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"></script>
<style>
  :root{
    --void:#0A0B0F;
    --surface:#13151B;
    --surface-2:#181B22;
    --line:#23262F;
    --ink:#E7E9EE;
    --muted:#8A8F9C;
    --signal:#57E6C8;
    --signal-dim:#2E7D6E;
    --amber:#F5A623;
  }
  *{box-sizing:border-box}
  html,body{background:var(--void);color:var(--ink);font-family:'Inter',sans-serif;margin:0;padding:0;}
  .font-display{font-family:'Space Grotesk',sans-serif;}
  .font-mono{font-family:'JetBrains Mono',monospace;}
  .text-signal{color:var(--signal);}
  .bg-void{background:var(--void);}
  .bg-surface{background:var(--surface);}
  .bg-surface-2{background:var(--surface-2);}
  .border-line{border-color:var(--line);}
  .text-muted{color:var(--muted);}
  .text-ink{color:var(--ink);}
  .glow-border{
    border:1px solid var(--line);
    box-shadow: 0 0 0 1px rgba(87,230,200,0.04), 0 0 60px -20px rgba(87,230,200,0.25);
  }
  .glow-border:hover{
    border-color: rgba(87,230,200,0.35);
    box-shadow: 0 0 0 1px rgba(87,230,200,0.08), 0 0 80px -15px rgba(87,230,200,0.35);
  }
  .btn-primary{
    background:var(--signal);
    color:#04342C;
    font-weight:600;
    transition: transform .15s ease, box-shadow .15s ease;
  }
  .btn-primary:hover{ transform: translateY(-1px); box-shadow: 0 8px 24px -8px rgba(87,230,200,0.5); }
  .btn-primary:active{ transform: translateY(0); }
  .btn-ghost{
    border:1px solid var(--line);
    color:var(--ink);
    transition: border-color .15s ease, background .15s ease;
  }
  .btn-ghost:hover{ border-color:#3a3e4a; background: rgba(255,255,255,0.02); }
  .tab-btn{
    color:var(--muted);
    border-bottom: 2px solid transparent;
    transition: color .2s ease, border-color .2s ease;
  }
  .tab-btn.active{ color:var(--ink); border-color:var(--signal); }
  .fade-panel{ transition: opacity .35s ease, transform .35s ease; }
  .fade-hidden{ opacity:0; transform: translateY(6px); position:absolute; pointer-events:none; }
  .fade-shown{ opacity:1; transform: translateY(0); position:relative; }
  .reveal{ opacity:0; transform: translateY(18px); transition: opacity .6s ease, transform .6s ease; }
  .reveal.in{ opacity:1; transform: translateY(0); }
  .kbd{
    font-family:'JetBrains Mono',monospace;
    background:#1D2028;
    border:1px solid #2C303B;
    border-bottom-width:2px;
    border-radius:6px;
    padding:2px 8px;
    font-size:12px;
    color:var(--muted);
  }
  .cp-node{ fill:var(--surface-2); stroke:var(--line); stroke-width:1.5; }
  .cp-node.crit{ stroke:var(--amber); }
  .cp-line{ stroke:var(--line); stroke-width:2; fill:none; }
  .cp-line.crit{
    stroke:var(--signal);
    stroke-dasharray: 240;
    stroke-dashoffset: 240;
    animation: draw 2.8s ease forwards 0.3s;
  }
  @keyframes draw{ to{ stroke-dashoffset:0; } }
  .pulse-dot{ animation: pulse 2s ease-in-out infinite; }
  @keyframes pulse{ 0%,100%{opacity:1;} 50%{opacity:.35;} }
  .row-highlight{ background: rgba(87,230,200,0.06); border-color: rgba(87,230,200,0.25) !important; }
  ::selection{ background: rgba(87,230,200,0.3); color:#fff; }
  .mobile-cta{ display:none; }
  @media (max-width: 767px){
    .mobile-cta{ display:flex; }
  }
</style>
</head>
<body class="bg-void">

<nav class="fixed top-0 left-0 right-0 z-50 border-b border-line bg-void/85" style="backdrop-filter: blur(10px);">
  <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="9" fill="none" stroke="#57E6C8" stroke-width="2"/><circle cx="11" cy="11" r="2.5" fill="#57E6C8"/></svg>
      <span class="font-display font-semibold text-lg tracking-tight">Waymark</span>
    </div>
    <div class="hidden md:flex items-center gap-8 text-sm text-muted">
      <a href="#product" class="hover:text-ink transition">Product</a>
      <a href="#proof" class="hover:text-ink transition">Customers</a>
      <a href="#pricing" class="hover:text-ink transition">Pricing</a>
    </div>
    <div class="flex items-center gap-3">
      <a href="#" class="hidden sm:block text-sm text-muted hover:text-ink transition">Sign in</a>
      <a href="#pricing" class="btn-primary text-sm px-4 py-2 rounded-lg">Start free</a>
    </div>
  </div>
</nav>

<section class="pt-40 pb-20 px-6" id="product">
  <div class="max-w-4xl mx-auto text-center mb-14 reveal" id="hero-copy">
    <div class="inline-flex items-center gap-2 text-xs font-mono text-muted border border-line rounded-full px-3 py-1 mb-6">
      <span class="w-1.5 h-1.5 rounded-full bg-signal pulse-dot"></span>
      Now with automatic critical-path detection
    </div>
    <h1 class="font-display text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.08] mb-6">
      Every plan has a critical path.<br class="hidden sm:block"> Most tools just don't <span class="text-signal">show it to you.</span>
    </h1>
    <p class="text-muted text-lg max-w-2xl mx-auto leading-relaxed mb-9">
      Waymark builds the schedule, the budget, and the risk register from the same work breakdown —
      so when one thing slips, you see exactly what it moves. No spreadsheet reconciliation. No surprise at status meeting.
    </p>
    <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
      <a href="#pricing" class="btn-primary text-sm px-6 py-3 rounded-lg w-full sm:w-auto text-center">Start free — no card required</a>
      <a href="#demo" class="btn-ghost text-sm px-6 py-3 rounded-lg w-full sm:w-auto text-center">Watch the schedule engine work</a>
    </div>
  </div>

  <div class="max-w-5xl mx-auto rounded-2xl glow-border bg-surface p-1.5 reveal">
    <div class="rounded-xl bg-surface-2 border border-line overflow-hidden">
      <div class="flex items-center gap-1.5 px-4 py-3 border-b border-line">
        <span class="w-2.5 h-2.5 rounded-full bg-[#3a3e4a]"></span>
        <span class="w-2.5 h-2.5 rounded-full bg-[#3a3e4a]"></span>
        <span class="w-2.5 h-2.5 rounded-full bg-[#3a3e4a]"></span>
        <span class="ml-3 text-xs font-mono text-muted">waymark.app / atlas-migration / schedule</span>
      </div>
      <div class="p-6 md:p-10">
        <svg viewBox="0 0 760 220" class="w-full h-auto">
          <line x1="40" y1="40" x2="40" y2="200" class="cp-line" stroke="#1c1f27"/>
          <line x1="40" y1="200" x2="720" y2="200" class="cp-line" stroke="#1c1f27"/>
          <path d="M 60 170 L 190 170 L 190 110 L 340 110 L 340 60 L 500 60 L 500 130 L 660 130" class="cp-line crit"/>
          <path d="M 60 170 L 190 170 L 190 150 L 300 150 L 300 175 L 420 175 L 420 155 L 550 155" class="cp-line" opacity="0.55"/>
          <circle cx="60" cy="170" r="7" class="cp-node crit"/>
          <circle cx="190" cy="110" r="7" class="cp-node crit"/>
          <circle cx="340" cy="60" r="7" class="cp-node crit"/>
          <circle cx="500" cy="130" r="7" class="cp-node crit"/>
          <circle cx="660" cy="130" r="7" class="cp-node crit"/>
          <text x="60" y="195" font-family="JetBrains Mono" font-size="10" fill="#8A8F9C">Discovery</text>
          <text x="175" y="195" font-family="JetBrains Mono" font-size="10" fill="#8A8F9C">Data model</text>
          <text x="310" y="45" font-family="JetBrains Mono" font-size="10" fill="#8A8F9C">Migration</text>
          <text x="470" y="195" font-family="JetBrains Mono" font-size="10" fill="#8A8F9C">QA cutover</text>
          <text x="610" y="115" font-family="JetBrains Mono" font-size="10" fill="#F5A623">Go-live · at risk</text>
        </svg>
        <div class="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 pt-4 border-t border-line text-xs font-mono">
          <span class="flex items-center gap-2 text-muted"><span class="w-2 h-2 rounded-full bg-signal"></span>Critical path — 0 days float</span>
          <span class="flex items-center gap-2 text-muted"><span class="w-2 h-2 rounded-full" style="background:#3a3e4a"></span>Non-critical — 6 days float</span>
          <span class="ml-auto text-amber-400">Slip on "Migration" delays go-live by 4 days</span>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="px-6 pb-4">
  <div class="max-w-3xl mx-auto reveal">
    <div class="flex justify-center gap-1 border-b border-line mb-10">
      <button class="tab-btn active px-5 py-3 text-sm font-medium" data-tab="pm">For project managers</button>
      <button class="tab-btn px-5 py-3 text-sm font-medium" data-tab="pmo">For PMOs</button>
      <button class="tab-btn px-5 py-3 text-sm font-medium" data-tab="agency">For agencies</button>
    </div>
  </div>
  <div class="max-w-5xl mx-auto relative" style="min-height:280px;" id="tab-frame">

    <div class="fade-panel fade-shown grid md:grid-cols-2 gap-8 items-center" data-panel="pm">
      <div>
        <p class="font-mono text-xs text-signal mb-3">01 — SINGLE-PROJECT VIEW</p>
        <h3 class="font-display text-2xl font-semibold mb-3">Build the plan once. Watch it stay correct.</h3>
        <p class="text-muted leading-relaxed">Your WBS, schedule, and budget share one spine. Move a task, and cost, float, and risk recalculate before you've released the mouse.</p>
      </div>
      <div class="rounded-xl bg-surface border border-line p-5">
        <div class="flex items-center justify-between text-xs font-mono text-muted mb-3">
          <span>Budget baseline</span><span class="text-signal">CPI 1.04</span>
        </div>
        <div class="space-y-2">
          <div class="h-2 rounded-full bg-surface-2 overflow-hidden"><div class="h-full bg-signal" style="width:72%"></div></div>
          <div class="h-2 rounded-full bg-surface-2 overflow-hidden"><div class="h-full bg-signal" style="width:88%"></div></div>
          <div class="h-2 rounded-full bg-surface-2 overflow-hidden"><div class="h-full" style="width:45%; background:#F5A623"></div></div>
        </div>
      </div>
    </div>

    <div class="fade-panel fade-hidden grid md:grid-cols-2 gap-8 items-center" data-panel="pmo">
      <div>
        <p class="font-mono text-xs text-signal mb-3">02 — PORTFOLIO VIEW</p>
        <h3 class="font-display text-2xl font-semibold mb-3">Know which of your 40 projects need you today.</h3>
        <p class="text-muted leading-relaxed">One RAG rollup across every project in the workspace, sorted by the ones actually slipping — not the ones with the loudest status report.</p>
      </div>
      <div class="rounded-xl bg-surface border border-line p-5 space-y-2">
        <div class="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-surface-2"><span>Atlas migration</span><span class="w-2 h-2 rounded-full" style="background:#e24b4a"></span></div>
        <div class="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-surface-2"><span>Vendor onboarding</span><span class="w-2 h-2 rounded-full" style="background:#F5A623"></span></div>
        <div class="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-surface-2"><span>Q3 platform refresh</span><span class="w-2 h-2 rounded-full bg-signal"></span></div>
      </div>
    </div>

    <div class="fade-panel fade-hidden grid md:grid-cols-2 gap-8 items-center" data-panel="agency">
      <div>
        <p class="font-mono text-xs text-signal mb-3">03 — CLIENT-FACING</p>
        <h3 class="font-display text-2xl font-semibold mb-3">Status reports your client didn't have to ask for.</h3>
        <p class="text-muted leading-relaxed">Auto-generated from live schedule and budget data, exportable to PDF, with sign-off links clients can approve without a login.</p>
      </div>
      <div class="rounded-xl bg-surface border border-line p-5">
        <div class="flex items-center gap-2 text-xs font-mono text-muted mb-3"><i></i>Status_Report_Week32.pdf</div>
        <div class="space-y-2 text-sm text-muted">
          <div class="flex justify-between"><span>Schedule health</span><span class="text-signal">On track</span></div>
          <div class="flex justify-between"><span>Budget variance</span><span class="text-signal">+2.1%</span></div>
          <div class="flex justify-between"><span>Open risks</span><span>2 high</span></div>
        </div>
      </div>
    </div>

  </div>
</section>

<section class="px-6 py-24" id="proof">
  <div class="max-w-6xl mx-auto">
    <p class="text-center text-xs font-mono text-muted mb-8 reveal">TRUSTED BY DELIVERY TEAMS AT</p>
    <div class="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 mb-20 opacity-50 reveal">
      <span class="font-display font-semibold text-lg">Northbeam</span>
      <span class="font-display font-semibold text-lg">Calder & Vine</span>
      <span class="font-display font-semibold text-lg">Ashgrove</span>
      <span class="font-display font-semibold text-lg">Reliant Partners</span>
      <span class="font-display font-semibold text-lg">Marrow Studio</span>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="rounded-xl bg-surface border border-line p-6 reveal">
        <p class="font-display text-3xl font-semibold text-signal mb-1">38%</p>
        <p class="text-sm text-muted">fewer missed baselines in the first quarter of use</p>
      </div>
      <div class="rounded-xl bg-surface border border-line p-6 reveal">
        <p class="font-display text-3xl font-semibold text-signal mb-1">&lt;5 min</p>
        <p class="text-sm text-muted">to import a WBS and get a working critical path</p>
      </div>
      <div class="rounded-xl bg-surface border border-line p-6 reveal">
        <p class="font-display text-3xl font-semibold text-signal mb-1">0</p>
        <p class="text-sm text-muted">spreadsheets required to reconcile schedule and budget</p>
      </div>
      <div class="rounded-xl bg-surface border border-line p-6 reveal">
        <p class="font-display text-3xl font-semibold text-signal mb-1">100%</p>
        <p class="text-sm text-muted">of generated reports match live project data, always</p>
      </div>
    </div>
  </div>
</section>

<section class="px-6 py-8">
  <div class="max-w-6xl mx-auto">
    <div class="max-w-xl mb-14 reveal">
      <p class="font-mono text-xs text-signal mb-3">EVERYTHING RUNS ON ONE WBS</p>
      <h2 class="font-display text-3xl md:text-4xl font-semibold tracking-tight">One work breakdown. Every downstream number stays correct.</h2>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-6 gap-4">

      <div class="md:col-span-4 rounded-2xl bg-surface border border-line p-7 reveal">
        <p class="font-display text-lg font-semibold mb-2">Critical path scheduling</p>
        <p class="text-muted text-sm mb-5 max-w-md">Full forward/backward pass CPM engine. Float, dependencies, and baselines recalculate live — no manual trigger, ever.</p>
        <svg viewBox="0 0 400 90" class="w-full">
          <line x1="10" y1="70" x2="90" y2="70" class="cp-line crit" stroke-dasharray="0" style="animation:none"/>
          <line x1="90" y1="70" x2="90" y2="30" class="cp-line crit" stroke-dasharray="0" style="animation:none"/>
          <line x1="90" y1="30" x2="220" y2="30" class="cp-line crit" stroke-dasharray="0" style="animation:none"/>
          <line x1="220" y1="30" x2="220" y2="55" class="cp-line crit" stroke-dasharray="0" style="animation:none"/>
          <line x1="220" y1="55" x2="380" y2="55" class="cp-line crit" stroke-dasharray="0" style="animation:none"/>
          <circle cx="10" cy="70" r="5" class="cp-node crit"/><circle cx="90" cy="30" r="5" class="cp-node crit"/>
          <circle cx="220" cy="55" r="5" class="cp-node crit"/><circle cx="380" cy="55" r="5" class="cp-node crit"/>
        </svg>
      </div>

      <div class="md:col-span-2 rounded-2xl bg-surface border border-line p-7 reveal">
        <p class="font-display text-lg font-semibold mb-2">Budget, live</p>
        <p class="text-muted text-sm mb-5">CPI, SPI, and EAC calculated from real actuals, not last month's export.</p>
        <div class="font-mono text-2xl text-signal">1.06 <span class="text-sm text-muted">CPI</span></div>
      </div>

      <div class="md:col-span-2 rounded-2xl bg-surface border border-line p-7 reveal">
        <p class="font-display text-lg font-semibold mb-2">RACI, enforced</p>
        <p class="text-muted text-sm mb-4">Every work package flagged the moment it has no owner.</p>
        <div class="grid grid-cols-4 gap-1">
          <div class="h-6 rounded bg-signal/20 border border-signal/40"></div>
          <div class="h-6 rounded bg-signal/20 border border-signal/40"></div>
          <div class="h-6 rounded" style="background:rgba(226,75,74,0.15); border:1px solid rgba(226,75,74,0.4)"></div>
          <div class="h-6 rounded bg-signal/20 border border-signal/40"></div>
        </div>
      </div>

      <div class="md:col-span-4 rounded-2xl bg-surface border border-line p-7 reveal">
        <p class="font-display text-lg font-semibold mb-2">Documents that write themselves</p>
        <p class="text-muted text-sm mb-5 max-w-md">Charter, WBS dictionary, status reports, closure docs — generated from live data, never hand-assembled.</p>
        <div class="flex gap-3">
          <span class="text-xs font-mono px-3 py-1.5 rounded-full border border-line text-muted">Charter.pdf</span>
          <span class="text-xs font-mono px-3 py-1.5 rounded-full border border-line text-muted">Status_report.docx</span>
          <span class="text-xs font-mono px-3 py-1.5 rounded-full border border-line text-muted">Closure_report.pdf</span>
        </div>
      </div>

      <div class="md:col-span-3 rounded-2xl bg-surface border border-line p-7 reveal">
        <p class="font-display text-lg font-semibold mb-2">SSO and audit, structurally enforced</p>
        <p class="text-muted text-sm">SAML/OAuth, approval workflows, and an append-only audit log — not a checkbox, a database guarantee.</p>
      </div>

      <div class="md:col-span-3 rounded-2xl bg-surface border border-line p-7 reveal">
        <p class="font-display text-lg font-semibold mb-2">Portfolio dashboards</p>
        <p class="text-muted text-sm">Every project's RAG status rolled up, sorted by what's actually at risk.</p>
      </div>

    </div>
  </div>
</section>

<section class="px-6 py-24" id="demo">
  <div class="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
    <div class="reveal">
      <p class="font-mono text-xs text-signal mb-3">SPEED IS THE FEATURE</p>
      <h2 class="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-5">Every action is one keystroke away.</h2>
      <p class="text-muted leading-relaxed mb-8">No modal maze. No five-click hierarchy. Waymark is built for people who plan for a living and don't want to fight the tool while they do it.</p>
      <div class="space-y-3">
        <div class="flex items-center gap-4 rounded-lg border border-line px-4 py-3">
          <span class="kbd">⌘K</span><span class="text-sm text-muted">Jump to any project, task, or report</span>
        </div>
        <div class="flex items-center gap-4 rounded-lg border border-line px-4 py-3">
          <span class="kbd">⌘⏎</span><span class="text-sm text-muted">Save a baseline and log it, instantly</span>
        </div>
        <div class="flex items-center gap-4 rounded-lg border border-line px-4 py-3">
          <span class="kbd">R</span><span class="text-sm text-muted">Open the risk register from anywhere</span>
        </div>
      </div>
    </div>
    <div class="rounded-2xl glow-border bg-surface p-6 reveal">
      <div class="rounded-lg bg-surface-2 border border-line p-3 mb-3 flex items-center gap-2">
        <i class="text-muted text-sm">⌘K</i>
        <span class="text-sm text-muted font-mono">reschedule migration...</span>
      </div>
      <div class="space-y-1" id="palette-rows">
        <div class="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm border border-transparent" data-row><span>Move "Data migration" +3 days</span><span class="text-xs text-muted font-mono">↵</span></div>
        <div class="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm border border-transparent" data-row><span>Reassign to critical resource</span><span class="text-xs text-muted font-mono">↵</span></div>
        <div class="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm border border-transparent" data-row><span>Notify affected owners</span><span class="text-xs text-muted font-mono">↵</span></div>
      </div>
    </div>
  </div>
</section>

<section class="px-6 py-24" id="pricing">
  <div class="max-w-6xl mx-auto">
    <div class="text-center max-w-xl mx-auto mb-14 reveal">
      <p class="font-mono text-xs text-signal mb-3">PRICING</p>
      <h2 class="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-3">Start free. Pay for what your team actually needs.</h2>
      <p class="text-muted">Every tier unlocks the next layer of the same platform — nothing is re-priced, only added.</p>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="rounded-2xl border border-line bg-surface p-6 reveal">
        <p class="font-mono text-xs text-muted mb-2">FREE</p>
        <p class="font-display text-3xl font-semibold mb-1">$0</p>
        <p class="text-xs text-muted mb-6">up to 3 users</p>
        <ul class="text-sm text-muted space-y-2 mb-8">
          <li>WBS + CPM schedule</li>
          <li>1 active project</li>
          <li>Gantt export</li>
        </ul>
        <a href="#" class="btn-ghost block text-center text-sm py-2.5 rounded-lg">Start free</a>
      </div>
      <div class="rounded-2xl border border-line bg-surface p-6 reveal">
        <p class="font-mono text-xs text-muted mb-2">STARTER</p>
        <p class="font-display text-3xl font-semibold mb-1">$9<span class="text-sm text-muted font-normal">/user/mo</span></p>
        <p class="text-xs text-muted mb-6">unlimited projects</p>
        <ul class="text-sm text-muted space-y-2 mb-8">
          <li>Budget + EVM engine</li>
          <li>RACI + risk register</li>
          <li>Unlimited projects</li>
        </ul>
        <a href="#" class="btn-ghost block text-center text-sm py-2.5 rounded-lg">Start free trial</a>
      </div>
      <div class="rounded-2xl p-6 relative" style="border:1px solid var(--signal); background:linear-gradient(180deg, rgba(87,230,200,0.06), transparent);">
        <span class="absolute -top-3 left-6 text-xs font-mono px-2 py-0.5 rounded-full bg-signal text-[#04342C] font-semibold">Most popular</span>
        <p class="font-mono text-xs text-muted mb-2">BUSINESS</p>
        <p class="font-display text-3xl font-semibold mb-1">$19<span class="text-sm text-muted font-normal">/user/mo</span></p>
        <p class="text-xs text-muted mb-6">for growing teams</p>
        <ul class="text-sm text-muted space-y-2 mb-8">
          <li>Auto-generated documents</li>
          <li>Dashboards + reporting</li>
          <li>Comments + notifications</li>
        </ul>
        <a href="#" class="btn-primary block text-center text-sm py-2.5 rounded-lg">Start free trial</a>
      </div>
      <div class="rounded-2xl border border-line bg-surface p-6 reveal">
        <p class="font-mono text-xs text-muted mb-2">ENTERPRISE</p>
        <p class="font-display text-3xl font-semibold mb-1">Custom</p>
        <p class="text-xs text-muted mb-6">for PMOs at scale</p>
        <ul class="text-sm text-muted space-y-2 mb-8">
          <li>SSO + approval workflows</li>
          <li>Audit log + custom templates</li>
          <li>API + ERP integration</li>
        </ul>
        <a href="#" class="btn-ghost block text-center text-sm py-2.5 rounded-lg">Talk to sales</a>
      </div>
    </div>
  </div>
</section>

<section class="px-6 py-24">
  <div class="max-w-3xl mx-auto text-center reveal">
    <h2 class="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-5">Stop finding out about the slip after it happens.</h2>
    <a href="#" class="btn-primary inline-block text-sm px-8 py-3.5 rounded-lg">Start free — no card required</a>
  </div>
</section>

<footer class="border-t border-line px-6 py-10">
  <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
    <span>© 2026 Waymark. All rights reserved.</span>
    <div class="flex gap-6">
      <a href="#" class="hover:text-ink">Privacy</a>
      <a href="#" class="hover:text-ink">Terms</a>
      <a href="#" class="hover:text-ink">Status</a>
    </div>
  </div>
</footer>

<div class="mobile-cta fixed bottom-0 left-0 right-0 z-50 p-3 bg-void border-t border-line items-center gap-3">
  <a href="#pricing" class="btn-primary flex-1 text-center text-sm py-3 rounded-lg">Start free — no card required</a>
</div>

<script>
  const tabs = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('[data-panel]');
  tabs.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      tabs.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.tab;
      panels.forEach(p=>{
        if(p.dataset.panel === target){
          p.classList.remove('fade-hidden'); p.classList.add('fade-shown');
        } else {
          p.classList.remove('fade-shown'); p.classList.add('fade-hidden');
        }
      });
    });
  });

  const rows = document.querySelectorAll('#palette-rows [data-row]');
  let i = 0;
  setInterval(()=>{
    rows.forEach(r=>r.classList.remove('row-highlight'));
    rows[i % rows.length].classList.add('row-highlight');
    i++;
  }, 1400);

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); } });
  }, {threshold:0.15});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
</script>

</body>
</html>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>The Sprint Cohort 2.0 — Learn PM by Shipping</title>
<style>
  :root{
    /* ---- Tokens ---- */
    --bg-base: #0B0C10;
    --bg-elevated: #14161C;
    --bg-elevated-2: #1B1E26;
    --border-hair: #262933;
    --border-glow: rgba(255,176,32,0.35);
    --border-glow-blue: rgba(110,134,255,0.35);
    --text-primary: #F3F4F6;
    --text-secondary: #9AA0AC;
    --text-tertiary: #5C6270;
    --accent-amber: #FFB020;
    --accent-amber-soft: rgba(255,176,32,0.12);
    --accent-blue: #6E86FF;
    --accent-blue-soft: rgba(110,134,255,0.12);
    --accent-green: #3ECF8E;

    --font-display: 'Space Grotesk', -apple-system, sans-serif;
    --font-body: 'Inter', -apple-system, sans-serif;
    --font-mono: 'IBM Plex Mono', 'Courier New', monospace;

    --radius-sm: 8px;
    --radius-md: 14px;
    --radius-lg: 22px;
    --max-width: 1160px;
  }

  @font-face{ font-family:'Space Grotesk'; src: local('Space Grotesk'); }

  *{ box-sizing:border-box; margin:0; padding:0; }
  html{ scroll-behavior:smooth; }
  body{
    background:var(--bg-base);
    color:var(--text-primary);
    font-family:var(--font-body);
    line-height:1.5;
    -webkit-font-smoothing:antialiased;
    overflow-x:hidden;
  }
  a{ color:inherit; text-decoration:none; }
  ul{ list-style:none; }
  img{ max-width:100%; display:block; }
  .wrap{ max-width:var(--max-width); margin:0 auto; padding:0 28px; }
  ::selection{ background:var(--accent-amber-soft); color:var(--accent-amber); }
  :focus-visible{ outline:2px solid var(--accent-amber); outline-offset:3px; }

  h1,h2,h3,h4{ font-family:var(--font-display); font-weight:600; letter-spacing:-0.02em; color:var(--text-primary); }

  .eyebrow{
    font-family:var(--font-mono);
    font-size:12px;
    letter-spacing:0.14em;
    text-transform:uppercase;
    color:var(--accent-amber);
    display:flex;
    align-items:center;
    gap:8px;
    margin-bottom:16px;
  }
  .eyebrow::before{ content:''; width:6px; height:6px; border-radius:50%; background:var(--accent-amber); box-shadow:0 0 8px var(--accent-amber); }

  /* ---------------- NAV ---------------- */
  header.nav{
    position:sticky; top:0; z-index:100;
    background:rgba(11,12,16,0.78);
    backdrop-filter:blur(14px);
    border-bottom:1px solid var(--border-hair);
  }
  .nav-inner{ display:flex; align-items:center; justify-content:space-between; height:72px; }
  .logo{ display:flex; align-items:center; gap:10px; font-family:var(--font-display); font-weight:700; font-size:18px; letter-spacing:-0.01em; }
  .logo-mark{
    width:28px; height:28px; border-radius:7px;
    background:linear-gradient(135deg, var(--accent-amber), #C97A17);
    display:flex; align-items:center; justify-content:center;
    font-family:var(--font-mono); font-size:13px; font-weight:700; color:#0B0C10;
  }
  .nav-right{ display:flex; align-items:center; gap:22px; }
  .nav-signin{ font-size:14px; color:var(--text-secondary); transition:color .2s; }
  .nav-signin:hover{ color:var(--text-primary); }
  .btn{
    font-family:var(--font-body); font-weight:600; font-size:14px;
    padding:10px 18px; border-radius:9px; border:1px solid transparent;
    cursor:pointer; transition:transform .15s ease, box-shadow .2s ease, background .2s ease;
    display:inline-flex; align-items:center; gap:8px; white-space:nowrap;
  }
  .btn-primary{
    background:var(--accent-amber); color:#0B0C10;
    box-shadow:0 0 0 1px rgba(255,176,32,0.4), 0 6px 20px -6px rgba(255,176,32,0.55);
  }
  .btn-primary:hover{ transform:translateY(-1px); box-shadow:0 0 0 1px rgba(255,176,32,0.6), 0 10px 26px -6px rgba(255,176,32,0.7); }
  .btn-ghost{
    background:transparent; border:1px solid var(--border-hair); color:var(--text-primary);
  }
  .btn-ghost:hover{ border-color:var(--text-tertiary); }

  /* ---------------- HERO ---------------- */
  section.hero{
    position:relative;
    padding:96px 0 60px;
    text-align:center;
    overflow:hidden;
  }
  .hero-glow{
    position:absolute; top:-260px; left:50%; transform:translateX(-50%);
    width:900px; height:520px;
    background:radial-gradient(ellipse at center, rgba(255,176,32,0.14), transparent 65%);
    pointer-events:none;
  }
  .hero h1{
    font-size:56px; line-height:1.06; max-width:820px; margin:0 auto 20px;
  }
  .hero h1 .hl{ color:var(--accent-amber); }
  .hero p.sub{
    font-size:18px; color:var(--text-secondary); max-width:560px; margin:0 auto 34px;
  }
  .hero-ctas{ display:flex; gap:14px; justify-content:center; margin-bottom:56px; }
  .btn-lg{ padding:13px 24px; font-size:15px; border-radius:10px; }

  /* Tab switcher */
  .switcher{
    display:inline-flex; gap:4px; padding:4px;
    background:var(--bg-elevated); border:1px solid var(--border-hair);
    border-radius:11px; margin-bottom:34px;
  }
  .switcher button{
    font-family:var(--font-body); font-size:13.5px; font-weight:600;
    padding:9px 16px; border-radius:8px; border:none; background:transparent;
    color:var(--text-secondary); cursor:pointer; transition:all .2s ease;
  }
  .switcher button.active{ background:var(--bg-elevated-2); color:var(--text-primary); box-shadow:0 0 0 1px var(--border-hair); }
  .switcher button:hover:not(.active){ color:var(--text-primary); }

  /* Hero product frame */
  .hero-frame{
    max-width:880px; margin:0 auto;
    border-radius:var(--radius-lg);
    border:1px solid var(--border-glow);
    background:linear-gradient(180deg, var(--bg-elevated) 0%, #101218 100%);
    box-shadow:0 0 0 1px rgba(255,176,32,0.08), 0 40px 100px -40px rgba(0,0,0,0.9), 0 0 60px -10px rgba(255,176,32,0.10);
    padding:22px;
    text-align:left;
    position:relative;
  }
  .frame-topbar{ display:flex; align-items:center; gap:8px; margin-bottom:16px; padding-bottom:14px; border-bottom:1px solid var(--border-hair); }
  .dot{ width:9px; height:9px; border-radius:50%; }
  .dot.r{ background:#FF5F57; } .dot.y{ background:#FEBC2E; } .dot.g{ background:#28C840; }
  .frame-title{ margin-left:10px; font-family:var(--font-mono); font-size:12px; color:var(--text-tertiary); }

  .doc-panel{ display:grid; grid-template-columns:1fr 260px; gap:20px; min-height:230px; }
  .doc-main{ font-family:var(--font-mono); font-size:13px; color:var(--text-secondary); }
  .doc-main .doc-title{ font-family:var(--font-display); font-size:17px; color:var(--text-primary); margin-bottom:4px; font-weight:600; }
  .doc-main .doc-sub{ color:var(--text-tertiary); margin-bottom:16px; font-size:12px; }
  .type-line{ min-height:20px; white-space:pre-wrap; }
  .cursor{ display:inline-block; width:7px; height:14px; background:var(--accent-amber); vertical-align:middle; animation:blink 1s steps(1) infinite; margin-left:2px; }
  @keyframes blink{ 50%{ opacity:0; } }

  .status-badge{
    display:inline-flex; align-items:center; gap:6px; font-family:var(--font-mono); font-size:11px;
    padding:5px 10px; border-radius:20px; margin-top:18px; font-weight:600; letter-spacing:0.03em;
    transition:all .3s ease;
  }
  .status-badge.draft{ background:rgba(154,160,172,0.12); color:var(--text-secondary); }
  .status-badge.review{ background:var(--accent-blue-soft); color:var(--accent-blue); }
  .status-badge.approved{ background:rgba(62,207,142,0.12); color:var(--accent-green); }

  .side-mock{ display:flex; flex-direction:column; gap:10px; }
  .mock-card{ background:var(--bg-elevated-2); border:1px solid var(--border-hair); border-radius:10px; padding:12px; }
  .mock-card .mc-label{ font-family:var(--font-mono); font-size:10px; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.06em; margin-bottom:6px; }
  .mock-card .mc-val{ font-size:13px; color:var(--text-primary); font-weight:600; }
  .kbd-hint{ display:flex; align-items:center; gap:6px; font-family:var(--font-mono); font-size:11px; color:var(--text-tertiary); }
  .kbd{ background:#20232C; border:1px solid var(--border-hair); border-bottom-width:2px; border-radius:5px; padding:2px 6px; font-size:10px; color:var(--text-secondary); }

  /* ---------------- TRUST / PROOF ---------------- */
  section.proof{ padding:70px 0; border-top:1px solid var(--border-hair); }
  .proof-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--border-hair); border:1px solid var(--border-hair); border-radius:var(--radius-md); overflow:hidden; }
  .proof-card{ background:var(--bg-base); padding:32px 26px; }
  .proof-num{ font-family:var(--font-display); font-size:34px; color:var(--accent-amber); margin-bottom:6px; }
  .proof-label{ font-size:14px; color:var(--text-secondary); }

  /* ---------------- BENTO ---------------- */
  section.bento{ padding:90px 0; }
  .section-head{ text-align:center; max-width:560px; margin:0 auto 48px; }
  .section-head h2{ font-size:36px; margin-bottom:14px; }
  .section-head p{ color:var(--text-secondary); font-size:16px; }

  .bento-grid{ display:grid; grid-template-columns:repeat(4, 1fr); grid-auto-rows:170px; gap:14px; }
  .bcard{
    background:var(--bg-elevated); border:1px solid var(--border-hair); border-radius:var(--radius-md);
    padding:22px; position:relative; overflow:hidden; transition:border-color .25s ease, transform .25s ease;
  }
  .bcard:hover{ border-color:var(--border-glow-blue); transform:translateY(-2px); }
  .bcard h4{ font-size:16px; margin-bottom:8px; }
  .bcard p{ font-size:13px; color:var(--text-secondary); line-height:1.5; }
  .bcard .tag{ position:absolute; top:18px; right:18px; font-family:var(--font-mono); font-size:10px; color:var(--text-tertiary); }
  .b-wide{ grid-column:span 2; }
  .b-tall{ grid-row:span 2; }
  .b-accent{ background:linear-gradient(160deg, rgba(255,176,32,0.10), var(--bg-elevated) 60%); }
  .b-blue{ background:linear-gradient(160deg, rgba(110,134,255,0.10), var(--bg-elevated) 60%); }

  .mini-doc{ font-family:var(--font-mono); font-size:11px; color:var(--text-tertiary); margin-top:12px; line-height:1.7; }
  .mini-doc span{ color:var(--accent-amber); }

  /* ---------------- INTERACTIVE DEMO ---------------- */
  section.demo{ padding:90px 0; border-top:1px solid var(--border-hair); border-bottom:1px solid var(--border-hair); background:var(--bg-elevated); }
  .demo-inner{ display:grid; grid-template-columns:340px 1fr; gap:50px; align-items:center; }
  .demo-list{ display:flex; flex-direction:column; gap:6px; }
  .demo-item{ padding:16px 18px; border-radius:11px; cursor:pointer; border:1px solid transparent; transition:all .2s ease; }
  .demo-item.active{ background:var(--bg-elevated-2); border-color:var(--border-hair); }
  .demo-item .di-num{ font-family:var(--font-mono); font-size:11px; color:var(--accent-amber); margin-bottom:4px; }
  .demo-item h4{ font-size:15px; margin-bottom:4px; }
  .demo-item p{ font-size:13px; color:var(--text-secondary); }

  .demo-screen{
    border-radius:var(--radius-lg); border:1px solid var(--border-hair);
    background:#101218; padding:20px; min-height:340px;
    box-shadow:0 30px 70px -30px rgba(0,0,0,0.8);
  }
  .kanban{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
  .kcol{ background:var(--bg-elevated-2); border-radius:10px; padding:12px; }
  .kcol h5{ font-family:var(--font-mono); font-size:10px; text-transform:uppercase; letter-spacing:0.06em; color:var(--text-tertiary); margin-bottom:10px; }
  .kcard{ background:var(--bg-base); border:1px solid var(--border-hair); border-radius:8px; padding:10px; font-size:12px; margin-bottom:8px; color:var(--text-secondary); }
  .kcard b{ display:block; color:var(--text-primary); font-size:12.5px; margin-bottom:4px; }

  /* ---------------- PRICING ---------------- */
  section.pricing{ padding:100px 0; text-align:center; }
  .pricing-grid{ display:grid; grid-template-columns:1fr 1fr; gap:22px; max-width:760px; margin:50px auto 0; text-align:left; }
  .price-card{ background:var(--bg-elevated); border:1px solid var(--border-hair); border-radius:var(--radius-lg); padding:32px; position:relative; }
  .price-card.featured{ border-color:var(--border-glow); box-shadow:0 0 0 1px rgba(255,176,32,0.15), 0 30px 70px -40px rgba(255,176,32,0.3); }
  .price-badge{ position:absolute; top:-12px; right:28px; background:var(--accent-amber); color:#0B0C10; font-family:var(--font-mono); font-size:10px; font-weight:700; padding:5px 10px; border-radius:20px; letter-spacing:0.04em; }
  .price-card h3{ font-size:18px; margin-bottom:6px; }
  .price-card .price-desc{ font-size:13px; color:var(--text-secondary); margin-bottom:22px; min-height:36px; }
  .price-amount{ font-family:var(--font-display); font-size:38px; margin-bottom:2px; }
  .price-amount span{ font-size:14px; color:var(--text-tertiary); font-family:var(--font-body); }
  .price-list{ margin:22px 0 26px; display:flex; flex-direction:column; gap:10px; }
  .price-list li{ display:flex; gap:9px; font-size:13.5px; color:var(--text-secondary); align-items:flex-start; }
  .price-list li::before{ content:'✓'; color:var(--accent-amber); font-weight:700; flex-shrink:0; }
  .price-card .btn{ width:100%; justify-content:center; }

  .final-cta{ margin-top:80px; padding:56px 40px; border-radius:var(--radius-lg); background:linear-gradient(135deg, rgba(255,176,32,0.10), rgba(110,134,255,0.06)); border:1px solid var(--border-hair); }
  .final-cta h3{ font-size:28px; margin-bottom:12px; }
  .final-cta p{ color:var(--text-secondary); margin-bottom:26px; }

  footer{ padding:40px 0; text-align:center; border-top:1px solid var(--border-hair); }
  footer p{ font-size:12.5px; color:var(--text-tertiary); font-family:var(--font-mono); }

  /* Mobile floating CTA */
  .mobile-cta{
    display:none; position:fixed; bottom:0; left:0; right:0; z-index:200;
    padding:14px 18px; background:rgba(11,12,16,0.92); backdrop-filter:blur(10px);
    border-top:1px solid var(--border-hair);
  }
  .mobile-cta .btn{ width:100%; justify-content:center; }

  /* Reveal on scroll */
  .reveal{ opacity:0; transform:translateY(16px); transition:opacity .6s ease, transform .6s ease; }
  .reveal.in{ opacity:1; transform:translateY(0); }

  @media (max-width:860px){
    .hero h1{ font-size:38px; }
    .doc-panel{ grid-template-columns:1fr; }
    .proof-grid{ grid-template-columns:1fr; }
    .bento-grid{ grid-template-columns:repeat(2,1fr); grid-auto-rows:150px; }
    .b-wide{ grid-column:span 2; }
    .demo-inner{ grid-template-columns:1fr; }
    .kanban{ grid-template-columns:1fr; }
    .pricing-grid{ grid-template-columns:1fr; }
    .nav-signin{ display:none; }
    .mobile-cta{ display:block; }
    body{ padding-bottom:74px; }
  }
</style>
</head>
<body>

<header class="nav">
  <div class="wrap nav-inner">
    <a class="logo" href="#top">
      <span class="logo-mark">SS</span>
      The Sprint School
    </a>
    <div class="nav-right">
      <a class="nav-signin" href="#">Sign In</a>
      <a class="btn btn-primary" href="#pricing">Join Cohort 2.0</a>
    </div>
  </div>
</header>

<section class="hero" id="top">
  <div class="hero-glow"></div>
  <div class="wrap">
    <div class="eyebrow" style="justify-content:center;">THE SPRINT COHORT 2.0 — LIVE, 6 WEEKS</div>
    <h1>Learn PM by shipping <span class="hl">one real product</span>,<br>not another slide deck.</h1>
    <p class="sub">Run the Sellytics Inventory Platform through real sprints — write the PRDs, ship the release plans, and defend your work on Demo Day.</p>
    <div class="hero-ctas">
      <a class="btn btn-primary btn-lg" href="#pricing">Join Cohort 2.0</a>
      <a class="btn btn-ghost btn-lg" href="#bento">See the curriculum</a>
    </div>

    <div class="switcher" id="switcher">
      <button class="active" data-audience="pm">For Aspiring PMs</button>
      <button data-audience="switcher">For Career Switchers</button>
      <button data-audience="lead">For Team Leads</button>
    </div>

    <div class="hero-frame reveal">
      <div class="frame-topbar">
        <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
        <span class="frame-title" id="frameTitle">sellytics — sprint-44-prd.md</span>
      </div>
      <div class="doc-panel">
        <div class="doc-main">
          <div class="doc-title" id="docTitle">Release Plan Module — PRD</div>
          <div class="doc-sub" id="docSub">Phase 13 · Sprint 44 · Owner: You</div>
          <div class="type-line" id="typeLine"></div>
          <div class="status-badge draft" id="statusBadge">● Draft</div>
        </div>
        <div class="side-mock">
          <div class="mock-card">
            <div class="mc-label">Kbd Shortcut</div>
            <div class="kbd-hint"><span class="kbd">⌘</span><span class="kbd">K</span> jump to any sprint doc</div>
          </div>
          <div class="mock-card">
            <div class="mc-label">Sprint velocity</div>
            <div class="mc-val" id="velocityVal">— pts</div>
          </div>
          <div class="mock-card">
            <div class="mc-label">Demo Day</div>
            <div class="mc-val">In 11 days</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="proof reveal">
  <div class="wrap">
    <div class="proof-grid">
      <div class="proof-card">
        <div class="proof-num">19+</div>
        <div class="proof-label">real documents shipped across 3 phases — not templates, working artifacts.</div>
      </div>
      <div class="proof-card">
        <div class="proof-num">1</div>
        <div class="proof-label">connected product. Every sprint builds on the last — no disconnected case studies.</div>
      </div>
      <div class="proof-card">
        <div class="proof-num">6 wks</div>
        <div class="proof-label">from first PRD to Demo Day, presenting to a live panel.</div>
      </div>
    </div>
  </div>
</section>

<section class="bento" id="bento">
  <div class="wrap">
    <div class="section-head reveal">
      <div class="eyebrow" style="justify-content:center;">WHAT YOU'LL SHIP</div>
      <h2>Every artifact a working PM writes</h2>
      <p>Not isolated exercises — one connected product, built sprint over sprint.</p>
    </div>

    <div class="bento-grid reveal">
      <div class="bcard b-wide b-accent">
        <span class="tag">01</span>
        <h4>Sprint PRDs</h4>
        <p>Write requirements docs under a real deadline, for a real engineering team's next sprint.</p>
        <div class="mini-doc"><span>Status:</span> Approved · <span>Reviewers:</span> 2</div>
      </div>
      <div class="bcard b-tall b-blue">
        <span class="tag">02</span>
        <h4>Release Plans</h4>
        <p>Sequence features across sprints, manage scope, and communicate trade-offs to stakeholders.</p>
      </div>
      <div class="bcard">
        <span class="tag">03</span>
        <h4>Roadmaps</h4>
        <p>Translate strategy into a quarter-view leadership will actually read.</p>
      </div>
      <div class="bcard">
        <span class="tag">04</span>
        <h4>Stakeholder Updates</h4>
        <p>Async status writing that keeps a distributed team aligned.</p>
      </div>
      <div class="bcard b-wide">
        <span class="tag">05</span>
        <h4>Demo Day</h4>
        <p>Present your sprint's shipped work to a live panel — the same pressure a real launch review carries.</p>
      </div>
    </div>
  </div>
</section>

<section class="demo">
  <div class="wrap">
    <div class="section-head reveal">
      <div class="eyebrow" style="justify-content:center;">INSIDE A SPRINT</div>
      <h2>Watch a sprint move, end to end</h2>
    </div>
    <div class="demo-inner reveal">
      <div class="demo-list" id="demoList">
        <div class="demo-item active" data-demo="0">
          <div class="di-num">01</div>
          <h4>Backlog gets triaged</h4>
          <p>Requirements land, get scoped, and enter the sprint board.</p>
        </div>
        <div class="demo-item" data-demo="1">
          <div class="di-num">02</div>
          <h4>Docs move with the work</h4>
          <p>PRDs and release notes update as the sprint progresses — not after.</p>
        </div>
        <div class="demo-item" data-demo="2">
          <div class="di-num">03</div>
          <h4>Demo Day locks the sprint</h4>
          <p>Shipped work gets presented and reviewed, live.</p>
        </div>
      </div>
      <div class="demo-screen">
        <div class="kanban">
          <div class="kcol"><h5>Backlog</h5>
            <div class="kcard" id="kb1"><b>Inventory sync API</b>Scoped · Est. 5pts</div>
          </div>
          <div class="kcol"><h5>In Sprint</h5>
            <div class="kcard" id="kb2"><b>Release Plan v2</b>PRD attached</div>
          </div>
          <div class="kcol"><h5>Demo Day</h5>
            <div class="kcard" id="kb3"><b>Low-stock alerts</b>Ready to present</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="pricing" id="pricing">
  <div class="wrap">
    <div class="section-head reveal" style="margin-bottom:0;">
      <div class="eyebrow" style="justify-content:center;">ENROLL</div>
      <h2>Pick your pace</h2>
      <p>Same product, same 19+ documents. One's guided, one's yours to run.</p>
    </div>

    <div class="pricing-grid reveal">
      <div class="price-card">
        <h3>Self-Paced Case Study</h3>
        <p class="price-desc">Work the full Sellytics case study on your own schedule.</p>
        <div class="price-amount">$149</div>
        <ul class="price-list">
          <li>Full Sellytics case study, all phases</li>
          <li>19+ real PM documents to build</li>
          <li>Lifetime access, self-graded</li>
        </ul>
        <a class="btn btn-ghost" href="#">Start self-paced</a>
      </div>
      <div class="price-card featured">
        <span class="price-badge">LIVE COHORT</span>
        <h3>The Sprint Cohort 2.0</h3>
        <p class="price-desc">6 weeks, live sprints, real deadlines, a Demo Day panel.</p>
        <div class="price-amount">$499</div>
        <ul class="price-list">
          <li>Everything in self-paced</li>
          <li>Live weekly sprints with a cohort</li>
          <li>Feedback on every document you ship</li>
          <li>Demo Day presentation to a live panel</li>
        </ul>
        <a class="btn btn-primary" href="#">Join Cohort 2.0</a>
      </div>
    </div>

    <div class="final-cta reveal">
      <h3>Next cohort starts soon.</h3>
      <p>Seats are capped so every sprint gets real feedback — not a queue.</p>
      <a class="btn btn-primary btn-lg" href="#">Join Cohort 2.0</a>
    </div>
  </div>
</section>

<footer>
  <p>THE SPRINT SCHOOL — SELLYTICS CASE STUDY © 2026</p>
</footer>

<div class="mobile-cta">
  <a class="btn btn-primary" href="#pricing">Join Cohort 2.0 — $499</a>
</div>

<script>
  // ---- Audience tab switcher (hero) ----
  const audienceCopy = {
    pm: {
      title: "Release Plan Module — PRD",
      sub: "Phase 13 · Sprint 44 · Owner: You",
      file: "sellytics — sprint-44-prd.md",
      lines: [
        "## Problem\\nOps can't see release sequencing across teams.",
        "## Goal\\nShip a release plan view scoped per product line."
      ],
      velocity: "32 pts"
    },
    switcher: {
      title: "Your First Sprint PRD",
      sub: "Phase 1 · Onboarding Sprint · Owner: You",
      file: "sellytics — onboarding-prd.md",
      lines: [
        "## Why this matters\\nThis is the doc a real PM writes in week one.",
        "## What you'll learn\\nScope, tradeoffs, and how to say no."
      ],
      velocity: "0 → 12 pts"
    },
    lead: {
      title: "Team Rollout Plan",
      sub: "Phase 13 · Sprint 46 · Owner: You",
      file: "sellytics — team-rollout-prd.md",
      lines: [
        "## Goal\\nGet your whole team fluent in one shared PM vocabulary.",
        "## Rollout\\n5 seats, 1 shared Demo Day, 1 shared standard."
      ],
      velocity: "Team: 5"
    }
  };

  const switcherEl = document.getElementById('switcher');
  const typeLineEl = document.getElementById('typeLine');
  const docTitleEl = document.getElementById('docTitle');
  const docSubEl = document.getElementById('docSub');
  const frameTitleEl = document.getElementById('frameTitle');
  const velocityEl = document.getElementById('velocityVal');

  let typeTimer = null;

  function typeText(text, el, done){
    clearInterval(typeTimer);
    el.innerHTML = '';
    let i = 0;
    typeTimer = setInterval(()=>{
      el.textContent = text.slice(0, i).replace(/\\n/g,' ');
      el.innerHTML += '<span class="cursor"></span>';
      i++;
      if(i > text.length){ clearInterval(typeTimer); if(done) done(); }
    }, 14);
  }

  function loadAudience(key){
    const d = audienceCopy[key];
    docTitleEl.textContent = d.title;
    docSubEl.textContent = d.sub;
    frameTitleEl.textContent = d.file;
    velocityEl.textContent = d.velocity;
    typeText(d.lines.join('  '), typeLineEl);
  }

  switcherEl.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    [...switcherEl.children].forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    loadAudience(btn.dataset.audience);
  });

  loadAudience('pm');

  // ---- Status badge cycle ----
  const badge = document.getElementById('statusBadge');
  const statuses = [
    {cls:'draft', text:'● Draft'},
    {cls:'review', text:'● In Review'},
    {cls:'approved', text:'● Approved'}
  ];
  let sIdx = 0;
  setInterval(()=>{
    sIdx = (sIdx+1) % statuses.length;
    badge.className = 'status-badge ' + statuses[sIdx].cls;
    badge.textContent = statuses[sIdx].text;
  }, 2600);

  // ---- Demo list interaction ----
  const demoItems = document.querySelectorAll('.demo-item');
  const kb1 = document.getElementById('kb1'), kb2 = document.getElementById('kb2'), kb3 = document.getElementById('kb3');
  const demoStates = [
    {kb1:'<b>Inventory sync API</b>Just added · Scoping', kb2:'<b>Release Plan v2</b>In progress', kb3:'<b>Low-stock alerts</b>Waiting'},
    {kb1:'<b>Inventory sync API</b>Scoped · Est. 5pts', kb2:'<b>Release Plan v2</b>PRD attached', kb3:'<b>Low-stock alerts</b>Waiting'},
    {kb1:'<b>Inventory sync API</b>Scoped · Est. 5pts', kb2:'<b>Release Plan v2</b>Shipped', kb3:'<b>Low-stock alerts</b>Ready to present'}
  ];
  demoItems.forEach(item=>{
    item.addEventListener('click', ()=>{
      demoItems.forEach(i=>i.classList.remove('active'));
      item.classList.add('active');
      const s = demoStates[item.dataset.demo];
      kb1.innerHTML = s.kb1; kb2.innerHTML = s.kb2; kb3.innerHTML = s.kb3;
    });
  });

  // ---- Scroll reveal ----
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){ entry.target.classList.add('in'); io.unobserve(entry.target); }
    });
  }, {threshold:0.12});
  revealEls.forEach(el=>io.observe(el));
  document.querySelector('.hero-frame').classList.add('in');
</script>

</body>
</html>