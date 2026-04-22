'use strict';

var ParseService      = require('../src/ParseService.js');
var ValidationService = require('../src/ValidationService.js');
var td = require('./testData.js');
var { test, describe, assertEqual, assertTrue, assertFalse } = require('./testRunner.js');

/** パース済みデータを取得するヘルパー */
function parse(jsonStr) {
  return ParseService.parseGeminiResponse(jsonStr);
}

describe('ValidationService._sumBreakdown', function () {

  test('全フィールドが null の場合 null を返す', function () {
    var data = { tax_10_base: null, tax_10_amount: null, tax_8_base: null,
                 tax_8_amount: null, tax_exempt_amount: null, tax_unknown_amount: null };
    assertEqual(ValidationService._sumBreakdown(data), null);
  });

  test('10%内訳のみある場合の合計を返す（1000 + 100 = 1100）', function () {
    var data = { tax_10_base: 1000, tax_10_amount: 100, tax_8_base: null,
                 tax_8_amount: null, tax_exempt_amount: null, tax_unknown_amount: null };
    assertEqual(ValidationService._sumBreakdown(data), 1100);
  });

  test('混在税率の合計を返す（1000+100 + 1300+104 = 2504）', function () {
    var data = { tax_10_base: 1000, tax_10_amount: 100, tax_8_base: 1300,
                 tax_8_amount: 104, tax_exempt_amount: null, tax_unknown_amount: null };
    assertEqual(ValidationService._sumBreakdown(data), 2504);
  });

  test('非課税額を含む合計を返す', function () {
    var data = { tax_10_base: 500, tax_10_amount: 50, tax_8_base: null,
                 tax_8_amount: null, tax_exempt_amount: 200, tax_unknown_amount: null };
    assertEqual(ValidationService._sumBreakdown(data), 750);
  });
});

describe('ValidationService.validate — 正常系', function () {

  test('正常データは SUCCESS を返す', function () {
    var result = ValidationService.validate(parse(td.RECEIPT_SUCCESS));
    assertEqual(result.status, 'SUCCESS');
    assertFalse(result.needs_review);
    assertEqual(result.review_reasons.length, 0);
  });

  test('混在税率で内訳が一致する場合は SUCCESS を返す', function () {
    var result = ValidationService.validate(parse(td.RECEIPT_MIXED_TAX));
    assertEqual(result.status, 'SUCCESS');
    assertFalse(result.needs_review);
  });
});

describe('ValidationService.validate — 要確認（ルール別）', function () {

  test('ルール1: 合計金額が null → NEEDS_REVIEW', function () {
    var result = ValidationService.validate(parse(td.RECEIPT_NO_AMOUNT));
    assertEqual(result.status, 'NEEDS_REVIEW');
    assertTrue(result.review_reasons.some(function (r) {
      return r.indexOf('合計金額') !== -1;
    }));
  });

  test('ルール2: 利用日・発行日が両方 null → NEEDS_REVIEW', function () {
    var result = ValidationService.validate(parse(td.RECEIPT_NO_DATE));
    assertEqual(result.status, 'NEEDS_REVIEW');
    assertTrue(result.review_reasons.some(function (r) {
      return r.indexOf('利用日') !== -1;
    }));
  });

  test('ルール3: 支払先名が null → NEEDS_REVIEW', function () {
    var result = ValidationService.validate(parse(td.RECEIPT_NO_VENDOR));
    assertEqual(result.status, 'NEEDS_REVIEW');
    assertTrue(result.review_reasons.some(function (r) {
      return r.indexOf('支払先名') !== -1;
    }));
  });

  test('ルール4: 主税率区分が「不明」→ NEEDS_REVIEW', function () {
    var result = ValidationService.validate(parse(td.RECEIPT_NO_VENDOR));
    assertEqual(result.status, 'NEEDS_REVIEW');
    assertTrue(result.review_reasons.some(function (r) {
      return r.indexOf('税率区分') !== -1;
    }));
  });

  test('ルール5: 合計と内訳が不一致（差 100 円）→ NEEDS_REVIEW', function () {
    var result = ValidationService.validate(parse(td.RECEIPT_AMOUNT_MISMATCH));
    assertEqual(result.status, 'NEEDS_REVIEW');
    assertTrue(result.review_reasons.some(function (r) {
      return r.indexOf('内訳合計') !== -1;
    }));
  });

  test('ルール6: 書類種別が「不明」→ NEEDS_REVIEW', function () {
    var json = JSON.stringify({
      document_type: '不明', usage_date: '2026-03-01',
      vendor_name: 'テスト', total_amount: 1000,
      primary_tax_rate: '10%', needs_review: false
    });
    var result = ValidationService.validate(ParseService.parseGeminiResponse(json));
    assertEqual(result.status, 'NEEDS_REVIEW');
    assertTrue(result.review_reasons.some(function (r) {
      return r.indexOf('書類種別') !== -1;
    }));
  });

  test('ルール7: Gemini needs_review: true → NEEDS_REVIEW（理由を引き継ぐ）', function () {
    var result = ValidationService.validate(parse(td.RECEIPT_GEMINI_REVIEW));
    assertEqual(result.status, 'NEEDS_REVIEW');
    assertTrue(result.review_reasons.some(function (r) {
      return r.indexOf('乗降区間') !== -1;
    }));
  });
});

