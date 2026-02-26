/* Tetris Game Logic */

const canvas = document.getElementById('tetrisCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const resetBtn = document.getElementById('resetBtn');
const retryBtn = document.getElementById('retryBtn');
const overlay = document.getElementById('overlay');
const finalScoreEl = document.getElementById('finalScore');

const COLS = 10;
const ROWS = 20;
const BLOCK = canvas.width / COLS; // 25

const COLORS = {
  I: '#06b6d4',
  O: '#f59e0b',
  T: '#8b5cf6',
  S: '#10b981',
  Z: '#ef4444',
  J: '#3b82f6',
  L: '#f97316',
};

const GLOW = {
  I: 'rgba(6, 182, 212, 0.25)',
  O: 'rgba(245, 158, 11, 0.25)',
  T: 'rgba(139, 92, 246, 0.25)',
  S: 'rgba(16, 185, 129, 0.25)',
  Z: 'rgba(239, 68, 68, 0.25)',
  J: 'rgba(59, 130, 246, 0.25)',
  L: 'rgba(249, 115, 22, 0.25)',
};

const SHAPES = {
  I: [[1,1,1,1]],
  O: [[1,1],[1,1]],
  T: [[0,1,0],[1,1,1]],
  S: [[0,1,1],[1,1,0]],
  Z: [[1,1,0],[0,1,1]],
  J: [[1,0,0],[1,1,1]],
  L: [[0,0,1],[1,1,1]],
};

let board, piece, nextPiece, score, lines, level, gameLoop, gameOver, dropCounter, dropInterval, lastTime;

function init() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  score = 0; lines = 0; level = 1;
  dropCounter = 0; dropInterval = 1000;
  gameOver = false;
  lastTime = 0;

  overlay.classList.add('hidden');
  scoreEl.textContent = '0';
  linesEl.textContent = '0';
  levelEl.textContent = '1';

  nextPiece = randomPiece();
  spawnPiece();
  drawNext();

  if (gameLoop) cancelAnimationFrame(gameLoop);
  gameLoop = requestAnimationFrame(update);
}

function randomPiece() {
  const types = Object.keys(SHAPES);
  const type = types[Math.floor(Math.random() * types.length)];
  return {
    type,
    shape: SHAPES[type].map(row => [...row]),
    x: 0, y: 0,
  };
}

function spawnPiece() {
  piece = nextPiece;
  piece.x = Math.floor((COLS - piece.shape[0].length) / 2);
  piece.y = 0;
  nextPiece = randomPiece();
  drawNext();

  if (collides(piece.shape, piece.x, piece.y)) {
    gameOver = true;
    finalScoreEl.textContent = score;
    overlay.classList.remove('hidden');
    // Save best
    const best = parseInt(localStorage.getItem('tetris-best')) || 0;
    if (score > best) localStorage.setItem('tetris-best', score);
  }
}

function collides(shape, px, py) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = px + c, ny = py + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

function merge() {
  piece.shape.forEach((row, r) => {
    row.forEach((val, c) => {
      if (val && piece.y + r >= 0) {
        board[piece.y + r][piece.x + c] = piece.type;
      }
    });
  });
}

function clearLines() {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(cell => cell !== null)) {
      board.splice(r, 1);
      board.unshift(Array(COLS).fill(null));
      cleared++;
      r++; // recheck
    }
  }
  if (cleared > 0) {
    const pts = [0, 100, 300, 500, 800];
    score += (pts[cleared] || 800) * level;
    lines += cleared;
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(100, 1000 - (level - 1) * 80);
    scoreEl.textContent = score;
    linesEl.textContent = lines;
    levelEl.textContent = level;
  }
}

function rotate(shape) {
  const rows = shape.length, cols = shape[0].length;
  const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rotated[c][rows - 1 - r] = shape[r][c];
    }
  }
  return rotated;
}

function drop() {
  if (collides(piece.shape, piece.x, piece.y + 1)) {
    merge();
    clearLines();
    spawnPiece();
  } else {
    piece.y++;
  }
}

function hardDrop() {
  while (!collides(piece.shape, piece.x, piece.y + 1)) {
    piece.y++;
    score += 2;
  }
  scoreEl.textContent = score;
  merge();
  clearLines();
  spawnPiece();
}

function moveLeft() {
  if (!collides(piece.shape, piece.x - 1, piece.y)) piece.x--;
}

function moveRight() {
  if (!collides(piece.shape, piece.x + 1, piece.y)) piece.x++;
}

