/***********************
 * Routine App JS v3.4
 * - Compatible avec recordTime(n)
 * - Met à jour "Current step"
 * - Sauvegarde automatique
 * - Reprise automatique
 * - Durée totale OK
 * - Save to history OK
 ************************/

let steps = Array(11).fill(null);  // indexes 1..10
let lastCompletedStep = 0;

// Liste des noms des étapes
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
 * Charger routine sauvegardée
 ************************/
window.addEventListener("load", () => {
    const saved = localStorage.getItem("currentRoutine");
    if (saved) {
        steps = JSON.parse(saved);

        // Trouver la dernière étape cliquée
        for (let i = 10; i >= 1; i--) {
            if (steps[i]) {
                lastCompletedStep = i;
                break;
            }
        }

        updateUI();
        updateCurrentStep();
    }
});

/***********************
 * Enregistrer une étape
 ************************/
function recordTime(stepNumber) {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    steps[stepNumber] = timeString;
    lastCompletedStep = stepNumber;

    // Sauvegarde automatique
    localStorage.setItem("currentRoutine", JSON.stringify(steps));

    updateUI();
    updateCurrentStep();
}

/***********************
 * Met à jour l’affichage du current step
 ************************/
function updateCurrentStep() {
    const el = document.getElementById("focusStep");

    if (lastCompletedStep === 0) {
        el.textContent = stepNames[1];
    } else {
        let nextStep = lastCompletedStep + 1;
        if (nextStep > 10) nextStep = 10;
        el.textContent = stepNames[nextStep];
    }
}

/***********************
 * Mettre à jour l’interface
 ************************/
function updateUI() {
    for (let i = 1; i <= 10; i++) {
        const el = document.getElementById(`time-${i}`);
        if (el) {
            el.textContent = steps[i] ? steps[i] : "--:--";
        }
    }
}

/***********************
 * Calculer la durée totale
 ************************/
function calculateDuration() {
    let first = steps[1];
    let last = steps[lastCompletedStep];

    if (!first || !last) return null;

    const [fh, fm] = first.split(":").map(Number);
    const [lh, lm] = last.split(":").map(Number);

    const start = new Date(); start.setHours(fh, fm, 0);
    const end = new Date(); end.setHours(lh, lm, 0);

    const diffMs = end - start;
    const diffMin = Math.floor(diffMs / 60000);
    const diffSec = Math.floor((diffMs % 60000) / 1000);

    return { first, last, diffMin, diffSec };
}

/***********************
 * Afficher la durée
 ************************/
function showTotalDuration() {
    const d = calculateDuration();
    if (!d) {
        alert("Not enough steps recorded.");
        return;
    }

    alert(`Routine total: ${d.diffMin}m ${d.diffSec}s\nStart: ${d.first}\nEnd: ${d.last}`);
}

/***********************
 * Enregistrer dans l’historique
 ************************/
function saveToHistory() {
    const d = calculateDuration();
    if (!d) {
        alert("Not enough steps recorded.");
        return;
    }

    let breakdown = [];

    for (let i = 2; i <= lastCompletedStep; i++) {
        if (steps[i - 1] && steps[i]) {
            const [h1, m1] = steps[i - 1].split(":").map(Number);
            const [h2, m2] = steps[i].split(":").map(Number);

            const t1 = new Date(); t1.setHours(h1, m1, 0);
            const t2 = new Date(); t2.setHours(h2, m2, 0);

            const dm = Math.floor((t2 - t1) / 60000);
            const ds = Math.floor(((t2 - t1) % 60000) / 1000);

            breakdown.push(`${stepNames[i - 1]} → ${stepNames[i]} : ${dm}m${ds}s`);
        }
    }

    const entry = {
        date: new Date().toLocaleDateString(),
        start: d.first,
        end: d.last,
        duration: `${d.diffMin} min ${d.diffSec} sec`,
        breakdown
    };

    let history = JSON.parse(localStorage.getItem("history") || "[]");
    history.push(entry);
    localStorage.setItem("history", JSON.stringify(history));

    // Reset
    localStorage.removeItem("currentRoutine");
    steps = Array(11).fill(null);
    lastCompletedStep = 0;

    updateUI();
    updateCurrentStep();

    alert("Routine saved to history.");
}

/***********************
 * Effacer historique
 ************************/
function clearHistory() {
    if (confirm("Clear ALL history?")) {
        localStorage.removeItem("history");
        loadHistory();
    }
}
