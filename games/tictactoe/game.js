/* ============================================
   TIC TAC TOE - Complete Logic
   ============================================ */

const cells = document.querySelectorAll('.ttt-cell');
const turnText = document.getElementById('turnText');
const scoreXEl = document.getElementById('scoreX');
const scoreOEl = document.getElementById('scoreO');
const scoreDrawEl = document.getElementById('scoreDraw');
const resultOverlay = document.getElementById('resultOverlay');
const resultTitle = document.getElementById('resultTitle');
const resultIcon = document.getElementById('resultIcon');
const nextRoundBtn = document.getElementById('nextRoundBtn');
const resetAllBtn = document.getElementById('resetAllBtn');
const winLine = document.getElementById('winLine');

// Winning combinations
const WINS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],             // diags
];

// Win line coordinates (relative to grid positions)
// Each maps to [x1%, y1%, x2%, y2%] of the board area
const LINE_COORDS = {
  '0,1,2': [8, 16.67, 92, 16.67],
  '3,4,5': [8, 50, 92, 50],
  '6,7,8': [8, 83.33, 92, 83.33],
  '0,3,6': [16.67, 8, 16.67, 92],
  '1,4,7': [50, 8, 50, 92],
  '2,5,8': [83.33, 8, 83.33, 92],
  '0,4,8': [8, 8, 92, 92],
  '2,4,6': [92, 8, 8, 92],
};

// State
let board = Array(9).fill('');
let currentPlayer = 'X';
let scores = {
  X: parseInt(localStorage.getItem('ttt-x') || 0),
  O: parseInt(localStorage.getItem('ttt-o') || 0),
  draw: parseInt(localStorage.getItem('ttt-draw') || 0),
};
let gameActive = true;

// ---- INIT ----
function init() {
  board = Array(9).fill('');
  currentPlayer = 'X';
  gameActive = true;
  
  cells.forEach(cell => {
    cell.textContent = '';
    cell.className = 'ttt-cell';
  });
  
  winLine.classList.remove('animate');
  winLine.setAttribute('x1', 0);
  winLine.setAttribute('y1', 0);
  winLine.setAttribute('x2', 0);
  winLine.setAttribute('y2', 0);
  
  updateTurn();
  updateScores();
}

// ---- CELL CLICK ----
cells.forEach(cell => {
  cell.addEventListener('click', () => {
    const idx = parseInt(cell.dataset.index);
    if (!gameActive || board[idx] !== '') return;

    board[idx] = currentPlayer;
    cell.textContent = currentPlayer;
    cell.classList.add(currentPlayer.toLowerCase(), 'taken');

    const winCombo = checkWin();
    if (winCombo) {
      gameActive = false;
      highlightWin(winCombo);
      scores[currentPlayer]++;
      localStorage.setItem(`ttt-${currentPlayer.toLowerCase()}`, scores[currentPlayer]);
      updateScores();

      setTimeout(() => {
        resultIcon.textContent = '🎉';
        resultTitle.textContent = `${currentPlayer} Wins!`;
        resultTitle.className = currentPlayer === 'X' ? 'x-wins' : 'o-wins';
        resultOverlay.classList.remove('hidden');
      }, 800);
      return;
    }

    if (board.every(c => c !== '')) {
      gameActive = false;
      scores.draw++;
      localStorage.setItem('ttt-draw', scores.draw);
      updateScores();

      setTimeout(() => {
        resultIcon.textContent = '🤝';
        resultTitle.textContent = "It's a Draw!";
        resultTitle.className = '';
        resultOverlay.classList.remove('hidden');
      }, 400);
      return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateTurn();
  });
});

// ---- CHECK WIN ----
function checkWin() {
  for (const combo of WINS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return combo;
    }
  }
  return null;
}

// ---- HIGHLIGHT WIN ----
function highlightWin(combo) {
  combo.forEach(idx => {
    cells[idx].classList.add('winner');
  });

  // Draw win line
  const key = combo.join(',');
  const coords = LINE_COORDS[key];
  if (coords) {
    const [x1p, y1p, x2p, y2p] = coords;
    winLine.setAttribute('x1', (x1p / 100) * 300);
    winLine.setAttribute('y1', (y1p / 100) * 300);
    winLine.setAttribute('x2', (x2p / 100) * 300);
    winLine.setAttribute('y2', (y2p / 100) * 300);

    // Set line color based on winner
    winLine.style.stroke = currentPlayer === 'X'
      ? 'rgba(239, 68, 68, 0.7)'
      : 'rgba(59, 130, 246, 0.7)';
    winLine.style.filter = currentPlayer === 'X'
      ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.5))'
      : 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))';

    requestAnimationFrame(() => {
      winLine.classList.add('animate');
    });
  }
}

// ---- UPDATE UI ----
function updateTurn() {
  turnText.textContent = `${currentPlayer}'s turn`;
  turnText.style.color = currentPlayer === 'X' ? '#ef4444' : '#3b82f6';
}

function updateScores() {
  scoreXEl.textContent = scores.X;
  scoreOEl.textContent = scores.O;
  scoreDrawEl.textContent = scores.draw;
}

// ---- BUTTONS ----
nextRoundBtn.addEventListener('click', () => {
  resultOverlay.classList.add('hidden');
  init();
});

resetAllBtn.addEventListener('click', () => {
  scores = { X: 0, O: 0, draw: 0 };
  localStorage.removeItem('ttt-x');
  localStorage.removeItem('ttt-o');
  localStorage.removeItem('ttt-draw');
  init();
});

// ---- START ----
init();
