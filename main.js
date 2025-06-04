// 캔버스와 2D 컨텍스트 가져오기
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// 게임 그리드 크기 설정 (20x20)
const tileCount = 20;
let gridSize;

// 게임 실행 상태 변수
let gameRunning = false;

// 캔버스 크기를 부모 .wrap 요소 너비에 맞추고 세로 크기는 화면 높이의 90% 내에서 결정
function resizeCanvas() {
  const wrap = document.querySelector(".wrap");
  // wrap의 너비와 화면 높이 * 0.9 중 작은 값을 캔버스 크기로 사용
  const size = Math.min(wrap.clientWidth, window.innerHeight * 0.9);
  const dpr = window.devicePixelRatio || 1;

  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;

  canvas.width = size * dpr;
  canvas.height = size * dpr;

  ctx.setTransform(1,0,0,1,0,0);
  ctx.scale(dpr,dpr);
  
  gridSize = canvas.width / tileCount; // 한 칸 크기 계산
}
resizeCanvas();

// 화면 크기 변경 시 캔버스 크기도 다시 계산, 그리고 화면 갱신
window.addEventListener("resize", () => {
  resizeCanvas();
  if (gameRunning) {
    draw();
  } else {
    drawIntro();
  }
});

// 게임 중일 때만 터치, 휠 스크롤 막는 이벤트 함수
function blockMobileScroll(e) {
  if (gameRunning) {
    e.preventDefault(); // 기본 터치, 휠 스크롤 동작 방지
  }
}

const scrollEvents = ["touchstart", "touchmove", "wheel", "pointermove", "gesturestart"];

// 게임 중 스크롤 막기 이벤트 등록 함수
function enableScrollBlock() {
  scrollEvents.forEach(eventName => {
    document.body.addEventListener(eventName, blockMobileScroll, { passive: false });
  });
}

// 게임 중이 아닐 때 스크롤 막기 이벤트 제거 함수
function disableScrollBlock() {
  scrollEvents.forEach(eventName => {
    document.body.removeEventListener(eventName, blockMobileScroll,false);
  });
}

// 처음 페이지 로드 시에는 스크롤 막기 이벤트를 제거하여 스크롤이 자유롭게 되도록 함
disableScrollBlock();

