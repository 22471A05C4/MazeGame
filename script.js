/* ------------ Elements ------------ */
const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');

const startBtn = document.getElementById('startBtn');
const levelSelect = document.getElementById('levelSelect');
const solutionBtn = document.getElementById('solutionBtn');
const hintBtn = document.getElementById('hintBtn');
const shapeBtn = document.getElementById('shapeBtn');
const exitBtn = document.getElementById('exitBtn');
const timerEl = document.getElementById('timer');
const statusMsg = document.getElementById('statusMsg');
const toast = document.getElementById('toast');

/* ------------ Game State ------------ */
let rows = 10, cols = 10, sizePx = 600, cell;      // cell = cell size in px
let grid = [];                                      // 2D array of Cells
let player = { r:0, c:0 };
let target = { r:0, c:0 };
let gameOn = false;

let showSolution = false;       // UI toggle state
let usedSolution = false;       // for win message rule
let timer = 0;
let timerInt = null;
let cheerInt = null;

/* Difficulty presets */
const LEVELS = { easy: 12, medium: 18, hard: 26 };

/* Encouragements */
const CHEERS = [
  "🚀 Keep going!",
  "💪 You’ve got this!",
  "🔥 Nice focus — stay sharp!",
  "🌟 Great progress!"
];

/* ------------ Cell (with walls) ------------ */
class Cell {
  constructor(r, c){
    this.r = r; this.c = c;
    // order: top, right, bottom, left
    this.w = [true,true,true,true];
    this.v = false;
  }
}

/* ------------ Utilities ------------ */
function setCanvasSize(){
  const display = Math.min(Math.floor(window.innerWidth*0.92), 720);
  // lock to even to avoid blurry lines
  sizePx = display % 2 === 0 ? display : display-1;
  canvas.width = sizePx;
  canvas.height = sizePx;
  cell = Math.floor(sizePx / Math.max(rows, cols));
  // adjust canvas to exact grid size to keep lines meeting edges
  canvas.width = cell * cols;
  canvas.height = cell * rows;
}

function line(x1,y1,x2,y2, strokeStyle= '#d9e2ec', width=2){
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1+0.5, y1+0.5); // crisp lines
  ctx.lineTo(x2+0.5, y2+0.5);
  ctx.stroke();
}

/* ------------ Maze Generation (DFS backtracker) ------------ */
function generateMaze(){
  grid = [];
  for(let r=0;r<rows;r++){
    const row = [];
    for(let c=0;c<cols;c++) row.push(new Cell(r,c));
    grid.push(row);
  }

  const stack = [];
  let current = grid[0][0];
  current.v = true;
  stack.push(current);

  while(stack.length){
    current = stack[stack.length-1];
    const { r, c } = current;
    const neighbors = [];

    if(r>0     && !grid[r-1][c].v) neighbors.push(grid[r-1][c]);   // up
    if(c<cols-1&& !grid[r][c+1].v) neighbors.push(grid[r][c+1]);   // right
    if(r<rows-1&& !grid[r+1][c].v) neighbors.push(grid[r+1][c]);   // down
    if(c>0     && !grid[r][c-1].v) neighbors.push(grid[r][c-1]);   // left

    if(neighbors.length){
      const nxt = neighbors[Math.floor(Math.random()*neighbors.length)];
      // carve passage
      if(nxt.r === r-1 && nxt.c === c){ current.w[0]=false; nxt.w[2]=false; }
      if(nxt.r === r   && nxt.c === c+1){ current.w[1]=false; nxt.w[3]=false; }
      if(nxt.r === r+1 && nxt.c === c){ current.w[2]=false; nxt.w[0]=false; }
      if(nxt.r === r   && nxt.c === c-1){ current.w[3]=false; nxt.w[1]=false; }
      nxt.v = true;
      stack.push(nxt);
    } else {
      stack.pop();
    }
  }
}

