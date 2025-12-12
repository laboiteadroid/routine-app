// Timestamp storage for each step
alert("App.js VERSION: 3.0");
let stepTimes = {};
let firstTimestamp = null;
let lastTimestamp = null;

// List of step names (for breakdown in History)
const stepNames = [
    "", // index 0 unused
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

// Called when user taps a step
function recordTime(stepIndex) {
    const now = new Date();

    // Save timestamp
    stepTimes[stepIndex] = now;

    if (!firstTimestamp) firstTimestamp = now;
    lastTimestamp = now;

    // Display time
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById(`time-${stepIndex}`).textContent = timeStr;

    // Update durations between steps
    updateStepDurations();

    // Update focus text
    const next = stepIndex + 1;
    if (next <= 10) {
        document.getElementById("focusStep").textContent =
            document.getElementById(`label-${next}`).textContent;
    } else {
        document.getElementById("focusStep").textContent = "Routine completed!";
    }

    alert(stepNames[stepIndex] + " recorded at " + timeStr);
}

// Calculates (+Xm) between each consecutive step
function updateStepDurations() {
    for (let i = 2; i <= 10; i++) {
        if (stepTimes[i] && stepTimes[i - 1]) {
            const diffMs = stepTimes[i] - stepTimes[i - 1];
            const min = Math.floor(diffMs / 60000);
            const sec = Math.floor((diffMs % 60000) / 1000);

            const formatted =
                sec === 0 ? `(+${min}m)` : `(+${min}m${sec}s)`;

            document.getElementById(`delta-${i}`).textContent = formatted;
        }
    }
}

// Show the total routine duration
function showTotalDuration() {
    if (!firstTimestamp || !lastTimestamp) {
        alert("You must record at least two steps.");
        return;
    }

    const diffMs = lastTimestamp - firstTimestamp;
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);

    alert("Total routine duration: " + minutes + " min " + seconds + " sec");
}

// Save routine data to history
function saveToHistory() {
    if (!firstTimestamp || !lastTimestamp) {
        alert("You must record the routine first.");
        return;
    }

    // Total duration
    const diffMs = lastTimestamp - firstTimestamp;
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    const totalDuration = minutes + " min " + seconds + " sec";

    const startTime = firstTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTime = lastTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Step-by-step breakdown with names
    let breakdown = [];
    for (let i = 2; i <= 10; i++) {
        if (stepTimes[i] && stepTimes[i - 1]) {
            const diff = stepTimes[i] - stepTimes[i - 1];
            const m = Math.floor(diff / 60000);
            const s = Math.floor((diff % 60000) / 1000);

            breakdown.push(`${stepNames[i - 1]} → ${stepNames[i]} : ${m}m${s}s`);
        }
    }

    // History entry object
    const entry = {
        date: new Date().toLocaleDateString(),
        start: startTime,
        end: endTime,
        duration: totalDuration,
        breakdown: breakdown
    };

    // Save to localStorage
    let history = JSON.parse(localStorage.getItem("routine_history") || "[]");
    history.push(entry);
    localStorage.setItem("routine_history", JSON.stringify(history));

    alert("Saved to history!");
}
