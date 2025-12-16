const reel = document.getElementById("reel");
const stage = document.getElementById("stage");
const barrier = document.getElementById("barrier");

const headline = document.getElementById("headline");
const subhead = document.getElementById("subhead");

const filmMode = document.getElementById("filmMode");
const runBtn = document.getElementById("runBtn");

const reqSelect = document.getElementById("reqSelect");
const pulseBtn = document.getElementById("pulseBtn");
const nextBtn = document.getElementById("nextBtn");
const resetBtn = document.getElementById("resetBtn");

const capTitle = document.getElementById("capTitle");
const capText = document.getElementById("capText");

const tMethod = document.getElementById("tMethod");
const tEndpoint = document.getElementById("tEndpoint");
const tResponse = document.getElementById("tResponse");

const nodes = Array.from(document.querySelectorAll(".node"));
const pulseLayer = document.getElementById("pulseLayer");

// --- SVG geometry paths ---
const geom = {
  "guest->api":  document.getElementById("g-guest-api"),
  "menu->api":   document.getElementById("g-menu-api"),
  "api->server": document.getElementById("g-api-server"),
  "api->data":   document.getElementById("g-api-data"),
  "server->api": document.getElementById("g-server-api"),
  "data->api":   document.getElementById("g-data-api"),
  "api->guest":  document.getElementById("g-api-guest"),
};

let timers = [];
let running = false;
let selectedNode = null;

// Step engine for “Nästa steg”
let manualSteps = [];
let manualIndex = 0;

function clearTimers(){ timers.forEach(t => clearTimeout(t)); timers = []; }
function setCaption(t, x){ capTitle.textContent = t; capText.textContent = x; }
function setHeader(h, s){ headline.textContent = h; subhead.textContent = s; }

function clearActive(){
  nodes.forEach(n => n.classList.remove("active"));
}

function activate(nodeKey){
  clearActive();
  const el = nodes.find(n => n.dataset.node === nodeKey);
  if(el) el.classList.add("active");
  selectedNode = nodeKey;
}

// --- Icons ---
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
document.querySelectorAll(".icon").forEach(el => { el.innerHTML = iconSVG(el.dataset.ico); });

// --- Pulse rendering (WAAPI = stabilt i iOS Safari) ---
function removePulseStrokes(){
  pulseLayer.querySelectorAll(".pulseStroke, .glowStroke").forEach(e => e.remove());
}

function pulseColor(kind){
  if(kind === "request") return { main: "rgba(255,204,102,.95)", glow: "rgba(255,204,102,.45)" };
  if(kind === "response") return { main: "rgba(56,209,122,.95)", glow: "rgba(56,209,122,.45)" };
  return { main: "rgba(124,92,255,.95)", glow: "rgba(124,92,255,.45)" };
}

function playPulse(key, kind="neutral", duration=950){
  const base = geom[key];
  if(!base) return;

  removePulseStrokes();

  const { main, glow } = pulseColor(kind);
  const len = base.getTotalLength();

  const dashA = Math.max(10, len * 0.18);
  const dashB = len;

  // Glow
  const g = base.cloneNode(true);
  g.removeAttribute("id");
  g.setAttribute("class", "glowStroke");
  g.style.fill = "none";
  g.style.stroke = glow;
  g.style.strokeWidth = "3.6";
  g.style.strokeLinecap = "round";
  g.style.filter = "url(#softGlow)";
  g.style.strokeDasharray = `${dashA} ${dashB}`;
  g.style.strokeDashoffset = `${len}`;
  g.style.opacity = "0";
  pulseLayer.appendChild(g);

  // Main
  const s = base.cloneNode(true);
  s.removeAttribute("id");
  s.setAttribute("class", "pulseStroke");
  s.style.fill = "none";
  s.style.stroke = main;
  s.style.strokeWidth = "2";
  s.style.strokeLinecap = "round";
  s.style.strokeDasharray = `${dashA} ${dashB}`;
  s.style.strokeDashoffset = `${len}`;
  s.style.opacity = "0";
  pulseLayer.appendChild(s);

  // Animate with WAAPI
  g.animate([
    { strokeDashoffset: len, opacity: 0 },
    { strokeDashoffset: len * 0.85, opacity: 0.85 },
    { strokeDashoffset: 0, opacity: 0 }
  ], { duration: duration + 120, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });

  s.animate([
    { strokeDashoffset: len, opacity: 0 },
    { strokeDashoffset: len * 0.9, opacity: 1 },
    { strokeDashoffset: 0, opacity: 0 }
  ], { duration, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });
}

