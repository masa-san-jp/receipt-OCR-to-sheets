'use strict';

var RetryService = require('../src/RetryService.js');
var { test, describe, assertTrue, assertFalse, assertEqual } = require('./testRunner.js');

describe('RetryService.isRetryable', function () {

  test('429 は再試行対象', function () {
    assertTrue(RetryService.isRetryable(429));
  });

  test('500 は再試行対象', function () {
    assertTrue(RetryService.isRetryable(500));
  });

  test('503 は再試行対象', function () {
    assertTrue(RetryService.isRetryable(503));
  });

  test('200 は再試行対象外', function () {
    assertFalse(RetryService.isRetryable(200));
  });

  test('400 は再試行対象外', function () {
    assertFalse(RetryService.isRetryable(400));
  });

  test('403 は再試行対象外', function () {
    assertFalse(RetryService.isRetryable(403));
  });
});

describe('RetryService.withRetry — 成功ケース', function () {

  // Node.js テスト時は LogService が存在しないためスタブを用意
  var origLog = global.LogService;
  global.LogService = { logInfo: function () {}, logError: function () {} };

  test('初回成功時はそのまま戻り値を返す', function () {
    var result = RetryService.withRetry(function () { return 'ok'; });
    assertEqual(result, 'ok');
  });

  test('1 回失敗後に成功すれば戻り値を返す', function () {
    var attempts = 0;
    var result = RetryService.withRetry(function () {
      attempts++;
      if (attempts < 2) {
        var e = new Error('一時エラー');
        e._retryable = true;
        throw e;
      }
      return 'recovered';
    });
    assertEqual(result, 'recovered');
    assertEqual(attempts, 2);
  });

  global.LogService = origLog;
});

describe('RetryService.withRetry — 失敗ケース', function () {

  global.LogService = { logInfo: function () {}, logError: function () {} };

  test('_retryable でないエラーは即座にスロー', function () {
    var attempts = 0;
    var threw = false;
    try {
      RetryService.withRetry(function () {
        attempts++;
        throw new Error('恒久エラー'); // _retryable なし
      });
    } catch (e) {
      threw = true;
    }
    assertTrue(threw);
    assertEqual(attempts, 1); // リトライなし
  });

  test('_retryable エラーが続くと最大試行回数後にスロー', function () {
    var attempts = 0;
    var threw = false;
    try {
      RetryService.withRetry(function () {
        attempts++;
        var e = new Error('一時エラー');
        e._retryable = true;
        throw e;
      });
    } catch (e) {
      threw = true;
    }
    assertTrue(threw);
    assertEqual(attempts, RetryService.MAX_RETRIES + 1); // 4 回試行
  });
});
