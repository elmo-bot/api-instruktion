const scenarioSel = document.getElementById("scenario");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

const title = document.getElementById("title");
const desc = document.getElementById("desc");
const tMethod = document.getElementById("tMethod");
const tEndpoint = document.getElementById("tEndpoint");
const tStatus = document.getElementById("tStatus");

const dotsEl = document.getElementById("dots");
const stepText = document.getElementById("stepText");

const nApp = document.getElementById("n-app");
const nApi = document.getElementById("n-api");
const nServer = document.getElementById("n-server");
const nDb = document.getElementById("n-db");

const response = document.getElementById("response");
const respText = document.getElementById("respText");
const respCode = document.getElementById("respCode");

const pulseLayer = document.getElementById("pulseLayer");

// Geometry paths
const geom = {
  "app->api": document.getElementById("g-app-api"),
  "api->server": document.getElementById("g-api-server"),
  "server->db": document.getElementById("g-server-db"),
  "db->server": document.getElementById("g-db-server"),
  "server->api": document.getElementById("g-server-api"),
  "api->app": document.getElementById("g-api-app"),
};

function clearActive(){
  [nApp,nApi,nServer,nDb].forEach(n=>n.classList.remove("active"));
}
function showResponse(show, text="200 OK", code="200"){
  response.classList.toggle("show", show);
  response.setAttribute("aria-hidden", show ? "false" : "true");
  respText.textContent = text;
  respCode.textContent = code;
}

function removePulseStrokes(){
  pulseLayer.querySelectorAll(".pulseStroke, .glowStroke").forEach(e => e.remove());
}

function colors(kind){
  if(kind === "request") return { main:"rgba(255,204,102,.95)", glow:"rgba(255,204,102,.42)" };
  if(kind === "response") return { main:"rgba(56,209,122,.95)", glow:"rgba(56,209,122,.42)" };
  return { main:"rgba(124,92,255,.95)", glow:"rgba(124,92,255,.42)" };
}

// One pulse, always the same behavior (no “modes”)
function pulseOnce(key, kind="neutral", duration=880){
  const base = geom[key];
  if(!base) return Promise.resolve();

  removePulseStrokes();

  const { main, glow } = colors(kind);
  const len = base.getTotalLength();

  const dashA = Math.max(10, len * 0.20);
  const dashB = len;

  // Glow stroke
  const g = base.cloneNode(true);
  g.removeAttribute("id");
  g.classList.add("glowStroke");
  g.style.fill = "none";
  g.style.stroke = glow;
  g.style.strokeWidth = "3.4";
  g.style.strokeLinecap = "round";
  g.style.filter = "url(#glow)";
  g.style.strokeDasharray = `${dashA} ${dashB}`;
  g.style.strokeDashoffset = `${len}`;
  g.style.opacity = "0";
  pulseLayer.appendChild(g);

  // Main stroke
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
    { strokeDashoffset: len * 0.84, opacity: 0.85 },
    { strokeDashoffset: 0, opacity: 0 }
  ], { duration: duration + 140, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });

  const a2 = s.animate([
    { strokeDashoffset: len, opacity: 0 },
    { strokeDashoffset: len * 0.90, opacity: 1 },
    { strokeDashoffset: 0, opacity: 0 }
  ], { duration, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });

  return Promise.all([a1.finished.catch(()=>{}), a2.finished.catch(()=>{})]).then(()=>{});
}