// --- Request presets (metafor + teknik) ---
const presets = {
  burger: {
    meta: [
      { title:"Metafor", text:"Gästen väljer en hamburgare i menyn." },
      { title:"Metafor", text:"API tar beställningen." },
      { title:"Metafor", text:"Köket (servern) hämtar/löser det." },
      { title:"Metafor", text:"API levererar svaret." },
    ],
    tech: { method:"GET", endpoint:"/menu/items/42", response:"200 OK • { item: … }" },
    flow: [
      { focus:"menu",  pulse:"menu->api",   kind:"neutral" },
      { focus:"api",   pulse:"guest->api",  kind:"neutral", note:"(du beställer via API)" },
      { focus:"server",pulse:"api->server", kind:"request" },
      { focus:"data",  pulse:"server->api", kind:"response" },
      { focus:"guest", pulse:"api->guest",  kind:"neutral" },
    ]
  },
  uber: {
    meta: [
      { title:"Metafor", text:"Du beställer en resa i appen." },
      { title:"Metafor", text:"API skickar din beställning." },
      { title:"Metafor", text:"Servern matchar förare." },
      { title:"Metafor", text:"Du får bekräftelse tillbaka." },
    ],
    tech: { method:"POST", endpoint:"/rides", response:"201 Created • { rideId: … }" },
    flow: [
      { focus:"menu",  pulse:"menu->api",   kind:"neutral" },
      { focus:"api",   pulse:"guest->api",  kind:"neutral" },
      { focus:"server",pulse:"api->server", kind:"request" },
      { focus:"data",  pulse:"server->api", kind:"response" },
      { focus:"guest", pulse:"api->guest",  kind:"neutral" },
    ]
  },
  login: {
    meta: [
      { title:"Metafor", text:"Du vill se dina bokningar." },
      { title:"Metafor", text:"API ber servern om dina data." },
      { title:"Metafor", text:"Servern kollar att du är inloggad." },
      { title:"Metafor", text:"Du får svar tillbaka." },
    ],
    tech: { method:"GET", endpoint:"/bookings  (Authorization: Bearer …)", response:"200 OK • [ … ]" },
    flow: [
      { focus:"menu",  pulse:"menu->api",   kind:"neutral" },
      { focus:"api",   pulse:"guest->api",  kind:"neutral" },
      { focus:"server",pulse:"api->server", kind:"request" },
      { focus:"data",  pulse:"server->api", kind:"response" },
      { focus:"guest", pulse:"api->guest",  kind:"neutral" },
    ]
  }
};

function applyTech(p){
  tMethod.textContent = p.tech.method;
  tEndpoint.textContent = p.tech.endpoint;
  tResponse.textContent = p.tech.response;
}

// --- Running flows (synkade steg) ---
function runFlow(presetKey){
  const p = presets[presetKey];
  if(!p) return;

  running = true;
  clearTimers();
  removePulseStrokes();

  applyTech(p);
  setHeader("Kör kedjan", "Metafor + teknik i synk. Tryck Reset om du vill avbryta.");

  // Barrier: visa när vi jobbar mot servern
  barrier.classList.add("show");

  const steps = p.flow;
  const meta = p.meta;

  const stepMs = 1050; // jämn, proffsig rytm

  steps.forEach((st, i) => {
    timers.push(setTimeout(() => {
      activate(st.focus);

      // caption sync: metafor
      const m = meta[Math.min(i, meta.length-1)];
      setCaption(m.title, m.text);

      // pulse
      playPulse(st.pulse, st.kind, 900);

      // extra: vid serversteg, förstärk “ingen direktåtkomst”
      if(st.focus === "server"){
        barrier.classList.add("show");
      }
      if(st.focus === "guest"){
        barrier.classList.remove("show");
      }

    }, i * stepMs));
  });

  timers.push(setTimeout(() => {
    running = false;
    setCaption("Klart", "Nu kan du klicka runt och visa enskilda pulser per nod.");
  }, steps.length * stepMs + 200));
}

