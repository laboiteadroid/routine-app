/***********************
 * Routine App JS v5 Modal
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
   MODAL EDIT PANEL
   ===================== */
function initEditModal() {
  const modal = document.getElementById("editModal");
  const select = document.getElementById("editStep");
  const input = document.getElementById("editStepTime");
  const saveBtn = document.getElementById("saveEditBtn");
  const openBtn = document.getElementById("openEditModalBtn");
  const closeBtn = document.getElementById("closeEditModalBtn");

  if (!modal || !select || !input || !saveBtn || !openBtn || !closeBtn) return;

  // Populate select
  select.innerHTML = "";
  for (let i = 1; i <= lastCompletedStep; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `${i} – ${stepNames[i]}`;
    select.appendChild(opt);
  }

  loadEditTime();

  select.addEventListener("change", loadEditTime);

  // Open modal
  openBtn.onclick = () => modal.style.display = "flex";

  // Close modal
  closeBtn.onclick = () => modal.style.display = "none";

  // Save changes
  saveBtn.onclick = () => {
    const step = Number(select.value);
    const timeVal = input.value;
    if (!step || !timeVal) return;

    const [h, m] = timeVal.split(":");
    steps[step] = `${h} h ${m}`;
    localStorage.setItem("currentRoutine", JSON.stringify(steps));

    updateUI();
    restoreDeltas();
    updateCurrentStep();

    modal.style.display = "none";
  };

  // Close modal if click outside
  window.onclick = e => {
    if (e.target === modal) modal.style.display = "none";
  };
}

function loadEditTime() {
  const step = Number(document.getElementById("editStep")?.value);
  const input = document.getElementById("editStepTime");
  if (!step || !steps[step]) {
    input.value = "";
    return;
  }
  const t = parseFrenchTime(steps[step]);
  if (!t) return;
  input.value = t.hour.toString().padStart(2, "0") + ":" + t.minute.toString().padStart(2, "0");
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