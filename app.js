/***********************
 * Routine App JS v6
 ************************/

let steps = Array(11).fill(null);
let lastCompletedStep = 0;

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
});

/* ---------- TIME ---------- */
function nowFormatted() {
  return new Date().toLocaleTimeString("fr-CA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(":", " h ");
}

function parseFrenchTime(t) {
  if (!t) return null;
  const p = t.replace(" h ", ":").split(":");
  return { hour: +p[0], minute: +p[1] };
}

/* ---------- STEPS ---------- */
function recordTime(step) {
  if (steps[step]) return;
  if (step !== lastCompletedStep + 1) return;

  steps[step] = nowFormatted();
  lastCompletedStep = step;

  localStorage.setItem("currentRoutine", JSON.stringify(steps));

  updateUI();
  updateCurrentStep();
  restoreDeltas();
  initEditModal();
}

function updateCurrentStep() {
  const el = document.getElementById("focusStep");
  if (!el) return;

  if (lastCompletedStep === 0) el.textContent = stepNames[1];
  else if (lastCompletedStep === 10) el.textContent = "Routine finished";
  else el.textContent = stepNames[lastCompletedStep + 1];
}

function updateUI() {
  for (let i = 1; i <= 10; i++) {
    const t = document.getElementById(`time-${i}`);
    const d = document.getElementById(`delta-${i}`);
    if (t) t.textContent = steps[i] || "--:--";
    if (!steps[i] && d) d.textContent = "";
  }
}

/* ---------- DELTAS ---------- */
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

    const min = Math.floor(diff / 60000);
    document.getElementById(`delta-${i}`).textContent = `${min} min`;
  }
}

/* ---------- EDIT MODAL ---------- */
function openEditModal() {
  document.getElementById("editModal").style.display = "block";
}

function closeEditModal() {
  document.getElementById("editModal").style.display = "none";
}

function initEditModal() {
  const select = document.getElementById("editStep");
  if (!select) return;

  select.innerHTML = "";
  for (let i = 1; i <= lastCompletedStep; i++) {
    const o = document.createElement("option");
    o.value = i;
    o.textContent = `${i} – ${stepNames[i]}`;
    select.appendChild(o);
  }
  loadEditTime();
}

function loadEditTime() {
  const step = document.getElementById("editStep").value;
  const input = document.getElementById("editStepTime");
  if (!steps[step]) return;

  const t = parseFrenchTime(steps[step]);
  input.value = `${t.hour.toString().padStart(2, "0")}:${t.minute.toString().padStart(2, "0")}`;
}

function saveEdit() {
  const step = document.getElementById("editStep").value;
  const time = document.getElementById("editStepTime").value;
  if (!time) return;

  const [h, m] = time.split(":");
  steps[step] = `${h} h ${m}`;
  localStorage.setItem("currentRoutine", JSON.stringify(steps));

  updateUI();
  restoreDeltas();
}

/* ---------- HISTORY ---------- */
function saveToHistory() {
  const history = JSON.parse(localStorage.getItem("history") || "[]");

  history.unshift({
    date: new Date().toLocaleDateString(),
    steps: [...steps],
    sleepTime: sleepTime.value,
    sleepScore: sleepScore.value,
    note: dailyNote.value
  });

  localStorage.setItem("history", JSON.stringify(history));
  resetRoutine();
  alert("Routine saved ✔");
}

function resetRoutine() {
  steps = Array(11).fill(null);
  lastCompletedStep = 0;

  localStorage.removeItem("currentRoutine");
  localStorage.removeItem("dailyInputs");

  updateUI();
  updateCurrentStep();
}

/* ---------- DAILY INPUTS ---------- */
function saveDailyInputs() {
  localStorage.setItem("dailyInputs", JSON.stringify({
    sleepTime: sleepTime.value,
    sleepScore: sleepScore.value,
    note: dailyNote.value
  }));
}

function restoreDailyInputs() {
  const d = JSON.parse(localStorage.getItem("dailyInputs") || "{}");
  sleepTime.value = d.sleepTime || "";
  sleepScore.value = d.sleepScore || "";
  dailyNote.value = d.note || "";
}