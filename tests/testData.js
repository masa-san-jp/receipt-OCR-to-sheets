/**
 * testData.js — ユニットテスト用ダミーデータ
 *
 * 個人情報（実名・実メールアドレス・実電話番号）を含みません。
 * 店舗名・住所はすべて架空です。
 */
'use strict';

/** 正常系: 必要項目がすべて揃ったレシート */
var RECEIPT_SUCCESS = JSON.stringify({
  document_type: 'レシート',
  usage_date:    '2026-03-18',
  issue_date:    null,
  vendor_name:   'テストストア 渋谷店',
  addressee:     null,
  description:   '食料品・日用品',
  total_amount:  1100,
  tax_10_base:   1000,
  tax_10_amount: 100,
  tax_8_base:    null,
  tax_8_amount:  null,
  tax_exempt_amount:   null,
  tax_unknown_amount:  null,
  primary_tax_rate:    '10%',
  payment_method:      '現金',
  document_number:     null,
  invoice_registration_number: null,
  address:       '東京都○○区△△1-2-3',
  phone:         '00-0000-0000',
  ocr_text:      'テストストア 渋谷店\n2026/03/18 10:00\n合計 1,080円',
  needs_review:  false,
  review_reason: null
});

/** 正常系: 混在税率（10% + 8%）で合計が内訳と一致 */
var RECEIPT_MIXED_TAX = JSON.stringify({
  document_type: 'レシート',
  usage_date:    '2026-03-20',
  issue_date:    null,
  vendor_name:   'サンプルスーパー',
  addressee:     null,
  description:   null,
  total_amount:  1954,
  tax_10_base:   500,
  tax_10_amount: 50,
  tax_8_base:    1300,
  tax_8_amount:  104,
  tax_exempt_amount:   null,
  tax_unknown_amount:  null,
  primary_tax_rate:    '混在',
  payment_method:      'クレジットカード',
  document_number:     null,
  invoice_registration_number: 'T1234567890123',
  address:       null,
  phone:         null,
  ocr_text:      'サンプルスーパー\n2026/03/20\n合計 1,954円',
  needs_review:  false,
  review_reason: null
});

/** 要確認: 合計金額が null */
var RECEIPT_NO_AMOUNT = JSON.stringify({
  document_type: '領収書',
  usage_date:    '2026-03-15',
  issue_date:    null,
  vendor_name:   'ダミー商会',
  addressee:     '上様',
  description:   '会議費',
  total_amount:  null,
  tax_10_base:   null,
  tax_10_amount: null,
  tax_8_base:    null,
  tax_8_amount:  null,
  tax_exempt_amount:   null,
  tax_unknown_amount:  null,
  primary_tax_rate:    '10%',
  payment_method:      '現金',
  document_number:     null,
  invoice_registration_number: null,
  address:       null,
  phone:         null,
  ocr_text:      'ダミー商会\n領収書\n金額不明',
  needs_review:  false,
  review_reason: null
});

/** 要確認: 日付が両方 null */
var RECEIPT_NO_DATE = JSON.stringify({
  document_type: 'レシート',
  usage_date:    null,
  issue_date:    null,
  vendor_name:   'テスト食堂',
  addressee:     null,
  description:   '飲食費',
  total_amount:  3300,
  tax_10_base:   3000,
  tax_10_amount: 300,
  tax_8_base:    null,
  tax_8_amount:  null,
  tax_exempt_amount:   null,
  tax_unknown_amount:  null,
  primary_tax_rate:    '10%',
  payment_method:      '現金',
  document_number:     null,
  invoice_registration_number: null,
  address:       null,
  phone:         null,
  ocr_text:      'テスト食堂\n合計 3,300円',
  needs_review:  false,
  review_reason: null
});

/** 要確認: 支払先名が null */
var RECEIPT_NO_VENDOR = JSON.stringify({
  document_type: 'レシート',
  usage_date:    '2026-03-10',
  issue_date:    null,
  vendor_name:   null,
  addressee:     null,
  description:   null,
  total_amount:  500,
  tax_10_base:   null,
  tax_10_amount: null,
  tax_8_base:    null,
  tax_8_amount:  null,
  tax_exempt_amount:   null,
  tax_unknown_amount:  null,
  primary_tax_rate:    '不明',
  payment_method:      '不明',
  document_number:     null,
  invoice_registration_number: null,
  address:       null,
  phone:         null,
  ocr_text:      '(読み取り不明)\n合計 500円',
  needs_review:  false,
  review_reason: null
});

/** 要確認: 合計と税内訳が不一致（差額 = 100円） */
var RECEIPT_AMOUNT_MISMATCH = JSON.stringify({
  document_type: 'レシート',
  usage_date:    '2026-03-12',
  issue_date:    null,
  vendor_name:   'サンプル書店',
  addressee:     null,
  description:   '書籍',
  total_amount:  1200,
  tax_10_base:   1000,
  tax_10_amount: 100,
  tax_8_base:    null,
  tax_8_amount:  null,
  tax_exempt_amount:   null,
  tax_unknown_amount:  null,
  primary_tax_rate:    '10%',
  payment_method:      '現金',
  document_number:     null,
  invoice_registration_number: null,
  address:       null,
  phone:         null,
  ocr_text:      'サンプル書店\n2026/03/12\n合計 1,200円',
  needs_review:  false,
  review_reason: null
});

/** 要確認: Gemini が needs_review: true を返したケース */
var RECEIPT_GEMINI_REVIEW = JSON.stringify({
  document_type: '利用明細',
  usage_date:    '2026-03-05',
  issue_date:    null,
  vendor_name:   'サンプル交通',
  addressee:     null,
  description:   '交通費',
  total_amount:  240,
  tax_10_base:   null,
  tax_10_amount: null,
  tax_8_base:    null,
  tax_8_amount:  null,
  tax_exempt_amount:   null,
  tax_unknown_amount:  null,
  primary_tax_rate:    '非課税',
  payment_method:      '電子マネー',
  document_number:     null,
  invoice_registration_number: null,
  address:       null,
  phone:         null,
  ocr_text:      'サンプル交通\n2026/03/05\n240円',
  needs_review:  true,
  review_reason: '複数の乗降区間が混在しているため確認が必要です'
});

/** エラー: 不正な JSON 文字列 */
var INVALID_JSON = '{ not valid json ';

/** エラー: 空文字列 */
var EMPTY_RESPONSE = '';

/** Markdown コードブロック付き JSON */
var RECEIPT_IN_CODEBLOCK = '```json\n' + RECEIPT_SUCCESS + '\n```';

module.exports = {
  RECEIPT_SUCCESS:        RECEIPT_SUCCESS,
  RECEIPT_MIXED_TAX:      RECEIPT_MIXED_TAX,
  RECEIPT_NO_AMOUNT:      RECEIPT_NO_AMOUNT,
  RECEIPT_NO_DATE:        RECEIPT_NO_DATE,
  RECEIPT_NO_VENDOR:      RECEIPT_NO_VENDOR,
  RECEIPT_AMOUNT_MISMATCH: RECEIPT_AMOUNT_MISMATCH,
  RECEIPT_GEMINI_REVIEW:  RECEIPT_GEMINI_REVIEW,
  INVALID_JSON:           INVALID_JSON,
  EMPTY_RESPONSE:         EMPTY_RESPONSE,
  RECEIPT_IN_CODEBLOCK:   RECEIPT_IN_CODEBLOCK
};
