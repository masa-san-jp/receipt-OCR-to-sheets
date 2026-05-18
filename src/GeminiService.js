/**
 * GeminiService — Gemini API による OCR と構造化抽出
 *
 * GAS の UrlFetchApp に依存します。
 * API キーは PropertiesService.getScriptProperties() で管理します。
 */
var GeminiService = (function () {

  var API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';

  /**
   * OCR + 構造化抽出のプロンプトを生成します。
   * @returns {string}
   */
  function buildPrompt() {
    return [
      '以下の経費証憑画像から情報を抽出し、指定の JSON 形式で返してください。',
      '',
      '【抽出ルール】',
      '- 画像に記載されている情報のみを抽出してください。推測・補完はしないでください。',
      '- 読み取れない項目・記載のない項目は null を返してください。',
      '- 日付は YYYY-MM-DD 形式で返してください。',
      '- 金額は整数（円）で返してください。',
      '',
      '【返却する JSON スキーマ】',
      '{',
      '  "document_type": "レシート"|"領収書"|"簡易領収書"|"利用明細"|"不明",',
      '  "usage_date": "YYYY-MM-DD または null",',
      '  "issue_date": "YYYY-MM-DD または null",',
      '  "vendor_name": "支払先名 または null",',
      '  "addressee": "宛名 または null",',
      '  "description": "摘要・但し書き または null",',
      '  "total_amount": "合計金額（税込）整数 または null",',
      '  "tax_10_base": "10%課税対象額（税抜）整数 または null",',
      '  "tax_10_amount": "10%税額 整数 または null",',
      '  "tax_8_base": "8%課税対象額（税抜）整数 または null",',
      '  "tax_8_amount": "8%税額 整数 または null",',
      '  "tax_exempt_amount": "非課税額 整数 または null",',
      '  "tax_unknown_amount": "税率不明額 整数 または null",',
      '  "primary_tax_rate": "10%"|"8%"|"混在"|"非課税"|"不明",',
      '  "payment_method": "現金"|"クレジットカード"|"電子マネー"|"QR決済"|"その他"|"不明",',
      '  "document_number": "書類番号 または null",',
      '  "invoice_registration_number": "T + 13桁数字 または null",',
      '  "address": "住所 または null",',
      '  "phone": "電話番号 または null",',
      '  "ocr_text": "画像から認識したすべてのテキスト",',
      '  "needs_review": true|false,',
      '  "review_reason": "要確認の理由 または null"',
      '}',
      '',
      'JSON のみ返してください。説明文は不要です。'
    ].join('\n');
  }

  /**
   * Gemini API に画像を送信し、構造化 JSON 文字列を返します。
   * @param {string} base64Image  Base64 エンコードされた画像データ
   * @param {string} mimeType     画像の MIME タイプ（例: "image/jpeg"）
   * @param {string} apiKey       Gemini API キー
   * @returns {string}  Gemini からの JSON 文字列
   * @throws {Error}    API エラー時
   */
  function callGeminiOcr(base64Image, mimeType, apiKey) {
    return RetryService.withRetry(function () {
      return _callOnce(base64Image, mimeType, apiKey);
    }, 'GeminiService.callGeminiOcr');
  }

  /** 1 回分の API 呼び出し（RetryService から呼ばれる） */
  function _callOnce(base64Image, mimeType, apiKey) {
    var model   = CONFIG.GEMINI_MODEL;
    var url     = API_BASE + model + ':generateContent?key=' + apiKey;
    var payload = {
      contents: [{
        parts: [
          { text: buildPrompt() },
          { inline_data: { mime_type: mimeType, data: base64Image } }
        ]
      }],
      generationConfig: {
        response_mime_type: 'application/json'
      }
    };

    var options = {
      method:             'post',
      contentType:        'application/json',
      payload:            JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var response   = UrlFetchApp.fetch(url, options);
    var statusCode = response.getResponseCode();
    var bodyText   = response.getContentText();

    if (statusCode !== 200) {
      var err = new Error('Gemini API エラー (HTTP ' + statusCode + '): ' + bodyText.slice(0, 200));
      // 一時障害（429/500/503）は再試行対象としてマーク
      err._retryable = RetryService.isRetryable(statusCode);
      throw err;
    }

    var body = JSON.parse(bodyText);
    var candidate = body.candidates && body.candidates[0];
    var content   = candidate && candidate.content;
    var part      = content && content.parts && content.parts[0];
    if (!part || !part.text) {
      throw new Error('Gemini API レスポンスにテキストが含まれていません');
    }
    return part.text;
  }

  return {
    callGeminiOcr: callGeminiOcr,
    buildPrompt:   buildPrompt
  };
})();
