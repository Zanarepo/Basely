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