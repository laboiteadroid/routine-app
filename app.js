/***********************
 * Routine App JS v5.3 STABLE
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

  if (lastCompletedStep === 10) {
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
   TOTAL DURATION (CORE)
   ===================== */
function calculateTotalDurationMinutes() {
  let totalMinutes = 0;

  for (let i = 2; i <= 10; i++) {
    const start = parseFrenchTime(steps[i - 1]);
    const end = parseFrenchTime(steps[i]);
    if (!start || !end) continue;

    const s = new Date();
    const e = new Date();
    s.setHours(start.hour, start.minute, 0);
    e.setHours(end.hour, end.minute, 0);

    let diff = e - s;
    if (diff < 0) diff += 86400000;

    totalMinutes += Math.floor(diff / 60000);
  }

  return totalMinutes;
}

/* =====================
   EDIT MODAL
   ===================== */
function openEditModal() {
  document.getElementById("editModal").style.display = "block";
  initEditModal();
}

function closeEditModal() {
  document.getElementById("editModal").style.display = "none";
}

function initEditModal() {
  const select = document.getElementById("editStep");
  if (!select) return;

  select.innerHTML = "";

  for (let i = 1; i <= lastCompletedStep; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `${i} – ${stepNames[i]}`;
    select.appendChild(opt);
  }

  select.onchange = loadEditTime;
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
  input.value =
    t.hour.toString().padStart(2, "0") +
    ":" +
    t.minute.toString().padStart(2, "0");
}

function saveEdit() {
  const step = Number(document.getElementById("editStep").value);
  const value = document.getElementById("editStepTime").value;
  if (!value) return;

  const [h, m] = value.split(":");
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
  saveDailyInputs();

  const totalMinutes = calculateTotalDurationMinutes();
  if (totalMinutes === 0) return;

  const history = JSON.parse(localStorage.getItem("history") || "[]");

  history.unshift({
    date: new Date().toLocaleDateString(),
    steps: [...steps],
    totalMinutes,
    totalFormatted: `${Math.floor(totalMinutes / 60)} h ${totalMinutes % 60} min`,
    sleepTime: sleepTime.value,
    sleepScore: sleepScore.value,
    note: dailyNote.value
  });

  localStorage.setItem("history", JSON.stringify(history));
  resetRoutine();
}

function loadHistory() {
  const container = document.getElementById("history");
  if (!container) return;

  const history = JSON.parse(localStorage.getItem("history") || "[]");
  container.innerHTML = "";

  history.forEach(h => {
    const div = document.createElement("div");
    div.className = "history-entry";

    let html = `<strong>${h.date}</strong><br>`;
    if (h.totalFormatted) {
      html += `<strong>Total routine:</strong> ${h.totalFormatted}<br><br>`;
    }

    h.steps.forEach((t, i) => {
      if (i > 0 && t) {
        html += `<strong>${stepNames[i]}:</strong> ${t}<br>`;
      }
    });

    if (h.sleepTime) html += `<br><strong>Sleep:</strong> ${h.sleepTime}<br>`;
    if (h.sleepScore) html += `<strong>Score:</strong> ${h.sleepScore}<br>`;
    if (h.note) html += `<br><strong>Note:</strong><br>${h.note}`;

    html += "<hr>";
    div.innerHTML = html;
    container.appendChild(div);
  });
}

/* =====================
   CSV EXPORT
   ===================== */
function exportHistoryCSV() {
  const history = JSON.parse(localStorage.getItem("history") || "[]");
  if (!history.length) {
    alert("No history to export");
    return;
  }

  let csv = "Date,TotalDuration,Step,Time,SleepTime,SleepScore,Note\n";

  history.forEach(h => {
    h.steps.forEach((t, i) => {
      if (i > 0 && t) {
        csv += `"${h.date}","${h.totalFormatted}","${stepNames[i]}","${t}","${h.sleepTime}","${h.sleepScore}","${(h.note || "").replace(/"/g,'""')}"\n`;
      }
    });
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `routine-history-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/* =====================
   RESET
   ===================== */
function resetRoutine() {
  steps = Array(11).fill(null);
  lastCompletedStep = 0;

  localStorage.removeItem("currentRoutine");
  localStorage.removeItem("dailyInputs");

  updateUI();
  updateCurrentStep();
  initEditModal();

  for (let i = 2; i <= 10; i++) {
    const el = document.getElementById(`delta-${i}`);
    if (el) el.textContent = "";
  }

  sleepTime.value = "";
  sleepScore.value = "";
  dailyNote.value = "";
}

/* =====================
   DAILY INPUTS
   ===================== */
function saveDailyInputs() {
  localStorage.setItem("dailyInputs", JSON.stringify({
    sleepTime: sleepTime.value,
    sleepScore: sleepScore.value,
    dailyNote: dailyNote.value
  }));
}

function restoreDailyInputs() {
  const saved = localStorage.getItem("dailyInputs");
  if (!saved) return;

  const d = JSON.parse(saved);
  sleepTime.value = d.sleepTime || "";
  sleepScore.value = d.sleepScore || "";
  dailyNote.value = d.dailyNote || "";
}

/* =====================
   MANUAL TOTAL (BUTTON)
   ===================== */
function showTotalDuration() {
  const totalMinutes = calculateTotalDurationMinutes();
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  let msg = "Total routine duration:\n";
  if (h > 0) msg += `${h} h `;
  msg += `${m} min`;

  alert(msg);
}