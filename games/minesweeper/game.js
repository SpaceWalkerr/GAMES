/* Minesweeper Game Logic */

const boardEl = document.getElementById('board');
const mineCountEl = document.getElementById('mineCount');
const timerEl = document.getElementById('timer');
const resetBtn = document.getElementById('resetBtn');
const overlay = document.getElementById('overlay');
const overlayIcon = document.getElementById('overlayIcon');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMsg = document.getElementById('overlayMsg');
const overlayBtn = document.getElementById('overlayBtn');
const diffBtns = document.querySelectorAll('.diff-btn');

const DIFFICULTIES = {
  easy:   { rows: 9,  cols: 9,  mines: 10 },
  medium: { rows: 12, cols: 12, mines: 30 },
  hard:   { rows: 14, cols: 18, mines: 50 },
};

let difficulty = 'easy';
let rows, cols, totalMines;
let grid, revealed, flagged, mineLocations;
let gameOver, firstClick, flagCount;
let timerInterval, seconds;

// Long-press for mobile flagging
let longPressTimer = null;
let longPressed = false;

function init() {
  const d = DIFFICULTIES[difficulty];
  rows = d.rows; cols = d.cols; totalMines = d.mines;

  grid = Array.from({ length: rows }, () => Array(cols).fill(0));
  revealed = Array.from({ length: rows }, () => Array(cols).fill(false));
  flagged = Array.from({ length: rows }, () => Array(cols).fill(false));
  mineLocations = [];
  gameOver = false;
  firstClick = true;
  flagCount = 0;
  seconds = 0;

  clearInterval(timerInterval);
  timerEl.textContent = '0';
  mineCountEl.textContent = totalMines;
  overlay.classList.add('hidden');

  boardEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  renderBoard();
}

function placeMines(safeR, safeC) {
  let placed = 0;
  while (placed < totalMines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (grid[r][c] === -1) continue;
    if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
    grid[r][c] = -1;
    mineLocations.push({ r, c });
    placed++;
  }
  // Calculate numbers
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === -1) continue;
      let count = 0;
      forNeighbors(r, c, (nr, nc) => { if (grid[nr][nc] === -1) count++; });
      grid[r][c] = count;
    }
  }
}

function forNeighbors(r, c, fn) {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) fn(nr, nc);
    }
  }
}

function renderBoard() {
  boardEl.innerHTML = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.className = 'ms-cell';
      cell.dataset.r = r;
      cell.dataset.c = c;

      cell.addEventListener('click', () => handleClick(r, c));
      cell.addEventListener('contextmenu', (e) => { e.preventDefault(); toggleFlag(r, c); });

      // Long-press for mobile
      cell.addEventListener('touchstart', (e) => {
        longPressed = false;
        longPressTimer = setTimeout(() => { longPressed = true; toggleFlag(r, c); }, 400);
      }, { passive: true });
      cell.addEventListener('touchend', () => { clearTimeout(longPressTimer); });
      cell.addEventListener('touchmove', () => { clearTimeout(longPressTimer); });

      boardEl.appendChild(cell);
    }
  }
}

function getCell(r, c) {
  return boardEl.children[r * cols + c];
}

function handleClick(r, c) {
  if (gameOver || flagged[r][c] || revealed[r][c] || longPressed) return;

  if (firstClick) {
    firstClick = false;
    placeMines(r, c);
    timerInterval = setInterval(() => { seconds++; timerEl.textContent = seconds; }, 1000);
  }

  reveal(r, c);
  updateCells();
  checkWin();
}

function reveal(r, c) {
  if (r < 0 || r >= rows || c < 0 || c >= cols) return;
  if (revealed[r][c] || flagged[r][c]) return;

  revealed[r][c] = true;

  if (grid[r][c] === -1) {
    // Hit mine
    gameOver = true;
    clearInterval(timerInterval);
    revealAllMines();
    updateCells();
    showOverlay(false);
    return;
  }

  if (grid[r][c] === 0) {
    forNeighbors(r, c, (nr, nc) => reveal(nr, nc));
  }
}

function toggleFlag(r, c) {
  if (gameOver || revealed[r][c]) return;
  flagged[r][c] = !flagged[r][c];
  flagCount += flagged[r][c] ? 1 : -1;
  mineCountEl.textContent = totalMines - flagCount;
  updateCells();
}

function revealAllMines() {
  mineLocations.forEach(({ r, c }) => { revealed[r][c] = true; });
}

function updateCells() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = getCell(r, c);
      cell.className = 'ms-cell';
      cell.textContent = '';
      cell.removeAttribute('data-num');

      if (flagged[r][c] && !revealed[r][c]) {
        cell.classList.add('flagged');
        cell.textContent = '🚩';
      } else if (revealed[r][c]) {
        cell.classList.add('revealed');
        if (grid[r][c] === -1) {
          cell.classList.add('mine');
          cell.textContent = '💣';
        } else if (grid[r][c] > 0) {
          cell.textContent = grid[r][c];
          cell.setAttribute('data-num', grid[r][c]);
        }
      }
    }
  }
}

function checkWin() {
  if (gameOver) return;
  let unrevealedSafe = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!revealed[r][c] && grid[r][c] !== -1) unrevealedSafe++;
    }
  }
  if (unrevealedSafe === 0) {
    gameOver = true;
    clearInterval(timerInterval);
    // Save best time
    const key = `ms-best-${difficulty}`;
    const best = localStorage.getItem(key);
    if (!best || seconds < parseInt(best)) {
      localStorage.setItem(key, seconds);
    }
    showOverlay(true);
  }
}

function showOverlay(won) {
  overlayIcon.textContent = won ? '🎉' : '💥';
  overlayTitle.textContent = won ? 'You Win!' : 'Game Over';
  overlayMsg.textContent = won ? `Cleared in ${seconds}s!` : 'You hit a mine!';
  overlay.classList.remove('hidden');
}

// Difficulty buttons
diffBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    diffBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    difficulty = btn.dataset.diff;
    init();
  });
});

resetBtn.addEventListener('click', init);
overlayBtn.addEventListener('click', init);

init();
