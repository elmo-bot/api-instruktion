const reel = document.getElementById("reel");
const stage = document.getElementById("stage");
const nodes = Array.from(document.querySelectorAll(".node"));
const barrier = document.getElementById("barrier");

const headline = document.getElementById("headline");
const subhead = document.getElementById("subhead");

const toggleMode = document.getElementById("toggleMode");
const presenterBtn = document.getElementById("presenterBtn");
const filmMode = document.getElementById("filmMode");

const steps = Array.from(document.querySelectorAll(".step"));
const capTitle = document.getElementById("capTitle");
const capText = document.getElementById("capText");

const pulseOnceBtn = document.getElementById("pulseOnce");
const nextPulseBtn = document.getElementById("nextPulse");
const resetBtn = document.getElementById("reset");

const pulseLayer = document.getElementById("pulseLayer");

// ---- Icons (inline SVG) ----
function iconSVG(name){
  if(name === "guest") return `
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.5" stroke="rgba(245,247,255,.88)" stroke-width="1.7"/>
      <path d="M5.5 20c1.8-4.2 11.2-4.2 13 0" stroke="rgba(245,247,255,.75)" stroke-width="1.7" stroke-linecap="round"/>
    </svg>`;
  if(name === "menu") return `
    <svg viewBox="0 0 24 24" fill="none">
      <rect x="6.5" y="4.8" width="11" height="14.4" rx="2.2" stroke="rgba(245,247,255,.78)" stroke-width="1.7"/>
      <line x1="9" y1="9" x2="15.5" y2="9" stroke="rgba(245,247,255,.72)" stroke-width="1.7" stroke-linecap="round"/>
      <line x1="9" y1="12.5" x2="15.5" y2="12.5" stroke="rgba(245,247,255,.60)" stroke-width="1.7" stroke-linecap="round"/>
    </svg>`;
  if(name === "api") return `
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M7 8.8c0-2.3 2.2-4.1 5-4.1s5 1.8 5 4.1" stroke="rgba(245,247,255,.88)" stroke-width="1.7" stroke-linecap="round"/>
      <path d="M6.5 9.6h11" stroke="rgba(245,247,255,.78)" stroke-width="1.7" stroke-linecap="round"/>
      <path d="M8 19.2c.8-3 7.2-3 8 0" stroke="rgba(245,247,255,.72)" stroke-width="1.7" stroke-linecap="round"/>
      <path d="M16.5 14.2h3.2" stroke="rgba(124,92,255,.95)" stroke-width="2.0" stroke-linecap="round"/>
    </svg>`;
  if(name === "server") return `
    <svg viewBox="0 0 24 24" fill="none">
      <rect x="6.2" y="5.5" width="11.6" height="5.3" rx="1.6" stroke="rgba(245,247,255,.78)" stroke-width="1.7"/>
      <rect x="6.2" y="12.7" width="11.6" height="5.8" rx="1.6" stroke="rgba(245,247,255,.62)" stroke-width="1.7"/>
      <circle cx="9.2" cy="8.1" r="0.8" fill="rgba(255,204,102,.95)"/>
      <circle cx="9.2" cy="15.6" r="0.8" fill="rgba(56,209,122,.95)"/>
    </svg>`;
  if(name === "data") return `
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M7 8.2c0-1.8 10-1.8 10 0s-10 1.8-10 0Z" stroke="rgba(245,247,255,.78)" stroke-width="1.7"/>
      <path d="M7 8.2v7.4c0 1.8 10 1.8 10 0V8.2" stroke="rgba(245,247,255,.62)" stroke-width="1.7"/>
    </svg>`;
  return "";
}
document.querySelectorAll(".icon").forEach(el => {
  el.innerHTML = iconSVG(el.dataset.ico);
});

// ---- Helpers ----
let timers = [];
function clearTimers(){ timers.forEach(t => clearTimeout(t)); timers = []; }

function setCaption(t, x){ capTitle.textContent = t; capText.textContent = x; }
function setHeader(h, s){ headline.textContent = h; subhead.textContent = s; }

function clearActive(){
  nodes.forEach(n => n.classList.remove("active"));
}
function focusNode(key){
  stage.classList.add("dim");
  clearActive();
  const el = nodes.find(n => n.dataset.node === key);
  if(el) el.classList.add("active");
}
function overview(){
  stage.classList.remove("dim");
  clearActive();
  barrier.classList.remove("show");
  setHeader("Klicka runt: tydliga pulser", "Välj en ruta → se en puls gå exakt dit den ska. Presenter Mode = stegvis.");
  setCaption("Översikt", "Tryck på en ruta. Pulsen visar exakt kommunikationen.");
  steps.forEach(s => s.classList.remove("on"));
}