describe('ValidationService.validate — エラー系', function () {

  test('_parseError データは ERROR を返す', function () {
    var data   = { _parseError: true, review_reason: 'JSON パース失敗' };
    var result = ValidationService.validate(data);
    assertEqual(result.status, 'ERROR');
    assertTrue(result.needs_review);
  });

  test('null データは ERROR を返す', function () {
    var result = ValidationService.validate(null);
    assertEqual(result.status, 'ERROR');
  });
});

describe('ValidationService.validate — 複数要確認理由', function () {

  test('複数条件に該当する場合、review_reason が改行区切りで結合される', function () {
    // 合計金額なし & 日付なし & 支払先なし → 3 つの理由
    var json = JSON.stringify({
      document_type: 'レシート', usage_date: null, issue_date: null,
      vendor_name: null, total_amount: null,
      primary_tax_rate: '10%', needs_review: false
    });
    var result = ValidationService.validate(ParseService.parseGeminiResponse(json));
    assertEqual(result.status, 'NEEDS_REVIEW');
    assertTrue(result.review_reasons.length >= 3);
    assertTrue(result.review_reason.indexOf('\n') !== -1);
  });
});

describe('ValidationService.validate — 許容誤差の境界値', function () {

  test('差額 1 円は許容範囲内（SUCCESS）', function () {
    var json = JSON.stringify({
      document_type: 'レシート', usage_date: '2026-03-01',
      vendor_name: 'テスト', total_amount: 1101,
      tax_10_base: 1000, tax_10_amount: 100,
      tax_8_base: null, tax_8_amount: null,
      tax_exempt_amount: null, tax_unknown_amount: null,
      primary_tax_rate: '10%', needs_review: false
    });
    var result = ValidationService.validate(ParseService.parseGeminiResponse(json));
    // 差額 1 円 < 2 円 → 内訳チェックは通過
    assertFalse(result.review_reasons.some(function (r) {
      return r.indexOf('内訳合計') !== -1;
    }));
  });

  test('差額 2 円は要確認（NEEDS_REVIEW）', function () {
    var json = JSON.stringify({
      document_type: 'レシート', usage_date: '2026-03-01',
      vendor_name: 'テスト', total_amount: 1102,
      tax_10_base: 1000, tax_10_amount: 100,
      tax_8_base: null, tax_8_amount: null,
      tax_exempt_amount: null, tax_unknown_amount: null,
      primary_tax_rate: '10%', needs_review: false
    });
    var result = ValidationService.validate(ParseService.parseGeminiResponse(json));
    assertTrue(result.review_reasons.some(function (r) {
      return r.indexOf('内訳合計') !== -1;
    }));
  });
});
