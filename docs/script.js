const towers = document.querySelectorAll(".tower");
const movesEl = document.getElementById("moves");
const diskCountEl = document.getElementById("diskCount");
const minMovesEl = document.getElementById("minMoves");

const overlay = document.getElementById("overlay");
const resultBox = document.getElementById("resultBox");

let diskCount = 3;
let moves = 0;
let dragged = null;
let selected = null;
let solving = false;
let solveToken = 0;
let manualPlay = false;

/* Neon disk colors */
const DISK_COLORS = [
  "#ff3b3b",
  "#b9ffb0",
  "#2aff6a",
  "#e8d6ff",
  "#ffe600",
  "#ffb199",
  "#28ff28",
  "#ff5a2a"
];

function minMoves(n) {
  return Math.pow(2, n) - 1;
}

function showResult(text, color = "#00ff7a") {
  resultBox.textContent = text;
  resultBox.style.color = color;
  overlay.classList.remove("hidden");
}

function hideResult() {
  overlay.classList.add("hidden");
  resultBox.textContent = "";
}

function reset() {
  solveToken++;
  solving = false;
  moves = 0;
  dragged = null;
  selected = null;
  manualPlay = false;

  hideResult();

  movesEl.textContent = moves;
  minMovesEl.textContent = minMoves(diskCount);
  towers.forEach(t => (t.innerHTML = ""));

  for (let i = diskCount; i >= 1; i--) {
    const d = document.createElement("div");
    d.className = "disk";
    d.style.width = 50 + i * 28 + "px";
    d.style.left = "50%";
    d.style.transform = "translateX(-50%)";
    d.style.bottom = (diskCount - i) * 24 + "px";

    const color = DISK_COLORS[diskCount - i];
    d.style.background = color;
    d.style.color = color;

    d.dataset.size = i;
    d.draggable = true;

    // Desktop
    d.addEventListener("dragstart", () => (dragged = d));
    d.addEventListener("click", () => (selected = d));

    // Mobile touch support
    d.addEventListener("touchstart", () => {
      dragged = d;
      selected = d;
    });

    d.addEventListener("touchmove", e => {
      e.preventDefault();
      const t = e.touches[0];
      d.style.position = "fixed";
      d.style.left = t.clientX - d.offsetWidth / 2 + "px";
      d.style.top = t.clientY - d.offsetHeight / 2 + "px";
      d.style.zIndex = 1000;
    });

    d.addEventListener("touchend", e => {
      const t = e.changedTouches[0];
      const el = document.elementFromPoint(t.clientX, t.clientY);
      const tower = el && el.closest(".tower");

      // restore normal style
      d.style.position = "absolute";
      d.style.left = "50%";
      d.style.top = "";
      d.style.transform = "translateX(-50%)";
      d.style.zIndex = "";

      if (tower) placeDisk(tower);
      dragged = null;
    });

    towers[0].appendChild(d);
  }
}

function arrange(tower) {
  [...tower.children].forEach((d, i) => {
    d.style.bottom = i * 24 + "px";
  });
}

towers.forEach(tower => {
  tower.addEventListener("dragover", e => e.preventDefault());
  tower.addEventListener("drop", () => placeDisk(tower));
  tower.addEventListener("click", () => placeDisk(tower));
});

function placeDisk(tower) {
  if (solving) return;
  const disk = dragged || selected;
  if (!disk) return;

  manualPlay = true;

  const top = tower.lastElementChild;
  if (top && Number(top.dataset.size) < Number(disk.dataset.size)) return;

  tower.appendChild(disk);
  arrange(tower);
  moves++;
  movesEl.textContent = moves;

  dragged = null;
  selected = null;

  checkGameState();
}

function checkGameState() {
  const min = minMoves(diskCount);

  if (towers[2].children.length === diskCount && manualPlay) {
    showResult("You Won!", "#00ff7a");
  } 
  else if (manualPlay && moves > min) {
    showResult("You Lost", "#ff4d4d");
  }
}


function solveHanoi(n, from, aux, to, steps = []) {
  if (n === 0) return steps;
  solveHanoi(n - 1, from, to, aux, steps);
  steps.push([from, to]);
  solveHanoi(n - 1, aux, from, to, steps);
  return steps;
}

async function autoSolve() {
  if (solving) return;
  solving = true;
  const myToken = ++solveToken;
  const steps = solveHanoi(diskCount, 0, 1, 2);

  for (let [f, t] of steps) {
    if (myToken !== solveToken) return;
    await new Promise(r => setTimeout(r, 450));

    const disk = towers[f].lastElementChild;
    if (!disk) continue;
    towers[t].appendChild(disk);
    arrange(towers[t]);
    moves++;
    movesEl.textContent = moves;
  }

  solving = false;
}

/* Controls */
document.getElementById("inc").onclick = () => {
  if (diskCount < 8) {
    diskCount++;
    diskCountEl.textContent = diskCount;
    reset();
  }
};

document.getElementById("dec").onclick = () => {
  if (diskCount > 2) {
    diskCount--;
    diskCountEl.textContent = diskCount;
    reset();
  }
};

document.getElementById("restart").onclick = reset;
document.getElementById("solve").onclick = autoSolve;

document.getElementById("toggleLog").onclick = () => {
  document.getElementById("logBox").classList.toggle("hidden");
};

reset();
