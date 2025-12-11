// Track timestamps for each step
let stepTimes = {};
let firstTimestamp = null;
let lastTimestamp = null;

// Called when user clicks a step
function recordTime(stepIndex) {
    const now = new Date();

    // Save timestamp for this step
    stepTimes[stepIndex] = now;

    if (!firstTimestamp) firstTimestamp = now;
    lastTimestamp = now;

    // Update UI: show time
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById(`time-${stepIndex}`).textContent = timeStr;

    // Update UI: calculate step-to-step durations
    updateStepDurations();

    // Update current focus
    const next = stepIndex + 1;
    if (next <= 10) {
        document.getElementById("focusStep").textContent =
            document.getElementById(`label-${next}`).textContent;
    } else {
        document.getElementById("focusStep").textContent = "Routine completed!";
    }

    alert(document.getElementById(`label-${stepIndex}`).textContent + " recorded at " + timeStr);
}

// Calculate (+Xm) durations for each step
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

// Show total routine duration
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

// Save everything to history
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

    const startTime = firstTimestamp.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
    const endTime = lastTimestamp.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });

    // Step-by-step durations
    let breakdown = [];
    for (let i = 2; i <= 10; i++) {
        if (stepTimes[i] && stepTimes[i - 1]) {
            const diff = stepTimes[i] - stepTimes[i - 1];
            const m = Math.floor(diff / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            breakdown.push(`${i-1}→${i}: ${m}m${s}s`);
        }
    }

    // Store in localStorage
    const entry = {
        date: new Date().toLocaleDateString(),
        start: startTime,
        end: endTime,
        duration: totalDuration,
        breakdown: breakdown
    };

    let history = JSON.parse(localStorage.getItem("routine_history") || "[]");
    history.push(entry);
    localStorage.setItem("routine_history", JSON.stringify(history));

    alert("Saved to history!");
}