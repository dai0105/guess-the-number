// =========================
// 画面
// =========================

const titleScreen = document.getElementById("title-screen");
const gameScreen = document.getElementById("game-screen");
const resultScreen = document.getElementById("result-screen");
const resultTitle = document.getElementById("result-title");
const resultMessage = document.getElementById("result-message");
const answerCode = document.getElementById("answer-code");
const resultTry = document.getElementById("result-try");
const resultTime = document.getElementById("result-time");
const resultScore = document.getElementById("result-score");
const resultRank = document.getElementById("result-rank");
const rankMessage = document.getElementById("rank-message");
const bestScoreDisplay = document.getElementById("best-score");


// =========================
// ボタン
// =========================

const gameStartButton = document.getElementById("game-start-button");
const retryButton = document.getElementById("retry-button");
const backTitleButton = document.getElementById("back-title-button");


// =========================
// 画面切り替え
// =========================

function showScreen(screen) {

    titleScreen.hidden = true;
    gameScreen.hidden = true;
    resultScreen.hidden = true;

    screen.hidden = false;
}


// =========================
// GAME START
// =========================

gameStartButton.addEventListener("click", () => {

    resetGame();

});

retryButton.addEventListener("click", () => {

    resetGame();

});

// =========================
// テンキー入力
// =========================

const numberKeys = document.querySelectorAll(".number-key");
const codeDigits = document.querySelectorAll(".code-digit");

const deleteButton = document.getElementById("delete-button");
const submitButton = document.getElementById("submit-button");

let inputCode = [];
let secretCode = [];
let tryCount = 0;
const tryDisplay = document.getElementById("try-display");
const historyList = document.getElementById("history-list");
const timeDisplay = document.getElementById("time-display");

let timeLeft = 300;
let timerId = null;


// =========================
// 秘密CODE生成
// =========================

function generateSecretCode() {

    const numbers = [
        "0", "1", "2", "3", "4",
        "5", "6", "7", "8", "9"
    ];

    const code = [];

    while (code.length < 3) {

        const randomIndex = Math.floor(
            Math.random() * numbers.length
        );

        const number = numbers.splice(randomIndex, 1)[0];

        code.push(number);
    }

    return code;
}


// =========================
// 入力表示を更新
// =========================

function updateCodeDisplay() {

    codeDigits.forEach((digit, index) => {

        if (inputCode[index] !== undefined) {
            digit.textContent = inputCode[index];
        } else {
            digit.textContent = "-";
        }

    });

    // 3桁入力されたら判定可能
    submitButton.disabled = inputCode.length !== 3;
}


// =========================
// 数字ボタン
// =========================

numberKeys.forEach((button) => {

    button.addEventListener("click", () => {

        const number = button.dataset.number;

        // 3桁入力済みなら何もしない
        if (inputCode.length >= 3) {
            return;
        }

        // 同じ数字は使えない
        if (inputCode.includes(number)) {
            return;
        }

        inputCode.push(number);

        updateCodeDisplay();

    });

});


// =========================
// 1文字削除
// =========================

deleteButton.addEventListener("click", () => {

    inputCode.pop();

    updateCodeDisplay();

});

// =========================
// HIT / BLOW 判定
// =========================

function checkCode(guess) {

    let hit = 0;
    let blow = 0;

    guess.forEach((number, index) => {

        // 数字も位置も一致
        if (number === secretCode[index]) {

            hit++;

        // 数字は存在するが位置が違う
        } else if (secretCode.includes(number)) {

            blow++;

        }

    });

    return {
        hit: hit,
        blow: blow
    };
}

// =========================
// ゲームクリア
// =========================

function gameClear() {

    stopTimer();

    resultTitle.textContent =
        "🔓 CODE CRACKED!";

    resultMessage.textContent =
        "暗証コードの解読に成功しました。";

    answerCode.textContent =
        secretCode.join("");

    resultTry.textContent =
        `${tryCount}回`;

    resultTime.textContent =
        formatTime(timeLeft);


    // SCORE計算
    const score = calculateScore();

    resultScore.textContent =
        score.toLocaleString("ja-JP");

    saveBestScore(score);


    // RANK判定
    const rankResult = calculateRank(score);

    resultRank.textContent =
        rankResult.rank;

    rankMessage.textContent =
        rankResult.message;


    showScreen(resultScreen);
}

// =========================
// GAME OVER
// =========================

function gameOver(reason = "tries") {

    stopTimer();
    resultScore.textContent = "0";

    resultRank.textContent = "-";

    rankMessage.textContent =
        "CODE BREAK FAILED";

    resultTitle.textContent = "🔒 GAME OVER";

    if (reason === "time") {

        resultMessage.textContent =
            "制限時間5分を超えました。";
        
        resultTime.textContent =
            formatTime(timeLeft);

    } else {

        resultMessage.textContent =
            "10回以内にCODEを解読できませんでした。";
    }

    answerCode.textContent =
        secretCode.join("");

    resultTry.textContent =
        `${tryCount}回`;

    showScreen(resultScreen);
}

