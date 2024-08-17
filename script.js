const canvas = document.getElementById('board');
const context = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('game-over');

const rows = 20;
const cols = 10;
const blockSize = 30;
let score = 0;
let board = Array.from({ length: rows }, () => Array(cols).fill(0));

const tetrominoes = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[0, 1, 0], [1, 1, 1]], // T
    [[1, 1, 0], [0, 1, 1]], // S
    [[0, 1, 1], [1, 1, 0]], // Z
    [[1, 1, 1], [1, 0, 0]], // L
    [[1, 1, 1], [0, 0, 1]]  // J
];

let currentTetromino;
let currentPosition;
let dropInterval = 1000; // 블록이 내려오는 간격 (밀리초)
let lastDropTime = 0;

function drawBoard() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                context.fillStyle = 'blue';
                context.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
                context.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
            }
        });
    });
}

function drawTetromino() {
    currentTetromino.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                context.fillStyle = 'red';
                context.fillRect((currentPosition.x + x) * blockSize, (currentPosition.y + y) * blockSize, blockSize, blockSize);
                context.strokeRect((currentPosition.x + x) * blockSize, (currentPosition.y + y) * blockSize, blockSize, blockSize);
            }
        });
    });
}

function mergeTetromino() {
    currentTetromino.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                board[currentPosition.y + y][currentPosition.x + x] = value;
            }
        });
    });
}

function removeFullRows() {
    const fullRows = board.filter(row => row.every(value => value !== 0)); // 완전한 줄 찾기
    if (fullRows.length > 0) { // 완전한 줄이 있을 경우
        score += fullRows.length * 10; // 지운 줄 수에 따라 점수 추가
        scoreElement.innerText = `점수: ${score}`;
    }
    board = board.filter(row => row.some(value => value === 0)); // 빈 줄 제외
    while (board.length < rows) {
        board.unshift(Array(cols).fill(0)); // 빈 줄 추가
    }
}

function resetGame() {
    board = Array.from({ length: rows }, () => Array(cols).fill(0));
    score = 0;
    scoreElement.innerText = `점수: ${score}`;
    gameOverElement.style.display = 'none'; // 게임 오버 메시지 숨김
    newTetromino();
}

function newTetromino() {
    const randomIndex = Math.floor(Math.random() * tetrominoes.length);
    currentTetromino = { shape: tetrominoes[randomIndex] };
    currentPosition = { x: Math.floor(cols / 2) - 1, y: 1 }; // y를 1로 설정하여 한 칸 아래에서 생성
    
    if (collision()) {
        gameOver(); // 충돌 시 게임 오버
    }
}

function update() {
    const now = Date.now();
    if (now - lastDropTime > dropInterval) {
        currentPosition.y++;
        if (collision()) {
            currentPosition.y--;
            mergeTetromino();
            removeFullRows();
            newTetromino();
        }
        lastDropTime = now;
    }
    drawBoard();
    drawTetromino();
}

function collision() {
    return currentTetromino.shape.some((row, y) => {
        return row.some((value, x) => {
            if (value) {
                const newX = currentPosition.x + x;
                const newY = currentPosition.y + y;
                return newX < 0 || newX >= cols || newY >= rows || (newY >= 0 && board[newY][newX]);
            }
            return false;
        });
    });
}

function rotateTetromino() {
    const originalShape = currentTetromino.shape;
    const rotatedShape = originalShape[0].map((_, index) => originalShape.map(row => row[index]).reverse());
    currentTetromino.shape = rotatedShape;

    if (collision()) {
        currentTetromino.shape = originalShape; // 회전 불가능 시 원래 모양으로 되돌림
    }
}

function dropToBottom() {
    while (!collision()) {
        currentPosition.y++;
    }
    currentPosition.y--; // 마지막 위치에서 한 단계 위로
    mergeTetromino();
    removeFullRows();
    newTetromino();
}

function gameOver() {
    gameOverElement.style.display = 'block'; // 게임 오버 메시지 표시
    cancelAnimationFrame(gameLoopId); // 게임 루프 중지
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
        currentPosition.x--;
        if (collision()) currentPosition.x++;
    } else if (event.key === 'ArrowRight') {
        currentPosition.x++;
        if (collision()) currentPosition.x--;
    } else if (event.key === 'ArrowDown') {
        currentPosition.y++;
        if (collision()) {
            currentPosition.y--;
            mergeTetromino();
            removeFullRows();
            newTetromino();
        }
    } else if (event.key === 'ArrowUp') {
        rotateTetromino(); // 위쪽 화살표 키로 회전
    } else if (event.key === ' ') {
        dropToBottom(); // 스페이스바로 바닥으로 이동
    }
});

let gameLoopId;
function gameLoop() {
    update();
    gameLoopId = requestAnimationFrame(gameLoop);
}

resetGame();
gameLoop(); // 게임 루프 시작
