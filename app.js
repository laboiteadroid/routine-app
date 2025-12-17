/***********************
 * Routine App JS v4.0 FINAL OFFICIELLE
 * Android Chrome / PWA SAFE
 ************************/

let steps = Array(11).fill(null);
let lastCompletedStep = 0;

/***********************
 * Noms des étapes
 ************************/
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
    checkAutoSave(); // 🛡️ sécurité post-refresh
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
function minutesToHours(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h.toString().padStart(2, "0")} h ${m.toString().padStart(2, "0")} min`;
}
/***********************
 * Texte étape courante
 ************************/
function updateCurrentStep() {
    const el = document.getElementById("focusStep");
    if (!el) return;

    if (lastCompletedStep === 0) {
        el.textContent = stepNames[1];
        return;
    }

    if (lastCompletedStep === 10) {
        el.textContent = "Routine finished";
        return;
    }

    el.textContent = stepNames[lastCompletedStep + 1];
}

/***********************
 * ENREGISTRER UNE ÉTAPE
 * + protection anti-double-clic
 ************************/
function recordTime(stepNumber) {

    // 🚫 Étape déjà enregistrée
    if (steps[stepNumber] !== null) return;

    // 🚫 Respect de l'ordre strict
    if (stepNumber !== lastCompletedStep + 1) return;

    const formatted = nowFormatted();
    steps[stepNumber] = formatted;

    // ⏱️ Calcul durée étape précédente
    if (stepNumber > 1 && steps[stepNumber - 1]) {
        const t1 = parseFrenchTime(steps[stepNumber - 1]);
        const t2 = parseFrenchTime(steps[stepNumber]);

        if (t1 && t2) {
            const s = new Date();
            const e = new Date();
            s.setHours(t1.hour, t1.minute, 0);
            e.setHours(t2.hour, t2.minute, 0);

            const diff = e - s;
            const m = Math.floor(diff / 60000);
            const sec = Math.floor((diff % 60000) / 1000);

            const el = document.getElementById(`delta-${stepNumber}`);
            if (el) el.textContent = `${m}m ${sec}s`;
        }
    }

    lastCompletedStep = stepNumber;

    // 💾 Anti-crash immédiat
    localStorage.setItem("currentRoutine", JSON.stringify(steps));

    updateUI();
    updateCurrentStep();
    checkAutoSave(); // ⭐ clé de la v4.0
}

/***********************
 * SAUVEGARDE AUTO ROBUSTE
 ************************/
function checkAutoSave() {
    if (lastCompletedStep === 10 && !localStorage.getItem("routineSaved")) {
        localStorage.setItem("routineSaved", "true");
        saveToHistory();
    }
}

/***********************
 * Calcul durée totale
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

/***********************
 * UI états visuels
 ************************/
function updateUI() {
    for (let i = 1; i <= 10; i++) {
        const timeEl = document.getElementById(`time-${i}`);
        const stepEl = timeEl?.closest(".step");

        if (timeEl) {
            timeEl.textContent = steps[i] || "--:--";
        }

        if (!stepEl) continue;

        stepEl.classList.remove("done", "active", "future");

        if (steps[i]) {
            stepEl.classList.add("done");
        } else if (i === lastCompletedStep + 1) {
            stepEl.classList.add("active");
        } else {
            stepEl.classList.add("future");
        }
    }
}

/***********************
 * Historique
 ************************/
function saveToHistory() {
    const d = calculateDuration();
    if (!d) return;

    const totalMinutes = d.min;
    const formattedHours = minutesToHours(totalMinutes);

    const sleepTime = document.getElementById("sleepTime")?.value || "";
    const sleepScore = document.getElementById("sleepScore")?.value || "";
    const note = document.getElementById("dailyNote")?.value || "";

    const history = JSON.parse(localStorage.getItem("history") || "[]");

    history.push({
        date: new Date().toLocaleDateString(),
        routineMinutes: totalMinutes,
        routineFormatted: formattedHours,
        sleepTime,
        sleepScore,
        note
    });

    localStorage.setItem("history", JSON.stringify(history));

    resetRoutine();
}

/***********************
 * RESET COMPLET PROPRE
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
 * Restaurer durées
 ************************/
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

/***********************
 * Page History
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
