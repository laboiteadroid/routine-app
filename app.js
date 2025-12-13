/***********************
 * Routine App JS v3.7 (Stable + French Time Format)
 * Compatible avec format "14 h 36"
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
 * Convertir "14 h 36" → { hour: 14, minute: 36 }
 ************************/
function parseFrenchTime(t) {
    if (!t) return null;

    // Format: "14 h 36" (français)
    if (t.includes("h")) {
        const parts = t.split("h");
        const h = parseInt(parts[0].trim());
        const m = parseInt(parts[1].trim());
        return { hour: h, minute: m };
    }

    // Format "14:36" fallback
    if (t.includes(":")) {
        const [h, m] = t.split(":").map(Number);
        return { hour: h, minute: m };
    }

    return null;
}

/***********************
 * Enregistrer l'heure d'une étape
 ************************/
function recordTime(stepNumber) {
    const now = new Date();

    const formatted = now.toLocaleTimeString("fr-CA", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    }).replace(":", " h ");

    steps[stepNumber] = formatted;

    if (stepNumber > lastCompletedStep) {
        lastCompletedStep = stepNumber;
    }

    localStorage.setItem("currentRoutine", JSON.stringify(steps));

    updateUI();
    updateCurrentStep();
}

/***********************
 * Mettre à jour l'affichage
 ************************/
function updateUI() {
    for (let i = 1; i <= 10; i++) {
        const el = document.getElementById(`time-${i}`);
        if (el) {
            el.textContent = steps[i] ? steps[i] : "--:--";
        }
    }
}

function updateCurrentStep() {
    const el = document.getElementById("focusStep");

    // Pas encore commencé
    if (lastCompletedStep === 0) {
        el.textContent = stepNames[1];
        return;
    }

    // Routine terminée
    if (lastCompletedStep === 10) {
        el.textContent = "Routine finished";
        return;
    }

    // Routine en progression
    let next = lastCompletedStep + 1;
    el.textContent = stepNames[next];
}

/***********************
 * Calcul de la durée totale
 ************************/
function calculateDuration() {
    const firstIndex = steps.findIndex(s => s !== null);
    const lastIndex = steps.length - 1 - [...steps].reverse().findIndex(s => s !== null);

    if (firstIndex === -1 || lastIndex === -1 || firstIndex === lastIndex) {
        return null;
    }

    const t1 = parseFrenchTime(steps[firstIndex]);
    const t2 = parseFrenchTime(steps[lastIndex]);

    if (!t1 || !t2) return null;

    const start = new Date();
    start.setHours(t1.hour, t1.minute, 0, 0);

    const end = new Date();
    end.setHours(t2.hour, t2.minute, 0, 0);

    let diffMs = end - start;
    if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000; // sécurité jour suivant

    const diffMin = Math.floor(diffMs / 60000);
    const diffSec = Math.floor((diffMs % 60000) / 1000);

    return {
        first: steps[firstIndex],
        last: steps[lastIndex],
        diffMin,
        diffSec,
        firstIndex,
        lastIndex
    };
}

/***********************
 * Afficher durée totale
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
 * Sauvegarder dans l'historique
 ************************/
function saveToHistory() {
    const d = calculateDuration();

    if (!d) {
    alert("Record at least the first and last steps before saving.");
    return;
}

    let breakdown = [];

    for (let i = 2; i <= lastCompletedStep; i++) {
        const t1 = parseFrenchTime(steps[i - 1]);
        const t2 = parseFrenchTime(steps[i]);

        if (t1 && t2) {
            const start = new Date();
            start.setHours(t1.hour, t1.minute, 0);

            const end = new Date();
            end.setHours(t2.hour, t2.minute, 0);

            const diffMs = end - start;
            const dm = Math.floor(diffMs / 60000);
            const ds = Math.floor((diffMs % 60000) / 1000);

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

    // Reset routine
    steps = Array(11).fill(null);
    lastCompletedStep = 0;
    localStorage.removeItem("currentRoutine");

    updateUI();
    updateCurrentStep();

    alert("Routine saved to history.");
}

/***********************
 * Charger History
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

function clearHistory() {
    if (confirm("Clear ALL history?")) {
        localStorage.removeItem("history");
        loadHistory();
    }
}
