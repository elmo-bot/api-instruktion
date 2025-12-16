const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const state = {
  scenario: "get",
  step: 0,
  totalSteps: 8,
  running: false,
};

const scenarios = {
  get: {
    method: "GET",
    endpoint: "/menu/items/42",
    story: [
      { focus: "app", pulse: null, status: "—", text: "Användaren öppnar appen och trycker “Visa detalj”. Appen förbereder en fråga." },
      { focus: "app", pulse: "req1", status: "Skickar...", text: "Appen skickar en request: “Kan jag få info om denna sak?”" },
      { focus: "api", pulse: "req1", status: "Skickar...", text: "API:t tar emot frågan och ser till att den går till rätt server." },
      { focus: "api", pulse: "req2", status: "Skickar...", text: "API:t skickar vidare frågan till servern (som gör jobbet)." },
      { focus: "server", pulse: "req2", status: "Jobbar...", text: "Servern förstår vad som efterfrågas och behöver hämta data." },
      { focus: "server", pulse: "req3", status: "Jobbar...", text: "Servern frågar databasen efter rätt information." },
      { focus: "db", pulse: "res1", status: "Svarar...", text: "Databasen skickar tillbaka datan till servern." },
      { focus: "api", pulse: "res2", status: "Klart ✅", text: "Servern skickar svaret via API:t tillbaka till appen. Appen visar resultatet för användaren." },
    ],
  },

  post: {
    method: "POST",
    endpoint: "/orders",
    story: [
      { focus: "app", pulse: null, status: "—", text: "Användaren trycker “Beställ”. Appen samlar ihop vad som ska skickas." },
      { focus: "app", pulse: "req1", status: "Skickar...", text: "Appen skickar en request: “Här är min beställning.”" },
      { focus: "api", pulse: "req1", status: "Skickar...", text: "API:t tar emot och kontrollerar att allt är i rätt format." },
      { focus: "api", pulse: "req2", status: "Skickar...", text: "API:t skickar vidare beställningen till servern." },
      { focus: "server", pulse: "req2", status: "Jobbar...", text: "Servern skapar en ny order och behöver spara den." },
      { focus: "server", pulse: "req3", status: "Jobbar...", text: "Servern sparar beställningen i databasen." },
      { focus: "db", pulse: "res1", status: "Svarar...", text: "Databasen bekräftar att allt sparats." },
      { focus: "api", pulse: "res2", status: "Klart ✅", text: "Servern skickar bekräftelse via API:t tillbaka till appen. Appen visar “Order skapad”." },
    ],
  },

  put: {
    method: "PUT",
    endpoint: "/profile",
    story: [
      { focus: "app", pulse: null, status: "—", text: "Användaren ändrar sin profil och trycker “Spara”." },
      { focus: "app", pulse: "req1", status: "Skickar...", text: "Appen skickar en request: “Uppdatera min profil med detta.”" },
      { focus: "api", pulse: "req1", status: "Skickar...", text: "API:t tar emot uppdateringen och skickar den rätt." },
      { focus: "api", pulse: "req2", status: "Skickar...", text: "API:t skickar vidare till servern." },
      { focus: "server", pulse: "req2", status: "Jobbar...", text: "Servern uppdaterar informationen." },
      { focus: "server", pulse: "req3", status: "Jobbar...", text: "Servern sparar ändringen i databasen." },
      { focus: "db", pulse: "res1", status: "Svarar...", text: "Databasen bekräftar uppdateringen." },
      { focus: "api", pulse: "res2", status: "Klart ✅", text: "Servern skickar svaret via API:t till appen. Appen visar den nya profilen." },
    ],
  },

  delete: {
    method: "DELETE",
    endpoint: "/orders/42",
    story: [
      { focus: "app", pulse: null, status: "—", text: "Användaren trycker “Ta bort”. Appen frågar systemet att radera något." },
      { focus: "app", pulse: "req1", status: "Skickar...", text: "Appen skickar en request: “Ta bort detta.”" },
      { focus: "api", pulse: "req1", status: "Skickar...", text: "API:t tar emot och skickar borttagnings-uppdraget vidare." },
      { focus: "api", pulse: "req2", status: "Skickar...", text: "API:t skickar vidare till servern." },
      { focus: "server", pulse: "req2", status: "Jobbar...", text: "Servern förbereder borttagningen." },
      { focus: "server", pulse: "req3", status: "Jobbar...", text: "Servern ber databasen att radera posten." },
      { focus: "db", pulse: "res1", status: "Svarar...", text: "Databasen bekräftar att posten är borttagen." },
      { focus: "api", pulse: "res2", status: "Klart ✅", text: "Servern skickar “borttagen” via API:t till appen. Appen uppdaterar listan." },
    ],
  },
};

