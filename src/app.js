const stage = document.getElementById("stage");
const barrier = document.getElementById("barrier");
const pulseLayer = document.getElementById("pulseLayer");

const reqSelect = document.getElementById("reqSelect");
const toggleRun = document.getElementById("toggleRun");
const speed = document.getElementById("speed");
const resetBtn = document.getElementById("reset");

const tMethod = document.getElementById("tMethod");
const tEndpoint = document.getElementById("tEndpoint");
const tResponse = document.getElementById("tResponse");

const nodes = Array.from(document.querySelectorAll(".node"));

const geom = {
  "guest->api":  document.getElementById("g-guest-api"),
  "menu->api":   document.getElementById("g-menu-api"),
  "api->server": document.getElementById("g-api-server"),
  "server->api": document.getElementById("g-server-api"),
  "api->data":   document.getElementById("g-api-data"),
  "data->api":   document.getElementById("g-data-api"),
  "api->guest":  document.getElementById("g-api-guest"),
};

let running = false;
let loopTimer = null;
let selected = null;

// ====== presets (clean) ======
const presets = {
  burger: {
    method: "GET",
    endpoint: "/menu/items/42",
    response: "200 OK",
    // Chain loop: UI -> API -> Server -> API -> Guest
    chain: [
      { focus:"menu",  pulse:"menu->api",   kind:"neutral", twoWay:false },
      { focus:"api",   pulse:"guest->api",  kind:"neutral", twoWay:false },
      { focus:"server",pulse:"api->server", kind:"request", twoWay:true, back:"server->api", backKind:"response" },
      { focus:"data",  pulse:"api->data",   kind:"response",twoWay:true, back:"data->api", backKind:"response" },
      { focus:"guest", pulse:"api->guest",  kind:"neutral", twoWay:false },
    ]
  },
  uber: {
    method: "POST",
    endpoint: "/rides",
    response: "201 Created",
    chain: [
      { focus:"menu",  pulse:"menu->api",   kind:"neutral", twoWay:false },
      { focus:"api",   pulse:"guest->api",  kind:"neutral", twoWay:false },
      { focus:"server",pulse:"api->server", kind:"request", twoWay:true, back:"server->api", backKind:"response" },
      { focus:"guest", pulse:"api->guest",  kind:"response",twoWay:false },
    ]
  },
  login: {
    method: "GET",
    endpoint: "/bookings (Authorization: Bearer …)",
    response: "200 OK",
    chain: [
      { focus:"menu",  pulse:"menu->api",   kind:"neutral", twoWay:false },
      { focus:"api",   pulse:"guest->api",  kind:"neutral", twoWay:false },
      { focus:"server",pulse:"api->server", kind:"request", twoWay:true, back:"server->api", backKind:"response" },
      { focus:"data",  pulse:"api->data",   kind:"response",twoWay:true, back:"data->api", backKind:"response" },
      { focus:"guest", pulse:"api->guest",  kind:"response",twoWay:false },
    ]
  }
};

function applyTech(key){
  const p = presets[key];
  tMethod.textContent = p.method;
  tEndpoint.textContent = p.endpoint;
  tResponse.textContent = p.response;
}

function clearActive(){
  nodes.forEach(n => n.classList.remove("active"));
}
function activate(nodeKey){
  clearActive();
  const el = nodes.find(n => n.dataset.node === nodeKey);
  if(el) el.classList.add("active");
  selected = nodeKey;
}

// ====== Pulse engine (stable) ======
function removePulseStrokes(){
  pulseLayer.querySelectorAll(".pulseStroke, .glowStroke").forEach(e => e.remove());
}

function colors(kind){
  if(kind === "request") return { main:"rgba(255,204,102,.95)", glow:"rgba(255,204,102,.42)" };
  if(kind === "response") return { main:"rgba(56,209,122,.95)", glow:"rgba(56,209,122,.42)" };
  return { main:"rgba(124,92,255,.95)", glow:"rgba(124,92,255,.42)" };
}

