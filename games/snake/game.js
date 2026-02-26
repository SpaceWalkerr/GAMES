/* ============================================
   SNAKE GAME - Complete Logic
   ============================================ */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreDisplay');
const highScoreDisplay = document.getElementById('highScoreDisplay');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const goScore = document.getElementById('goScore');
const goBest = document.getElementById('goBest');
const playAgainBtn = document.getElementById('playAgainBtn');

// Game settings
const GRID_SIZE = 20;
const CELL_SIZE = canvas.width / GRID_SIZE;
const FPS = 12;

// Colors
const COLORS = {
  board: '#0d0d14',
  grid: 'rgba(255, 255, 255, 0.02)',
  head: '#06b6d4',
  headGlow: 'rgba(6, 182, 212, 0.3)',
  body: '#8b5cf6',
  bodyGlow: 'rgba(139, 92, 246, 0.15)',
  food: '#f43f5e',
  foodGlow: 'rgba(244, 63, 94, 0.4)',
  foodInner: '#fb7185',
};

// State
let snake, food, direction, directionQueue, score, highScore, gameLoop, gameStarted;

function initState() {
  snake = [
    { x: 4, y: 10 },
    { x: 3, y: 10 },
    { x: 2, y: 10 },
  ];
  direction = '';
  directionQueue = [];
  score = 0;
  gameStarted = false;
  highScore = parseInt(localStorage.getItem('high-score')) || 0;
  food = spawnFood();
  updateScoreDisplay();
}

// ---- DRAW ----
function drawBoard() {
  // Dark background
  ctx.fillStyle = COLORS.board;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle grid
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= GRID_SIZE; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CELL_SIZE, 0);
    ctx.lineTo(i * CELL_SIZE, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * CELL_SIZE);
    ctx.lineTo(canvas.width, i * CELL_SIZE);
    ctx.stroke();
  }
}

