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
