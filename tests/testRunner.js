/**
 * testRunner.js — シンプルなテストフレームワーク（Node.js 用）
 */
'use strict';

var passed = 0;
var failed = 0;
var errors = [];

function test(name, fn) {
  try {
    fn();
    console.log('  ✓ ' + name);
    passed++;
  } catch (e) {
    console.error('  ✗ ' + name);
    console.error('    ' + e.message);
    errors.push({ name: name, message: e.message });
    failed++;
  }
}

function describe(suiteName, fn) {
  console.log('\n[' + suiteName + ']');
  fn();
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'assertion failed');
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(
      (label ? label + ': ' : '') +
      'expected ' + JSON.stringify(expected) +
      ' but got ' + JSON.stringify(actual)
    );
  }
}

function assertNull(actual, label) {
  if (actual !== null) {
    throw new Error(
      (label ? label + ': ' : '') +
      'expected null but got ' + JSON.stringify(actual)
    );
  }
}

function assertNotNull(actual, label) {
  if (actual === null || actual === undefined) {
    throw new Error((label ? label + ': ' : '') + 'expected non-null value');
  }
}

function assertTrue(actual, label) {
  if (actual !== true) {
    throw new Error((label ? label + ': ' : '') + 'expected true but got ' + JSON.stringify(actual));
  }
}

function assertFalse(actual, label) {
  if (actual !== false) {
    throw new Error((label ? label + ': ' : '') + 'expected false but got ' + JSON.stringify(actual));
  }
}

function summary() {
  console.log('\n' + '='.repeat(50));
  console.log('結果: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    console.log('\n失敗したテスト:');
    errors.forEach(function (e) {
      console.log('  - ' + e.name + ': ' + e.message);
    });
  }
  console.log('='.repeat(50));
  return { passed: passed, failed: failed };
}

module.exports = {
  test:        test,
  describe:    describe,
  assert:      assert,
  assertEqual: assertEqual,
  assertNull:  assertNull,
  assertNotNull: assertNotNull,
  assertTrue:  assertTrue,
  assertFalse: assertFalse,
  summary:     summary
};
