/***********************
 * Routine App JS v3.8 — STABLE MOBILE
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
    const parts = t.replace(" h ", ":").split(":").map(Number);
    return { hour: parts[0], minute: parts[1] };
}

/***********************
 * Enregistrer une étape
 ************************/
function recordTime(stepNumber) {
    const now = new Date();
    const formatted = now
        .toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })
        .replace(":", " h ");

    steps[stepNumber] = formatted;
    lastCompletedStep = Math.max(lastCompletedStep, stepNumber);

    localStorage.setItem("currentRoutine", JSON.stringify(steps));

    updateUI();
    updateCurrentStep();
    restoreDeltas();
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

    if (lastCompletedStep === 0) {
        el.textContent = stepNames[1];
    } else if (lastCompletedStep >= 10) {
        el.textContent = "Routine finished";
    } else {
        el.textContent = stepNames[lastCompletedStep + 1];
    }
}

/***********************
 * Durée totale
 ************************/
function calculateDuration() {
    const first = steps.findIndex(s => s);
    const last = steps.map((s, i) => s ? i : null).filter(i => i).pop();

    if (!first || !last || first === last) return null;

    const t1 = parseFrenchTime(steps[first]);
    const t2 = parseFrenchTime(steps[last]);

    const start = new Date();
    start.setHours(t1.hour, t1.minute, 0);

    const end = new Date();
    end.setHours(t2.hour, t2.minute, 0);

    let diff = end - start;
    if (diff < 0) diff += 86400000;

    return {
        start: steps[first],
        end: steps[last],
        min: Math.floor(diff / 60000),
        sec: Math.floor((diff % 60000) / 1000)
    };
}

function showTotalDuration() {
    const d = calculateDuration();
    if (!d) {
        alert("Not enough steps recorded.");
        return;
    }

    alert(
        `Total routine: ${d.min}m ${d.sec}s\n` +
        `Start: ${d.start}\nEnd: ${d.end}`
    );
}

/***********************
 * Historique
 ************************/
function saveToHistory() {
    const d = calculateDuration();
    if (!d) {
        alert("Complete routine before saving.");
        return;
    }

    const breakdown = [];
    for (let i = 2; i <= lastCompletedStep; i++) {
        if (steps[i - 1] && steps[i]) {
            const a = parseFrenchTime(steps[i - 1]);
            const b = parseFrenchTime(steps[i]);
            const s = new Date();
            const e = new Date();
            s.setHours(a.hour, a.minute, 0);
            e.setHours(b.hour, b.minute, 0);
            const diff = e - s;
            breakdown.push(
                `${stepNames[i - 1]} → ${stepNames[i]} : ${Math.floor(diff / 60000)}m`
            );
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
    alert("Saved to history.");
}

/***********************
 * Reset propre
 ************************/
function resetRoutine() {
    steps = Array(11).fill(null);
    lastCompletedStep = 0;
    localStorage.removeItem("currentRoutine");
    updateUI();
    updateCurrentStep();
}

/***********************
 * Deltas
 ************************/
function restoreDeltas() {
    for (let i = 2; i <= 10; i++) {
        if (steps[i - 1] && steps[i]) {
            const a = parseFrenchTime(steps[i - 1]);
            const b = parseFrenchTime(steps[i]);
            const s = new Date();
            const e = new Date();
            s.setHours(a.hour, a.minute, 0);
            e.setHours(b.hour, b.minute, 0);
            const diff = e - s;
            const el = document.getElementById(`delta-${i}`);
            if (el) el.textContent = `${Math.floor(diff / 60000)}m`;
        }
    }
}