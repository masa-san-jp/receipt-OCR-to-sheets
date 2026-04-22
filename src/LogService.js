/**
 * LogService — 処理ログとエラーの記録
 *
 * GAS の Logger および SpreadsheetApp に依存します。
 * ログシート列:
 *   A: 処理日時  B: ファイル名  C: 処理結果  D: メッセージ  E: ファイルID（重複防止用）
 */
var LogService = (function () {

  function now() {
    return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
  }

  /**
   * 情報ログを Logger に出力します。
   * @param {string} message
   */
  function logInfo(message) {
    Logger.log('[INFO] ' + message);
  }

  /**
   * エラーをログシートと Logger に記録します。
   * @param {string} fileName
   * @param {Error}  error
   */
  function logError(fileName, error) {
    var msg = error && error.message ? error.message : String(error);
    Logger.log('[ERROR] ' + fileName + ': ' + msg);
  }

  /**
   * 処理結果をログシートに追記します。
   * @param {string} spreadsheetId
   * @param {string} logSheetName
   * @param {string} fileName
   * @param {'成功'|'要確認'|'エラー'} result
   * @param {string} message
   * @param {string} fileId  Drive ファイル ID（重複防止に使用）
   */
  function logResult(spreadsheetId, logSheetName, fileName, result, message, fileId) {
    try {
      var ss    = SpreadsheetApp.openById(spreadsheetId);
      var sheet = ss.getSheetByName(logSheetName);
      if (!sheet) {
        sheet = ss.insertSheet(logSheetName);
        sheet.appendRow(['処理日時', 'ファイル名', '処理結果', 'メッセージ', 'ファイルID']);
      }
      sheet.appendRow([now(), fileName, result, message, fileId || '']);
    } catch (e) {
      Logger.log('[ERROR] ログシートへの書き込みに失敗しました: ' + e.message);
    }
  }

  return {
    logInfo:    logInfo,
    logError:   logError,
    logResult:  logResult
  };
})();
