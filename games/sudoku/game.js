/* Sudoku Game Logic */

const boardEl = document.getElementById('board');
const mistakesEl = document.getElementById('mistakes');
const timerEl = document.getElementById('timer');
const resetBtn = document.getElementById('resetBtn');
const overlay = document.getElementById('overlay');
const overlayIcon = document.getElementById('overlayIcon');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMsg = document.getElementById('overlayMsg');
const overlayBtn = document.getElementById('overlayBtn');
const diffBtns = document.querySelectorAll('.diff-btn');
const numBtns = document.querySelectorAll('.num-btn');

const EMPTY_COUNTS = { easy: 30, medium: 40, hard: 52 };
let difficulty = 'easy';
let solution = [];
let puzzle = [];
let userGrid = [];
let selectedCell = null; // {r, c}
let mistakes = 0;
const MAX_MISTAKES = 3;
let timerInterval, seconds;
let gameActive = false;

// ---- SUDOKU GENERATOR ----
function generateSolution() {
  const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillGrid(grid);
  return grid;
}

function fillGrid(grid) {
  const empty = findEmpty(grid);
  if (!empty) return true;
  const [r, c] = empty;
  const nums = shuffle([1,2,3,4,5,6,7,8,9]);
  for (const num of nums) {
    if (isValid(grid, r, c, num)) {
      grid[r][c] = num;
      if (fillGrid(grid)) return true;
      grid[r][c] = 0;
    }
  }
  return false;
}

function findEmpty(grid) {
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      if (grid[r][c] === 0) return [r, c];
  return null;
}

function isValid(grid, row, col, num) {
  // Row
  if (grid[row].includes(num)) return false;
  // Col
  for (let r = 0; r < 9; r++) if (grid[r][col] === num) return false;
  // Box
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++)
    for (let c = bc; c < bc + 3; c++)
      if (grid[r][c] === num) return false;
  return true;
}

function createPuzzle(sol, empties) {
  const puz = sol.map(row => [...row]);
  let removed = 0;
  const cells = shuffle([...Array(81).keys()]);
  for (const idx of cells) {
    if (removed >= empties) break;
    const r = Math.floor(idx / 9), c = idx % 9;
    if (puz[r][c] !== 0) {
      puz[r][c] = 0;
      removed++;
    }
  }
  return puz;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---- INIT ----
function init() {
  solution = generateSolution();
  puzzle = createPuzzle(solution, EMPTY_COUNTS[difficulty]);
  userGrid = puzzle.map(row => [...row]);
  selectedCell = null;
  mistakes = 0;
  seconds = 0;
  gameActive = true;

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!gameActive) return;
    seconds++;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    timerEl.textContent = `${m}:${s.toString().padStart(2, '0')}`;
  }, 1000);

  mistakesEl.textContent = `0 / ${MAX_MISTAKES}`;
  timerEl.textContent = '0:00';
  overlay.classList.add('hidden');
  renderBoard();
}

// ---- RENDER ----
function renderBoard() {
  boardEl.innerHTML = '';
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = document.createElement('div');
      cell.className = 'sdk-cell';
      cell.dataset.row = r;
      cell.dataset.col = c;

      const val = userGrid[r][c];
      const isGiven = puzzle[r][c] !== 0;

      if (val !== 0) cell.textContent = val;

      if (isGiven) {
        cell.classList.add('given');
      } else if (val !== 0) {
        cell.classList.add('user');
        if (val !== solution[r][c]) cell.classList.add('error');
      }

      cell.addEventListener('click', () => selectCell(r, c));
      boardEl.appendChild(cell);
    }
  }
  highlightCells();
}

function getCell(r, c) {
  return boardEl.children[r * 9 + c];
}

function selectCell(r, c) {
  selectedCell = { r, c };
  highlightCells();
}

function highlightCells() {
  // Clear all highlights
  boardEl.querySelectorAll('.sdk-cell').forEach(el => {
    el.classList.remove('selected', 'highlight', 'same-num');
  });

  if (!selectedCell) return;
  const { r, c } = selectedCell;
  const selEl = getCell(r, c);
  selEl.classList.add('selected');

  // Highlight row, col, box
  for (let i = 0; i < 9; i++) {
    getCell(r, i).classList.add('highlight');
    getCell(i, c).classList.add('highlight');
  }
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let dr = 0; dr < 3; dr++)
    for (let dc = 0; dc < 3; dc++)
      getCell(br + dr, bc + dc).classList.add('highlight');

  // Highlight same number
  const val = userGrid[r][c];
  if (val !== 0) {
    for (let rr = 0; rr < 9; rr++)
      for (let cc = 0; cc < 9; cc++)
        if (userGrid[rr][cc] === val) getCell(rr, cc).classList.add('same-num');
  }
}

// ---- INPUT ----
function placeNumber(num) {
  if (!gameActive || !selectedCell) return;
  const { r, c } = selectedCell;
  if (puzzle[r][c] !== 0) return; // given cell

  if (num === 0) {
    userGrid[r][c] = 0;
  } else {
    userGrid[r][c] = num;
    if (num !== solution[r][c]) {
      mistakes++;
      mistakesEl.textContent = `${mistakes} / ${MAX_MISTAKES}`;
      if (mistakes >= MAX_MISTAKES) {
        gameActive = false;
        clearInterval(timerInterval);
        overlayIcon.textContent = '😞';
        overlayTitle.textContent = 'Game Over';
        overlayMsg.textContent = 'Too many mistakes!';
        overlay.classList.remove('hidden');
      }
    }
  }

  renderBoard();
  selectedCell = { r, c };
  highlightCells();

  // Check win
  if (gameActive && userGrid.every((row, ri) => row.every((v, ci) => v === solution[ri][ci]))) {
    gameActive = false;
    clearInterval(timerInterval);
    overlayIcon.textContent = '🎉';
    overlayTitle.textContent = 'Puzzle Solved!';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    overlayMsg.textContent = `Completed in ${m}:${s.toString().padStart(2, '0')}`;
    overlay.classList.remove('hidden');
  }
}

// Number pad
numBtns.forEach(btn => {
  btn.addEventListener('click', () => placeNumber(parseInt(btn.dataset.num)));
});

// Keyboard
document.addEventListener('keydown', (e) => {
  if (e.key >= '1' && e.key <= '9') placeNumber(parseInt(e.key));
  if (e.key === 'Backspace' || e.key === 'Delete') placeNumber(0);
  if (e.key === 'ArrowUp' && selectedCell && selectedCell.r > 0) selectCell(selectedCell.r - 1, selectedCell.c);
  if (e.key === 'ArrowDown' && selectedCell && selectedCell.r < 8) selectCell(selectedCell.r + 1, selectedCell.c);
  if (e.key === 'ArrowLeft' && selectedCell && selectedCell.c > 0) selectCell(selectedCell.r, selectedCell.c - 1);
  if (e.key === 'ArrowRight' && selectedCell && selectedCell.c < 8) selectCell(selectedCell.r, selectedCell.c + 1);
});

// Difficulty
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
