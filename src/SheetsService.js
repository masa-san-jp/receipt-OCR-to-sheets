/**
 * SheetsService — Google スプレッドシートへのデータ追記と重複チェック
 *
 * GAS の SpreadsheetApp に依存します。
 * 列定義は docs/design-speculation.md「3.1 スプレッドシート列定義」に準拠します。
 */
var SheetsService = (function () {

  /**
   * 内部データオブジェクトとメタ情報から列定義順の配列を生成します。
   * @param {Object} data        parseGeminiResponse() の戻り値
   * @param {Object} validation  validate() の戻り値
   * @param {Object} meta        { processedAt, expenseMonth, applicant, imageUrl, fileId }
   * @returns {Array}
   */
  function buildRowArray(data, validation, meta) {
    return [
      meta.processedAt,                         // A: 処理日時
      meta.expenseMonth,                         // B: 精算対象月
      data.document_type,                        // C: 書類種別
      data.usage_date,                           // D: 利用日
      data.issue_date,                           // E: 発行日
      data.vendor_name,                          // F: 支払先名
      data.addressee,                            // G: 宛名
      data.description,                          // H: 摘要 / 但し書き
      data.total_amount,                         // I: 合計金額（税込）
      data.tax_10_base,                          // J: 10%対象額
      data.tax_10_amount,                        // K: 10%税額
      data.tax_8_base,                           // L: 8%対象額
      data.tax_8_amount,                         // M: 8%税額
      data.tax_exempt_amount,                    // N: 非課税額
      data.tax_unknown_amount,                   // O: 税率不明額
      data.primary_tax_rate,                     // P: 主税率区分
      data.payment_method,                       // Q: 支払方法
      data.document_number,                      // R: 書類番号
      data.invoice_registration_number,          // S: 適格請求書発行事業者登録番号
      data.address,                              // T: 住所
      data.phone,                                // U: 電話番号
      meta.applicant,                            // V: 申請者
      meta.imageUrl,                             // W: 画像 URL
      data.ocr_text,                             // X: OCR 抽出テキスト
      validation.needs_review ? 'TRUE' : 'FALSE', // Y: 要確認フラグ
      validation.review_reason || '',            // Z: 要確認理由
      ''                                         // AA: 備考（申請者が手動入力）
    ];
  }

  /**
   * 指定シートの末尾に 1 行追記します。
   * @param {string} spreadsheetId
   * @param {string} sheetName
   * @param {Object} data
   * @param {Object} validation
   * @param {Object} meta
   */
  function appendRow(spreadsheetId, sheetName, data, validation, meta) {
    var ss    = SpreadsheetApp.openById(spreadsheetId);
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error('シートが見つかりません: ' + sheetName);
    }
    var row = buildRowArray(data, validation, meta);
    sheet.appendRow(row);
  }

  /**
   * 同一 Drive ファイル ID の登録が処理ログに存在するか確認します（冪等性保証）。
   * ログシートの E 列（ファイルID）を検索します。
   * @param {string} spreadsheetId
   * @param {string} logSheetName
   * @param {string} fileId  Drive ファイル ID
   * @returns {boolean}
   */
  function isDuplicate(spreadsheetId, logSheetName, fileId) {
    if (!fileId) return false;
    try {
      var ss    = SpreadsheetApp.openById(spreadsheetId);
      var sheet = ss.getSheetByName(logSheetName);
      if (!sheet || sheet.getLastRow() < 2) return false;
      // E 列（ファイルID）が存在しない場合は重複なし扱い
      if (sheet.getLastColumn() < 5) return false;
      // TextFinder で E 列のみを対象に 1 件検索（全件読み込みより効率的）
      var col    = sheet.getRange(2, 5, sheet.getLastRow() - 1, 1);
      var finder = col.createTextFinder(fileId).matchEntireCell(true);
      return finder.findNext() !== null;
    } catch (e) {
      Logger.log('[WARN] 重複チェック中にエラーが発生しました: ' + e.message);
      return false;
    }
  }

  return {
    buildRowArray: buildRowArray,
    appendRow:     appendRow,
    isDuplicate:   isDuplicate
  };
})();