// =========================
// 判定ボタン
// =========================

submitButton.addEventListener("click", () => {

    // 3桁揃っていなければ判定しない
    if (inputCode.length !== 3) {
        return;
    }

    // HIT / BLOWを判定
    const result = checkCode(inputCode);

    // 挑戦回数を増やす
    tryCount++;

    // TRY表示
    tryDisplay.textContent = `${tryCount} / 10`;

    // 「まだ解析データはありません」を削除
    const historyEmpty =
        document.getElementById("history-empty");

    if (historyEmpty) {
        historyEmpty.remove();
    }

    // 入力したCODEを文字列にする
    const guessedCode = inputCode.join("");

    // 履歴を作成
    const historyItem = document.createElement("div");

    historyItem.classList.add("history-item");

    historyItem.innerHTML = `
        <span class="history-try">
            #${tryCount}
        </span>

        <strong class="history-code">
            ${guessedCode}
        </strong>

        <div class="history-result">

            <span class="hit-result">
                🎯 ${result.hit} HIT
            </span>

            <span class="blow-result">
                🔄 ${result.blow} BLOW
            </span>

        </div>
    `;

    // 新しい履歴を上に追加
    historyList.prepend(historyItem);

    // 3 HITならゲームクリア
    if (result.hit === 3) {

        gameClear();

        return;
    }

    // 10回使い切ったらGAME OVER
    if (tryCount >= 10) {

        gameOver();

        return;
    }

    // 入力をリセット
    inputCode = [];

    updateCodeDisplay();

});

// =========================
// 時間表示
// =========================

function updateTimeDisplay() {

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    timeDisplay.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatTime(seconds) {

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

// =========================
// SCORE計算
// =========================

function calculateScore() {

    const tryPenalty =
        (tryCount - 1) * 1000;

    const timeBonus =
        timeLeft * 10;

    const score =
        10000 - tryPenalty + timeBonus;

    return Math.max(score, 0);
}

// =========================
// RANK判定
// =========================

function calculateRank(score) {

    if (score >= 12000) {

        return {
            rank: "S",
            message: "MASTER CODE BREAKER"
        };

    }

    if (score >= 10000) {

        return {
            rank: "A",
            message: "EXCELLENT!"
        };

    }

    if (score >= 8000) {

        return {
            rank: "B",
            message: "GREAT!"
        };

    }

    if (score >= 5000) {

        return {
            rank: "C",
            message: "GOOD!"
        };

    }

    return {
        rank: "D",
        message: "CLEAR!"
    };
}


// =========================
// タイマー停止
// =========================

function stopTimer() {

    if (timerId !== null) {

        clearInterval(timerId);
        timerId = null;
    }
}

// =========================
// タイマー開始
// =========================

function startTimer() {

    stopTimer();

    timeLeft = 300;

    updateTimeDisplay();

    timerId = setInterval(() => {

        timeLeft--;

        updateTimeDisplay();

        if (timeLeft <= 0) {

            timeLeft = 0;

            updateTimeDisplay();

            stopTimer();

            gameOver("time");

        }

    }, 1000);
}

// =========================
// ゲーム初期化
// =========================

function resetGame() {

    // タイマーを停止
    stopTimer();

    // 新しい秘密CODE
    secretCode = generateSecretCode();

    // 入力をリセット
    inputCode = [];

    // 挑戦回数をリセット
    tryCount = 0;

    // 表示をリセット
    tryDisplay.textContent = "0 / 10";

    updateCodeDisplay();

    // 履歴を初期化
    historyList.innerHTML = `
        <p id="history-empty">
            まだ解析データはありません。
        </p>
    `;

    // タイマーを5分から開始
    startTimer();

    // ゲーム画面を表示
    showScreen(gameScreen);
}

// =========================
// BEST SCORE
// =========================

function getBestScore() {

    const savedScore =
        localStorage.getItem("bestScore");

    if (savedScore === null) {
        return 0;
    }

    return Number(savedScore);
}

function updateBestScoreDisplay() {

    const bestScore = getBestScore();

    if (bestScore === 0) {

        bestScoreDisplay.textContent =
            "🏆 ---";

        return;
    }

    bestScoreDisplay.textContent =
        `🏆 ${bestScore.toLocaleString("ja-JP")}`;
}

function saveBestScore(score) {

    const bestScore = getBestScore();

    if (score > bestScore) {

        localStorage.setItem(
            "bestScore",
            String(score)
        );

        updateBestScoreDisplay();
    }
}

// =========================
// TITLEへ戻る
// =========================

backTitleButton.addEventListener("click", () => {

    stopTimer();

    inputCode = [];

    updateCodeDisplay();

    showScreen(titleScreen);

    updateBestScoreDisplay();

});

// =========================
// 初期表示
// =========================

updateBestScoreDisplay();

