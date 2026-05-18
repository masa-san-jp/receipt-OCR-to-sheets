/**
 * NotificationService — 管理者へのメール通知
 *
 * GAS の MailApp に依存します。
 * 通知設定は CONFIG の以下で制御します:
 *   ADMIN_EMAIL              : 通知先メールアドレス
 *   NOTIFY_ON_CRITICAL_ERROR : true のとき重大エラー発生時に即時通知
 *   NOTIFY_BATCH_SUMMARY     : true のときバッチ終了時にエラー集約を通知
 *
 * メールアドレスがプレースホルダーのままの場合は通知をスキップします。
 */
var NotificationService = (function () {

  var PLACEHOLDER_EMAIL = 'ここに管理者のメールアドレスを設定';

  /** 通知先が有効かどうかを確認します */
  function hasValidEmail() {
    return CONFIG.ADMIN_EMAIL &&
           CONFIG.ADMIN_EMAIL !== PLACEHOLDER_EMAIL &&
           CONFIG.ADMIN_EMAIL.indexOf('@') !== -1;
  }

  /**
   * メールを送信します。失敗してもバッチ処理は継続します。
   * @param {string} subject
   * @param {string} body
   */
  function sendMail(subject, body) {
    try {
      MailApp.sendEmail(CONFIG.ADMIN_EMAIL, subject, body);
      LogService.logInfo('[通知] メール送信: ' + subject);
    } catch (e) {
      LogService.logError('NotificationService', e);
    }
  }

  /**
   * バッチ終了後のエラー集約通知メッセージを組み立てます（テスト可能な純粋関数）。
   * @param {number} processedCount 成功件数
   * @param {number} errorCount     エラー件数
   * @param {string} dateStr        処理日時の文字列
   * @returns {string}
   */
  function buildSummaryBody(processedCount, errorCount, dateStr) {
    return [
      '経費証憑 OCR ツール — バッチ処理完了レポート',
      '',
      '処理日時 : ' + dateStr,
      '成功     : ' + processedCount + ' 件',
      'エラー   : ' + errorCount + ' 件',
      '',
      '【対応が必要です】',
      'スプレッドシートの「処理ログ」シートでエラー内容を確認し、',
      '「04_エラー」フォルダのファイルを対処してください。',
      '',
      '詳細: docs/troubleshooting.md を参照してください。'
    ].join('\n');
  }

  /**
   * 重大エラー発生時の即時通知メッセージを組み立てます（テスト可能な純粋関数）。
   * @param {string} fileName
   * @param {string} errorMessage
   * @returns {{subject: string, body: string}}
   */
  function buildCriticalBody(fileName, errorMessage) {
    return {
      subject: '[経費証憑 OCR] 重大エラーが発生しました',
      body: [
        '経費証憑 OCR ツールで重大なエラーが発生しました。',
        '',
        'ファイル名   : ' + fileName,
        'エラー内容   : ' + errorMessage,
        '発生日時     : ' + new Date().toLocaleString('ja-JP'),
        '',
        '管理者による確認・対処が必要です。',
        '詳細: docs/troubleshooting.md を参照してください。'
      ].join('\n')
    };
  }

  /**
   * 重大エラー（CONFIG_ERROR など）を即時通知します。
   * CONFIG.NOTIFY_ON_CRITICAL_ERROR が false の場合は送信しません。
   * @param {string} fileName
   * @param {string} errorMessage
   */
  function notifyCriticalError(fileName, errorMessage) {
    if (!CONFIG.NOTIFY_ON_CRITICAL_ERROR) return;
    if (!hasValidEmail()) return;
    var msg = buildCriticalBody(fileName, errorMessage);
    sendMail(msg.subject, msg.body);
  }

  /**
   * バッチ処理終了時にエラーがあれば集約通知します。
   * CONFIG.NOTIFY_BATCH_SUMMARY が false、またはエラー件数 0 の場合は送信しません。
   * @param {number} processedCount
   * @param {number} errorCount
   */
  function notifySummary(processedCount, errorCount) {
    if (!CONFIG.NOTIFY_BATCH_SUMMARY) return;
    if (errorCount === 0) return;
    if (!hasValidEmail()) return;
    var dateStr = new Date().toLocaleString('ja-JP');
    var subject = '[経費証憑 OCR] バッチ処理完了（エラー ' + errorCount + ' 件）';
    var body    = buildSummaryBody(processedCount, errorCount, dateStr);
    sendMail(subject, body);
  }

  return {
    notifyCriticalError:  notifyCriticalError,
    notifySummary:        notifySummary,
    // テスト用エクスポート
    _buildSummaryBody:    buildSummaryBody,
    _buildCriticalBody:   buildCriticalBody,
    _hasValidEmail:       hasValidEmail
  };
})();
