/**
 * ParseService — Gemini レスポンスのパースと型正規化
 *
 * GAS 環境と Node.js（ユニットテスト用）の両方で動作します。
 * GAS 依存はありません。
 */
var ParseService = (function () {

  /** ゼロ埋め（"3" → "03"） */
  function pad(n) {
    return ('0' + n).slice(-2);
  }

  /**
   * 日付文字列を YYYY-MM-DD 形式に正規化します。
   * 対応フォーマット:
   *   YYYY-MM-DD / YYYY/MM/DD / YYYY/M/D
   *   YYYY年MM月DD日
   *   令和N年MM月DD日
   *   RN.MM.DD / RN/MM/DD（和暦略記）
   * @param {*} value
   * @returns {string|null}
   */
  function normalizeDate(value) {
    if (value === null || value === undefined || value === '') return null;
    var s = String(value).trim();

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

    // YYYY/MM/DD または YYYY/M/D
    var m = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
    if (m) return m[1] + '-' + pad(m[2]) + '-' + pad(m[3]);

    // YYYY年MM月DD日
    m = s.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (m) return m[1] + '-' + pad(m[2]) + '-' + pad(m[3]);

    // 令和N年MM月DD日（令和1年 = 2019年）
    m = s.match(/^令和(\d+)年(\d{1,2})月(\d{1,2})日/);
    if (m) return (2018 + parseInt(m[1], 10)) + '-' + pad(m[2]) + '-' + pad(m[3]);

    // RN.MM.DD または RN/MM/DD（和暦略記）
    m = s.match(/^R(\d+)[./](\d{1,2})[./](\d{1,2})$/);
    if (m) return (2018 + parseInt(m[1], 10)) + '-' + pad(m[2]) + '-' + pad(m[3]);

    return null;
  }

  /**
   * 金額文字列を整数（円）に変換します。
   * ¥ ￥ 円 カンマ 全角数字 に対応します。
   * @param {*} value
   * @returns {number|null}
   */
  function normalizeAmount(value) {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') {
      return Number.isFinite(value) ? Math.round(value) : null;
    }
    var s = String(value).trim();
    // 全角数字 → 半角
    s = s.replace(/[０-９]/g, function (c) {
      return String.fromCharCode(c.charCodeAt(0) - 0xFEE0);
    });
    // 通貨記号・カンマ・スペースを除去
    s = s.replace(/[¥￥円,，\s]/g, '');
    if (s === '' || !/^-?\d+$/.test(s)) return null;
    return parseInt(s, 10);
  }

  /**
   * Gemini の JSON レスポンスを内部データオブジェクトにパースします。
   * パース失敗時は { _parseError: true, review_reason: '...' } を返します。
   * @param {string} jsonString
   * @returns {Object}
   */
  function parseGeminiResponse(jsonString) {
    if (!jsonString) {
      return { _parseError: true, review_reason: 'Gemini レスポンスの JSON パースに失敗しました' };
    }
    var data;
    try {
      // Markdown コードブロック（```json ... ```）が付いている場合に対応
      var cleaned = String(jsonString)
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/, '')
        .trim();
      data = JSON.parse(cleaned);
    } catch (e) {
      return { _parseError: true, review_reason: 'Gemini レスポンスの JSON パースに失敗しました' };
    }

    return {
      document_type:                  data.document_type                  || null,
      usage_date:                     normalizeDate(data.usage_date),
      issue_date:                     normalizeDate(data.issue_date),
      vendor_name:                    data.vendor_name                    || null,
      addressee:                      data.addressee                      || null,
      description:                    data.description                    || null,
      total_amount:                   normalizeAmount(data.total_amount),
      tax_10_base:                    normalizeAmount(data.tax_10_base),
      tax_10_amount:                  normalizeAmount(data.tax_10_amount),
      tax_8_base:                     normalizeAmount(data.tax_8_base),
      tax_8_amount:                   normalizeAmount(data.tax_8_amount),
      tax_exempt_amount:              normalizeAmount(data.tax_exempt_amount),
      tax_unknown_amount:             normalizeAmount(data.tax_unknown_amount),
      primary_tax_rate:               data.primary_tax_rate               || null,
      payment_method:                 data.payment_method                 || null,
      document_number:                data.document_number                || null,
      invoice_registration_number:    data.invoice_registration_number    || null,
      address:                        data.address                        || null,
      phone:                          data.phone                          || null,
      ocr_text:                       data.ocr_text                       || null,
      needs_review:                   data.needs_review === true,
      review_reason:                  data.review_reason                  || null
    };
  }

  return {
    normalizeDate:        normalizeDate,
    normalizeAmount:      normalizeAmount,
    parseGeminiResponse:  parseGeminiResponse
  };
})();

// Node.js 互換（GAS 環境では module は未定義のため無視される）
if (typeof module !== 'undefined') {
  module.exports = ParseService;
}
