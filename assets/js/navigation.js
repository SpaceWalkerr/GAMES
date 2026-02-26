/* ============================================
   NAVIGATION COMPONENT - Injected via JS
   ============================================ */

class ArcadeNavigation {
  constructor(activePage = '') {
    this.activePage = activePage;
    this.isOpen = false;
    this.init();
  }

  getBasePath() {
    const path = window.location.pathname;
    if (path.includes('/games/')) {
      return '../../';
    }
    return './';
  }

  init() {
    const base = this.getBasePath();
    const nav = document.createElement('nav');
    nav.className = 'navbar';
    nav.innerHTML = `
      <a href="${base}index.html" class="nav-brand">
        <div class="nav-brand-icon">🎮</div>
        <span class="nav-brand-text">Arcade Zone</span>
      </a>
      <ul class="nav-links">
        <li><a href="${base}index.html" class="${this.activePage === 'home' ? 'active' : ''}">
          <span class="nav-link-icon">🏠</span> Home
        </a></li>
        <li><a href="${base}games/2048/index.html" class="${this.activePage === '2048' ? 'active' : ''}">
          <span class="nav-link-icon">🔢</span> 2048
        </a></li>
        <li><a href="${base}games/snake/index.html" class="${this.activePage === 'snake' ? 'active' : ''}">
          <span class="nav-link-icon">🐍</span> Snake
        </a></li>
        <li><a href="${base}games/tictactoe/index.html" class="${this.activePage === 'tictactoe' ? 'active' : ''}">
          <span class="nav-link-icon">⭕</span> Tic Tac Toe
        </a></li>
        <li><a href="${base}games/minesweeper/index.html" class="${this.activePage === 'minesweeper' ? 'active' : ''}">
          <span class="nav-link-icon">💣</span> Minesweeper
        </a></li>
        <li><a href="${base}games/memory/index.html" class="${this.activePage === 'memory' ? 'active' : ''}">
          <span class="nav-link-icon">🃏</span> Memory
        </a></li>
        <li><a href="${base}games/tetris/index.html" class="${this.activePage === 'tetris' ? 'active' : ''}">
          <span class="nav-link-icon">🧱</span> Tetris
        </a></li>
        <li><a href="${base}games/breakout/index.html" class="${this.activePage === 'breakout' ? 'active' : ''}">
          <span class="nav-link-icon">🏓</span> Breakout
        </a></li>
        <li><a href="${base}games/sudoku/index.html" class="${this.activePage === 'sudoku' ? 'active' : ''}">
          <span class="nav-link-icon">🔟</span> Sudoku
        </a></li>
      </ul>
      <div class="nav-toggle" id="navToggle">
        <span></span><span></span><span></span>
      </div>
    `;
    document.body.prepend(nav);

    // Mobile toggle
    const toggle = document.getElementById('navToggle');
    const links = nav.querySelector('.nav-links');
    toggle.addEventListener('click', () => {
      this.isOpen = !this.isOpen;
      links.classList.toggle('open', this.isOpen);
    });

    // Close on link click (mobile)
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('open');
        this.isOpen = false;
      });
    });

    // Scroll effect
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    });
  }
}

// Background gradient
function addBgGradient() {
  const bg = document.createElement('div');
  bg.className = 'bg-gradient';
  document.body.prepend(bg);
}
