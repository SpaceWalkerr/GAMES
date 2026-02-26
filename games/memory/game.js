/* Memory Match Game Logic */

const boardEl = document.getElementById('board');
const movesEl = document.getElementById('moves');
const pairsEl = document.getElementById('pairs');
const timerEl = document.getElementById('timer');
const resetBtn = document.getElementById('resetBtn');
const overlay = document.getElementById('overlay');
const overlayMsg = document.getElementById('overlayMsg');
const overlayBtn = document.getElementById('overlayBtn');
const diffBtns = document.querySelectorAll('.diff-btn');

const EMOJIS = ['🎮','🚀','⭐','🎯','🔥','💎','🎵','🌈','🦊','🐼','🍕','🌺','🎸','🏆','⚡','🦋','🎨','🍭'];

let gridSize = 4;
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let totalPairs = 0;
let moves = 0;
let locked = false;
let timerInterval = null;
let seconds = 0;
let started = false;

function init() {
  const numCards = gridSize * gridSize;
  totalPairs = numCards / 2;
  matchedPairs = 0;
  moves = 0;
  seconds = 0;
  started = false;
  locked = false;
  flippedCards = [];
  clearInterval(timerInterval);

  movesEl.textContent = '0';
  pairsEl.textContent = `0 / ${totalPairs}`;
  timerEl.textContent = '0';
  overlay.classList.add('hidden');

  // Pick emojis and make pairs
  const chosen = shuffle([...EMOJIS]).slice(0, totalPairs);
  const deck = shuffle([...chosen, ...chosen]);
  cards = deck;

  boardEl.className = `mem-board${gridSize === 6 ? ' size-6' : ''}`;
  boardEl.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
  boardEl.innerHTML = '';

  deck.forEach((emoji, i) => {
    const card = document.createElement('div');
    card.className = 'mem-card';
    card.dataset.index = i;
    card.innerHTML = `
      <div class="mem-card-inner">
        <div class="mem-card-face mem-card-back">?</div>
        <div class="mem-card-face mem-card-front">${emoji}</div>
      </div>`;
    card.addEventListener('click', () => flipCard(i, card));
    boardEl.appendChild(card);
  });
}

function flipCard(index, cardEl) {
  if (locked || cardEl.classList.contains('flipped') || cardEl.classList.contains('matched')) return;

  if (!started) {
    started = true;
    timerInterval = setInterval(() => { seconds++; timerEl.textContent = seconds; }, 1000);
  }

  cardEl.classList.add('flipped');
  flippedCards.push({ index, el: cardEl });

  if (flippedCards.length === 2) {
    moves++;
    movesEl.textContent = moves;
    locked = true;

    const [a, b] = flippedCards;
    if (cards[a.index] === cards[b.index]) {
      // Match!
      setTimeout(() => {
        a.el.classList.add('matched');
        b.el.classList.add('matched');
        matchedPairs++;
        pairsEl.textContent = `${matchedPairs} / ${totalPairs}`;
        flippedCards = [];
        locked = false;
        if (matchedPairs === totalPairs) win();
      }, 350);
    } else {
      // No match
      setTimeout(() => {
        a.el.classList.remove('flipped');
        b.el.classList.remove('flipped');
        flippedCards = [];
        locked = false;
      }, 800);
    }
  }
}

function win() {
  clearInterval(timerInterval);
  overlayMsg.textContent = `${moves} moves in ${seconds}s`;
  overlay.classList.remove('hidden');
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Difficulty
diffBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    diffBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    gridSize = parseInt(btn.dataset.size);
    init();
  });
});

resetBtn.addEventListener('click', init);
overlayBtn.addEventListener('click', init);

init();
