const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const ui = {
  methodVal: $("#methodVal"),
  endpointVal: $("#endpointVal"),
  statusVal: $("#statusVal"),
  explainText: $("#explainText"),
  stepNow: $("#stepNow"),
  stepTotal: $("#stepTotal"),
  dots: $("#dots"),
  nextBtn: $("#nextBtn"),
  resetBtn: $("#resetBtn"),

  nodeApp: $("#nodeApp"),
  nodeApi: $("#nodeApi"),
  nodeServer: $("#nodeServer"),
  nodeDb: $("#nodeDb"),

  pulseReq: $("#pulseRequest"),
  pulseRes: $("#pulseResponse"),

  // paths
  p_app_api: $("#path_app_api"),
  p_api_server: $("#path_api_server"),
  p_server_db: $("#path_server_db"),
  p_db_api: $("#path_db_api"),
  p_api_app: $("#path_api_app"),
};

const state = {
  scenarioKey: "look",
  step: 0,
  running: false,
  total: 7,
  rafId: null,
};

const scenarios = {
  // GET
  look: {
    friendly: "Titta på meny",
    method: "GET",
    endpoint: "/menu/items/42",
    frames: [
      {
        focus: "app",
        status: "—",
        pulse: null,
        text: "Användaren trycker på något i appen. Appen ska be om information.",
      },
      {
        focus: "app",
        status: "Appen frågar…",
        pulse: { type: "request", path: "p_app_api" },
        text: "Appen skickar en fråga: “Kan jag få info om det här?”",
      },
      {
        focus: "api",
        status: "API skickar vidare…",
        pulse: { type: "request", path: "p_api_server" },
        text: "API:t tar emot frågan och skickar den till rätt server.",
      },
      {
        focus: "server",
        status: "Servern hämtar data…",
        pulse: { type: "request", path: "p_server_db" },
        text: "Servern behöver data – den frågar databasen.",
      },
      {
        focus: "db",
        status: "Databasen svarar…",
        pulse: { type: "response", path: "p_db_api" },
        text: "Databasen skickar tillbaka informationen.",
      },
      {
        focus: "api",
        status: "Svar på väg…",
        pulse: { type: "response", path: "p_api_app" },
        text: "API:t skickar svaret tillbaka till appen.",
      },
      {
        focus: "app",
        status: "Klart ✅",
        pulse: null,
        text: "Appen visar informationen för användaren.",
      },
    ],
  },

  // POST
  order: {
    friendly: "Skicka beställning",
    method: "POST",
    endpoint: "/orders",
    frames: [
      {
        focus: "app",
        status: "—",
        pulse: null,
        text: "Användaren trycker “Beställ”. Appen förbereder vad som ska skickas.",
      },
      {
        focus: "app",
        status: "Appen skickar…",
        pulse: { type: "request", path: "p_app_api" },
        text: "Appen skickar: “Här är min beställning.”",
      },
      {
        focus: "api",
        status: "API skickar vidare…",
        pulse: { type: "request", path: "p_api_server" },
        text: "API:t ser till att beställningen når servern.",
      },
      {
        focus: "server",
        status: "Servern sparar…",
        pulse: { type: "request", path: "p_server_db" },
        text: "Servern skapar ordern och sparar den i databasen.",
      },
      {
        focus: "db",
        status: "Databasen bekräftar…",
        pulse: { type: "response", path: "p_db_api" },
        text: "Databasen säger: “Sparat!”",
      },
      {
        focus: "api",
        status: "Svar på väg…",
        pulse: { type: "response", path: "p_api_app" },
        text: "API:t skickar bekräftelsen tillbaka till appen.",
      },
      {
        focus: "app",
        status: "Klart ✅",
        pulse: null,
        text: "Appen visar: “Din beställning är mottagen.”",
      },
    ],
  },

  // PUT
  edit: {
    friendly: "Ändra profil",
    method: "PUT",
    endpoint: "/profile",
    frames: [
      { focus: "app", status: "—", pulse: null, text: "Användaren ändrar något och trycker “Spara”." },
      { focus: "app", status: "Appen skickar…", pulse: { type: "request", path: "p_app_api" }, text: "Appen skickar: “Uppdatera min profil så här.”" },
      { focus: "api", status: "API skickar vidare…", pulse: { type: "request", path: "p_api_server" }, text: "API:t skickar uppdateringen till servern." },
      { focus: "server", status: "Servern uppdaterar…", pulse: { type: "request", path: "p_server_db" }, text: "Servern sparar ändringen i databasen." },
      { focus: "db", status: "Databasen bekräftar…", pulse: { type: "response", path: "p_db_api" }, text: "Databasen säger: “Uppdaterat!”" },
      { focus: "api", status: "Svar på väg…", pulse: { type: "response", path: "p_api_app" }, text: "API:t skickar svaret tillbaka." },
      { focus: "app", status: "Klart ✅", pulse: null, text: "Appen visar den uppdaterade profilen." },
    ],
  },

  // DELETE
  remove: {
    friendly: "Ta bort order",
    method: "DELETE",
    endpoint: "/orders/42",
    frames: [
      { focus: "app", status: "—", pulse: null, text: "Användaren trycker “Ta bort”." },
      { focus: "app", status: "Appen skickar…", pulse: { type: "request", path: "p_app_api" }, text: "Appen skickar: “Ta bort den här.”" },
      { focus: "api", status: "API skickar vidare…", pulse: { type: "request", path: "p_api_server" }, text: "API:t skickar uppdraget till servern." },
      { focus: "server", status: "Servern tar bort…", pulse: { type: "request", path: "p_server_db" }, text: "Servern ber databasen att radera." },
      { focus: "db", status: "Databasen bekräftar…", pulse: { type: "response", path: "p_db_api" }, text: "Databasen säger: “Borttagen!”" },
      { focus: "api", status: "Svar på väg…", pulse: { type: "response", path: "p_api_app" }, text: "API:t skickar svaret tillbaka." },
      { focus: "app", status: "Klart ✅", pulse: null, text: "Appen uppdaterar listan så att den är borta." },
    ],
  },
};