// 키보드 방향키와 스페이스바에 의한 기본 스크롤 방지 및 방향 변경 처리
window.addEventListener("keydown", e => {
  // 방향키 및 스페이스가 눌리면 기본 스크롤 방지
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
    e.preventDefault();
  }
  if (!gameRunning) return; // 게임 중 아닐 때는 방향 전환 무시

  // 방향키에 따른 뱀 이동 방향 설정 (방향이 반대로 바뀌는 것 방지)
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

// 터치 스와이프를 통한 방향 전환 처리 변수
let touchStartX = 0;
let touchStartY = 0;

// 터치 시작 위치 저장 (게임 캔버스 내에서)
canvas.addEventListener("touchstart", e => {
  e.preventDefault(); // 터치 기본 동작 방지 (스크롤 막기)
  const touch = e.touches[0]; // 첫 번째 손가락 좌표만 사용
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}, { passive: false });

// 터치 끝난 위치와 시작 위치를 비교해 스와이프 방향 판단 후 뱀 방향 전환
canvas.addEventListener("touchend", e => {
  e.preventDefault(); // 기본 동작 방지
  const touch = e.changedTouches[0];
  const dxTouch = touch.clientX - touchStartX;
  const dyTouch = touch.clientY - touchStartY;

  if (!gameRunning) return; // 게임 중 아닐 때 무시

  // 수평 스와이프가 더 크면 좌우 방향 전환
  if (Math.abs(dxTouch) > Math.abs(dyTouch)) {
    if (dxTouch > 30 && (dx === 0 || snake.length === 1)) { dx = 1; dy = 0; }
    else if (dxTouch < -30 && (dx === 0 || snake.length === 1)) { dx = -1; dy = 0; }
  } else { // 수직 스와이프가 더 크면 상하 방향 전환
    if (dyTouch > 30 && (dy === 0 || snake.length === 1)) { dx = 0; dy = 1; }
    else if (dyTouch < -30 && (dy === 0 || snake.length === 1)) { dx = 0; dy = -1; }
  }
}, { passive: false });

// 게임 상태 변수 초기화
let snake, food, dx, dy, score, gameOver;
let intervalId, gameSpeed, currentSpeed;
let highScore = localStorage.getItem("highScore") || 0;

// UI 요소 참조
const startBtn = document.getElementById("startBtn");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const difficultSelect = document.getElementById("difficult");

// 최고 점수 표시 초기화
highScoreEl.textContent = `💖 Best Score : ${highScore} 💖`;

// 게임 시작 버튼 클릭 시 실행 함수 등록
startBtn.addEventListener("click", startGame);

function startGame() {
  // 뱀 초기 위치 (가운데)
  snake = [{x:10, y:10}];
  // 초기 먹이 위치
  food = {x:5, y:5};
  // 뱀 이동 방향 초기화 (오른쪽)
  dx = 1; dy = 0;
  // 점수 및 상태 초기화
  score = 0;
  gameOver = false;
  gameRunning = true;

  // 게임 중일 때만 스크롤 막기 활성화
  enableScrollBlock();

  // 난이도 선택에 따라 게임 속도(ms 단위) 설정
  gameSpeed = parseInt(difficultSelect.value);
  currentSpeed = gameSpeed;

  scoreEl.textContent = "💛 Score : 0 💛";

  // 이전 게임 루프 정리 후 새 루프 시작
  if(intervalId) clearInterval(intervalId);
  intervalId = setInterval(gameLoop, currentSpeed);
}

// 게임 메인 루프
function gameLoop() {
  if(gameOver) {
    clearInterval(intervalId);
    drawIntro(); // 게임 오버 후 안내 메시지 출력
    endGame();   // 게임 상태 종료 처리
    return;
  }
  update(); // 게임 상태 갱신 (뱀 이동, 충돌, 먹이 등)
  draw();   // 화면 다시 그리기
}

// 게임 상태 갱신 함수
function update() {
  // 뱀 머리의 새 위치 계산
  const head = {x: snake[0].x + dx, y: snake[0].y + dy};

  // 벽이나 자기 몸에 부딪히면 게임 종료
  if (
    head.x < 0 || head.x >= tileCount ||
    head.y < 0 || head.y >= tileCount ||
    snake.some(segment => segment.x === head.x && segment.y === head.y)
  ) {
    gameOver = true;

    alert(`😭 Game Over : ${score} 😭`);

    // 최고 점수 갱신 및 로컬 스토리지 저장
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("highScore", highScore);
      highScoreEl.textContent = `💖 Best Score : ${highScore} 💖`;
    }
    return;
  }

  // 머리 위치 배열 앞에 추가(뱀 이동 효과)
  snake.unshift(head);

  // 먹이를 먹었는지 확인
  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreEl.textContent = `💛 Score : ${score} 💛`;
    placeFood(); // 새로운 먹이 생성

    // 속도 증가 (인터벌 감소), 단 최소 20ms
    currentSpeed = Math.max(currentSpeed - 5, 20);
    clearInterval(intervalId);
    intervalId = setInterval(gameLoop, currentSpeed);
  } else {
    // 먹지 않았다면 꼬리 제거하여 길이 유지
    snake.pop();
  }
}

// 화면 그리기 함수
function draw() {
  // 배경 칠하기
  ctx.fillStyle = "#ebf9ef";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 뱀 그리기
  ctx.fillStyle = "lawngreen";
  snake.forEach(segment => {
    ctx.fillRect(
      segment.x * gridSize,
      segment.y * gridSize,
      gridSize - 1,
      gridSize - 1
    );
  });

  // 먹이 그리기
  ctx.fillStyle = "red";
  ctx.fillRect(
    food.x * gridSize,
    food.y * gridSize,
    gridSize - 1,
    gridSize - 1
  );
}

// 먹이 위치 무작위 생성 (뱀이랑 겹치지 않도록)
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

// 게임 시작 전 안내 메시지 화면에 출력
function drawIntro() {
  ctx.fillStyle = "#ebf9ef";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ccc";
  ctx.font = "20px Gothic";
  ctx.textAlign = "center";
  ctx.fillText("[😎 Game Start 😎] 버튼을 눌러 게임을 시작하세요!", canvas.width / 2, canvas.height / 2);
}

// 게임 종료 처리 함수
function endGame() {
  gameRunning = false;
  // 게임 종료 시 스크롤 막기 이벤트 해제하여 자유롭게 스크롤 가능하도록 함
  disableScrollBlock();
}

// 최초 안내 메시지 표시
drawIntro();