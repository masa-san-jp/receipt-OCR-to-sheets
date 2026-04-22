'use strict';

var FileService = require('../src/FileService.js');
var { test, describe, assertEqual, assertTrue } = require('./testRunner.js');

// new Date('...Z') は UTC 基準のため、UTC-N 環境では前日の日付になる。
// new Date(y, m, d) でローカル 00:00 を明示し、どの環境でも 2026-03-23 になるようにする。
var FIXED_DATE = new Date(2026, 2, 23);

describe('FileService._formatDatePrefix', function () {

  test('Date オブジェクトを yyyymmdd 形式に変換する', function () {
    // new Date(y, m, d) はローカルタイムゾーンの 00:00 を生成する
    var d = new Date(2026, 2, 23); // month は 0 始まり
    var result = FileService._formatDatePrefix(d);
    assertEqual(result, '20260323');
  });
});

describe('FileService._sanitizeVendorName', function () {

  test('ファイル名に使えない文字を _ に置換する', function () {
    assertEqual(FileService._sanitizeVendorName('テスト/店舗:名', 20), 'テスト_店舗_名');
  });

  test('最大長を超えたら切り詰める', function () {
    var long = 'あ'.repeat(25);
    var result = FileService._sanitizeVendorName(long, 20);
    // 文字数で切り詰め（UTF-16 単位）
    assertEqual(result.length, 20);
  });

  test('最大長以下はそのまま返す', function () {
    assertEqual(FileService._sanitizeVendorName('テスト店', 20), 'テスト店');
  });
});

describe('FileService.buildFileName — 処理済', function () {

  var data = {
    usage_date:  '2026-03-18',
    vendor_name: 'テストストア 渋谷店',
    total_amount: 1980
  };

  test('正常データで正しいファイル名を生成する', function () {
    var result = FileService.buildFileName('処理済', FIXED_DATE, data, 'receipt.jpg');
    assertEqual(result, '20260323-処理済-2026-03-18_テストストア 渋谷店_1980円.jpg');
  });

  test('拡張子を小文字に変換する', function () {
    var result = FileService.buildFileName('処理済', FIXED_DATE, data, 'RECEIPT.JPG');
    assertTrue(result.endsWith('.jpg'));
  });
});

describe('FileService.buildFileName — 要確認（一部フィールド欠損）', function () {

  test('usage_date が null の場合「日付不明」を使用する', function () {
    var data = { usage_date: null, vendor_name: 'テスト店', total_amount: 500 };
    var result = FileService.buildFileName('要確認', FIXED_DATE, data, 'scan.png');
    assertTrue(result.indexOf('日付不明') !== -1);
  });

  test('vendor_name が null の場合「支払先不明」を使用する', function () {
    var data = { usage_date: '2026-03-01', vendor_name: null, total_amount: 500 };
    var result = FileService.buildFileName('要確認', FIXED_DATE, data, 'scan.png');
    assertTrue(result.indexOf('支払先不明') !== -1);
  });

  test('total_amount が null の場合「金額不明円」を使用する', function () {
    var data = { usage_date: '2026-03-01', vendor_name: 'テスト店', total_amount: null };
    var result = FileService.buildFileName('要確認', FIXED_DATE, data, 'scan.png');
    assertTrue(result.indexOf('金額不明円') !== -1);
  });

  test('全フィールド欠損でデフォルト値を使用する', function () {
    var data = { usage_date: null, vendor_name: null, total_amount: null };
    var result = FileService.buildFileName('要確認', FIXED_DATE, data, 'scan.heic');
    assertEqual(result, '20260323-要確認-日付不明_支払先不明_金額不明円.heic');
  });
});

describe('FileService.buildFileName — エラー', function () {

  test('エラー時は元のファイル名をそのまま使用する', function () {
    var result = FileService.buildFileName('エラー', FIXED_DATE, null, 'scan_003.png');
    assertEqual(result, '20260323-エラー-scan_003.png');
  });

  test('エラー時は data が null でも問題なく動作する', function () {
    var result = FileService.buildFileName('エラー', FIXED_DATE, null, 'receipt.jpg');
    assertTrue(result.startsWith('20260323-エラー-'));
  });
});

describe('FileService.buildFileName — 支払先名のサニタイズ', function () {

  test('スラッシュを含む支払先名を _ に置換する', function () {
    var data = { usage_date: '2026-03-01', vendor_name: 'テスト/商店', total_amount: 1000 };
    var result = FileService.buildFileName('処理済', FIXED_DATE, data, 'r.jpg');
    assertTrue(result.indexOf('/') === -1);
  });
});
