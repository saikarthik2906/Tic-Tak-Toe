/* Tic-Tac-Toe — Pure JS (external)
   - Two-player
   - Win detection & highlight
   - Draw detection
   - Restart, Undo, Clear history
   - Keyboard accessibility (Enter/Space to place, arrow keys to navigate)
*/

document.addEventListener('DOMContentLoaded', () => {
  // DOM references
  const boardEl = document.getElementById('board');
  const cells = Array.from(boardEl.querySelectorAll('.cell'));
  const turnText = document.getElementById('turnText');
  const turnBadge = document.getElementById('turnBadge');
  const restartBtn = document.getElementById('restartBtn');
  const swapStartBtn = document.getElementById('swapStartBtn');
  const movesCounter = document.getElementById('movesCounter');
  const undoBtn = document.getElementById('undoBtn');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');

  const WIN_COMBOS = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6]          // diagonals
  ];

  let boardState = Array(9).fill(null); // 'X' or 'O' or null
  let currentPlayer = 'X';
  let startingPlayer = 'X';
  let gameOver = false;
  let moves = 0;
  let history = []; // {index,player}

  function init(){
    cells.forEach((cell, idx) => {
      cell.addEventListener('click', () => onCellClick(idx));
      cell.addEventListener('keydown', (e) => onCellKeydown(e, idx));
      cell.setAttribute('aria-label', `Cell ${idx+1}: empty`);
      renderCell(cell, boardState[idx]);
    });

    restartBtn.addEventListener('click', resetGame);
    swapStartBtn.addEventListener('click', toggleStartingPlayer);
    undoBtn.addEventListener('click', undoLastMove);
    clearHistoryBtn.addEventListener('click', clearHistory);

    document.addEventListener('keydown', arrowKeyNavigation);

    updateUI();
    setTimeout(()=> cells[0].focus(), 200);
  }

  function renderCell(cellEl, value){
    cellEl.classList.remove('x','o','win');
    cellEl.innerHTML = '';
    if (value === 'X'){
      cellEl.classList.add('x');
      const span = document.createElement('span');
      span.className = 'mark x';
      span.textContent = 'X';
      span.setAttribute('aria-hidden','true');
      cellEl.appendChild(span);
      cellEl.setAttribute('aria-label', `Cell ${cellEl.dataset.index}: X`);
      cellEl.setAttribute('disabled','true');
    } else if (value === 'O'){
      cellEl.classList.add('o');
      const span = document.createElement('span');
      span.className = 'mark o';
      span.textContent = 'O';
      span.setAttribute('aria-hidden','true');
      cellEl.appendChild(span);
      cellEl.setAttribute('aria-label', `Cell ${cellEl.dataset.index}: O`);
      cellEl.setAttribute('disabled','true');
    } else {
      cellEl.removeAttribute('disabled');
      cellEl.setAttribute('aria-label', `Cell ${cellEl.dataset.index}: empty`);
    }
  }

  function updateUI(message){
    if (message){
      turnText.textContent = message;
      turnBadge.style.display = 'none';
    } else {
      turnText.textContent = `Player ${currentPlayer}'s Turn`;
      turnBadge.style.display = 'inline-grid';
      turnBadge.textContent = currentPlayer;
      if (currentPlayer === 'X'){
        turnBadge.classList.add('x-badge'); turnBadge.classList.remove('o-badge');
      } else {
        turnBadge.classList.add('o-badge'); turnBadge.classList.remove('x-badge');
      }
    }
    movesCounter.textContent = `Moves: ${moves}`;
  }

  function onCellClick(index){
    if (gameOver) return;
    if (boardState[index]) return;
    placeMark(index, currentPlayer);
  }

  function placeMark(index, player){
    boardState[index] = player;
    moves++;
    history.push({index, player});
    renderCell(cells[index], player);

    const winner = checkWin();
    if (winner){
      gameOver = true;
      highlightWinningCells(winner.indices, winner.player);
      updateUI(`Player ${winner.player} Wins!`);
      announce(`Player ${winner.player} wins`);
      return;
    }

    if (moves >= 9){
      gameOver = true;
      updateUI('Draw!');
      announce('Game is a draw');
      return;
    }

    currentPlayer = (currentPlayer === 'X') ? 'O' : 'X';
    updateUI();
    announce(`Player ${currentPlayer}'s turn`);
  }

  function checkWin(){
    for (const combo of WIN_COMBOS){
      const [a,b,c] = combo;
      const v = boardState[a];
      if (v && boardState[b] === v && boardState[c] === v){
        return { player: v, indices: combo };
      }
    }
    return null;
  }

  function highlightWinningCells(indices, player){
    indices.forEach(i => {
      const el = cells[i];
      el.classList.add('win', player === 'X' ? 'x' : 'o');
    });
    cells.forEach((c, idx) => {
      if (!indices.includes(idx)){
        c.style.opacity = '0.86';
        c.style.transform = 'translateY(0)';
      }
    });
  }

  function resetGame(){
    boardState = Array(9).fill(null);
    currentPlayer = startingPlayer;
    gameOver = false;
    moves = 0;
    history = [];
    cells.forEach((cell) => {
      cell.removeAttribute('disabled');
      cell.style.opacity = '';
      cell.style.transform = '';
      cell.classList.remove('win','x','o');
      renderCell(cell, null);
    });
    updateUI();
    announce('Game reset. Player ' + currentPlayer + ' starts');
  }

  function toggleStartingPlayer(){
    startingPlayer = (startingPlayer === 'X') ? 'O' : 'X';
    swapStartBtn.textContent = `Start: ${startingPlayer}`;
    resetGame();
  }

  function announce(msg){
    if (gameOver){
      updateUI(msg);
    } else {
      const prev = turnText.textContent;
      updateUI(msg);
      setTimeout(()=> {
        if (!gameOver) updateUI();
        else updateUI(turnText.textContent);
      }, 900);
    }
  }

  function onCellKeydown(e, idx){
    const key = e.key;
    if (key === 'Enter' || key === ' '){
      e.preventDefault();
      onCellClick(idx);
    }
  }

  function arrowKeyNavigation(e){
    const active = document.activeElement;
    if (!active || !active.classList.contains('cell')) return;

    const idx = Number(active.dataset.index);
    let nextIdx = null;

    switch(e.key){
      case 'ArrowLeft':
        nextIdx = (idx % 3 === 0) ? idx + 2 : idx - 1;
        break;
      case 'ArrowRight':
        nextIdx = (idx % 3 === 2) ? idx - 2 : idx + 1;
        break;
      case 'ArrowUp':
        nextIdx = (idx < 3) ? idx + 6 : idx - 3;
        break;
      case 'ArrowDown':
        nextIdx = (idx > 5) ? idx - 6 : idx + 3;
        break;
      default:
        return;
    }

    e.preventDefault();
    const target = cells[nextIdx];
    if (target) target.focus();
  }

  function undoLastMove(){
    if (history.length === 0 || gameOver) return;
    const last = history.pop();
    boardState[last.index] = null;
    moves = Math.max(0, moves - 1);
    renderCell(cells[last.index], null);
    cells[last.index].removeAttribute('disabled');
    currentPlayer = last.player;
    gameOver = false;
    cells.forEach(c => { c.classList.remove('win'); c.style.opacity=''; });
    updateUI();
  }

  function clearHistory(){
    history = [];
    announce('Move history cleared');
  }

  // initialize
  init();

  // double-click board to reset (fun easter)
  boardEl.addEventListener('dblclick', resetGame);
});
