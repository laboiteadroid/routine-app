/***********************
 * Routine App JS v3.9 FINAL STABLE
 * Android Chrome compatible
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

/***********************
 * Sécurité anti-blocage
 ************************/
if (!localStorage.getItem("currentRoutine")) {
    localStorage.removeItem("routineSaved");
}

/***********************
 * Charger données sauvegardées
 ************************/
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

    updateUI();
    updateCurrentStep();
    restoreDeltas();
});

/***********************
 * Utils temps
 ************************/
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

/***********************
 * Enregistrer étape
 ************************/
function recordTime(step) {
    steps[step] = nowFormatted();

    if (step > lastCompletedStep) lastCompletedStep = step;

    localStorage.setItem("currentRoutine", JSON.stringify(steps));

    calculateDelta(step);
    updateUI();
    updateCurrentStep();

    if (step === 10 && !localStorage.getItem("routineSaved")) {
        saveToHistory();
        localStorage.setItem("routineSaved", "true");
    }
}

/***********************
 * Calcul durée étape
 ************************/
function calculateDelta(step) {
    if (step <= 1 || !steps[step - 1]) return;

    const a = parseFrenchTime(steps[step - 1]);
    const b = parseFrenchTime(steps[step]);

    const s = new Date();
    const e = new Date();
    s.setHours(a.hour, a.minute, 0);
    e.setHours(b.hour, b.minute, 0);

    const diff = e - s;
    const m = Math.floor(diff / 60000);
    const sec = Math.floor((diff % 60000) / 1000);

    const el = document.getElementById(`delta-${step}`);
    if (el) el.textContent = `${m}m ${sec}s`;
}

/***********************
 * UI
 ************************/
function updateUI() {
    for (let i = 1; i <= 10; i++) {
        const el = document.getElementById(`time-${i}`);
        if (el) el.textContent = steps[i] || "--:--";
    }
}

function updateCurrentStep() {
    const el = document.getElementById("focusStep");
    if (lastCompletedStep === 0) el.textContent = stepNames[1];
    else if (lastCompletedStep === 10) el.textContent = "Routine finished";
    else el.textContent = stepNames[lastCompletedStep + 1];
}

/***********************
 * Durée totale
 ************************/
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

function showTotalDuration() {
    const d = calculateDuration();
    if (!d) return alert("Not enough steps.");
    alert(`Total: ${d.min}m ${d.sec}s\nStart: ${d.start}\nEnd: ${d.end}`);
}

/***********************
 * Historique
 ************************/
function saveToHistory() {
    const d = calculateDuration();
    if (!d) return;

    const breakdown = [];
    for (let i = 2; i <= lastCompletedStep; i++) {
        if (steps[i] && steps[i - 1]) {
            const el = document.getElementById(`delta-${i}`);
            breakdown.push(`${stepNames[i - 1]} → ${stepNames[i]} : ${el?.textContent || ""}`);
        }
    }

    const history = JSON.parse(localStorage.getItem("history") || "[]");
    history.push({
        date: new Date().toLocaleDateString(),
        start: d.start,
        end: d.end,
        duration: `${d.min}m ${d.sec}s`,
        breakdown
    });

    localStorage.setItem("history", JSON.stringify(history));
    resetRoutine();
}

/***********************
 * Reset propre
 ************************/
function resetRoutine() {
    steps = Array(11).fill(null);
    lastCompletedStep = 0;

    localStorage.removeItem("currentRoutine");
    localStorage.removeItem("routineSaved");

    updateUI();
    updateCurrentStep();

    for (let i = 2; i <= 10; i++) {
        const el = document.getElementById(`delta-${i}`);
        if (el) el.textContent = "";
    }
}

/***********************
 * Restore deltas
 ************************/
function restoreDeltas() {
    for (let i = 2; i <= 10; i++) {
        if (steps[i] && steps[i - 1]) calculateDelta(i);
    }
}

/***********************
 * History page
 ************************/
function loadHistory() {
    const container = document.getElementById("history");
    if (!container) return;

    const history = JSON.parse(localStorage.getItem("history") || "[]");
    container.innerHTML = "";

    history.forEach(h => {
        const d = document.createElement("div");
        d.className = "history-entry";
        d.innerHTML = `
            <strong>${h.date}</strong><br>
            ${h.start} → ${h.end}<br>
            <strong>${h.duration}</strong><br><br>
            ${h.breakdown.join("<br>")}
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