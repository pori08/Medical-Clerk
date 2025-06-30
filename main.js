'use strict';

// --- DOM要素 ---
const form = document.getElementById('calculation-form');
const appointmentDateInput = document.getElementById('appointment-date');
const drugList = document.getElementById('drug-list');
const addDrugButton = document.getElementById('add-drug-button');
const resultDiv = document.getElementById('result');
const historyList = document.getElementById('history-list');
const clearHistoryButton = document.getElementById('clear-history-button');

let drugIdCounter = 0;

/**
 * 今日の日付を 'YYYY-MM-DD' 形式で取得 (JST)
 */
function getTodayJstString() {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date());
}

/**
 * 数字を丸囲み数字に変換するヘルパー関数
 * @param {number} num - 変換する数字
 * @returns {string} 丸囲み数字の文字列、または元の数字（対応範囲外の場合）
 */
function convertToCircledNumber(num) {
    if (num >= 1 && num <= 10) {
        // Unicodeの丸囲み数字の範囲 (①はU+2460)
        return String.fromCharCode(0x2460 + num - 1);
    } else if (num >= 11 && num <= 20) {
        // Unicodeの丸囲み数字の範囲 (⑪はU+246A)
        return String.fromCharCode(0x246A + num - 11);
    } else {
        return String(num); // 対応範囲外はそのままの数字を返す
    }
}

/**
 * 新しい薬剤入力フォームのHTMLを生成
 */
function createDrugItem(id) {
    const div = document.createElement('div');
    div.className = 'drug-item';
    div.dataset.id = id;
    div.innerHTML = `
        <h3 class="drug-number">薬剤${convertToCircledNumber(id)}</h3>
        <div class="form-group">
            <label for="dose-amount-${id}">服薬量</label>
            <input type="number" id="dose-amount-${id}" placeholder="例）2" required>
        </div>
        <div class="form-group">
            <label for="dose-unit-${id}">単位</label>
            <select id="dose-unit-${id}">
                <option value="day">日</option>
                <option value="week">週</option>
                <option value="month">月</option>
            </select>
        </div>
        <button type="button" class="button-danger remove-drug-button"><i class="fa-solid fa-trash"></i></button>
    `;
    return div;
}

/**
 * 薬剤フォームを追加
 */
function addDrug() {
    drugIdCounter++;
    const newDrugItem = createDrugItem(drugIdCounter);
    drugList.appendChild(newDrugItem);
}

/**
 * 薬剤フォームを削除
 */
function removeDrug(event) {
    if (event.target.closest('.remove-drug-button')) {
        const item = event.target.closest('.drug-item');
        item.remove();
    }
}

/**
 * 計算を実行し、結果を表示
 */
function calculate(event) {
    event.preventDefault(); // フォームのデフォルト送信をキャンセル

    const appointmentDateStr = appointmentDateInput.value;
    if (!appointmentDateStr) {
        displayError('予約日を設定してください。');
        return;
    }

    const today = new Date(getTodayJstString() + 'T00:00:00Z');
    const appointmentDate = new Date(appointmentDateStr + 'T00:00:00Z');
    const daysDiff = Math.round((appointmentDate - today) / (1000 * 60 * 60 * 24));

    if (daysDiff < 0) {
        displayError('エラー: 過去の日付は選択できません。');
        return;
    }

    const drugItems = drugList.querySelectorAll('.drug-item');
    if (drugItems.length === 0) {
        displayError('薬剤を1つ以上追加してください。');
        return;
    }

    let results = [];
    let hasError = false;

    drugItems.forEach((item, index) => {
        const id = item.dataset.id;
        const amount = Number(item.querySelector(`#dose-amount-${id}`).value);
        const unit = item.querySelector(`#dose-unit-${id}`).value;

        if (amount <= 0) {
            hasError = true;
            return;
        }

        let requiredDose = 0;
        switch (unit) {
            case 'day': requiredDose = amount * daysDiff; break;
            case 'week': requiredDose = amount * Math.ceil(daysDiff / 7); break;
            case 'month': requiredDose = amount * Math.ceil(daysDiff / 28); break;
        }
        results.push({ index: index + 1, dose: requiredDose }); // 薬剤名を削除し、インデックスを追加
    });

    if (hasError) {
        displayError('すべての服薬量を正しく入力してください。');
        return;
    }

    displaySuccess(daysDiff, results);
    saveHistory({ date: new Date().toLocaleString('ja-JP'), appointmentDate: appointmentDateStr, daysDiff, results });
}

