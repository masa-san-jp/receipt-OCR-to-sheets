/**
 * runAll.js — 全ユニットテストを実行します
 * 使用方法: node tests/runAll.js
 */
'use strict';

console.log('経費証憑 OCR ツール — ユニットテスト');
console.log('実行日時: ' + new Date().toISOString());

require('./ParseService.test.js');
require('./ValidationService.test.js');
require('./FileService.test.js');

var { summary } = require('./testRunner.js');
var result = summary();
process.exit(result.failed > 0 ? 1 : 0);
