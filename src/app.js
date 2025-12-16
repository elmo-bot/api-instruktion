const reel = document.getElementById("reel");
const stage = document.querySelector(".stage");
const nodes = Array.from(document.querySelectorAll(".node"));
const barrier = document.getElementById("barrier");

const headline = document.getElementById("headline");
const subhead = document.getElementById("subhead");

const toggleMode = document.getElementById("toggleMode");
const playDemo = document.getElementById("playDemo");
const filmMode = document.getElementById("filmMode");

const steps = Array.from(document.querySelectorAll(".step"));
const capTitle = document.getElementById("capTitle");
const capText = document.getElementById("capText");

const packet = document.getElementById("packet");
const pktTitle = document.getElementById("pktTitle");
const pktSub = document.getElementById("pktSub");
const pktPill = document.getElementById("pktPill");

const sendReq = document.getElementById("sendReq");
const sendRes = document.getElementById("sendRes");
const resetBtn = document.getElementById("reset");

const wires = document.querySelector(".wires");
const wire1 = document.getElementById("wire1");
const wire2 = document.getElementById("wire2");
const wire3 = document.getElementById("wire3");
const wire4 = document.getElementById("wire4");

let mode = "interactive"; // interactive | focus
let runningDemo = false;
let timers = [];

function clearTimers(){ timers.forEach(t => clearTimeout(t)); timers = []; }

function setCaption(t, x){ capTitle.textContent = t; capText.textContent = x; }
function setHeader(h, s){ headline.textContent = h; subhead.textContent = s; }

function clearActive(){
  nodes.forEach(n => n.classList.remove("active"));
  stage.classList.remove("dim");
}

function focusNode(key){
  clearActive();
  stage.classList.add("dim");
  const el = nodes.find(n => n.dataset.node === key);
  if(el){ el.classList.add("active"); }
}

function overview(){
  clearActive();
  barrier.classList.remove("show");
  packet.className = "packet";
  packet.style.opacity = "0";
  setHeader("Klicka runt: en sak i taget", "Välj steg eller tryck på en ruta för att fokusera. Perfekt att skärminspela.");
  setCaption("Översikt", "Tryck på en ruta eller välj ett steg.");
  wires.classList.remove("hot","warm","ok");
  [wire1,wire2,wire3,wire4].forEach(w => w.setAttribute("class",""));
  steps.forEach(s => s.classList.remove("on"));
}

function setStep(n){
  steps.forEach(s => s.classList.toggle("on", s.dataset.step === String(n)));

  if(n === 0){
    overview();
    return;
  }

  // Always show barrier in step 3
  barrier.classList.toggle("show", n === 3);

  if(n === 1){
    focusNode("guest");
    setHeader("Steg 1: Du beställer", "Appen är menyn. Du väljer vad du vill ha.");
    setCaption("Steg 1", "Du beställer via appen – som att välja från en meny.");
    wire4.setAttribute("class","ok");
    [wire1,wire2,wire3].forEach(w => w.setAttribute("class",""));
  }
  if(n === 2){
    focusNode("api");
    setHeader("Steg 2: API tar emot", "API är mellanhanden som vet hur man pratar med servern.");
    setCaption("Steg 2", "API tar din förfrågan och skickar den vidare på rätt sätt.");
    wire1.setAttribute("class","warm");
    wire2.setAttribute("class","warm");
    [wire3,wire4].forEach(w => w.setAttribute("class",""));
  }
  if(n === 3){
    focusNode("server");
    setHeader("Steg 3: Servern är köket", "Du får inte gå in i köket. API sköter kontakten.");
    setCaption("Steg 3", "Servern skyddas. Du får bara det du får lov att se via API.");
    wire2.setAttribute("class","hot");
    [wire1,wire3,wire4].forEach(w => w.setAttribute("class",""));
  }
  if(n === 4){
    focusNode("data");
    setHeader("Steg 4: Svaret tillbaka", "API levererar svaret till appen.");
    setCaption("Steg 4", "Du får ett svar tillbaka – exakt det du bad om.");
    wire3.setAttribute("class","ok");
    [wire1,wire2,wire4].forEach(w => w.setAttribute("class",""));
  }
}

