{
  // canvas와 2D context 가져오기
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const tileCount = 20;
  let gridSize;

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

  /* 스크롤 방지 */
  let gameRunning = false;

    // 스크롤 막기
  function preventScroll(e) {
    if (gameRunning) e.preventDefault();
  }

  document.body.addEventListener("touchstart", preventScroll, {passive:false});
  document.body.removeEventListener("touchmove", preventScroll, {passive: false});
  document.body.removeEventListener("wheel", preventScroll, {passive: false});

  function blockMobileScroll(e) {
  if (gameRunning) e.preventDefault();
  }
  ["touchstart", "touchmove", "wheel", "pointermove", "gesturestart"].forEach(eventName => {
    document.body.addEventListener(eventName, blockMobileScroll, { passive: false });
  });
  
  // 방향키 스크롤 방지
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

  /* 모바일 터치 스와이프 이벤트 */

  // 터치 시작 좌표 저장
  let touchStartX = 0;
  let touchStartY = 0;

  // 터치 시작 시 위치 저장
  canvas.addEventListener("touchstart", e => {
    e.preventDefault();
    const touch = e.touches[0]; // 화면을 터치한 모든 손가락 좌표, 한 손가락만 사용 [0]
    touchStartX = touch.clientX; // 화면 내 좌표 가로 위치(왼쪽부터 몇 px)
    touchStartY = touch.clientY; // 화면 내 좌표 세로 위치(위쪽부터 몇 px)    
  }, {passive: false});

  canvas.addEventListener("touchend", e => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    const dxTouch = touch.clientX - touchStartX; // 수평 이동거리
    const dyTouch = touch.clientY - touchStartY; // 수직 이동 거리

  if(!gameRunning) return;

  if (Math.abs(dxTouch) > Math.abs(dyTouch)) {
    if (dxTouch > 30 && (dx === 0 || snake.length === 1)) { dx = 1; dy = 0; }
    else if (dxTouch < -30 && (dx === 0 || snake.length === 1)) { dx = -1; dy = 0; }
  } else {
    if (dyTouch > 30 && (dy === 0 || snake.length === 1)) { dx = 0; dy = 1; }
    else if (dyTouch < -30 && (dy === 0 || snake.length === 1)) { dx = 0; dy = -1; }
  }
}, { passive: false });

  /* 모바일 터치 스와이프 이벤트 처리 종료 */

  // 게임 시작 - 버튼 클릭 시
  function startGame() {
    snake = [{x:10, y:10}]; // 여러개의 segment로 이루어져 있어 []로 묶음
    food = {x:5, y:5};
    dx = 1; dy = 0; // 오른쪽으로 이동하기 위한 초기 값
    score = 0;
    gameOver = false;
    gameRunning = true;

    // 난이도 선택 값 (ms 단위)
    gameSpeed = parseInt(difficultSelect.value);
    currentSpeed = gameSpeed;

    scoreEl.textContent = "💛 Score : 0 💛";

    // 이전 게임 루프 제거 후 새로 시작
    if(intervalId) clearInterval(intervalId); // 이전 설정된 반복 실행 타이머 멈춤, 기존 루프 지움
    intervalId = setInterval(gameLoop, currentSpeed); // 새로운 속도로 다시 시작
  }

  // 게임 루프
  function gameLoop() {
    if(gameOver) {
      clearInterval(intervalId);
      drawIntro(); // 게임 오버 후 안내 텍스트 보여주기
      endGame();
      return;
    }
    
    update(); // 게임 상태 업데이트
    draw(); // 화면 다시 그리기
  }

  // 게임 상태 업데이트
  function update() {
    // 뱀 머리 새 위치 계산 (현재 방향으로 한 칸 이동)
    const head = {x: snake[0].x + dx, y: snake[0].y + dy};

    // 벽 충돌 또는 본인 몸 충돌
    if (
      head.x < 0 || head.x >= tileCount ||
      head.y < 0 || head.y >= tileCount ||
      snake.some(segment => segment.x === head.x && segment.y === head.y)
    ) {
      gameOver = true;

      alert(`😭 Game Over : ${score} 😭`);

      // 최고 점수 갱신 여부
      if (score > highScore) {
        highScore = score;
        localStorage.setItem("highScore", highScore);
        highScoreEl.textContent = `💖 Best Score : ${highScore} 💖`;
      }
      return;
    }

    // 새 머리 추가(이동)
    snake.unshift(head);

    // 먹이 먹었는지 확인
    if (head.x === food.x && head.y === food.y) {
      score++;
      scoreEl.textContent = `💛 Score : ${score} 💛`;
      placeFood(); // 새로운 먹이 배치

      // 먹을 때마다 뱀 속도 증가 (인터벌 시간 감소, 최소 20ms)
      currentSpeed = Math.max(currentSpeed - 5, 20);
      clearInterval(intervalId);
      intervalId = setInterval(gameLoop, currentSpeed);
    } else {
      // 먹지 않으면 꼬리 제거해서 길이 유지
      snake.pop();
    }
  }
  function draw() {
    // 배경
    ctx.fillStyle = "#ebf9ef";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 뱀
    ctx.fillStyle = "lawngreen";
    snake.forEach(segment => {
      ctx.fillRect(
        segment.x * gridSize,
        segment.y * gridSize,
        gridSize -1,
        gridSize -1
      );
    });
    
    // 먹이
    ctx.fillStyle = "red";
    ctx.fillRect(
      food.x * gridSize,
      food.y * gridSize,
      gridSize -1,
      gridSize -1
    );
  }

  // 먹이 랜덤 배치
  function placeFood() {
    food = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };
    // 뱀 몸통과 겹치지 않게 배치
    while (snake.some(segment => segment.x === food.x && segment.y === food.y)) {
      food.x = Math.floor(Math.random() * tileCount);
      food.y = Math.floor(Math.random() * tileCount);
    }
  }

  // 게임 시작 전 또는 게임 오버 후 화면에 안내 문구 출력
  function drawIntro() {
    ctx.fillStyle = "#ebf9ef";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ccc";
    ctx.font = "20px Gothic";
    ctx.textAlign = "center";
    ctx.fillText("[😎 Game Start 😎] 버튼을 눌러 게임을 시작하세요!", canvas.width / 2, canvas.height / 2);
  }

  function endGame() {
    gameRunning = false;
  }

  // 최초 페이지 로드 시 안내 텍스트 출력(자동 게임 시작 방지)
  drawIntro();
}