function drawSnake() {
  snake.forEach((segment, index) => {
    const x = segment.x * CELL_SIZE;
    const y = segment.y * CELL_SIZE;
    const isHead = index === 0;
    const progress = 1 - (index / snake.length);

    if (isHead) {
      // Head glow
      ctx.shadowColor = COLORS.headGlow;
      ctx.shadowBlur = 15;
      ctx.fillStyle = COLORS.head;
    } else {
      ctx.shadowColor = COLORS.bodyGlow;
      ctx.shadowBlur = 6;
      // Gradient from head color to body color
      const alpha = 0.5 + progress * 0.5;
      ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`;
    }

    // Rounded rectangle
    const padding = isHead ? 1 : 2;
    const radius = isHead ? 5 : 3;
    roundRect(ctx, x + padding, y + padding, CELL_SIZE - padding * 2, CELL_SIZE - padding * 2, radius);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Eyes on head
    if (isHead) {
      drawEyes(segment);
    }
  });
}

function drawEyes(head) {
  const x = head.x * CELL_SIZE;
  const y = head.y * CELL_SIZE;
  const eyeSize = 3;
  ctx.fillStyle = '#fff';

  let ex1, ey1, ex2, ey2;
  switch (direction) {
    case 'right':
      ex1 = x + CELL_SIZE - 7; ey1 = y + 5;
      ex2 = x + CELL_SIZE - 7; ey2 = y + CELL_SIZE - 8;
      break;
    case 'left':
      ex1 = x + 5; ey1 = y + 5;
      ex2 = x + 5; ey2 = y + CELL_SIZE - 8;
      break;
    case 'up':
      ex1 = x + 5; ey1 = y + 5;
      ex2 = x + CELL_SIZE - 8; ey2 = y + 5;
      break;
    case 'down':
      ex1 = x + 5; ey1 = y + CELL_SIZE - 7;
      ex2 = x + CELL_SIZE - 8; ey2 = y + CELL_SIZE - 7;
      break;
    default:
      ex1 = x + CELL_SIZE - 7; ey1 = y + 5;
      ex2 = x + CELL_SIZE - 7; ey2 = y + CELL_SIZE - 8;
  }

  ctx.beginPath();
  ctx.arc(ex1, ey1, eyeSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ex2, ey2, eyeSize, 0, Math.PI * 2);
  ctx.fill();
}

function drawFood() {
  const x = food.x * CELL_SIZE + CELL_SIZE / 2;
  const y = food.y * CELL_SIZE + CELL_SIZE / 2;
  const radius = CELL_SIZE / 2 - 3;

  // Outer glow
  ctx.shadowColor = COLORS.foodGlow;
  ctx.shadowBlur = 20;

  // Food circle
  ctx.fillStyle = COLORS.food;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Inner highlight
  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.foodInner;
  ctx.beginPath();
  ctx.arc(x - 2, y - 2, radius * 0.4, 0, Math.PI * 2);
  ctx.fill();
}

// ---- FOOD ----
function spawnFood() {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  return pos;
}

// ---- MOVE ----
function moveSnake() {
  if (!gameStarted) return;

  const head = { ...snake[0] };

  if (directionQueue.length) {
    direction = directionQueue.shift();
  }

  switch (direction) {
    case 'right': head.x += 1; break;
    case 'left':  head.x -= 1; break;
    case 'up':    head.y -= 1; break;
    case 'down':  head.y += 1; break;
    default: return;
  }

  // Eat food?
  if (head.x === food.x && head.y === food.y) {
    food = spawnFood();
    score++;
    updateScoreDisplay();
  } else {
    snake.pop();
  }

  snake.unshift(head);
}

// ---- COLLISION ----
function checkCollision() {
  const head = snake[0];
  // Wall
  if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) return true;
  // Self
  for (let i = 1; i < snake.length; i++) {
    if (snake[i].x === head.x && snake[i].y === head.y) return true;
  }
  return false;
}

// ---- SCORE ----
function updateScoreDisplay() {
  scoreDisplay.textContent = score;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('high-score', highScore);
  }
  highScoreDisplay.textContent = highScore;
}

// ---- GAME OVER ----
function gameOver() {
  clearInterval(gameLoop);
  goScore.textContent = score;
  goBest.textContent = highScore;
  gameOverScreen.classList.remove('hidden');
}

// ---- GAME LOOP ----
function frame() {
  drawBoard();
  drawFood();
  moveSnake();
  drawSnake();
  if (checkCollision()) {
    gameOver();
  }
}

// ---- INPUT ----
const opposites = { right: 'left', left: 'right', up: 'down', down: 'up' };

function setDirection(newDir) {
  const last = directionQueue.length ? directionQueue[directionQueue.length - 1] : direction;
  if (newDir === last || newDir === opposites[last]) return;

  if (!gameStarted) {
    gameStarted = true;
    startScreen.classList.add('hidden');
    gameLoop = setInterval(frame, 1000 / FPS);
  }
  directionQueue.push(newDir);
}

document.addEventListener('keydown', (e) => {
  const keyMap = {
    ArrowRight: 'right', ArrowLeft: 'left', ArrowUp: 'up', ArrowDown: 'down',
    d: 'right', a: 'left', w: 'up', s: 'down',
    D: 'right', A: 'left', W: 'up', S: 'down',
  };
  if (keyMap[e.key]) {
    e.preventDefault();
    setDirection(keyMap[e.key]);
  }
});

// Touch / Swipe
let touchStartX = 0, touchStartY = 0;
canvas.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].clientX;
  touchStartY = e.changedTouches[0].clientY;
}, { passive: true });

canvas.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
  if (Math.abs(dx) > Math.abs(dy)) {
    setDirection(dx > 0 ? 'right' : 'left');
  } else {
    setDirection(dy > 0 ? 'down' : 'up');
  }
}, { passive: true });

// D-Pad buttons
document.querySelectorAll('.d-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    setDirection(btn.dataset.dir);
  });
  // Prevent hold-select on mobile
  btn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    setDirection(btn.dataset.dir);
  });
});

// ---- RESTART ----
playAgainBtn.addEventListener('click', () => {
  gameOverScreen.classList.add('hidden');
  initState();
  startScreen.classList.remove('hidden');
  drawBoard();
  drawSnake();
  drawFood();
});

// ---- HELPERS ----
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ---- INIT ----
initState();
drawBoard();
drawSnake();
drawFood();