/**
 * エラーメッセージを表示
 */
function displayError(message) {
    resultDiv.className = 'card error';
    resultDiv.innerHTML = `<p>${message}</p>`;
}

/**
 * 成功結果を表示
 */
function displaySuccess(daysDiff, results) {
    let resultHTML = `<p><b>予約日まであと ${daysDiff} 日</b></p><ul>`;
    results.forEach(r => {
        resultHTML += `<li>薬剤${convertToCircledNumber(r.index)} は ${r.dose} 錠</li>`;
    });
    resultHTML += '</ul>';
    resultDiv.className = 'card success';
    resultDiv.innerHTML = resultHTML;
}

/**
 * 計算履歴をlocalStorageに保存
 */
function saveHistory(calculation) {
    const history = JSON.parse(localStorage.getItem('calculationHistory') || '[]');
    history.unshift(calculation); // 最新のものを先頭に追加
    localStorage.setItem('calculationHistory', JSON.stringify(history));
    renderHistory();
}

/**
 * 計算履歴をlocalStorageから読み込み、表示
 */
function renderHistory() {
    const history = JSON.parse(localStorage.getItem('calculationHistory') || '[]');
    historyList.innerHTML = ''; // 一度クリア

    if (history.length === 0) {
        historyList.innerHTML = '<p style="text-align: center; color: var(--secondary-color);">履歴はありません。</p>';
        clearHistoryButton.style.display = 'none';
        return;
    }

    clearHistoryButton.style.display = 'block';

    history.forEach((calc, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'history-item';
        let resultsHtml = '<ul>';
        calc.results.forEach(r => {
            resultsHtml += `<li>薬剤${convertToCircledNumber(r.index)} は ${r.dose} 錠</li>`;
        });
        resultsHtml += '</ul>';

        itemDiv.innerHTML = `
            <div class="history-item-header">
                <div class="date">計算日時: ${calc.date} / 予約日: ${calc.appointmentDate} (あと ${calc.daysDiff} 日)</div>
                <button type="button" class="button-danger delete-history-item" data-index="${index}"><i class="fa-solid fa-trash"></i> 削除</button>
            </div>
            ${resultsHtml}
        `;
        historyList.appendChild(itemDiv);
    });

    // 個別削除ボタンのイベントリスナーを設定
    document.querySelectorAll('.delete-history-item').forEach(button => {
        button.addEventListener('click', deleteHistoryItem);
    });
}

/**
 * 個別の履歴項目を削除
 */
function deleteHistoryItem(event) {
    const indexToDelete = event.currentTarget.dataset.index;
    let history = JSON.parse(localStorage.getItem('calculationHistory') || '[]');
    
    if (confirm('この履歴項目を削除しますか？')) {
        history.splice(indexToDelete, 1);
        localStorage.setItem('calculationHistory', JSON.stringify(history));
        renderHistory(); // 履歴を再描画
    }
}

/**
 * 履歴をすべて消去
 */
function clearAllHistory() {
    if (confirm('すべての計算履歴を消去しますか？')) {
        localStorage.removeItem('calculationHistory');
        renderHistory();
    }
}

// --- 初期化処理 ---
function initialize() {
    appointmentDateInput.min = getTodayJstString();
    addDrugButton.addEventListener('click', addDrug);
    drugList.addEventListener('click', removeDrug);
    form.addEventListener('submit', calculate);
    clearHistoryButton.addEventListener('click', clearAllHistory);

    // 初期状態で1つ薬剤フォームを追加
    addDrug();
    // 履歴を読み込み表示
    renderHistory();
}

// --- アプリケーション開始 ---
initialize();
