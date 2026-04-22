/**
 * DriveService — Google Drive からの画像取得と精算対象月の決定
 *
 * GAS の DriveApp に依存します。
 */
var DriveService = (function () {

  var SUPPORTED_MIME = [
    'image/jpeg',
    'image/png',
    'image/heic',
    'image/webp'
  ];

  /**
   * 取込フォルダから未処理の画像ファイル一覧を返します。
   * プレフィックスが付いているファイルはスキップします（処理済みと判断）。
   * @param {string} folderId
   * @returns {GoogleAppsScript.Drive.File[]}
   */
  function getUnprocessedFiles(folderId) {
    var folder = DriveApp.getFolderById(folderId);
    var files   = folder.getFiles();
    var result  = [];
    while (files.hasNext()) {
      var file = files.next();
      var mime = file.getMimeType();
      var name = file.getName();
      // サポート対象 MIME かつ処理済みプレフィックスがないものを対象とする
      var isSupported = SUPPORTED_MIME.indexOf(mime) !== -1;
      var isProcessed = /^\d{8}-/.test(name);
      if (isSupported && !isProcessed) {
        result.push(file);
      }
    }
    return result;
  }

  /**
   * 精算対象月を決定します。
   * mode === 'fixed'  : CONFIG.EXPENSE_MONTH_FIXED を返します。
   * mode === 'folder' : 取込フォルダ名から YYYY-MM を抽出します。
   * @param {GoogleAppsScript.Drive.File} file
   * @param {'fixed'|'folder'} mode
   * @param {string} fixedMonth  EXPENSE_MONTH_FIXED の値
   * @returns {string}  YYYY-MM 形式
   */
  function getExpenseMonth(file, mode, fixedMonth) {
    if (mode === 'folder') {
      var parents = file.getParents();
      if (parents.hasNext()) {
        var folderName = parents.next().getName();
        var m = folderName.match(/(\d{4}-\d{2})/);
        if (m) return m[1];
      }
    }
    return fixedMonth;
  }

  /**
   * ファイルを Base64 エンコードして返します（Gemini API 送信用）。
   * @param {GoogleAppsScript.Drive.File} file
   * @returns {string}
   */
  function getFileAsBase64(file) {
    var bytes = file.getBlob().getBytes();
    return Utilities.base64Encode(bytes);
  }

  return {
    getUnprocessedFiles: getUnprocessedFiles,
    getExpenseMonth:     getExpenseMonth,
    getFileAsBase64:     getFileAsBase64
  };
})();