function showPacket(){
  packet.classList.add("show");
  packet.style.opacity = "1";
}

function movePacket(state){
  // state: pGuest, pApi, pServer, pBack
  packet.classList.remove("pGuest","pApi","pServer","pBack");
  packet.classList.add(state);
}

function requestFlow(){
  showPacket();
  pktTitle.textContent = "Request";
  pktSub.textContent = "Hämta “hamburgare”";
  pktPill.textContent = "GET";
  movePacket("pGuest");
  setCaption("Request", "Förfrågan skickas…");
  // move
  timers.push(setTimeout(()=> { movePacket("pApi"); setCaption("API", "API tar emot requesten."); }, 700));
  timers.push(setTimeout(()=> { barrier.classList.add("show"); movePacket("pServer"); setCaption("Server", "API hämtar från servern (köket)."); }, 1500));
}

function responseFlow(){
  showPacket();
  pktTitle.textContent = "Response";
  pktSub.textContent = "Här är det du bad om";
  pktPill.textContent = "200";
  movePacket("pServer");
  setCaption("Response", "Svaret går tillbaka…");
  timers.push(setTimeout(()=> { movePacket("pApi"); setCaption("API", "API paketerar svaret."); }, 700));
  timers.push(setTimeout(()=> { movePacket("pBack"); setCaption("App", "Svaret levereras till appen."); }, 1500));
}

function runDemo(){
  if(runningDemo) return;
  runningDemo = true;
  clearTimers();
  setStep(1);

  timers.push(setTimeout(()=> setStep(2), 1600));
  timers.push(setTimeout(()=> setStep(3), 3200));
  timers.push(setTimeout(()=> setStep(4), 4800));

  timers.push(setTimeout(()=> {
    clearTimers();
    requestFlow();
  }, 6400));

  timers.push(setTimeout(()=> {
    clearTimers();
    responseFlow();
  }, 8900));

  timers.push(setTimeout(()=> {
    runningDemo = false;
    setCaption("Klart", "Nu kan du klicka runt fritt och förklara medan du spelar in.");
  }, 11200));
}

// Icons (inline SVG)
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

// Events
nodes.forEach(n => {
  n.addEventListener("click", () => {
    if(runningDemo) return;
    focusNode(n.dataset.node);
    setCaption("Fokus", `Du tittar nu på: ${n.querySelector(".nodeTitle").innerText}.`);
  });
  n.addEventListener("keydown", (e) => {
    if(e.key === "Enter" || e.key === " "){
      e.preventDefault();
      n.click();
    }
  });
});

steps.forEach(s => s.addEventListener("click", () => {
  if(runningDemo) return;
  clearTimers();
  setStep(Number(s.dataset.step));
}));

toggleMode.addEventListener("click", () => {
  if(runningDemo) return;
  mode = (mode === "interactive") ? "focus" : "interactive";
  toggleMode.textContent = (mode === "interactive") ? "Interaktiv" : "Fokus";
  if(mode === "focus"){
    stage.classList.add("dim");
    setCaption("Fokusläge", "Tryck på en ruta för att få den i fokus.");
  } else {
    stage.classList.remove("dim");
    setCaption("Interaktivt", "Klicka runt och berätta i din egen takt.");
  }
});

playDemo.addEventListener("click", () => {
  clearTimers();
  overview();
  runDemo();
});

filmMode.addEventListener("click", () => {
  reel.classList.toggle("film");
});

sendReq.addEventListener("click", () => {
  if(runningDemo) return;
  clearTimers();
  requestFlow();
});

sendRes.addEventListener("click", () => {
  if(runningDemo) return;
  clearTimers();
  responseFlow();
});

resetBtn.addEventListener("click", () => {
  clearTimers();
  runningDemo = false;
  overview();
});

// Initial
overview();
