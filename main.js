'use strict';

// --- DOM要素の取得 ---
const doseAmountInput = document.getElementById('dose-amount');
const doseUnitInput = document.getElementById('dose-unit');
const appointmentDateInput = document.getElementById('appointment-date');
const resultDiv = document.getElementById('result');
const resultParagraph = resultDiv.querySelector('p');
const clearButton = document.getElementById('clear-button');

/**
 * 今日の日付を 'YYYY-MM-DD' 形式で取得する (JST基準)
 * @returns {string} 今日の日付文字列
 */
function getTodayJstString() {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date());
}

/**
 * 日付入力の最小値を設定する
 */
function setMinDate() {
    appointmentDateInput.min = getTodayJstString();
}

/**
 * 計算と結果表示を行うメイン関数
 */
function calculateAndDisplay() {
    // 結果表示を一旦隠す
    resultDiv.classList.remove('visible');

    // --- 入力値の取得 ---
    const doseAmount = Number(doseAmountInput.value);
    const doseUnit = doseUnitInput.value;
    const appointmentDateStr = appointmentDateInput.value;

    // --- バリデーション ---
    if (!doseAmount || !appointmentDateStr || doseAmount <= 0) {
        resultParagraph.textContent = '服薬量と予約日を正しく入力してください。';
        resultDiv.className = 'card'; // スタイルをリセット
        resultDiv.classList.add('visible');
        return;
    }

    // --- 日付差の計算 ---
    const today = new Date(getTodayJstString() + 'T00:00:00Z');
    const appointmentDate = new Date(appointmentDateStr + 'T00:00:00Z');
    const daysDiff = Math.round((appointmentDate - today) / (1000 * 60 * 60 * 24));

    if (daysDiff < 0) {
        resultParagraph.textContent = 'エラー: 過去の日付は選択できません。';
        resultDiv.className = 'card error';
        resultDiv.classList.add('visible');
        return;
    }

    // --- 必要錠数の計算 ---
    let requiredDose = 0;
    switch (doseUnit) {
        case 'day':
            requiredDose = doseAmount * daysDiff;
            break;
        case 'week':
            requiredDose = doseAmount * Math.ceil(daysDiff / 7);
            break;
        case 'month':
            requiredDose = doseAmount * Math.ceil(daysDiff / 28);
            break;
    }

    // --- 結果の表示 ---
    resultParagraph.textContent = `予約日まであと ${daysDiff} 日。必要錠数は ${requiredDose} 錠です。`;
    resultDiv.className = 'card success';
    
    // 少し遅延させて表示することでアニメーションを発火
    setTimeout(() => {
        resultDiv.classList.add('visible');
    }, 10);
}

/**
 * フォームをクリアする関数
 */
function clearForm() {
    doseAmountInput.value = '';
    doseUnitInput.value = 'day';
    appointmentDateInput.value = '';
    resultParagraph.textContent = '入力フォームに値を設定してください。';
    resultDiv.className = 'card';
    resultDiv.classList.add('visible');
}

// --- 初期化処理 ---
function initialize() {
    setMinDate();
    doseAmountInput.addEventListener('input', calculateAndDisplay);
    doseUnitInput.addEventListener('change', calculateAndDisplay);
    appointmentDateInput.addEventListener('change', calculateAndDisplay);
    clearButton.addEventListener('click', clearForm);
    // 初期表示
    setTimeout(() => calculateAndDisplay(), 100);
}

// --- アプリケーションの開始 ---
initialize();
