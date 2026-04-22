/**
 * ValidationService — 抽出データの要確認判定
 *
 * 判定ルールは docs/design-speculation.md「5. 要確認判定ルール」に準拠します。
 * GAS 依存はありません。
 */
var ValidationService = (function () {

  // 金額整合性チェックの許容誤差（円）
  var AMOUNT_TOLERANCE = 2;

  /**
   * 税内訳の合計を計算します。
   * 全フィールドが null の場合は null を返し、チェックをスキップします。
   * 計算式: (10%基準額 + 10%税額) + (8%基準額 + 8%税額) + 非課税額 + 税率不明額
   * @param {Object} data
   * @returns {number|null}
   */
  function sumBreakdown(data) {
    var fields = [
      data.tax_10_base,
      data.tax_10_amount,
      data.tax_8_base,
      data.tax_8_amount,
      data.tax_exempt_amount,
      data.tax_unknown_amount
    ];
    var hasAny = fields.some(function (v) { return v !== null && v !== undefined; });
    if (!hasAny) return null;
    return fields.reduce(function (acc, v) {
      return acc + (v !== null && v !== undefined ? v : 0);
    }, 0);
  }

  /**
   * 抽出データに要確認判定ルールを適用します。
   *
   * @param {Object} data  parseGeminiResponse() の戻り値
   * @returns {{
   *   needs_review: boolean,
   *   review_reasons: string[],
   *   review_reason: string,
   *   status: 'SUCCESS'|'NEEDS_REVIEW'|'ERROR'
   * }}
   */
  function validate(data) {
    // JSON パースエラーはそのまま ERROR として返す
    if (!data || data._parseError) {
      var errMsg = (data && data.review_reason)
        ? data.review_reason
        : 'Gemini レスポンスの JSON パースに失敗しました';
      return {
        needs_review:   true,
        review_reasons: [errMsg],
        review_reason:  errMsg,
        status:         'ERROR'
      };
    }

    var reasons = [];

    // ルール 1: 合計金額が取得できない
    if (data.total_amount === null || data.total_amount === undefined) {
      reasons.push('合計金額が取得できませんでした');
    }

    // ルール 2: 利用日・発行日が両方とも取得できない
    if (!data.usage_date && !data.issue_date) {
      reasons.push('利用日・発行日が取得できませんでした');
    }

    // ルール 3: 支払先名が取得できない
    if (!data.vendor_name) {
      reasons.push('支払先名が取得できませんでした');
    }

    // ルール 4: 主税率区分が「不明」
    if (data.primary_tax_rate === '不明') {
      reasons.push('税率区分が判別できませんでした');
    }

    // ルール 5: 合計金額と税内訳の合計が不一致（許容誤差 ±2 円以上）
    if (data.total_amount !== null && data.total_amount !== undefined) {
      var breakdown = sumBreakdown(data);
      if (breakdown !== null) {
        var diff = Math.abs(data.total_amount - breakdown);
        if (diff >= AMOUNT_TOLERANCE) {
          reasons.push(
            '合計金額と税内訳の合計が一致しません（合計: ' + data.total_amount +
            '円、内訳合計: ' + breakdown + '円）'
          );
        }
      }
    }

    // ルール 6: 書類種別が「不明」
    if (data.document_type === '不明') {
      reasons.push('書類種別が判定できませんでした');
    }

    // ルール 7: Gemini が needs_review: true を返した
    if (data.needs_review === true) {
      reasons.push(data.review_reason || 'Gemini が要確認と判定しました');
    }

    var needsReview = reasons.length > 0;
    return {
      needs_review:   needsReview,
      review_reasons: reasons,
      review_reason:  reasons.join('\n'),
      status:         needsReview ? 'NEEDS_REVIEW' : 'SUCCESS'
    };
  }

  return {
    validate:       validate,
    _sumBreakdown:  sumBreakdown  // テスト用
  };
})();

if (typeof module !== 'undefined') {
  module.exports = ValidationService;
}
