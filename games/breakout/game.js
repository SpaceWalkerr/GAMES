/* Breakout / Brick Breaker Game Logic */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const levelEl = document.getElementById('level');
const resetBtn = document.getElementById('resetBtn');
const startScreen = document.getElementById('startScreen');
const overlay = document.getElementById('overlay');
const overlayIcon = document.getElementById('overlayIcon');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMsg = document.getElementById('overlayMsg');
const overlayBtn = document.getElementById('overlayBtn');

const W = canvas.width;
const H = canvas.height;

// Colors for brick rows
const ROW_COLORS = [
  { fill: '#ef4444', glow: 'rgba(239,68,68,0.3)' },
  { fill: '#f97316', glow: 'rgba(249,115,22,0.3)' },
  { fill: '#f59e0b', glow: 'rgba(245,158,11,0.3)' },
  { fill: '#10b981', glow: 'rgba(16,185,129,0.3)' },
  { fill: '#3b82f6', glow: 'rgba(59,130,246,0.3)' },
  { fill: '#8b5cf6', glow: 'rgba(139,92,246,0.3)' },
];

// Paddle
const paddle = { w: 80, h: 12, x: 0, y: H - 30, speed: 8 };
// Ball
const ball = { x: 0, y: 0, r: 7, dx: 0, dy: 0, speed: 4.5 };

let bricks = [];
let score, lives, level, started, gameRunning, animId;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_PAD = 6;
const BRICK_TOP = 50;
let BRICK_W, BRICK_H;

function calcBrickSize() {
  BRICK_W = (W - BRICK_PAD * (BRICK_COLS + 1)) / BRICK_COLS;
  BRICK_H = 18;
}

function createBricks() {
  bricks = [];
  const rows = Math.min(BRICK_ROWS + level - 1, 6);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      bricks.push({
        x: BRICK_PAD + c * (BRICK_W + BRICK_PAD),
        y: BRICK_TOP + r * (BRICK_H + BRICK_PAD),
        w: BRICK_W,
        h: BRICK_H,
        alive: true,
        color: ROW_COLORS[r % ROW_COLORS.length],
        hits: level >= 3 && r === 0 ? 2 : 1, // Top row needs 2 hits on level 3+
      });
    }
  }
}

function init() {
  calcBrickSize();
  score = 0; lives = 3; level = 1; started = false; gameRunning = true;
  scoreEl.textContent = '0'; livesEl.textContent = '3'; levelEl.textContent = '1';
  overlay.classList.add('hidden');
  startScreen.classList.remove('hidden');
  createBricks();
  resetBall();
  draw();
}

function resetBall() {
  paddle.x = (W - paddle.w) / 2;
  ball.x = W / 2;
  ball.y = paddle.y - ball.r - 2;
  const angle = -Math.PI / 4 - Math.random() * Math.PI / 2;
  const spd = ball.speed + (level - 1) * 0.3;
  ball.dx = spd * Math.cos(angle);
  ball.dy = spd * Math.sin(angle);
  started = false;
}

// ---- DRAW ----
function draw() {
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, W, H);

  // Bricks
  bricks.forEach(b => {
    if (!b.alive) return;
    ctx.shadowColor = b.color.glow;
    ctx.shadowBlur = 10;
    ctx.fillStyle = b.color.fill;
    roundRect(ctx, b.x, b.y, b.w, b.h, 4);
    ctx.fill();
    ctx.shadowBlur = 0;
    if (b.hits > 1) {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.hits, b.x + b.w / 2, b.y + b.h / 2 + 4);
    }
  });

  // Paddle
  ctx.shadowColor = 'rgba(255,255,255,0.15)';
  ctx.shadowBlur = 12;
  const grad = ctx.createLinearGradient(paddle.x, 0, paddle.x + paddle.w, 0);
  grad.addColorStop(0, '#6366f1');
  grad.addColorStop(1, '#06b6d4');
  ctx.fillStyle = grad;
  roundRect(ctx, paddle.x, paddle.y, paddle.w, paddle.h, 6);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Ball
  ctx.shadowColor = 'rgba(255,255,255,0.4)';
  ctx.shadowBlur = 15;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function update() {
  if (!gameRunning || !started) return;

  ball.x += ball.dx;
  ball.y += ball.dy;

  // Wall bounce
  if (ball.x - ball.r <= 0 || ball.x + ball.r >= W) ball.dx = -ball.dx;
  if (ball.y - ball.r <= 0) ball.dy = -ball.dy;

  // Paddle collision
  if (
    ball.dy > 0 &&
    ball.y + ball.r >= paddle.y &&
    ball.y + ball.r <= paddle.y + paddle.h + 4 &&
    ball.x >= paddle.x &&
    ball.x <= paddle.x + paddle.w
  ) {
    const hitPos = (ball.x - paddle.x) / paddle.w; // 0..1
    const angle = -Math.PI / 6 - hitPos * (Math.PI / 2.5);
    const spd = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
    ball.dx = spd * Math.cos(angle);
    ball.dy = spd * Math.sin(angle);
    ball.y = paddle.y - ball.r;
  }

  // Brick collision
  bricks.forEach(b => {
    if (!b.alive) return;
    if (
      ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w &&
      ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h
    ) {
      b.hits--;
      if (b.hits <= 0) { b.alive = false; score += 10 * level; }
      else { score += 5; }
      ball.dy = -ball.dy;
      scoreEl.textContent = score;
    }
  });

  // Ball fell
  if (ball.y - ball.r > H) {
    lives--;
    livesEl.textContent = lives;
    if (lives <= 0) {
      gameRunning = false;
      showOverlay(false);
    } else {
      resetBall();
    }
  }

  // Check level clear
  if (bricks.every(b => !b.alive)) {
    level++;
    levelEl.textContent = level;
    createBricks();
    resetBall();
    startScreen.classList.remove('hidden');
  }
}

function showOverlay(won) {
  overlayIcon.textContent = won ? '🎉' : '💥';
  overlayTitle.textContent = won ? 'You Win!' : 'Game Over';
  overlayMsg.textContent = `Score: ${score}`;
  overlay.classList.remove('hidden');
  const best = parseInt(localStorage.getItem('breakout-best')) || 0;
  if (score > best) localStorage.setItem('breakout-best', score);
}

function loop() {
  update();
  draw();
  animId = requestAnimationFrame(loop);
}

// ---- INPUT ----
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  paddle.x = (e.clientX - rect.left) * scaleX - paddle.w / 2;
  paddle.x = Math.max(0, Math.min(W - paddle.w, paddle.x));
  if (!started) { ball.x = paddle.x + paddle.w / 2; }
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  paddle.x = (e.touches[0].clientX - rect.left) * scaleX - paddle.w / 2;
  paddle.x = Math.max(0, Math.min(W - paddle.w, paddle.x));
  if (!started) { ball.x = paddle.x + paddle.w / 2; }
}, { passive: false });

canvas.addEventListener('click', () => {
  if (!started && gameRunning) {
    started = true;
    startScreen.classList.add('hidden');
  }
});

canvas.addEventListener('touchstart', () => {
  if (!started && gameRunning) {
    started = true;
    startScreen.classList.add('hidden');
  }
}, { passive: true });

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

resetBtn.addEventListener('click', () => { cancelAnimationFrame(animId); init(); loop(); });
overlayBtn.addEventListener('click', () => { cancelAnimationFrame(animId); init(); loop(); });

init();
loop();
