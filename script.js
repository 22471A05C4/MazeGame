let canvas, ctx;
let maze, player, destination;
let cellSize = 40;
let pathSolution = [];
let hintIndex = 0;

window.onload = () => {
  canvas = document.getElementById("mazeCanvas");
  ctx = canvas.getContext("2d");

  document.getElementById("startBtn").addEventListener("click", startGame);
  document.getElementById("hintBtn").addEventListener("click", showHint);
  document.getElementById("solutionBtn").addEventListener("click", showSolution);

  document.addEventListener("keydown", handleKeyPress);
};

function startGame() {
  maze = [
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 1, 0, 0, 0, 0, 1, 0],
    [1, 1, 0, 1, 0, 1, 1, 0, 1, 0],
    [0, 0, 0, 0, 0, 1, 0, 0, 1, 0],
    [0, 1, 1, 1, 0, 1, 0, 1, 1, 0],
    [0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 1, 0, 1, 1, 1, 1, 1, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];

  player = { x: 0, y: 0 };
  destination = { x: 9, y: 8 };
  hintIndex = 0;

  pathSolution = findPath(player, destination);

  drawMaze();
  drawPlayer();
  document.getElementById("message").textContent = "Game Started! Use Arrow Keys 🎯";
}

function drawMaze() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < maze.length; y++) {
    for (let x = 0; x < maze[y].length; x++) {
      ctx.fillStyle = maze[y][x] === 1 ? "#333" : "#eee";
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      ctx.strokeStyle = "#999";
      ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }

  ctx.fillStyle = "green";
  ctx.fillRect(destination.x * cellSize, destination.y * cellSize, cellSize, cellSize);
}

function drawPlayer() {
  ctx.fillStyle = "blue";
  ctx.fillRect(player.x * cellSize, player.y * cellSize, cellSize, cellSize);
}

function handleKeyPress(e) {
  let newX = player.x;
  let newY = player.y;

  if (e.key === "ArrowUp") newY--;
  if (e.key === "ArrowDown") newY++;
  if (e.key === "ArrowLeft") newX--;
  if (e.key === "ArrowRight") newX++;

  if (maze[newY] && maze[newY][newX] === 0) {
    player.x = newX;
    player.y = newY;
    drawMaze();
    drawPlayer();

    if (player.x === destination.x && player.y === destination.y) {
      document.getElementById("message").textContent = "🎉 Congratulations! You reached the goal 🏆";
    }
  }
}

function showSolution() {
  drawMaze();
  drawPlayer();
  ctx.fillStyle = "rgba(255,0,0,0.5)";
  pathSolution.forEach(cell => {
    ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize);
  });
}

function showHint() {
  if (hintIndex < pathSolution.length) {
    let step = pathSolution[hintIndex];
    ctx.fillStyle = "yellow";
    ctx.fillRect(step.x * cellSize, step.y * cellSize, cellSize, cellSize);
    hintIndex++;
  }
}

// BFS pathfinding
function findPath(start, end) {
  let queue = [[start]];
  let visited = new Set([start.x + "," + start.y]);

  while (queue.length) {
    let path = queue.shift();
    let { x, y } = path[path.length - 1];

    if (x === end.x && y === end.y) return path;

    let moves = [
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 },
    ];

    for (let move of moves) {
      if (
        maze[move.y] &&
        maze[move.y][move.x] === 0 &&
        !visited.has(move.x + "," + move.y)
      ) {
        visited.add(move.x + "," + move.y);
        queue.push([...path, move]);
      }
    }
  }

  return [];
}