// Scenarios: same structure, different copy + tech
const scenarios = {
  burger: {
    method: "GET",
    endpoint: "/menu/items/42",
    status: "200 OK",
    responseText: "200 OK • { item: … }",
    responseCode: "200",
    steps: [
      { focus:"app",    title:"Du väljer något i appen", desc:"(metafor) du beställer via menyn.", tech:{method:"GET", endpoint:"/menu/items/42", status:"—"} },
      { focus:"app",    pulse:["app->api","neutral"],     title:"Appen skickar en förfrågan", desc:"API tar emot din request.", tech:{method:"GET", endpoint:"/menu/items/42", status:"—"} },
      { focus:"api",    pulse:["api->server","request"],  title:"API skickar vidare", desc:"Request skickas till servern.", tech:{method:"GET", endpoint:"/menu/items/42", status:"—"} },
      { focus:"server", pulse:["server->db","request"],   title:"Servern hämtar data", desc:"Servern frågar databasen.", tech:{method:"GET", endpoint:"/menu/items/42", status:"—"} },
      { focus:"db",     pulse:["db->server","response"],  title:"Databasen svarar", desc:"Data går tillbaka till servern.", tech:{method:"GET", endpoint:"/menu/items/42", status:"200 OK"} },
      { focus:"server", pulse:["server->api","response"], title:"Server → API", desc:"Servern skickar svaret tillbaka.", tech:{method:"GET", endpoint:"/menu/items/42", status:"200 OK"} },
      { focus:"api",    pulse:["api->app","response"],    title:"API → App", desc:"Appen får svaret den bad om.", tech:{method:"GET", endpoint:"/menu/items/42", status:"200 OK"} },
      { focus:"app",    done:true,                        title:"Klart", desc:"Nu kan appen visa innehållet för dig.", tech:{method:"GET", endpoint:"/menu/items/42", status:"200 OK"} },
    ]
  },

  uber: {
    method: "POST",
    endpoint: "/rides",
    status: "201 Created",
    responseText: "201 Created • { rideId: … }",
    responseCode: "201",
    steps: [
      { focus:"app",    title:"Du beställer en resa", desc:"(metafor) du säger vad du vill ha.", tech:{method:"POST", endpoint:"/rides", status:"—"} },
      { focus:"app",    pulse:["app->api","neutral"],     title:"App → API", desc:"Din beställning blir en request.", tech:{method:"POST", endpoint:"/rides", status:"—"} },
      { focus:"api",    pulse:["api->server","request"],  title:"API → Server", desc:"Servern tar emot och jobbar.", tech:{method:"POST", endpoint:"/rides", status:"—"} },
      { focus:"server", pulse:["server->db","request"],   title:"Servern sparar / matchar", desc:"Data skrivs/uppdateras.", tech:{method:"POST", endpoint:"/rides", status:"—"} },
      { focus:"db",     pulse:["db->server","response"],  title:"Databas → Server", desc:"Resultat tillbaka.", tech:{method:"POST", endpoint:"/rides", status:"201 Created"} },
      { focus:"server", pulse:["server->api","response"], title:"Server → API", desc:"Svaret skickas tillbaka.", tech:{method:"POST", endpoint:"/rides", status:"201 Created"} },
      { focus:"api",    pulse:["api->app","response"],    title:"API → App", desc:"Appen kan visa bekräftelse.", tech:{method:"POST", endpoint:"/rides", status:"201 Created"} },
      { focus:"app",    done:true,                        title:"Klart", desc:"Du ser att resan är skapad.", tech:{method:"POST", endpoint:"/rides", status:"201 Created"} },
    ]
  },

  login: {
    method: "GET",
    endpoint: "/bookings (Authorization: Bearer …)",
    status: "200 OK",
    responseText: "200 OK • [ … ]",
    responseCode: "200",
    steps: [
      { focus:"app",    title:"Du vill se dina bokningar", desc:"(tekniskt) requesten behöver auth.", tech:{method:"GET", endpoint:"/bookings (auth)", status:"—"} },
      { focus:"app",    pulse:["app->api","neutral"],     title:"App → API", desc:"Request skickas med token.", tech:{method:"GET", endpoint:"/bookings (auth)", status:"—"} },
      { focus:"api",    pulse:["api->server","request"],  title:"API → Server", desc:"Servern verifierar behörighet.", tech:{method:"GET", endpoint:"/bookings (auth)", status:"—"} },
      { focus:"server", pulse:["server->db","request"],   title:"Server → Databas", desc:"Servern hämtar bokningar.", tech:{method:"GET", endpoint:"/bookings (auth)", status:"—"} },
      { focus:"db",     pulse:["db->server","response"],  title:"Databas → Server", desc:"Bokningar returneras.", tech:{method:"GET", endpoint:"/bookings (auth)", status:"200 OK"} },
      { focus:"server", pulse:["server->api","response"], title:"Server → API", desc:"Svaret går tillbaka.", tech:{method:"GET", endpoint:"/bookings (auth)", status:"200 OK"} },
      { focus:"api",    pulse:["api->app","response"],    title:"API → App", desc:"Appen får listan.", tech:{method:"GET", endpoint:"/bookings (auth)", status:"200 OK"} },
      { focus:"app",    done:true,                        title:"Klart", desc:"Nu kan appen visa dina bokningar.", tech:{method:"GET", endpoint:"/bookings (auth)", status:"200 OK"} },
    ]
  }
};