// ---- Pulse system (SVG clone + glow) ----
// We keep base paths as geometry, then clone into animated strokes.
// This avoids CSS/JS fighting and makes Safari smooth.
const geom = {
  "guest-api": document.getElementById("p-guest-api"),
  "menu-api": document.getElementById("p-menu-api"),
  "api-guest": document.getElementById("p-api-guest"),
  "api-server": document.getElementById("p-api-server"),
  "api-data": document.getElementById("p-api-data"),
  "server-api": document.getElementById("p-server-api"),
  "data-api": document.getElementById("p-data-api")
};

function removeActivePulseStrokes(){
  const olds = pulseLayer.querySelectorAll(".pulseStroke, .glowStroke");
  olds.forEach(o => o.remove());
}

function colorFor(from, to){
  // Subtle semantics: requests (towards server) = warm, responses = accent
  const key = `${from}-${to}`;
  if(key.includes("server") || key.includes("api-server") || key.includes("server-api")) return { main: "rgba(255,204,102,.95)", glow: "rgba(255,204,102,.55)" };
  if(key.includes("data") || key.includes("api-data") || key.includes("data-api")) return { main: "rgba(56,209,122,.95)", glow: "rgba(56,209,122,.52)" };
  return { main: "rgba(124,92,255,.95)", glow: "rgba(124,92,255,.55)" };
}

function playPulse(from, to){
  clearTimers();
  removeActivePulseStrokes();

  const key = `${from}-${to}`;
  const base = geom[key];
  if(!base) return false;

  const colors = colorFor(from, to);

  // Create glow stroke
  const glow = base.cloneNode(true);
  glow.removeAttribute("id");
  glow.setAttribute("class", "glowStroke");
  glow.style.stroke = colors.glow;
  glow.style.animation = `afterGlow var(--pulseDur) cubic-bezier(.4,0,.2,1) forwards`;

  // Create main stroke
  const stroke = base.cloneNode(true);
  stroke.removeAttribute("id");
  stroke.setAttribute("class", "pulseStroke");
  stroke.style.stroke = colors.main;
  stroke.style.animation = `pulseMove var(--pulseDur) cubic-bezier(.4,0,.2,1) forwards`;

  // Put above baseline but under nodes
  pulseLayer.appendChild(glow);
  pulseLayer.appendChild(stroke);

  return true;
}

// ---- Interaction logic (pedagogical lock + presenter mode) ----
let focusMode = true;          // dim others on focus
let presenterMode = false;     // click to advance sequence
let selected = null;           // current selected node (guest/menu/api/server/data)
let sequence = [];             // current pulse sequence
let seqIndex = 0;

// Allowed “concept map” (lock)
const allowed = {
  guest: [["guest","api"]],
  menu:  [["menu","api"]],
  api:   [["api","guest"], ["api","server"], ["api","data"]],
  server:[["server","api"]],
  data:  [["data","api"]]
};

function buildSequence(nodeKey){
  return (allowed[nodeKey] || []).map(([a,b]) => ({ from:a, to:b }));
}

function applySelection(nodeKey){
  selected = nodeKey;
  seqIndex = 0;
  sequence = buildSequence(nodeKey);

  // Focus visuals
  if(focusMode){
    focusNode(nodeKey);
  }else{
    stage.classList.remove("dim");
    clearActive();
    const el = nodes.find(n => n.dataset.node === nodeKey);
    if(el) el.classList.add("active");
  }

  // Barrier concept: show when server is involved or when api is selected (since it "crosses")
  const showBar = (nodeKey === "server") || (nodeKey === "api");
  barrier.classList.toggle("show", showBar);

  // Caption text
  const titles = { guest:"Gästen", menu:"Menyn", api:"API", server:"Servern", data:"Svaret" };
  setCaption(titles[nodeKey] || "Fokus", presenterMode
    ? "Presenter Mode: tryck “Nästa” eller klicka igen för nästa puls."
    : "Tryck igen eller “Puls” för att spela pulsen."
  );
}

function pulseOnce(){
  if(!selected){
    setCaption("Tips", "Välj en ruta först.");
    return;
  }
  if(sequence.length === 0) return;

  // In non-presenter: always play the first pulse for that selection
  // In presenter: play current index and do NOT auto-advance unless asked
  const item = presenterMode ? sequence[seqIndex] : sequence[0];
  playPulse(item.from, item.to);

  // If not presenter, done.
  if(!presenterMode) return;
}

function nextPulse(){
  if(!selected){
    setCaption("Tips", "Välj en ruta först.");
    return;
  }
  if(sequence.length === 0) return;

  const item = sequence[seqIndex];
  playPulse(item.from, item.to);

  seqIndex = (seqIndex + 1) % sequence.length;

  // Keep captions clean
  if(selected === "api"){
    const labels = ["API → Gäst", "API → Server", "API → Svar"];
    const idxShown = (seqIndex === 0) ? 3 : seqIndex; // after increment
    setCaption("API", `Presenter Mode: ${labels[idxShown-1]}`);
  }
}

