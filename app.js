/***********************
 * Routine App JS v4.0 FINAL
 * Android Chrome / PWA SAFE
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
   SAFETY
   ===================== */
if (!localStorage.getItem("currentRoutine")) {
    localStorage.removeItem("routineSaved");
}

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
   CURRENT STEP LABEL
   ===================== */
function updateCurrentStep() {
    const el = document.getElementById("focusStep");
    if (!el) return;

    if (lastCompletedStep === 0) {
        el.textContent = stepNames[1];
    } else if (lastCompletedStep === 10) {
        el.textContent = "Routine finished";
    } else {
        el.textContent = stepNames[lastCompletedStep + 1];
    }
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

            const diff = e - s;
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
   TOTAL DURATION
   ===================== */
function calculateDuration() {
    const first = steps.find(s => s);
    const last = [...steps].reverse().find(s => s);

    if (!first || !last || first === last) return null;

    const a = parseFrenchTime(first);
    const b = parseFrenchTime(last);

    const s = new Date();
    const e = new Date();
    s.setHours(a.hour, a.minute, 0);
    e.setHours(b.hour, b.minute, 0);

    const diff = e - s;

    return {
        start: first,
        end: last,
        min: Math.floor(diff / 60000),
        sec: Math.floor((diff % 60000) / 1000)
    };
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
        note: document.getElementById("dailyNote")?.value || ""
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
    localStorage.removeItem("dailyInputs"); // ✅ CORRECTION CLÉ

    updateUI();
    updateCurrentStep();

    for (let i = 2; i <= 10; i++) {
        const el = document.getElementById(`delta-${i}`);
        if (el) el.textContent = "";
    }
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

            const diff = e - s;
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

    const history = JSON.parse(localStorage.getItem("history") || "[]");
    container.innerHTML = "";

    history.forEach(h => {
        const d = document.createElement("div");
        d.className = "history-entry";
        d.innerHTML = `
            <strong>${h.date}</strong><br><br>
            <strong>Routine:</strong> ${h.routineFormatted}<br><br>
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
   DAILY INPUTS PERSISTENCE
   ===================== */
function saveDailyInputs() {
    localStorage.setItem("dailyInputs", JSON.stringify({
        sleepTime: document.getElementById("sleepTime")?.value || "",
        sleepScore: document.getElementById("sleepScore")?.value || "",
        dailyNote: document.getElementById("dailyNote")?.value || ""
    }));
}

function restoreDailyInputs() {
    const saved = localStorage.getItem("dailyInputs");
    if (!saved) return;

    const d = JSON.parse(saved);
    if (document.getElementById("sleepTime")) document.getElementById("sleepTime").value = d.sleepTime || "";
    if (document.getElementById("sleepScore")) document.getElementById("sleepScore").value = d.sleepScore || "";
    if (document.getElementById("dailyNote")) document.getElementById("dailyNote").value = d.dailyNote || "";
}