let currentKey = scenarioSel.value;
let step = 0;
let busy = false;

function buildDots(count){
  dotsEl.innerHTML = "";
  for(let i=0;i<count;i++){
    const d = document.createElement("div");
    d.className = "dot";
    dotsEl.appendChild(d);
  }
}

function renderStep(){
  const sc = scenarios[currentKey];
  const steps = sc.steps;

  // UI state
  const total = steps.length;
  stepText.textContent = `Steg ${Math.min(step+1,total)}/${total}`;

  // dots
  const dots = Array.from(dotsEl.children);
  dots.forEach((d,i)=> d.classList.toggle("on", i === step));

  // buttons
  prevBtn.disabled = (step === 0 || busy);
  nextBtn.disabled = busy;

  if(step >= total-1){
    nextBtn.textContent = "Spela igen";
  } else {
    nextBtn.textContent = "Nästa";
  }

  // response visibility
  showResponse(false);
}

function applyCopy(s){
  title.textContent = s.title;
  desc.textContent = s.desc;
  tMethod.textContent = s.tech?.method ?? "—";
  tEndpoint.textContent = s.tech?.endpoint ?? "—";
  tStatus.textContent = s.tech?.status ?? "—";
}

function focusNode(key){
  clearActive();
  if(key === "app") nApp.classList.add("active");
  if(key === "api") nApi.classList.add("active");
  if(key === "server") nServer.classList.add("active");
  if(key === "db") nDb.classList.add("active");
}

async function runCurrentStep(){
  const sc = scenarios[currentKey];
  const s = sc.steps[step];

  applyCopy(s);
  focusNode(s.focus);

  // If done step: show response card (wow, but clear)
  if(s.done){
    showResponse(true, sc.responseText, sc.responseCode);
    return;
  }

  // One pulse at a time
  if(s.pulse){
    const [pathKey, kind] = s.pulse;
    await pulseOnce(pathKey, kind);
  }
}

function resetScenario(){
  busy = false;
  removePulseStrokes();
  showResponse(false);
  step = 0;

  const sc = scenarios[currentKey];
  buildDots(sc.steps.length);

  // set initial tech preview
  tMethod.textContent = sc.method;
  tEndpoint.textContent = sc.endpoint;
  tStatus.textContent = "—";

  // set initial copy
  title.textContent = "Välj scenario och tryck Nästa";
  desc.textContent = "En puls i taget visar exakt hur request → response går.";

  clearActive();
  renderStep();
}

scenarioSel.addEventListener("change", () => {
  currentKey = scenarioSel.value;
  resetScenario();
});

prevBtn.addEventListener("click", async () => {
  if(busy || step === 0) return;
  busy = true;
  removePulseStrokes();
  showResponse(false);
  step = Math.max(0, step - 1);
  renderStep();
  await runCurrentStep();
  busy = false;
  renderStep();
});

nextBtn.addEventListener("click", async () => {
  if(busy) return;

  const sc = scenarios[currentKey];
  const total = sc.steps.length;

  // Replay at end
  if(step >= total - 1){
    resetScenario();
    return;
  }

  busy = true;
  removePulseStrokes();
  showResponse(false);

  renderStep();
  await runCurrentStep();

  // advance after animation/copy applied
  step = Math.min(total - 1, step + 1);
  renderStep();

  busy = false;
  renderStep();
});

// init
resetScenario();
