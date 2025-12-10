const steps = [
  "Step 1","Step 2","Step 3","Step 4","Step 5",
  "Step 6","Step 7","Step 8","Step 9","Step 10"
];

const container = document.getElementById("steps");

steps.forEach((s,i)=>{
  const btn = document.createElement("button");
  btn.textContent = s + " - Tap to record";
  btn.onclick = ()=> {
    const now = new Date();
    btn.textContent = s + ": " +
      now.getHours().toString().padStart(2,'0') + ":" +
      now.getMinutes().toString().padStart(2,'0');
  };
  container.appendChild(btn);
});