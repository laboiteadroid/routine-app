/***********************
 * Routine App JS – Version finale stable
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
 * Chargement initial
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
 * Parse heure FR "14 h 36"
 ************************/
function parseFrenchTime(t) {
    if (!t) return null;

    if (t.includes("h")) {
        const [h, m] = t.split("h").map(v => parseInt(v.trim()));
        return { hour: h, minute: m };
    }

    if (t.includes(":")) {
        const [h, m] = t.split(":").map(Number);
        return { hour: h, minute: m };
    }

    return null;
}

/***********************
 * Enregistrer une étape
 ************************/
function recordTime(stepNumber) {
    const now = new Date();
    const formatted = now.toLocaleTimeString("fr-CA", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    }).replace(":", " h ");

    steps[stepNumber] = formatted;

    // Calcul durée de l'étape précédente
    if (stepNumber > 1 && steps[stepNumber - 1]) {
        const t1 = parseFrenchTime(steps[stepNumber - 1]);
        const t2 = parseFrenchTime(formatted);

        if (t1 && t2) {
            const start = new Date();
            start.setHours(t1.hour, t1.minute, 0);

            const end = new Date();
            end.setHours(t2.hour, t2.minute, 0);

            const diffMs = end - start;
            const dm = Math.floor(diffMs / 60000);
            const ds = Math.floor((diffMs % 60000) / 1000);

            const deltaEl = document.getElementById(`delta-${stepNumber}`);
            if (deltaEl) deltaEl.textContent = `${dm}m ${ds}s`;
        }
    }

    if (stepNumber > lastCompletedStep) {
        lastCompletedStep = stepNumber;
    }

    localStorage.setItem("currentRoutine", JSON.stringify(steps));

    updateUI();
    updateCurrentStep();

    // FIN DE ROUTINE → sauvegarde automatique
    if (stepNumber === 10 && !localStorage.getItem("routineSaved")) {
        saveToHistory();
        localStorage.setItem("routineSaved", "true");
    }
}

/***********************
 * Mise à jour UI
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
    } else if (lastCompletedStep === 10) {
        el.textContent = "Routine finished";
    } else {
        el.textContent = stepNames[lastCompletedStep + 1];
    }
}

/***********************
 * Calcul durée totale
 ************************/
function calculateDuration() {
    const first = steps.findIndex(s => s);
    const last = steps.length - 1 - [...steps].reverse().findIndex(s => s);

    if (first === -1 || last === -1 || first === last) return null;

    const t1 = parseFrenchTime(steps[first]);
    const t2 = parseFrenchTime(steps[last]);
    if (!t1 || !t2) return null;

    const start = new Date();
    start.setHours(t1.hour, t1.minute, 0);

    const end = new Date();
    end.setHours(t2.hour, t2.minute, 0);

    let diff = end - start;
    if (diff < 0) diff += 86400000;

    return {
        first: steps[first],
        last: steps[last],
        diffMin: Math.floor(diff / 60000),
        diffSec: Math.floor((diff % 60000) / 1000)
    };
}

/***********************
 * Sauvegarde historique + RESET
 ************************/
function saveToHistory() {
    const d = calculateDuration();
    if (!d) return;

    let breakdown = [];

    for (let i = 2; i <= 10; i++) {
        if (steps[i] && steps[i - 1]) {
            const t1 = parseFrenchTime(steps[i - 1]);
            const t2 = parseFrenchTime(steps[i]);

            const start = new Date();
            start.setHours(t1.hour, t1.minute, 0);

            const end = new Date();
            end.setHours(t2.hour, t2.minute, 0);

            const diffMs = end - start;
            breakdown.push(
                `${stepNames[i - 1]} → ${stepNames[i]} : ${Math.floor(diffMs / 60000)}m ${Math.floor((diffMs % 60000) / 1000)}s`
            );
        }
    }

    const history = JSON.parse(localStorage.getItem("history") || "[]");
    history.push({
        date: new Date().toLocaleDateString(),
        start: d.first,
        end: d.last,
        duration: `${d.diffMin} min ${d.diffSec} sec`,
        breakdown
    });

    localStorage.setItem("history", JSON.stringify(history));

    // RESET COMPLET
    steps = Array(11).fill(null);
    lastCompletedStep = 0;
    localStorage.removeItem("currentRoutine");
    localStorage.removeItem("routineSaved");

    updateUI();
    updateCurrentStep();

    // Effacer les deltas
    for (let i = 2; i <= 10; i++) {
        const d = document.getElementById(`delta-${i}`);
        if (d) d.textContent = "";
    }
}

/***********************
 * Restaurer les durées (delta)
 ************************/
function restoreDeltas() {
    for (let i = 2; i <= 10; i++) {
        if (steps[i] && steps[i - 1]) {
            const t1 = parseFrenchTime(steps[i - 1]);
            const t2 = parseFrenchTime(steps[i]);

            const start = new Date();
            start.setHours(t1.hour, t1.minute, 0);

            const end = new Date();
            end.setHours(t2.hour, t2.minute, 0);

            const diffMs = end - start;
            const deltaEl = document.getElementById(`delta-${i}`);
            if (deltaEl) {
                deltaEl.textContent =
                    `${Math.floor(diffMs / 60000)}m ${Math.floor((diffMs % 60000) / 1000)}s`;
            }
        }
    }
}