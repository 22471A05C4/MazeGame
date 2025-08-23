const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");

let rows = 10, cols = 10, cellSize = 30;
let maze = [], player, exitCell;
let timer = 0, timerInterval, encourageInterval;
let gameActive = false;

// 🎉 Encouraging messages
const messages = [
  "Keep going, you can do it! 🚀",
  "Don’t give up, almost there! 💪",
  "Great focus! Stay on track 🔥",
  "Amazing effort, keep pushing! 🌟"
];

// Cell constructor
function Cell(row, col) {
  this.row = row;
  this.col = col;
  this.walls = [true, true, true, true]; // top, right, bottom, left
  this.visited = false;
}

// Generate maze (DFS backtracking)
function generateMaze() {
  maze = [];
  for (let r = 0; r < rows; r++) {
    let row = [];
    for (let c = 0; c < cols; c++) row.push(new Cell(r, c));
    maze.push(row);
  }

  let stack = [];
  let current = maze[0][0];
  current.visited = true;

  while (true) {
    let neighbors = [];
    let {row, col} = current;

    if (row > 0 && !maze[row-1][col].visited) neighbors.push(maze[row-1][col]);
    if (col < cols-1 && !maze[row][col+1].visited) neighbors.push(maze[row][col+1]);
    if (row < rows-1 && !maze[row+1][col].visited) neighbors.push(maze[row+1][col]);
    if (col > 0 && !maze[row][col-1].visited) neighbors.push(maze[row][col-1]);

    if (neighbors.length > 0) {
      stack.push(current);
      let next = neighbors[Math.floor(Math.random()*neighbors.length)];
      removeWalls(current, next);
      current = next;
      current.visited = true;
    } else if (stack.length > 0) {
      current = stack.pop();
    } else break;
  }

  player = {row: 0, col: 0};
  exitCell = {row: rows-1, col: cols-1};
  drawMaze();
}

function removeWalls(a, b) {
  let dx = a.col - b.col;
  let dy = a.row - b.row;

  if (dx === 1) { a.walls[3] = false; b.walls[1] = false; }
  if (dx === -1) { a.walls[1] = false; b.walls[3] = false; }
  if (dy === 1) { a.walls[0] = false; b.walls[2] = false; }
  if (dy === -1) { a.walls[2] = false; b.walls[0] = false; }
}

// Draw maze
function drawMaze(solutionPath = []) {
  canvas.width = cols * cellSize;
  canvas.height = rows * cellSize;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let cell = maze[r][c];
      let x = c * cellSize;
      let y = r * cellSize;

      ctx.beginPath();
      if (cell.walls[0]) { ctx.moveTo(x, y); ctx.lineTo(x+cellSize, y); }
      if (cell.walls[1]) { ctx.moveTo(x+cellSize, y); ctx.lineTo(x+cellSize, y+cellSize); }
      if (cell.walls[2]) { ctx.moveTo(x, y+cellSize); ctx.lineTo(x+cellSize, y+cellSize); }
      if (cell.walls[3]) { ctx.moveTo(x, y); ctx.lineTo(x, y+cellSize); }
      ctx.stroke();
    }
  }

  // Exit
  ctx.fillStyle = "green";
  ctx.fillRect(exitCell.col*cellSize+8, exitCell.row*cellSize+8, cellSize-16, cellSize-16);

  // Player
  ctx.fillStyle = "blue";
  ctx.beginPath();
  ctx.arc(player.col*cellSize+cellSize/2, player.row*cellSize+cellSize/2, cellSize/3, 0, Math.PI*2);
  ctx.fill();

  // Solution path
  ctx.strokeStyle = "red";
  ctx.lineWidth = 3;
  ctx.beginPath();
  solutionPath.forEach((p, i) => {
    let x = p.col*cellSize+cellSize/2;
    let y = p.row*cellSize+cellSize/2;
    if (i === 0) ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
  });
  ctx.stroke();
  ctx.strokeStyle = "black";
}

// Movement
function move(dir) {
  if (!gameActive) return;
  let cell = maze[player.row][player.col];
  if (dir==="up" && !cell.walls[0]) player.row--;
  if (dir==="right" && !cell.walls[1]) player.col++;
  if (dir==="down" && !cell.walls[2]) player.row++;
  if (dir==="left" && !cell.walls[3]) player.col--;

  drawMaze();

  if (player.row===exitCell.row && player.col===exitCell.col) {
    clearInterval(timerInterval);
    clearInterval(encourageInterval);
    alert("🎉 Congratulations! You solved the maze! 🏆👏");
  }
}

// Timer
function startTimer() {
  timer = 0;
  document.getElementById("timer").textContent = "Time: 0s";
  timerInterval = setInterval(() => {
    timer++;
    document.getElementById("timer").textContent = `Time: ${timer}s`;
  }, 1000);

  encourageInterval = setInterval(() => {
    let msg = messages[Math.floor(Math.random()*messages.length)];
    document.getElementById("encourage").textContent = msg;
  }, 30000);
}

// Solution using BFS
function findSolution() {
  let queue = [[{row: player.row, col: player.col}]];
  let visited = new Set([`${player.row},${player.col}`]);

  while (queue.length > 0) {
    let path = queue.shift();
    let {row, col} = path[path.length-1];

    if (row===exitCell.row && col===exitCell.col) return path;

    let cell = maze[row][col];
    let moves = [
      {dir:"up", r:row-1, c:col, wall:0},
      {dir:"right", r:row, c:col+1, wall:1},
      {dir:"down", r:row+1, c:col, wall:2},
      {dir:"left", r:row, c:col-1, wall:3}
    ];

    for (let m of moves) {
      if (m.r>=0 && m.c>=0 && m.r<rows && m.c<cols) {
        if (!cell.walls[m.wall]) {
          let key = `${m.r},${m.c}`;
          if (!visited.has(key)) {
            visited.add(key);
            queue.push([...path, {row:m.r, col:m.c}]);
          }
        }
      }
    }
  }
  return [];
}

// Event Listeners
document.getElementById("startBtn").addEventListener("click", () => {
  rows = cols = parseInt(document.getElementById("difficulty").value);
  generateMaze();
  gameActive = true;
  startTimer();
});

document.getElementById("solutionBtn").addEventListener("click", () => {
  let path = findSolution();
  drawMaze(path);
});

document.getElementById("hintBtn").addEventListener("click", () => {
  let path = findSolution();
  if (path.length > 1) drawMaze([path[0], path[1]]);
});

document.getElementById("exitBtn").addEventListener("click", () => location.reload());

document.getElementById("changeShapeBtn").addEventListener("click", () => {
  generateMaze();
});

document.addEventListener("keydown", e => {
  if (e.key==="ArrowUp") move("up");
  if (e.key==="ArrowRight") move("right");
  if (e.key==="ArrowDown") move("down");
  if (e.key==="ArrowLeft") move("left");
});

document.querySelectorAll(".arrow").forEach(btn=>{
  btn.addEventListener("click", ()=>move(btn.dataset.dir));
});
