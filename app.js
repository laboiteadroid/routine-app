/***********************
 * Routine App JS v5 MODAL EDIT
 ************************/

/* =====================
   STATE
   ===================== */
let steps = Array(11).fill(null);
let lastCompletedStep = 0;

/* =====================
   STEP NAMES
   ===================== */
const stepNames = [
  "",
  "Start wake-up",
  "Out of bed",
  "In Bathroom",
  "Finished ready",
  "In kitchen",
  "Sitting down for breakfast",
  "Finish eating",
  "In Bathroom teeth",
  "Finish brushing teeth",
  "Out of bathroom - Kitchen"
];

/* =====================
   INIT
   ===================== */
window.addEventListener("load", () => {

  // Restore routine
  const saved = localStorage.getItem("currentRoutine");
  if (saved) {
    steps = JSON.parse(saved);
    for (let i = 10; i >= 1; i--) {
      if (steps[i]) {
        lastCompletedStep = i;
        break;
      }
    }
  }

  restoreDailyInputs();
  updateUI();
  updateCurrentStep();
  restoreDeltas();
  initEditModal();
  checkAutoSave();

  ["sleepTime", "sleepScore", "dailyNote"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", saveDailyInputs);
  });
});

/* =====================
   TIME UTILS
   ===================== */
function parseFrenchTime(t) {
  if (!t) return null;
  const p = t.replace(" h ", ":").split(":");
  return { hour: Number(p[0]), minute: Number(p[1]) };
}

function nowFormatted() {
  return new Date().toLocaleTimeString("fr-CA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(":", " h ");
}

function minutesToHours(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h.toString().padStart(2, "0")} h ${m.toString().padStart(2, "0")} min`;
}

/* =====================
   CURRENT STEP
   ===================== */
function updateCurrentStep() {
  const el = document.getElementById("focusStep");
  if (!el) return;

  if (lastCompletedStep === 0) el.textContent = stepNames[1];
  else if (lastCompletedStep === 10) el.textContent = "Routine finished";
  else el.textContent = stepNames[lastCompletedStep + 1];
}

/* =====================
   RECORD STEP
   ===================== */
function recordTime(stepNumber) {
  if (steps[stepNumber]) return;
  if (stepNumber !== lastCompletedStep + 1) return;

  steps[stepNumber] = nowFormatted();
  lastCompletedStep = stepNumber;

  localStorage.setItem("currentRoutine", JSON.stringify(steps));

  updateUI();
  updateCurrentStep();
  restoreDeltas();
  initEditModal();
  checkAutoSave();
}

/* =====================
   AUTO SAVE
   ===================== */
function checkAutoSave() {
  if (lastCompletedStep === 10 && !localStorage.getItem("routineSaved")) {
    localStorage.setItem("routineSaved", "true");
    saveToHistory();
  }
}

/* =====================
   UI UPDATE
   ===================== */
function updateUI() {
  for (let i = 1; i <= 10; i++) {
    const timeEl = document.getElementById(`time-${i}`);
    const stepEl = timeEl?.closest(".step");

    if (timeEl) timeEl.textContent = steps[i] || "--:--";
    if (!stepEl) continue;

    stepEl.classList.remove("done", "active", "future");

    if (steps[i]) stepEl.classList.add("done");
    else if (i === lastCompletedStep + 1) stepEl.classList.add("active");
    else stepEl.classList.add("future");
  }
}

/* =====================
   DELTAS
   ===================== */
function restoreDeltas() {
  for (let i = 2; i <= 10; i++) {
    const a = parseFrenchTime(steps[i - 1]);
    const b = parseFrenchTime(steps[i]);
    if (!a || !b) continue;

    const s = new Date();
    const e = new Date();
    s.setHours(a.hour, a.minute, 0);
    e.setHours(b.hour, b.minute, 0);

    let diff = e - s;
    if (diff < 0) diff += 86400000;

    const m = Math.floor(diff / 60000);
    const el = document.getElementById(`delta-${i}`);
    if (el) el.textContent = `${m} min`;
  }
}

/* =====================
   EDIT MODAL
   ===================== */
function initEditModal() {
  const select = document.getElementById("editStep");
  if (!select) return;

  select.innerHTML = "";
  for (let i = 1; i <= 10; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `${i} – ${stepNames[i]}`;
    if (!steps[i]) opt.disabled = true; // désactiver les étapes non complétées
    select.appendChild(opt);
  }

  select.addEventListener("change", loadEditTime);
  loadEditTime();
}

function loadEditTime() {
  const step = Number(document.getElementById("editStep").value);
  const input = document.getElementById("editStepTime");

  if (!steps[step]) {
    input.value = "";
    return;
  }

  const t = parseFrenchTime(steps[step]);
  if (!t) return;

  input.value = t.hour.toString().padStart(2, "0") + ":" + t.minute.toString().padStart(2, "0");
}

function saveEdit() {
  const step = Number(document.getElementById("editStep").value);
  const input = document.getElementById("editStepTime").value;
  if (!input) return;

  const [h, m] = input.split(":");
  steps[step] = `${h} h ${m}`;

  localStorage.setItem("currentRoutine", JSON.stringify(steps));

  updateUI();
  restoreDeltas();
  updateCurrentStep();
}

/* =====================
   HISTORY
   ===================== */
function saveToHistory() {
  const history = JSON.parse(localStorage.getItem("history") || "[]");

  history.unshift({
    date: new Date().toLocaleDateString(),
    steps: [...steps],
    sleepTime: document.getElementById("sleepTime").value || "",
    sleepScore: document.getElementById("sleepScore").value || "",
    note: document.getElementById("dailyNote").value || ""
  });

  localStorage.setItem("history", JSON.stringify(history));
  resetRoutine();
}

/* =====================
   RESET
   ===================== */
function resetRoutine() {
  steps = Array(11).fill(null);
  lastCompletedStep = 0;

  localStorage.removeItem("currentRoutine");
  localStorage.removeItem("routineSaved");
  localStorage.removeItem("dailyInputs");

  updateUI();
  updateCurrentStep();
  initEditModal();

  for (let i = 2; i <= 10; i++) {
    const el = document.getElementById(`delta-${i}`);
    if (el) el.textContent = "";
  }

  document.getElementById("sleepTime").value = "";
  document.getElementById("sleepScore").value = "";
  document.getElementById("dailyNote").value = "";
}

/* =====================
   DAILY INPUTS
   ===================== */
function saveDailyInputs() {
  localStorage.setItem("dailyInputs", JSON.stringify({
    sleepTime: document.getElementById("sleepTime").value,
    sleepScore: document.getElementById("sleepScore").value,
    dailyNote: document.getElementById("dailyNote").value
  }));
}

function restoreDailyInputs() {
  const saved = localStorage.getItem("dailyInputs");
  if (!saved) return;

  const d = JSON.parse(saved);
  document.getElementById("sleepTime").value = d.sleepTime || "";
  document.getElementById("sleepScore").value = d.sleepScore || "";
  document.getElementById("dailyNote").value = d.dailyNote || "";
}