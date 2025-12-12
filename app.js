alert("APP.JS IS RUNNING");
/***********************
 * Routine App JS v3.3
 * Compatible avec :
 * - onclick="recordTime(n)"
 * - id="time-n"
 * - id="label-n"
 * Avec sauvegarde automatique
 ************************/

let steps = Array(11).fill(null);  // index 1 à 10 utilisés

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
        updateUI();
    }
});

/***********************
 * Enregistrer une étape
 ************************/
function recordTime(stepNumber) {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    steps[stepNumber] = timeString;

    updateUI();

    // Sauvegarde automatique
    localStorage.setItem("currentRoutine", JSON.stringify(steps));
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
    let first = null;
    let last = null;

    for (let i = 1; i <= 10; i++) {
        if (steps[i]) {
            if (!first) first = steps[i];
            last = steps[i];
        }
    }

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
 * Sauvegarder dans l’historique
 ************************/
function saveToHistory() {
    const d = calculateDuration();
    if (!d) {
        alert("Not enough steps recorded.");
        return;
    }

    let breakdown = [];

    for (let i = 2; i <= 10; i++) {
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

    // Effacer la routine courante
    localStorage.removeItem("currentRoutine");
    steps = Array(11).fill(null);
    updateUI();

    alert("Routine saved to history.");
}

/***********************
 * Charger l’historique
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
 * Effacer historique
 ************************/
function clearHistory() {
    if (confirm("Clear ALL history?")) {
        localStorage.removeItem("history");
        loadHistory();
    }
}