function pulseOnce(key, kind="neutral", baseMs=900){
  const base = geom[key];
  if(!base) return Promise.resolve();

  removePulseStrokes();

  const { main, glow } = colors(kind);
  const len = base.getTotalLength();
  const dashA = Math.max(10, len * 0.18);
  const dashB = len;

  const dur = Math.round(baseMs / Number(speed.value));

  const g = base.cloneNode(true);
  g.removeAttribute("id");
  g.classList.add("glowStroke");
  g.style.fill = "none";
  g.style.stroke = glow;
  g.style.strokeWidth = "3.4";
  g.style.strokeLinecap = "round";
  g.style.filter = "url(#softGlow)";
  g.style.strokeDasharray = `${dashA} ${dashB}`;
  g.style.strokeDashoffset = `${len}`;
  g.style.opacity = "0";
  pulseLayer.appendChild(g);

  const s = base.cloneNode(true);
  s.removeAttribute("id");
  s.classList.add("pulseStroke");
  s.style.fill = "none";
  s.style.stroke = main;
  s.style.strokeWidth = "2";
  s.style.strokeLinecap = "round";
  s.style.strokeDasharray = `${dashA} ${dashB}`;
  s.style.strokeDashoffset = `${len}`;
  s.style.opacity = "0";
  pulseLayer.appendChild(s);

  const a1 = g.animate([
    { strokeDashoffset: len, opacity: 0 },
    { strokeDashoffset: len * 0.85, opacity: 0.85 },
    { strokeDashoffset: 0, opacity: 0 }
  ], { duration: dur + 140, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });

  const a2 = s.animate([
    { strokeDashoffset: len, opacity: 0 },
    { strokeDashoffset: len * 0.9, opacity: 1 },
    { strokeDashoffset: 0, opacity: 0 }
  ], { duration: dur, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });

  return Promise.all([a1.finished.catch(()=>{}), a2.finished.catch(()=>{})]).then(()=>{});
}

// ====== Chains ======
async function playStep(step){
  activate(step.focus);

  // Barrier only during server communication (fixes red vertical line bug)
  const showBarrier = (step.focus === "server") || (step.pulse.includes("server"));
  barrier.classList.toggle("show", showBarrier);

  // Forward
  await pulseOnce(step.pulse, step.kind);

  // Optional return pulse (two-way)
  if(step.twoWay && step.back){
    await pulseOnce(step.back, step.backKind || "response");
  }
}

async function runLoop(){
  const p = presets[reqSelect.value];
  if(!p) return;

  applyTech(reqSelect.value);

  running = true;
  toggleRun.textContent = "Stop";

  // Continous loop: runs forever until Stop
  while(running){
    for(const step of p.chain){
      if(!running) break;
      await playStep(step);
      // tiny rest for “breathing room”
      await new Promise(r => setTimeout(r, Math.round(140 / Number(speed.value))));
    }
  }
}

function stopLoop(){
  running = false;
  toggleRun.textContent = "Start";
  barrier.classList.remove("show");
  removePulseStrokes();
  if(loopTimer){ clearTimeout(loopTimer); loopTimer = null; }
}

// ====== Node click behaviour (continuous local loop) ======
async function nodeLoop(nodeKey){
  // Stop any global loop first
  stopLoop();

  // clean activation
  activate(nodeKey);

  // Define “correct” direction + two-way rules per node
  // Guest/Menu: one-way to API (repeat)
  // API: two-way to Server then to Data (repeat)
  // Server/Data: two-way with API (repeat)
  const delay = () => new Promise(r => setTimeout(r, Math.round(180 / Number(speed.value))));

  running = true;
  toggleRun.textContent = "Stop";

  while(running){
    if(nodeKey === "guest"){
      barrier.classList.remove("show");
      await pulseOnce("guest->api","neutral");
      await delay();
    } else if(nodeKey === "menu"){
      barrier.classList.remove("show");
      await pulseOnce("menu->api","neutral");
      await delay();
    } else if(nodeKey === "api"){
      barrier.classList.add("show");
      await pulseOnce("api->server","request");
      await pulseOnce("server->api","response");
      await delay();
      await pulseOnce("api->data","response");
      await pulseOnce("data->api","response");
      await delay();
    } else if(nodeKey === "server"){
      barrier.classList.add("show");
      await pulseOnce("api->server","request");
      await pulseOnce("server->api","response");
      await delay();
    } else if(nodeKey === "data"){
      barrier.classList.remove("show");
      await pulseOnce("api->data","response");
      await pulseOnce("data->api","response");
      await delay();
    } else {
      await delay();
    }
  }
}

// ====== UI events ======
toggleRun.addEventListener("click", () => {
  if(running){
    stopLoop();
    return;
  }
  runLoop();
});

resetBtn.addEventListener("click", () => {
  stopLoop();
  clearActive();
  selected = null;
  applyTech(reqSelect.value);
});

reqSelect.addEventListener("change", () => {
  stopLoop();
  applyTech(reqSelect.value);
});

nodes.forEach(n => {
  n.addEventListener("click", () => {
    nodeLoop(n.dataset.node);
  });
});

// Init
applyTech(reqSelect.value);