function buildDots(count) {
  ui.dots.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "dotStep";
    ui.dots.appendChild(el);
  }
}

function setScenario(key) {
  state.scenarioKey = key;
  state.step = 0;
  state.running = false;

  const s = scenarios[key];
  ui.methodVal.textContent = s.method;
  ui.endpointVal.textContent = s.endpoint;
  ui.statusVal.textContent = "—";
  ui.explainText.textContent = "Välj ett exempel och tryck Nästa.";

  ui.stepTotal.textContent = String(state.total);
  ui.stepNow.textContent = "0";

  clearFocus();
  stopPulse();
  updateDots();
  ui.nextBtn.textContent = "Nästa";
}

function clearFocus() {
  [ui.nodeApp, ui.nodeApi, ui.nodeServer, ui.nodeDb].forEach((n) => n.classList.remove("isFocus"));
}
function focus(which) {
  clearFocus();
  const map = { app: ui.nodeApp, api: ui.nodeApi, server: ui.nodeServer, db: ui.nodeDb };
  map[which]?.classList.add("isFocus");
}

function updateDots() {
  const dots = $$(".dotStep");
  dots.forEach((d, i) => {
    d.classList.remove("active", "done");
    if (i < state.step - 1) d.classList.add("done");
    if (i === state.step - 1) d.classList.add("active");
  });
}

function stopPulse() {
  if (state.rafId) cancelAnimationFrame(state.rafId);
  state.rafId = null;
  ui.pulseReq.style.opacity = "0";
  ui.pulseRes.style.opacity = "0";
  ui.pulseReq.setAttribute("cx", -20);
  ui.pulseReq.setAttribute("cy", -20);
  ui.pulseRes.setAttribute("cx", -20);
  ui.pulseRes.setAttribute("cy", -20);
}

function easeInOut(t) {
  // smooth
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function animatePulse({ type, pathKey }, durationMs = 850) {
  stopPulse();

  const path = ui[pathKey];
  if (!path) return;

  const dot = type === "response" ? ui.pulseRes : ui.pulseReq;
  dot.style.opacity = "1";

  const len = path.getTotalLength();
  const start = performance.now();

  const tick = (now) => {
    const tRaw = (now - start) / durationMs;
    const t = Math.min(1, Math.max(0, tRaw));
    const e = easeInOut(t);

    const pt = path.getPointAtLength(e * len);
    dot.setAttribute("cx", pt.x);
    dot.setAttribute("cy", pt.y);

    // fade out near end
    if (t > 0.85) {
      dot.style.opacity = String(1 - (t - 0.85) / 0.15);
    }

    if (t < 1) {
      state.rafId = requestAnimationFrame(tick);
    } else {
      dot.style.opacity = "0";
      state.rafId = null;
    }
  };

  state.rafId = requestAnimationFrame(tick);
}

function applyFrame() {
  const s = scenarios[state.scenarioKey];
  const frame = s.frames[state.step - 1];

  focus(frame.focus);
  ui.statusVal.textContent = frame.status;
  ui.explainText.textContent = frame.text;

  if (frame.pulse) {
    animatePulse({
      type: frame.pulse.type,
      pathKey: frame.pulse.path,
    });
  } else {
    stopPulse();
  }
}

async function next() {
  if (state.running) return;
  state.running = true;

  if (state.step >= state.total) {
    // replay
    reset();
    state.running = false;
    return;
  }

  state.step += 1;
  ui.stepNow.textContent = String(state.step);
  updateDots();
  applyFrame();

  // liten “debounce” så det känns stabilt på mobil
  await new Promise((r) => setTimeout(r, 250));
  state.running = false;

  if (state.step >= state.total) ui.nextBtn.textContent = "Kör igen";
}

function reset() {
  state.step = 0;
  ui.stepNow.textContent = "0";
  ui.statusVal.textContent = "—";
  ui.explainText.textContent = "Välj ett exempel och tryck Nästa.";
  ui.nextBtn.textContent = "Nästa";
  clearFocus();
  stopPulse();
  updateDots();
}

// Buttons + tabs
ui.nextBtn.addEventListener("click", next);
ui.resetBtn.addEventListener("click", reset);

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

// Init
(function init() {
  state.total = 7;
  buildDots(state.total);
  setScenario("look");
})();
