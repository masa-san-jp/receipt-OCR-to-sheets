'use strict';

var ParseService = require('../src/ParseService.js');
var td = require('./testData.js');
var { test, describe, assertEqual, assertNull, assertTrue, assertFalse } = require('./testRunner.js');

describe('ParseService.normalizeDate', function () {

  test('YYYY-MM-DD をそのまま返す', function () {
    assertEqual(ParseService.normalizeDate('2026-03-18'), '2026-03-18');
  });

  test('YYYY/MM/DD を変換する', function () {
    assertEqual(ParseService.normalizeDate('2026/03/18'), '2026-03-18');
  });

  test('YYYY/M/D（ゼロ埋めなし）を変換する', function () {
    assertEqual(ParseService.normalizeDate('2026/3/5'), '2026-03-05');
  });

  test('YYYY年MM月DD日 を変換する', function () {
    assertEqual(ParseService.normalizeDate('2026年3月18日'), '2026-03-18');
  });

  test('令和8年3月18日 を変換する', function () {
    assertEqual(ParseService.normalizeDate('令和8年3月18日'), '2026-03-18');
  });

  test('令和1年1月1日 を変換する', function () {
    assertEqual(ParseService.normalizeDate('令和1年1月1日'), '2019-01-01');
  });

  test('R8.3.18（和暦略記・ドット区切り）を変換する', function () {
    assertEqual(ParseService.normalizeDate('R8.3.18'), '2026-03-18');
  });

  test('R8/3/18（和暦略記・スラッシュ区切り）を変換する', function () {
    assertEqual(ParseService.normalizeDate('R8/3/18'), '2026-03-18');
  });

  test('null を返す（null 入力）', function () {
    assertNull(ParseService.normalizeDate(null));
  });

  test('null を返す（空文字入力）', function () {
    assertNull(ParseService.normalizeDate(''));
  });

  test('null を返す（認識不能な文字列）', function () {
    assertNull(ParseService.normalizeDate('不明'));
  });
});

describe('ParseService.normalizeAmount', function () {

  test('整数をそのまま返す', function () {
    assertEqual(ParseService.normalizeAmount(1980), 1980);
  });

  test('小数を丸める', function () {
    assertEqual(ParseService.normalizeAmount(1980.6), 1981);
  });

  test('カンマ区切り文字列を変換する', function () {
    assertEqual(ParseService.normalizeAmount('1,980'), 1980);
  });

  test('¥ 記号付き文字列を変換する', function () {
    assertEqual(ParseService.normalizeAmount('¥1,980'), 1980);
  });

  test('￥ 記号付き文字列を変換する', function () {
    assertEqual(ParseService.normalizeAmount('￥1,980'), 1980);
  });

  test('「円」付き文字列を変換する', function () {
    assertEqual(ParseService.normalizeAmount('1,980円'), 1980);
  });

  test('全角数字を変換する', function () {
    assertEqual(ParseService.normalizeAmount('１，９８０'), 1980);
  });

  test('null を返す（null 入力）', function () {
    assertNull(ParseService.normalizeAmount(null));
  });

  test('null を返す（空文字入力）', function () {
    assertNull(ParseService.normalizeAmount(''));
  });

  test('null を返す（数字以外の文字列）', function () {
    assertNull(ParseService.normalizeAmount('不明'));
  });

  test('null を返す（NaN）', function () {
    assertNull(ParseService.normalizeAmount(NaN));
  });

  test('0 を変換する', function () {
    assertEqual(ParseService.normalizeAmount(0), 0);
  });
});

describe('ParseService.parseGeminiResponse', function () {

  test('正常な JSON をパースし内部データ構造を返す', function () {
    var result = ParseService.parseGeminiResponse(td.RECEIPT_SUCCESS);
    assertEqual(result.document_type, 'レシート');
    assertEqual(result.usage_date,    '2026-03-18');
    assertEqual(result.vendor_name,   'テストストア 渋谷店');
    assertEqual(result.total_amount,  1100);
    assertFalse(result.needs_review);
    assertEqual(result._parseError, undefined);
  });

  test('Markdown コードブロック付き JSON をパースする', function () {
    var result = ParseService.parseGeminiResponse(td.RECEIPT_IN_CODEBLOCK);
    assertEqual(result.document_type, 'レシート');
    assertEqual(result.total_amount,  1100);
  });

  test('不正な JSON に対して _parseError: true を返す', function () {
    var result = ParseService.parseGeminiResponse(td.INVALID_JSON);
    assertTrue(result._parseError);
  });

  test('空文字に対して _parseError: true を返す', function () {
    var result = ParseService.parseGeminiResponse(td.EMPTY_RESPONSE);
    assertTrue(result._parseError);
  });

  test('null の項目を null として返す', function () {
    var result = ParseService.parseGeminiResponse(td.RECEIPT_SUCCESS);
    assertNull(result.issue_date);
    assertNull(result.addressee);
  });

  test('usage_date を YYYY-MM-DD に正規化する（JSON 内の日付も変換）', function () {
    var json = JSON.stringify({ usage_date: '2026/03/18', vendor_name: 'X', total_amount: 100 });
    var result = ParseService.parseGeminiResponse(json);
    assertEqual(result.usage_date, '2026-03-18');
  });

  test('total_amount を整数に正規化する', function () {
    var json = JSON.stringify({ total_amount: '1,080円', vendor_name: 'X', usage_date: '2026-03-01' });
    var result = ParseService.parseGeminiResponse(json);
    assertEqual(result.total_amount, 1080);
  });

  test('needs_review が true の場合 true を返す', function () {
    var result = ParseService.parseGeminiResponse(td.RECEIPT_GEMINI_REVIEW);
    assertTrue(result.needs_review);
  });
});
