
/***********************
 * Routine App JS v4.2 STABLE
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

  // Restore daily inputs
  restoreDailyInputs();

  ["sleepTime", "sleepScore", "dailyNote"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", saveDailyInputs);
  });

  updateUI();
  updateCurrentStep();
  restoreDeltas();
  checkAutoSave();
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
  if (steps[stepNumber] !== null) return;
  if (stepNumber !== lastCompletedStep + 1) return;

  steps[stepNumber] = nowFormatted();

  if (stepNumber > 1 && steps[stepNumber - 1]) {
    const a = parseFrenchTime(steps[stepNumber - 1]);
    const b = parseFrenchTime(steps[stepNumber]);

    if (a && b) {
      const s = new Date();
      const e = new Date();
      s.setHours(a.hour, a.minute, 0);
      e.setHours(b.hour, b.minute, 0);

      let diff = e - s;
      if (diff < 0) diff += 24 * 60 * 60 * 1000;

      const m = Math.floor(diff / 60000);
      const sec = Math.floor((diff % 60000) / 1000);

      const el = document.getElementById(`delta-${stepNumber}`);
      if (el) el.textContent = `${m}m ${sec}s`;
    }
  }

  lastCompletedStep = stepNumber;
  localStorage.setItem("currentRoutine", JSON.stringify(steps));

  updateUI();
  updateCurrentStep();
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
   DURATION
   ===================== */
function calculateDuration() {
  const times = steps.filter(Boolean);
  if (times.length < 2) return null;

  const a = parseFrenchTime(times[0]);
  const b = parseFrenchTime(times[times.length - 1]);

  const s = new Date();
  const e = new Date();
  s.setHours(a.hour, a.minute, 0);
  e.setHours(b.hour, b.minute, 0);

  let diff = e - s;
  if (diff < 0) diff += 24 * 60 * 60 * 1000;

  return { min: Math.floor(diff / 60000) };
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
   SAVE TO HISTORY
   ===================== */
function saveToHistory() {
  const d = calculateDuration();
  if (!d) return;

  const history = JSON.parse(localStorage.getItem("history") || "[]");

  history.push({
    date: new Date().toLocaleDateString(),
    routineMinutes: d.min,
    routineFormatted: minutesToHours(d.min),
    sleepTime: document.getElementById("sleepTime")?.value || "",
    sleepScore: document.getElementById("sleepScore")?.value || "",
    note: document.getElementById("dailyNote")?.value || "",
    steps: [...steps]
  });

  localStorage.setItem("history", JSON.stringify(history));
  resetRoutine();
}

/* =====================
   RESET ROUTINE
   ===================== */
function resetRoutine() {
  steps = Array(11).fill(null);
  lastCompletedStep = 0;

  localStorage.removeItem("currentRoutine");
  localStorage.removeItem("routineSaved");
  localStorage.removeItem("dailyInputs");

  updateUI();
  updateCurrentStep();

  for (let i = 2; i <= 10; i++) {
    const el = document.getElementById(`delta-${i}`);
    if (el) el.textContent = "";
  }

  document.getElementById("sleepTime").value = "";
  document.getElementById("sleepScore").value = "";
  document.getElementById("dailyNote").value = "";
}

/* =====================
   RESTORE DELTAS
   ===================== */
function restoreDeltas() {
  for (let i = 2; i <= 10; i++) {
    if (steps[i] && steps[i - 1]) {
      const a = parseFrenchTime(steps[i - 1]);
      const b = parseFrenchTime(steps[i]);

      const s = new Date();
      const e = new Date();
      s.setHours(a.hour, a.minute, 0);
      e.setHours(b.hour, b.minute, 0);

      let diff = e - s;
      if (diff < 0) diff += 24 * 60 * 60 * 1000;

      const m = Math.floor(diff / 60000);
      const sec = Math.floor((diff % 60000) / 1000);

      const el = document.getElementById(`delta-${i}`);
      if (el) el.textContent = `${m}m ${sec}s`;
    }
  }
}

/* =====================
   HISTORY PAGE
   ===================== */
function loadHistory() {
  const container = document.getElementById("history");
  if (!container) return;

  const history = JSON.parse(localStorage.getItem("history") || "[]").reverse();
  container.innerHTML = "";

  history.forEach(h => {
    const stepsHtml = h.steps
      ? h.steps
          .map((t, i) => (t && i > 0 ? `<div>${stepNames[i]} : ${t}</div>` : ""))
          .join("")
      : "";

    const d = document.createElement("div");
    d.className = "history-entry";
    d.innerHTML = `
      <strong>${h.date}</strong><br><br>
      <strong>Routine :</strong> ${h.routineFormatted}<br><br>
      ${stepsHtml}<br>
      ${h.sleepTime ? `<strong>Sleep:</strong> ${h.sleepTime}<br>` : ""}
      ${h.sleepScore ? `<strong>Score:</strong> ${h.sleepScore}<br>` : ""}
      ${h.note ? `<br><strong>Note:</strong><br>${h.note}` : ""}
      <hr>
    `;
    container.appendChild(d);
  });
}

function clearHistory() {
  if (confirm("Clear history?")) {
    localStorage.removeItem("history");
    loadHistory();
  }
}

/* =====================
   DAILY INPUTS
   ===================== */
function saveDailyInputs() {
  localStorage.setItem("dailyInputs", JSON.stringify({
    sleepTime: document.getElementById("sleepTime").value || "",
    sleepScore: document.getElementById("sleepScore").value || "",
    dailyNote: document.getElementById("dailyNote").value || ""
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