function clickBehavior(nodeKey){
  // If you click a different node: select it
  if(selected !== nodeKey){
    applySelection(nodeKey);
    // In normal mode, immediately show the relevant pulse once (feels premium)
    if(!presenterMode) pulseOnce();
    return;
  }

  // If clicking same node:
  // - Presenter: advance one pulse
  // - Normal: replay its pulse
  if(presenterMode){
    nextPulse();
  }else{
    pulseOnce();
  }
}

// ---- Steps (optional guided learning) ----
function setStep(n){
  steps.forEach(s => s.classList.toggle("on", s.dataset.step === String(n)));

  if(n === 0){
    overview();
    selected = null;
    sequence = [];
    seqIndex = 0;
    removeActivePulseStrokes();
    return;
  }

  if(n === 1){
    applySelection("guest");
    if(!presenterMode) playPulse("guest","api");
    setHeader("Steg 1: Du beställer", "Gästen pratar inte med köket direkt — pulsen visar vägen till API.");
    setCaption("Steg 1", "Gästen → API (en tydlig kontaktpunkt)");
  }
  if(n === 2){
    applySelection("api");
    setHeader("Steg 2: API tar emot", "API kan prata med flera — pulserna visar kopplingarna.");
    setCaption("Steg 2", presenterMode ? "Presenter: klicka Nästa för API:s pulser." : "API → Gäst/Server/Svar (sekventiellt)");
    if(!presenterMode){
      // play a tasteful sequence once
      playPulse("api","guest");
      timers.push(setTimeout(()=> playPulse("api","server"), 520));
      timers.push(setTimeout(()=> playPulse("api","data"), 1040));
    }
  }
  if(n === 3){
    applySelection("server");
    setHeader("Steg 3: Köket är skyddat", "Barriären visar att du inte går in — API sköter det.");
    setCaption("Steg 3", "Server → API (kontakt sker via mellanhand)");
    if(!presenterMode) playPulse("server","api");
  }
  if(n === 4){
    applySelection("data");
    setHeader("Steg 4: Du får svaret", "Du får bara det du bad om — inte hela köket.");
    setCaption("Steg 4", "Svar → API (och vidare till appen)");
    if(!presenterMode) playPulse("data","api");
  }
}

// ---- UI Buttons ----
toggleMode.addEventListener("click", () => {
  focusMode = !focusMode;
  toggleMode.textContent = focusMode ? "Fokus" : "Fritt";
  if(focusMode){
    if(selected) focusNode(selected);
    setCaption("Fokusläge", "Allt dimmas utom det du pratar om.");
  } else {
    stage.classList.remove("dim");
    setCaption("Fritt läge", "Allt syns – pulserna visar ändå vägen.");
  }
});

presenterBtn.addEventListener("click", () => {
  presenterMode = !presenterMode;
  presenterBtn.classList.toggle("primary", presenterMode);
  presenterBtn.textContent = presenterMode ? "Presenter: På" : "Presenter";

  if(presenterMode){
    setHeader("Presenter Mode", "Klicka samma ruta igen för nästa puls. Perfekt för live-berättande.");
    setCaption("Presenter Mode", "Välj t.ex. API → klicka igen för att pulsera till nästa koppling.");
  } else {
    setHeader("Interaktivt", "Klicka en ruta → en tydlig puls. Minimalt brus.");
    setCaption("Interaktivt", "Du kan klicka runt fritt och spela pulser när du vill.");
  }
});

filmMode.addEventListener("click", () => {
  reel.classList.toggle("film");
});

pulseOnceBtn.addEventListener("click", () => pulseOnce());
nextPulseBtn.addEventListener("click", () => nextPulse());
resetBtn.addEventListener("click", () => {
  clearTimers();
  removeActivePulseStrokes();
  presenterMode = false;
  presenterBtn.classList.remove("primary");
  presenterBtn.textContent = "Presenter";
  overview();
  selected = null;
  sequence = [];
  seqIndex = 0;
  setHeader("Klicka runt: tydliga pulser", "Välj en ruta → se en puls gå exakt dit den ska.");
});

// ---- Node Events ----
nodes.forEach(n => {
  n.addEventListener("click", () => clickBehavior(n.dataset.node));
  n.addEventListener("keydown", (e) => {
    if(e.key === "Enter" || e.key === " "){
      e.preventDefault();
      n.click();
    }
  });
});

steps.forEach(s => s.addEventListener("click", () => setStep(Number(s.dataset.step))));

// ---- Initial ----
overview();
