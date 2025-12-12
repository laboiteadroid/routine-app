/***********************
 * Routine App JS v3.5 (Stable)
 * - lastCompletedStep corrigé et totalement fiable
 * - Durée totale fonctionne
 * - Save to history fonctionne
 * - Sauvegarde automatique à chaque étape
 * - Reprise automatique à l'ouverture
 * - Compatible avec ton HTML
 ************************/

let steps = Array(11).fill(null);  // steps[1] à steps[10]
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
 * Charger les données sauvegardées
 ************************/
window.addEventListener("load", () => {
    const saved = localStorage.getItem("currentRoutine");

    if (saved) {
        steps = JSON.parse(saved);

        // Trouver la dernière étape complétée
        lastCompletedStep = 0;
        for (let i = 10; i >= 1; i--) {
            if (steps[i] !== null) {
                lastCompletedStep = i;
                break;
            }
        }
    }

    updateUI();
    updateCurrentStep();
});

/***********************
 * Enregistrer l'heure d'une étape
 ************************/
function recordTime(stepNumber) {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    steps[stepNumber] = timeString;

    // Mise à jour lastCompletedStep
    if (stepNumber > lastCompletedStep) {
        lastCompletedStep = stepNumber;
    }

    // Sauvegarde automatique
    localStorage.setItem("currentRoutine", JSON.stringify(steps));

    updateUI();
    updateCurrentStep();
}

/***********************
 * Mettre à jour "Current step"
 ************************/
function updateCurrentStep() {
    const el = document.getElementById("focusStep");

    if (lastCompletedStep === 0) {
        el.textContent = stepNames[1];
        return;
    }

    let nextStep = lastCompletedStep + 1;
    if (nextStep > 10) nextStep = 10;

    el.textContent = stepNames[nextStep];
}

/***********************
 * Met à jour l'affichage des heures dans l'écran Routine
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
 * Calcul de la durée totale
 ************************/
function calculateDuration() {
    const first = steps[1];
    const last = steps[lastCompletedStep];

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
 * Afficher la durée totale (popup)
 ************************/
function showTotalDuration() {
    const d = calculateDuration();

    if (!d) {
        alert("Not enough steps recorded.");
        return;
    }

    alert(
        `Routine total: ${d.diffMin}m ${d.diffSec}s\n` +
        `Start: ${d.first}\n` +
        `End: ${d.last}`
    );
}

/***********************
 * Enregistrer la routine dans l'historique
 ************************/
function saveToHistory() {
    const d = calculateDuration();

    if (!d) {
        alert("Not enough steps recorded.");
        return;
    }

    // Créer les breakdowns
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

    // Sauvegarder dans localStorage
    let history = JSON.parse(localStorage.getItem("history") || "[]");
    history.push(entry);
    localStorage.setItem("history", JSON.stringify(history));

    // Réinitialisation de la routine
    localStorage.removeItem("currentRoutine");
    steps = Array(11).fill(null);
    lastCompletedStep = 0;

    updateUI();
    updateCurrentStep();

    alert("Routine saved to history.");
}

/***********************
 * Charger l'historique dans la page History
 ************************/
function loadHistory() {
    const container = document.getElementById("history");
    if (!container) return;

    let history = JSON.parse(localStorage.getItem("history") || "[]");

    container.innerHTML = "";

    history.forEach(item => {
        const div = document.createElement("div");
        div.className = "history-entry";

        div.innerHTML = `
            <strong>Date:</strong> ${item.date}<br>
            <strong>Start:</strong> ${item.start}<br>
            <strong>End:</strong> ${item.end}<br>
            <strong>Duration:</strong> ${item.duration}<br><br>
            <strong>Step breakdown:</strong><br>
            ${item.breakdown.map(line => `• ${line}`).join("<br>")}
            <hr>
        `;
        container.appendChild(div);
    });
}

/***********************
 * Effacer l'historique
 ************************/
function clearHistory() {
    if (confirm("Clear ALL history?")) {
        localStorage.removeItem("history");
        loadHistory();
    }
}