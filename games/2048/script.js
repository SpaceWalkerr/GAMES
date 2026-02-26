/* ============================================
   2048 GAME - Complete Logic
   ============================================ */

const board = document.getElementById('board');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const resetBtn = document.getElementById('resetBtn');
const retryBtn = document.getElementById('retryBtn');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const finalScoreEl = document.getElementById('finalScore');

let grid = [
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
];
let score = 0;
let bestScore = parseInt(localStorage.getItem('best')) || 0;
let canMove = true;

// Touch tracking
let touchStartX = 0;
let touchStartY = 0;

// ---- INIT ----
function init() {
  grid = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
  score = 0;
  canMove = true;
  gameOverOverlay.classList.add('hidden');
  spawnTile();
  spawnTile();
  render();
}

// ---- SPAWN ----
function spawnTile() {
  const empty = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === 0) empty.push({ r, c });
    }
  }
  if (empty.length === 0) return;
  const { r, c } = empty[Math.floor(Math.random() * empty.length)];
  grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  // Mark new tile for animation
  grid[r][c] = { value: grid[r][c], isNew: true };
}

function getVal(cell) {
  return typeof cell === 'object' && cell !== null ? cell.value : cell;
}

function setVal(r, c, val, merged = false) {
  grid[r][c] = { value: val, merged };
}

// ---- RENDER ----
function render() {
  board.innerHTML = '';
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      const raw = grid[r][c];
      let val = 0;
      let isNew = false;
      let merged = false;

      if (typeof raw === 'object' && raw !== null) {
        val = raw.value;
        isNew = raw.isNew || false;
        merged = raw.merged || false;
      } else {
        val = raw;
      }

      if (val > 0) {
        cell.textContent = val;
        cell.setAttribute('data-value', val);
        if (isNew) cell.classList.add('pop');
        if (merged) cell.classList.add('merge');
      }

      board.appendChild(cell);
    }
  }

  // Flatten grid to plain values
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      grid[r][c] = getVal(grid[r][c]);
    }
  }

  scoreEl.textContent = score;
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('best', bestScore);
  }
  bestEl.textContent = bestScore;
}

// ---- MOVE LOGIC ----
function slideRow(row) {
  let arr = row.filter(v => v !== 0);
  let merged = new Array(4).fill(false);
  let scoreGain = 0;
  let moved = false;

  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2;
      scoreGain += arr[i];
      arr[i] = { value: arr[i], merged: true };
      arr.splice(i + 1, 1);
    }
  }

  while (arr.length < 4) arr.push(0);
  return { row: arr, scoreGain };
}

function moveLeft() {
  let totalGain = 0;
  let moved = false;
  for (let r = 0; r < 4; r++) {
    const oldRow = [...grid[r]];
    const { row, scoreGain } = slideRow(grid[r]);
    grid[r] = row.map(v => typeof v === 'object' ? v : v);
    totalGain += scoreGain;
    // Check if anything moved
    for (let c = 0; c < 4; c++) {
      const newVal = typeof row[c] === 'object' ? row[c].value : row[c];
      if (newVal !== oldRow[c]) moved = true;
    }
  }
  score += totalGain;
  return moved;
}

function moveRight() {
  let totalGain = 0;
  let moved = false;
  for (let r = 0; r < 4; r++) {
    const oldRow = [...grid[r]];
    const reversed = [...grid[r]].reverse();
    const { row, scoreGain } = slideRow(reversed);
    grid[r] = row.reverse();
    totalGain += scoreGain;
    for (let c = 0; c < 4; c++) {
      const newVal = typeof grid[r][c] === 'object' ? grid[r][c].value : grid[r][c];
      if (newVal !== oldRow[c]) moved = true;
    }
  }
  score += totalGain;
  return moved;
}

function transpose() {
  const newGrid = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      newGrid[c][r] = grid[r][c];
    }
  }
  grid = newGrid;
}

function moveUp() {
  transpose();
  const moved = moveLeft();
  transpose();
  return moved;
}

function moveDown() {
  transpose();
  const moved = moveRight();
  transpose();
  return moved;
}

// ---- CHECK GAME OVER ----
function isGameOver() {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === 0) return false;
      if (c < 3 && grid[r][c] === grid[r][c + 1]) return false;
      if (r < 3 && grid[r][c] === grid[r + 1][c]) return false;
    }
  }
  return true;
}

function showGameOver() {
  canMove = false;
  finalScoreEl.textContent = score;
  gameOverOverlay.classList.remove('hidden');
}

// ---- HANDLE MOVE ----
function handleMove(direction) {
  if (!canMove) return;
  let moved = false;

  switch (direction) {
    case 'left':  moved = moveLeft(); break;
    case 'right': moved = moveRight(); break;
    case 'up':    moved = moveUp(); break;
    case 'down':  moved = moveDown(); break;
  }

  if (moved) {
    // Flatten any remaining merge objects
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        grid[r][c] = getVal(grid[r][c]);
      }
    }
    spawnTile();
    render();

    if (isGameOver()) {
      setTimeout(showGameOver, 300);
    }
  }
}

// ---- KEYBOARD INPUT ----
document.addEventListener('keydown', (e) => {
  const keyMap = {
    ArrowLeft: 'left', ArrowRight: 'right',
    ArrowUp: 'up', ArrowDown: 'down',
    a: 'left', d: 'right', w: 'up', s: 'down',
    A: 'left', D: 'right', W: 'up', S: 'down',
  };
  if (keyMap[e.key]) {
    e.preventDefault();
    handleMove(keyMap[e.key]);
  }
});

// ---- TOUCH INPUT ----
board.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].clientX;
  touchStartY = e.changedTouches[0].clientY;
}, { passive: true });

board.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (Math.max(absDx, absDy) < 20) return; // too small

  if (absDx > absDy) {
    handleMove(dx > 0 ? 'right' : 'left');
  } else {
    handleMove(dy > 0 ? 'down' : 'up');
  }
}, { passive: true });

// ---- RESET ----
function resetGame() {
  init();
}

resetBtn.addEventListener('click', resetGame);
retryBtn.addEventListener('click', resetGame);

// ---- START ----
init();