/* ------------ Drawing ------------ */
function drawMaze(path= null, hintSeg= null){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Walls
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const x = c*cell, y = r*cell;
      const w = grid[r][c].w;
      if(w[0]) line(x, y, x+cell, y);               // top
      if(w[1]) line(x+cell, y, x+cell, y+cell);     // right
      if(w[2]) line(x, y+cell, x+cell, y+cell);     // bottom
      if(w[3]) line(x, y, x, y+cell);               // left
    }
  }

  // Exit
  const tx = target.c*cell + cell/2, ty = target.r*cell + cell/2;
  ctx.fillStyle = 'rgba(0,212,143,0.2)';
  ctx.beginPath(); ctx.arc(tx, ty, Math.max(8, cell*0.28), 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#00d48f';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(tx, ty, Math.max(8, cell*0.28), 0, Math.PI*2); ctx.stroke();

  // Solution path (if toggled on)
  if(path && showSolution){
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    path.forEach((p,i)=>{
      const cx = p.c*cell + cell/2;
      const cy = p.r*cell + cell/2;
      if(i===0) ctx.moveTo(cx,cy); else ctx.lineTo(cx,cy);
    });
    ctx.stroke();
  }

  // Hint (one step only)
  if(hintSeg){
    ctx.strokeStyle = '#ffcc66';
    ctx.lineWidth = 4;
    const a = hintSeg[0], b = hintSeg[1];
    const ax = a.c*cell + cell/2, ay = a.r*cell + cell/2;
    const bx = b.c*cell + cell/2, by = b.r*cell + cell/2;
    line(ax,ay,bx,by,'#ffcc66',4);
  }

  // Player
  const px = player.c*cell + cell/2, py = player.r*cell + cell/2;
  ctx.fillStyle = '#6ea8fe';
  ctx.beginPath(); ctx.arc(px, py, Math.max(6, cell*0.28), 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = 'white'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(px, py, Math.max(6, cell*0.28), 0, Math.PI*2); ctx.stroke();
}

/* ------------ BFS for shortest path ------------ */
function bfsPath(fromR, fromC, toR, toC){
  const q = [[{r:fromR, c:fromC}]];
  const seen = new Set([`${fromR},${fromC}`]);

  while(q.length){
    const path = q.shift();
    const cur = path[path.length-1];
    if(cur.r===toR && cur.c===toC) return path;

    const cellObj = grid[cur.r][cur.c];
    const moves = [];
    if(!cellObj.w[0]) moves.push({r:cur.r-1, c:cur.c}); // up
    if(!cellObj.w[1]) moves.push({r:cur.r, c:cur.c+1}); // right
    if(!cellObj.w[2]) moves.push({r:cur.r+1, c:cur.c}); // down
    if(!cellObj.w[3]) moves.push({r:cur.r, c:cur.c-1}); // left

    for(const n of moves){
      const key = `${n.r},${n.c}`;
      if(n.r>=0 && n.c>=0 && n.r<rows && n.c<cols && !seen.has(key)){
        seen.add(key);
        q.push([...path, n]);
      }
    }
  }
  return [];
}

/* ------------ Movement ------------ */
function move(dir){
  if(!gameOn) return;

  const cellObj = grid[player.r][player.c];
  if(dir==='up'    && !cellObj.w[0]) player.r--;
  if(dir==='right' && !cellObj.w[1]) player.c++;
  if(dir==='down'  && !cellObj.w[2]) player.r++;
  if(dir==='left'  && !cellObj.w[3]) player.c--;

  // Hide hint drawing on actual move (shows fresh next step if you press Hint again)
  drawMaze(showSolution ? bfsPath(player.r, player.c, target.r, target.c) : null, null);

  if(player.r===target.r && player.c===target.c){
    gameOn = false;
    clearInterval(timerInt);
    clearInterval(cheerInt);
    // Only celebrate if full solution was NOT shown
    if(!usedSolution){
      statusMsg.textContent = "🎉🥳 Congratulations! You reached the destination!";
      statusMsg.style.color = 'var(--win)';
    } else {
      statusMsg.textContent = "Finished (solution was shown). Try again without it! 💡";
      statusMsg.style.color = 'var(--muted)';
    }
  }
}

/* ------------ Timer + Toast ------------ */
function startTimer(){
  timer = 0;
  timerEl.textContent = 'Time: 0s';
  timerInt = setInterval(()=>{
    timer++;
    timerEl.textContent = `Time: ${timer}s`;
  },1000);

  cheerInt = setInterval(()=>{
    const msg = CHEERS[Math.floor(Math.random()*CHEERS.length)];
    showToast(msg);
  }, 30000);
}

function stopTimer(){
  clearInterval(timerInt);
  clearInterval(cheerInt);
}

function showToast(msg){
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'), 3000);
}

/* ------------ Controls ------------ */
function startGame(){
  // map difficulty -> grid size
  const lv = levelSelect.value;
  rows = cols = LEVELS[lv] || 12;

  setCanvasSize();
  generateMaze();

  // reset state
  player = { r:0, c:0 };
  target = { r: rows-1, c: cols-1 };
  showSolution = false;
  usedSolution = false;
  solutionBtn.textContent = 'Show Solution';
  statusMsg.textContent = '';
  statusMsg.style.color = 'var(--muted)';
  gameOn = true;

  drawMaze();
  stopTimer();
  startTimer();
}

function toggleSolution(){
  if(!gameOn) return;
  showSolution = !showSolution;
  if(showSolution){ usedSolution = true; }
  solutionBtn.textContent = showSolution ? 'Hide Solution' : 'Show Solution';
  const path = showSolution ? bfsPath(player.r, player.c, target.r, target.c) : null;
  drawMaze(path, null);
}

function giveHint(){
  if(!gameOn) return;
  const path = bfsPath(player.r, player.c, target.r, target.c);
  if(path.length >= 2){
    // draw only the next segment (one step)
    drawMaze(showSolution ? path : null, [path[0], path[1]]);
  }
}

function changeShape(){
  if(!gameOn) return startGame();
  // Regenerate a new maze with same difficulty
  generateMaze();
  player = { r:0, c:0 };
  target = { r: rows-1, c: cols-1 };
  // preserve toggled solution state; recompute path if visible
  const path = showSolution ? bfsPath(player.r, player.c, target.r, target.c) : null;
  drawMaze(path, null);
}

function exitGame(){
  gameOn = false;
  stopTimer();
  ctx.clearRect(0,0,canvas.width,canvas.height);
  timerEl.textContent = 'Time: 0s';
  statusMsg.textContent = '👋 Game exited.';
  statusMsg.style.color = 'var(--muted)';
  showSolution = false;
  usedSolution = false;
  solutionBtn.textContent = 'Show Solution';
}

/* ------------ Event Binding ------------ */
startBtn.addEventListener('click', startGame);
solutionBtn.addEventListener('click', toggleSolution);
hintBtn.addEventListener('click', giveHint);
shapeBtn.addEventListener('click', changeShape);
exitBtn.addEventListener('click', exitGame);

document.addEventListener('keydown', (e)=>{
  if(e.key==='ArrowUp') move('up');
  if(e.key==='ArrowRight') move('right');
  if(e.key==='ArrowDown') move('down');
  if(e.key==='ArrowLeft') move('left');
});

// Mobile/on-screen arrows
document.querySelectorAll('.arrow').forEach(btn=>{
  btn.addEventListener('click', ()=> move(btn.dataset.dir));
});

// Set a sensible canvas size on load (before first start)
setCanvasSize();
drawMaze(); // draw empty grid area (no walls) initially
