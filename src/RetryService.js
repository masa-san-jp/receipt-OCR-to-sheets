/**
 * RetryService — 一時障害に対する再試行ポリシー
 *
 * 再試行対象: HTTP 429 / 500 / 503（一時障害）
 * 非対象:     HTTP 400 / 403 / 404（恒久的なエラー）
 * 戦略:       指数バックオフ（2s → 4s → 8s）、最大 3 回リトライ（計 4 試行）
 *
 * GAS の Utilities.sleep に依存します（Node.js テスト時はスキップ）。
 */
var RetryService = (function () {

  var MAX_RETRIES          = 3;
  var BASE_DELAY_MS        = 2000;
  var RETRYABLE_STATUS_CODES = [429, 500, 503];

  /** GAS / Node.js 互換スリープ */
  function sleep(ms) {
    if (typeof Utilities !== 'undefined') {
      Utilities.sleep(ms);
    }
    // Node.js（テスト環境）ではスキップ
  }

  /**
   * HTTP ステータスコードが再試行対象かどうかを返します。
   * @param {number} statusCode
   * @returns {boolean}
   */
  function isRetryable(statusCode) {
    return RETRYABLE_STATUS_CODES.indexOf(statusCode) !== -1;
  }

  /**
   * 指定した関数を再試行ポリシー付きで実行します。
   * 再試行対象エラーには `_retryable: true` プロパティを付与してスローしてください。
   *
   * @param {Function} fn     実行する関数（引数なし、戻り値あり）
   * @param {string}  [label] ログに出力する処理名
   * @returns {*} fn の戻り値
   * @throws 最終試行後もエラーが解消しない場合にスロー
   */
  function withRetry(fn, label) {
    var name          = label || '処理';
    var totalAttempts = MAX_RETRIES + 1;
    var lastError;

    for (var attempt = 1; attempt <= totalAttempts; attempt++) {
      try {
        return fn();
      } catch (e) {
        lastError = e;
        var isLast = attempt >= totalAttempts;

        if (!isLast && e._retryable === true) {
          var delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
          LogService.logInfo(
            '[RETRY] ' + name + ' 試行 ' + attempt + '/' + totalAttempts + ' 失敗。' +
            (delay / 1000) + '秒後に再試行します。(' + (e.message || String(e)) + ')'
          );
          sleep(delay);
        } else {
          if (attempt > 1) {
            LogService.logInfo(
              '[RETRY] ' + name + ' 試行 ' + attempt + '/' + totalAttempts + ' も失敗しました。リトライ打ち切り。'
            );
          }
          break;
        }
      }
    }
    throw lastError;
  }

  return {
    withRetry:             withRetry,
    isRetryable:           isRetryable,
    MAX_RETRIES:           MAX_RETRIES,
    RETRYABLE_STATUS_CODES: RETRYABLE_STATUS_CODES
  };
})();

if (typeof module !== 'undefined') {
  module.exports = RetryService;
}
