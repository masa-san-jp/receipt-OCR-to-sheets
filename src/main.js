/**
 * main.js — エントリーポイント
 *
 * GAS タイムトリガーから呼び出されます。
 * ファイル単位で try-catch し、1 件の失敗がバッチ全体を止めません。
 */

/**
 * メイン処理。GAS タイムトリガーで定期実行します。
 */
function main() {
  var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) {
    LogService.logError('CONFIG', new Error('GEMINI_API_KEY がスクリプトプロパティに設定されていません'));
    return;
  }

  var files = DriveService.getUnprocessedFiles(CONFIG.INTAKE_FOLDER_ID);
  if (files.length === 0) {
    LogService.logInfo('処理対象ファイルなし');
    return;
  }

  var processedCount = 0;
  for (var i = 0; i < files.length && processedCount < CONFIG.MAX_FILES_PER_RUN; i++) {
    var file     = files[i];
    var fileName = file.getName();
    var fileId   = file.getId();

    try {
      // 重複チェック（冪等性保証）
      if (SheetsService.isDuplicate(CONFIG.SPREADSHEET_ID, CONFIG.LOG_SHEET_NAME, fileId)) {
        LogService.logInfo('重複スキップ: ' + fileName + ' (ID: ' + fileId + ')');
        // 取込フォルダから除去し、次回以降スキャン対象に入らないようリネームして移動
        var dupName = FileService.buildFileName('処理済', new Date(), null, fileName);
        try {
          FileService.moveToProcessed(file, CONFIG.PROCESSED_FOLDER_ID, dupName);
        } catch (moveErr) {
          LogService.logError(fileName + ' [重複移動失敗]', moveErr);
        }
        continue;
      }
      processFile_(file, fileName, fileId, apiKey);
      processedCount++;
    } catch (e) {
      // 技術エラー: ログ記録 → エラーフォルダへ移動
      LogService.logError(fileName, e);
      var errMsg = (e && e.message) ? e.message : String(e);
      LogService.logResult(
        CONFIG.SPREADSHEET_ID, CONFIG.LOG_SHEET_NAME,
        fileName, 'エラー', errMsg, fileId
      );
      try {
        var errName = FileService.buildFileName('エラー', new Date(), null, fileName);
        FileService.moveToProcessed(file, CONFIG.ERROR_FOLDER_ID, errName);
      } catch (moveErr) {
        LogService.logError(fileName + ' [移動失敗]', moveErr);
      }
    }
  }

  LogService.logInfo('処理完了: ' + processedCount + ' 件');
}

/**
 * ファイル 1 件を処理します（OCR → パース → バリデーション → 登録 → 移動）。
 * @param {GoogleAppsScript.Drive.File} file
 * @param {string} fileName
 * @param {string} fileId
 * @param {string} apiKey
 */
function processFile_(file, fileName, fileId, apiKey) {
  var expenseMonth = DriveService.getExpenseMonth(
    file, CONFIG.EXPENSE_MONTH_MODE, CONFIG.EXPENSE_MONTH_FIXED
  );

  // Gemini API 呼び出し（技術エラーは呼び出し元でキャッチ）
  var mimeType    = file.getMimeType();
  var base64Image = DriveService.getFileAsBase64(file);
  var rawResponse = GeminiService.callGeminiOcr(base64Image, mimeType, apiKey);

  // OCR 結果パース
  var data = ParseService.parseGeminiResponse(rawResponse);

  // JSON パースエラー → エラー扱い（呼び出し元で try-catch するためスロー）
  if (data._parseError) {
    throw new Error(data.review_reason || 'Gemini レスポンスの JSON パースに失敗しました');
  }

  // バリデーション
  var validation    = ValidationService.validate(data);
  var processedDate = new Date();
  var processedAt   = Utilities.formatDate(
    processedDate, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'
  );

  var meta = {
    processedAt:  processedAt,
    expenseMonth: expenseMonth,
    applicant:    CONFIG.APPLICANT_NAME,
    imageUrl:     'https://drive.google.com/file/d/' + fileId + '/view',
    fileId:       fileId
  };

  // スプレッドシートへ追記（NEEDS_REVIEW / SUCCESS の両方で登録）
  SheetsService.appendRow(CONFIG.SPREADSHEET_ID, CONFIG.SHEET_NAME, data, validation, meta);

  // ログ記録
  var resultLabel = validation.status === 'SUCCESS' ? '成功' : '要確認';
  LogService.logResult(
    CONFIG.SPREADSHEET_ID, CONFIG.LOG_SHEET_NAME,
    fileName, resultLabel, validation.review_reason || '', fileId
  );

  // ファイルをリネームして移動
  var statusLabel  = validation.status === 'SUCCESS' ? '処理済' : '要確認';
  var destFolderId = validation.status === 'SUCCESS'
    ? CONFIG.PROCESSED_FOLDER_ID
    : CONFIG.NEEDS_REVIEW_FOLDER_ID;
  var newName = FileService.buildFileName(statusLabel, processedDate, data, fileName);
  FileService.moveToProcessed(file, destFolderId, newName);
}