// --- UI refs
const methodVal = $("#methodVal");
const endpointVal = $("#endpointVal");
const statusVal = $("#statusVal");
const explainText = $("#explainText");
const stepNow = $("#stepNow");
const stepTotal = $("#stepTotal");
const dotsWrap = $("#dots");

const nextBtn = $("#nextBtn");
const resetBtn = $("#resetBtn");

const nodeApp = $("#nodeApp");
const nodeApi = $("#nodeApi");
const nodeServer = $("#nodeServer");
const nodeDb = $("#nodeDb");

const pulseReq1 = $("#pulseReq1");
const pulseReq2 = $("#pulseReq2");
const pulseReq3 = $("#pulseReq3");
const pulseRes1 = $("#pulseRes1");
const pulseRes2 = $("#pulseRes2");

function buildDots(total) {
  dotsWrap.innerHTML = "";
  for (let i = 0; i < total; i++) {
    const d = document.createElement("div");
    d.className = "dot";
    dotsWrap.appendChild(d);
  }
}

function setScenario(key) {
  state.scenario = key;
  state.step = 0;
  state.running = false;

  const s = scenarios[key];
  methodVal.textContent = s.method;
  endpointVal.textContent = s.endpoint;
  statusVal.textContent = "—";
  explainText.textContent = "Tryck Nästa för att starta resan.";

  updateStepper();
  clearFocus();
  stopAllPulses();
}

function clearFocus() {
  [nodeApp, nodeApi, nodeServer, nodeDb].forEach((n) => n.classList.remove("isFocus"));
}

function focusNode(which) {
  clearFocus();
  const map = { app: nodeApp, api: nodeApi, server: nodeServer, db: nodeDb };
  map[which]?.classList.add("isFocus");
}

function stopAllPulses() {
  [pulseReq1, pulseReq2, pulseReq3, pulseRes1, pulseRes2].forEach((p) => {
    p.classList.remove("run");
    // force reflow-safe reset
    p.style.animation = "none";
    p.offsetHeight; // eslint-disable-line no-unused-expressions
    p.style.animation = "";
  });
}

function runPulse(name) {
  stopAllPulses();
  const map = {
    req1: pulseReq1,
    req2: pulseReq2,
    req3: pulseReq3,
    res1: pulseRes1,
    res2: pulseRes2,
  };
  const p = map[name];
  if (!p) return;
  p.classList.add("run");
}

function updateStepper() {
  stepTotal.textContent = String(state.totalSteps);
  stepNow.textContent = String(state.step);

  const dots = $$(".dot");
  dots.forEach((d, i) => {
    d.classList.remove("active", "done");
    if (i < state.step - 1) d.classList.add("done");
    if (i === state.step - 1) d.classList.add("active");
  });
}

function applyStep() {
  const s = scenarios[state.scenario];
  const idx = Math.max(0, Math.min(state.step - 1, s.story.length - 1));
  const frame = s.story[idx];

  focusNode(frame.focus);
  statusVal.textContent = frame.status;
  explainText.textContent = frame.text;

  if (frame.pulse) runPulse(frame.pulse);
  else stopAllPulses();
}

async function next() {
  if (state.running) return;
  state.running = true;

  const s = scenarios[state.scenario];

  // step 0 -> step 1: start
  if (state.step < state.totalSteps) {
    state.step += 1;
    updateStepper();
    applyStep();

    // small lock so animations feel clean
    await new Promise((r) => setTimeout(r, 520));
  }

  // if finished, keep last state and unlock
  if (state.step >= state.totalSteps) {
    nextBtn.textContent = "Kör igen";
    state.running = false;
    return;
  }

  nextBtn.textContent = "Nästa";
  state.running = false;
}

function resetAll() {
  state.step = 0;
  state.running = false;
  statusVal.textContent = "—";
  explainText.textContent = "Välj scenario och tryck Nästa för att starta.";
  nextBtn.textContent = "Nästa";
  updateStepper();
  clearFocus();
  stopAllPulses();
}

// Segmented scenario
$$(".segBtn").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$(".segBtn").forEach((b) => {
      b.classList.remove("isActive");
      b.setAttribute("aria-selected", "false");
    });
    btn.classList.add("isActive");
    btn.setAttribute("aria-selected", "true");
    setScenario(btn.dataset.scenario);
  });
});

// Buttons
nextBtn.addEventListener("click", () => {
  // If finished, restart same scenario
  if (state.step >= state.totalSteps) {
    resetAll();
    return;
  }
  next();
});
resetBtn.addEventListener("click", resetAll);

// Init
(function init() {
  state.totalSteps = 8;
  buildDots(state.totalSteps);
  setScenario("get");
  updateStepper();
})();