function rotatePiece() {
  const rotated = rotate(piece.shape);
  // Wall kick: try 0, -1, +1, -2, +2
  for (const offset of [0, -1, 1, -2, 2]) {
    if (!collides(rotated, piece.x + offset, piece.y)) {
      piece.shape = rotated;
      piece.x += offset;
      return;
    }
  }
}

// ---- DRAW ----
function draw() {
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 0.5;
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath(); ctx.moveTo(c * BLOCK, 0); ctx.lineTo(c * BLOCK, canvas.height); ctx.stroke();
  }
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(0, r * BLOCK); ctx.lineTo(canvas.width, r * BLOCK); ctx.stroke();
  }

  // Board
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c]) drawBlock(ctx, c, r, board[r][c]);
    }
  }

  // Ghost piece
  if (piece && !gameOver) {
    let ghostY = piece.y;
    while (!collides(piece.shape, piece.x, ghostY + 1)) ghostY++;
    piece.shape.forEach((row, r) => {
      row.forEach((val, c) => {
        if (val && piece.y + r >= 0) {
          const gx = (piece.x + c) * BLOCK;
          const gy = (ghostY + r) * BLOCK;
          ctx.fillStyle = 'rgba(255,255,255,0.05)';
          ctx.fillRect(gx + 1, gy + 1, BLOCK - 2, BLOCK - 2);
        }
      });
    });

    // Active piece
    piece.shape.forEach((row, r) => {
      row.forEach((val, c) => {
        if (val && piece.y + r >= 0) drawBlock(ctx, piece.x + c, piece.y + r, piece.type);
      });
    });
  }
}

function drawBlock(context, x, y, type) {
  const px = x * BLOCK, py = y * BLOCK;
  context.shadowColor = GLOW[type];
  context.shadowBlur = 8;
  context.fillStyle = COLORS[type];
  context.fillRect(px + 1, py + 1, BLOCK - 2, BLOCK - 2);
  context.shadowBlur = 0;
  // Highlight
  context.fillStyle = 'rgba(255,255,255,0.15)';
  context.fillRect(px + 1, py + 1, BLOCK - 2, 3);
  context.fillRect(px + 1, py + 1, 3, BLOCK - 2);
}

function drawNext() {
  nextCtx.fillStyle = 'transparent';
  nextCtx.clearRect(0, 0, 100, 100);
  if (!nextPiece) return;
  const shape = nextPiece.shape;
  const blockSize = 20;
  const offsetX = (100 - shape[0].length * blockSize) / 2;
  const offsetY = (100 - shape.length * blockSize) / 2;
  shape.forEach((row, r) => {
    row.forEach((val, c) => {
      if (val) {
        const px = offsetX + c * blockSize, py = offsetY + r * blockSize;
        nextCtx.shadowColor = GLOW[nextPiece.type];
        nextCtx.shadowBlur = 6;
        nextCtx.fillStyle = COLORS[nextPiece.type];
        nextCtx.fillRect(px + 1, py + 1, blockSize - 2, blockSize - 2);
        nextCtx.shadowBlur = 0;
      }
    });
  });
}

// ---- LOOP ----
function update(time = 0) {
  if (gameOver) { draw(); return; }
  const dt = time - lastTime;
  lastTime = time;
  dropCounter += dt;
  if (dropCounter > dropInterval) {
    drop();
    dropCounter = 0;
  }
  draw();
  gameLoop = requestAnimationFrame(update);
}

// ---- INPUT ----
document.addEventListener('keydown', (e) => {
  if (gameOver) return;
  switch (e.key) {
    case 'ArrowLeft': case 'a': case 'A': e.preventDefault(); moveLeft(); break;
    case 'ArrowRight': case 'd': case 'D': e.preventDefault(); moveRight(); break;
    case 'ArrowDown': case 's': case 'S': e.preventDefault(); drop(); score += 1; scoreEl.textContent = score; break;
    case 'ArrowUp': case 'w': case 'W': e.preventDefault(); rotatePiece(); break;
    case ' ': e.preventDefault(); hardDrop(); break;
  }
});

// Mobile controls
document.getElementById('btnLeft').addEventListener('click', () => { if (!gameOver) moveLeft(); });
document.getElementById('btnRight').addEventListener('click', () => { if (!gameOver) moveRight(); });
document.getElementById('btnDown').addEventListener('click', () => { if (!gameOver) { drop(); score += 1; scoreEl.textContent = score; } });
document.getElementById('btnRotate').addEventListener('click', () => { if (!gameOver) rotatePiece(); });
document.getElementById('btnDrop').addEventListener('click', () => { if (!gameOver) hardDrop(); });

resetBtn.addEventListener('click', init);
retryBtn.addEventListener('click', init);

init();