// Manual stepping (Nästa steg)
function buildManual(presetKey){
  const p = presets[presetKey];
  manualSteps = p ? p.flow : [];
  manualIndex = 0;
  if(p) applyTech(p);
}

function doNext(){
  if(manualSteps.length === 0) buildManual(reqSelect.value);
  const st = manualSteps[manualIndex];
  if(!st) return;

  activate(st.focus);
  playPulse(st.pulse, st.kind, 900);

  // captions: visa både metafor + tekniskt kompakt
  const p = presets[reqSelect.value];
  const m = p.meta[Math.min(manualIndex, p.meta.length-1)];
  setCaption(m.title, `${m.text}  •  ${p.tech.method} ${p.tech.endpoint}`);

  barrier.classList.toggle("show", st.focus === "server" || st.focus === "api");

  manualIndex = (manualIndex + 1) % manualSteps.length;
}

// Node-click pulses (snabbt & tydligt)
function pulseForNode(nodeKey){
  // “pedagogisk lock”: bara logiska pulser
  if(nodeKey === "guest"){ activate("guest"); playPulse("guest->api", "neutral", 900); setCaption("Gästen", "Gästen pratar med API (inte med köket)."); return; }
  if(nodeKey === "menu"){ activate("menu"); playPulse("menu->api", "neutral", 900); setCaption("Menyn", "Appen skickar valet vidare till API."); return; }
  if(nodeKey === "api"){  activate("api");  playPulse("api->server", "request", 900); setCaption("API", "API skickar request till servern."); barrier.classList.add("show"); return; }
  if(nodeKey === "server"){ activate("server"); playPulse("server->api", "response", 900); setCaption("Servern", "Servern svarar till API (response)."); barrier.classList.add("show"); return; }
  if(nodeKey === "data"){ activate("data"); playPulse("data->api", "response", 900); setCaption("Svar", "Svaret går tillbaka via API."); return; }
}

// --- UI events ---
filmMode.addEventListener("click", () => reel.classList.toggle("film"));

runBtn.addEventListener("click", () => {
  if(running) return;
  buildManual(reqSelect.value);
  runFlow(reqSelect.value);
});

pulseBtn.addEventListener("click", () => {
  if(!selectedNode) { setCaption("Tips", "Tryck på en nod först."); return; }
  pulseForNode(selectedNode);
});

nextBtn.addEventListener("click", () => {
  if(running) return;
  buildManual(reqSelect.value);
  doNext();
});

resetBtn.addEventListener("click", () => {
  running = false;
  clearTimers();
  removePulseStrokes();
  barrier.classList.remove("show");
  clearActive();
  selectedNode = null;

  setHeader("Välj en förfrågan och kör kedjan", "Tryck på noderna för fokus + puls. Eller välj en förfrågan längst ner för en komplett “request → response”.");
  setCaption("Redo", "Välj en förfrågan och tryck “Kör”. Eller tryck på en nod för en snabb puls.");
  tMethod.textContent = "—";
  tEndpoint.textContent = "—";
  tResponse.textContent = "—";
});

reqSelect.addEventListener("change", () => {
  buildManual(reqSelect.value);
  const p = presets[reqSelect.value];
  setCaption("Vald förfrågan", p.meta[0].text);
});

// Node clickable
nodes.forEach(n => {
  n.addEventListener("click", () => {
    if(running) return;
    const key = n.dataset.node;
    activate(key);
    pulseForNode(key);
  });
});

// Init
setCaption("Redo", "Välj en förfrågan och tryck “Kör”. Eller tryck på en nod för en snabb puls.");
buildManual(reqSelect.value);
applyTech(presets[reqSelect.value]);
