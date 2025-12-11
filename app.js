const steps = [
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

let firstTimestamp = null;
let lastTimestamp = null;

function formatTime(d) {
  return d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
}

function renderSteps() {
  const list = document.getElementById('stepsList');
  list.innerHTML = '';
  steps.forEach((s, i) => {
    const div = document.createElement('div');
    div.className = 'step';
    const timeText = '';
    div.innerHTML = `<div><div class="label">${i+1}. ${s}</div><div class="time" id="time-${i}">${timeText}</div></div><button class="btn">Record time</button>`;
    div.onclick = () => recordTime(i);
    list.appendChild(div);
  });
  updateFocus();
}

function updateFocus() {
  const idx = getCurrentIndex();
  const title = document.getElementById('currentStepTitle');
  const timeDisp = document.getElementById('timeDisplay');
  if (idx === -1) {
    title.textContent = 'All done';
    timeDisp.textContent = '';
  } else {
    title.textContent = (idx+1) + '. ' + steps[idx];
    const el = document.getElementById('time-' + idx);
    timeDisp.textContent = el ? el.textContent : '';
  }
}

function getCurrentIndex() {
  for (let i=0;i<steps.length;i++) {
    const t = document.getElementById('time-' + i);
    if (t && !t.textContent) return i;
  }
  return -1;
}

function recordTime(index) {
  const now = new Date();
  if (!firstTimestamp) firstTimestamp = now;
  lastTimestamp = now;
  const el = document.getElementById('time-' + index);
  if (el) el.textContent = formatTime(now);
  updateFocus();
  setTimeout(()=>{ alert(steps[index] + ' recorded at ' + formatTime(now)); }, 50);
}

function showTotalDuration() {
  if (!firstTimestamp || !lastTimestamp) {
    alert('You must record at least two steps.');
    return;
  }
  const diffMs = lastTimestamp - firstTimestamp;
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  alert('Total routine duration: ' + minutes + ' min ' + seconds + ' sec');
}

function saveToHistory() {
  if (!firstTimestamp || !lastTimestamp) {
    alert('You must record the routine first.');
    return;
  }

  // Calculate duration
  const diffMs = lastTimestamp - firstTimestamp;
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);

  const duration = minutes + ' min ' + seconds + ' sec';

  // New fields: formatted start and end
  const startTime = firstTimestamp.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  const endTime = lastTimestamp.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});

  const today = new Date().toLocaleDateString();

  let history = JSON.parse(localStorage.getItem('routine_history') || '[]');

  history.push({
    date: today,
    start: startTime,
    end: endTime,
    duration: duration
  });

  localStorage.setItem('routine_history', JSON.stringify(history));

  alert('Saved to history: ' + duration);
}

document.addEventListener('DOMContentLoaded', () => {
  renderSteps();
  document.getElementById('doneBtn').addEventListener('click', () => {
    const idx = getCurrentIndex();
    if (idx !== -1) recordTime(idx);
  });
});