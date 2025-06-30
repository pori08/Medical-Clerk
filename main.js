'use strict';

// --- DOM要素の取得 ---
const doseAmountInput = document.getElementById('dose-amount');
const doseUnitInput = document.getElementById('dose-unit');
const appointmentDateInput = document.getElementById('appointment-date');
const resultDiv = document.getElementById('result');
const resultParagraph = resultDiv.querySelector('p');

/**
 * 計算と結果表示を行うメイン関数
 */
function calculateAndDisplay() {
    // --- 入力値の取得 ---
    const doseAmount = Number(doseAmountInput.value);
    const doseUnit = doseUnitInput.value;
    const appointmentDateStr = appointmentDateInput.value;

    // --- 入力値のバリデーション ---
    if (!doseAmount || !appointmentDateStr || doseAmount <= 0) {
        resultParagraph.textContent = '服薬量と予約日を正しく入力してください。';
        resultDiv.classList.remove('error');
        return;
    }

    // --- 日付差の計算 ---
    // タイムゾーン間の問題を避けるため、UTC基準で日付の差を計算する

    // 今日の日付をAsia/Tokyoタイムゾーンで取得し、'YYYY-MM-DD'形式の文字列にする
    // 'sv-SE'ロケールはISO 8601形式(YYYY-MM-DD)を返すため利用
    const todayJstStr = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date());

    // UTCの0時0分0秒としてDateオブジェクトを生成
    const today = new Date(todayJstStr + 'T00:00:00Z');
    const appointmentDate = new Date(appointmentDateStr + 'T00:00:00Z');

    // ミリ秒単位の差を日数に変換
    const timeDiff = appointmentDate.getTime() - today.getTime();
    const daysDiff = Math.round(timeDiff / (1000 * 60 * 60 * 24));

    // 過去日のエラーハンドリング
    if (daysDiff < 0) {
        resultParagraph.textContent = 'エラー: 過去の日付は選択できません。';
        resultDiv.classList.add('error');
        return;
    }

    // --- 必要錠数の計算 ---
    let requiredDose = 0;
    switch (doseUnit) {
        case 'day': // 日単位
            requiredDose = doseAmount * daysDiff;
            break;
        case 'week': // 週単位
            requiredDose = doseAmount * Math.ceil(daysDiff / 7);
            break;
        case 'month': // 月単位 (1ヶ月 = 4週 = 28日換算)
            requiredDose = doseAmount * Math.ceil(daysDiff / 28);
            break;
    }

    // --- 結果の表示 ---
    resultDiv.classList.remove('error');
    resultDiv.classList.add('success');
    resultParagraph.textContent = `予約日まであと ${daysDiff} 日。必要錠数は ${requiredDose} 錠です。`;
}

// --- イベントリスナーの設定 ---
// 各フォーム要素の入力が変更されたら、リアルタイムで計算を実行
doseAmountInput.addEventListener('input', calculateAndDisplay);
doseUnitInput.addEventListener('change', calculateAndDisplay);
appointmentDateInput.addEventListener('change', calculateAndDisplay);

// 初期表示のために一度呼び出す
calculateAndDisplay();