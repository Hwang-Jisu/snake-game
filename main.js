// canvas와 2D context 가져오기
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const tileCount = 20;
let gridSize;

// 게임 진행 여부 변수
let gameRunning = false;

function resizeCanvas() {
  const size = Math.min(window.innerWidth, window.innerHeight) * 0.9;
  canvas.width = size;
  canvas.height = size;
  gridSize = canvas.width / tileCount;
}

resizeCanvas();
window.addEventListener("resize", () => {
  resizeCanvas();
  draw();
});

// ---------------------------------------------------
// 최초 진입 시 화면 가운데로 스크롤 위치 맞추기 (smooth 효과)
// 그리고 스크롤 막는 이벤트는 비활성 상태로 둬서 화면이 움직임
window.scrollTo({
  top: document.body.scrollHeight / 2,
  left: document.body.scrollWidth / 2,
  behavior: "smooth"
});

// ---------------------------------------------------
// 터치/휠 스크롤 막는 핸들러 (게임 중일 때만 막음)
function blockMobileScroll(e) {
  if (gameRunning) {
    e.preventDefault();
  }
}

// 게임 중일 때만 터치 스크롤 막기 이벤트 등록
function enableScrollBlock() {
  ["touchstart", "touchmove", "wheel", "pointermove", "gesturestart"].forEach(eventName => {
    document.body.addEventListener(eventName, blockMobileScroll, { passive: false });
  });
}

// 게임 종료 시 터치 스크롤 막기 이벤트 해제
function disableScrollBlock() {
  ["touchstart", "touchmove", "wheel", "pointermove", "gesturestart"].forEach(eventName => {
    document.body.removeEventListener(eventName, blockMobileScroll, { passive: false });
  });
}

// ---------------------------------------------------
// 방향키 스크롤 방지 (게임 중에만 방향키 조작 허용)
window.addEventListener("keydown", e => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
    e.preventDefault();
  }

  if (!gameRunning) return;

  switch (e.key) {
    case "ArrowUp":
      if (dy === 0 || snake.length === 1) { dx = 0; dy = -1; }
      break;
    case "ArrowDown":
      if (dy === 0 || snake.length === 1) { dx = 0; dy = 1; }
      break;
    case "ArrowLeft":
      if (dx === 0 || snake.length === 1) { dx = -1; dy = 0; }
      break;
    case "ArrowRight":
      if (dx === 0 || snake.length === 1) { dx = 1; dy = 0; }
      break;
  }
}, { passive: false });

// ---------------------------------------------------
// 모바일 터치 스와이프 이벤트 처리
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}, { passive: false });

canvas.addEventListener("touchend", e => {
  e.preventDefault();
  const touch = e.changedTouches[0];
  const dxTouch = touch.clientX - touchStartX;
  const dyTouch = touch.clientY - touchStartY;

  if(!gameRunning) return;

  if (Math.abs(dxTouch) > Math.abs(dyTouch)) {
    if (dxTouch > 30 && (dx === 0 || snake.length === 1)) { dx = 1; dy = 0; }
    else if (dxTouch < -30 && (dx === 0 || snake.length === 1)) { dx = -1; dy = 0; }
  } else {
    if (dyTouch > 30 && (dy === 0 || snake.length === 1)) { dx = 0; dy = 1; }
    else if (dyTouch < -30 && (dy === 0 || snake.length === 1)) { dx = 0; dy = -1; }
  }
}, { passive: false });

// ---------------------------------------------------
// 게임 변수들
let snake, food, dx, dy, score, gameOver;
let intervalId, gameSpeed, currentSpeed;
let highScore = localStorage.getItem("highScore") || 0;

// UI 요소
const startBtn = document.getElementById("startBtn");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const difficultSelect = document.getElementById("difficult");

// 최고 점수 표시 업데이트
highScoreEl.textContent = `💖 Best Score : ${highScore} 💖`;

// 게임 시작 버튼 클릭 이벤트
startBtn.addEventListener("click", startGame);

// ---------------------------------------------------
// 게임 시작 함수
function startGame() {
  snake = [{x:10, y:10}];
  food = {x:5, y:5};
  dx = 1; dy = 0;
  score = 0;
  gameOver = false;

  gameRunning = true;       // 게임 중 상태로 변경
  enableScrollBlock();      // 게임 중이므로 터치 스크롤 막기 활성화

  gameSpeed = parseInt(difficultSelect.value);
  currentSpeed = gameSpeed;

  scoreEl.textContent = "💛 Score : 0 💛";

  if(intervalId) clearInterval(intervalId);
  intervalId = setInterval(gameLoop, currentSpeed);
}

// ---------------------------------------------------
// 게임 루프
function gameLoop() {
  if(gameOver) {
    clearInterval(intervalId);
    drawIntro();
    endGame();
    return;
  }

  update();
  draw();
}

// ---------------------------------------------------
// 게임 상태 업데이트
function update() {
  const head = {x: snake[0].x + dx, y: snake[0].y + dy};

  if (
    head.x < 0 || head.x >= tileCount ||
    head.y < 0 || head.y >= tileCount ||
    snake.some(segment => segment.x === head.x && segment.y === head.y)
  ) {
    gameOver = true;

    alert(`😭 Game Over : ${score} 😭`);

    if (score > highScore) {
      highScore = score;
      localStorage.setItem("highScore", highScore);
      highScoreEl.textContent = `💖 Best Score : ${highScore} 💖`;
    }
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreEl.textContent = `💛 Score : ${score} 💛`;
    placeFood();

    currentSpeed = Math.max(currentSpeed - 5, 20);
    clearInterval(intervalId);
    intervalId = setInterval(gameLoop, currentSpeed);
  } else {
    snake.pop();
  }
}

// ---------------------------------------------------
// 그리기 함수
function draw() {
  ctx.fillStyle = "#ebf9ef";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "lawngreen";
  snake.forEach(segment => {
    ctx.fillRect(
      segment.x * gridSize,
      segment.y * gridSize,
      gridSize -1,
      gridSize -1
    );
  });

  ctx.fillStyle = "red";
  ctx.fillRect(
    food.x * gridSize,
    food.y * gridSize,
    gridSize -1,
    gridSize -1
  );
}

// ---------------------------------------------------
// 먹이 랜덤 배치
function placeFood() {
  food = {
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount)
  };
  while (snake.some(segment => segment.x === food.x && segment.y === food.y)) {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);
  }
}

// ---------------------------------------------------
// 게임 시작 전 또는 게임 오버 후 안내 문구
function drawIntro() {
  ctx.fillStyle = "#ebf9ef";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ccc";
  ctx.font = "20px Gothic";
  ctx.textAlign = "center";
  ctx.fillText("[😎 Game Start 😎] 버튼을 눌러 게임을 시작하세요!", canvas.width / 2, canvas.height / 2);
}

// ---------------------------------------------------
// 게임 종료 함수 (게임 중 상태 해제, 터치 스크롤 막기 해제)
function endGame() {
  gameRunning = false;
  disableScrollBlock();
}

// 최초 페이지 로드 시 안내 텍스트 출력
drawIntro();