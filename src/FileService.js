/**
 * FileService — ファイルのリネームと移動
 *
 * buildFileName() は GAS 依存なし（Node.js でテスト可能）。
 * moveToProcessed() は GAS DriveApp に依存します。
 */
var FileService = (function () {

  var INVALID_CHARS = /[/\\:*?"<>|]/g;
  var VENDOR_MAX_LEN = 20;

  /**
   * Date オブジェクトを "yyyymmdd" 文字列に変換します。
   * @param {Date} date
   * @returns {string}
   */
  function formatDatePrefix(date) {
    var y = date.getFullYear();
    var m = ('0' + (date.getMonth() + 1)).slice(-2);
    var d = ('0' + date.getDate()).slice(-2);
    return '' + y + m + d;
  }

  /**
   * ファイル名に使用できない文字を "_" に置換し、最大長に切り詰めます。
   * @param {string} name
   * @param {number} maxLen
   * @returns {string}
   */
  function sanitizeVendorName(name, maxLen) {
    var s = name.replace(INVALID_CHARS, '_');
    return s.length > maxLen ? s.slice(0, maxLen) : s;
  }

  /**
   * 元ファイル名から拡張子（小文字）を取得します。
   * @param {string} originalFileName
   * @returns {string}
   */
  function getExtension(originalFileName) {
    var parts = originalFileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  /**
   * docs/design-speculation.md「6. ファイル命名規則」に従いファイル名を生成します。
   *
   * @param {'処理済'|'要確認'|'エラー'} status
   * @param {Date}   processedDate  GAS がファイルを処理した日付
   * @param {Object|null} data      parseGeminiResponse() の戻り値（エラー時は null）
   * @param {string} originalFileName
   * @returns {string}
   */
  function buildFileName(status, processedDate, data, originalFileName) {
    var prefix = formatDatePrefix(processedDate) + '-' + status + '-';

    if (status === 'エラー') {
      return prefix + originalFileName;
    }

    var usageDate  = (data && data.usage_date)   ? data.usage_date   : '日付不明';
    var vendorName = (data && data.vendor_name)
      ? sanitizeVendorName(data.vendor_name, VENDOR_MAX_LEN)
      : '支払先不明';
    var amount = (data && data.total_amount !== null && data.total_amount !== undefined)
      ? data.total_amount + '円'
      : '金額不明円';
    var ext = getExtension(originalFileName);
    var body = usageDate + '_' + vendorName + '_' + amount;

    return ext ? prefix + body + '.' + ext : prefix + body;
  }

  /**
   * ファイルをリネームして指定フォルダへ移動します（GAS 専用）。
   * @param {GoogleAppsScript.Drive.File} file
   * @param {string} folderId  移動先フォルダ ID
   * @param {string} newName   新しいファイル名
   */
  function moveToProcessed(file, folderId, newName) {
    file.setName(newName);
    var dest = DriveApp.getFolderById(folderId);
    dest.addFile(file);
    // 元の親フォルダから除去（DriveApp では明示的に必要）
    var parents = file.getParents();
    while (parents.hasNext()) {
      var parent = parents.next();
      if (parent.getId() !== folderId) {
        parent.removeFile(file);
      }
    }
  }

  return {
    buildFileName:    buildFileName,
    moveToProcessed:  moveToProcessed,
    _formatDatePrefix:    formatDatePrefix,   // テスト用
    _sanitizeVendorName:  sanitizeVendorName  // テスト用
  };
})();

if (typeof module !== 'undefined') {
  module.exports = FileService;
}
