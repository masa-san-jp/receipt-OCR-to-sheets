# テスト結果レポート — 2026-04-22

## 概要

| 項目 | 結果 |
|------|------|
| 実行日時 | 2026-04-22 |
| 実行コマンド | `node tests/runAll.js` |
| 合計テスト数 | 62 |
| 成功 | 62 |
| 失敗 | 0 |
| 対象フェーズ | Phase 1（P1-01 ユニットテスト整備） |

## テスト対象モジュール

| モジュール | テストスクリプト | テスト数 |
|-----------|----------------|---------|
| `src/ParseService.js` | `tests/ParseService.test.js` | 31 |
| `src/ValidationService.js` | `tests/ValidationService.test.js` | 19 |
| `src/FileService.js` | `tests/FileService.test.js` | 12 |

## テストスイート別結果

### ParseService.normalizeDate（11 件）

| # | テスト名 | 結果 |
|---|---------|------|
| 1 | YYYY-MM-DD をそのまま返す | ✓ |
| 2 | YYYY/MM/DD を変換する | ✓ |
| 3 | YYYY/M/D（ゼロ埋めなし）を変換する | ✓ |
| 4 | YYYY年MM月DD日 を変換する | ✓ |
| 5 | 令和8年3月18日 を変換する | ✓ |
| 6 | 令和1年1月1日 を変換する | ✓ |
| 7 | R8.3.18（和暦略記・ドット区切り）を変換する | ✓ |
| 8 | R8/3/18（和暦略記・スラッシュ区切り）を変換する | ✓ |
| 9 | null を返す（null 入力） | ✓ |
| 10 | null を返す（空文字入力） | ✓ |
| 11 | null を返す（認識不能な文字列） | ✓ |

### ParseService.normalizeAmount（12 件）

| # | テスト名 | 結果 |
|---|---------|------|
| 1 | 整数をそのまま返す | ✓ |
| 2 | 小数を丸める | ✓ |
| 3 | カンマ区切り文字列を変換する | ✓ |
| 4 | ¥ 記号付き文字列を変換する | ✓ |
| 5 | ￥ 記号付き文字列を変換する | ✓ |
| 6 | 「円」付き文字列を変換する | ✓ |
| 7 | 全角数字を変換する | ✓ |
| 8 | null を返す（null 入力） | ✓ |
| 9 | null を返す（空文字入力） | ✓ |
| 10 | null を返す（数字以外の文字列） | ✓ |
| 11 | null を返す（NaN） | ✓ |
| 12 | 0 を変換する | ✓ |

### ParseService.parseGeminiResponse（8 件）

| # | テスト名 | 結果 |
|---|---------|------|
| 1 | 正常な JSON をパースし内部データ構造を返す | ✓ |
| 2 | Markdown コードブロック付き JSON をパースする | ✓ |
| 3 | 不正な JSON に対して _parseError: true を返す | ✓ |
| 4 | 空文字に対して _parseError: true を返す | ✓ |
| 5 | null の項目を null として返す | ✓ |
| 6 | usage_date を YYYY-MM-DD に正規化する | ✓ |
| 7 | total_amount を整数に正規化する | ✓ |
| 8 | needs_review が true の場合 true を返す | ✓ |

### ValidationService._sumBreakdown（4 件）

| # | テスト名 | 結果 |
|---|---------|------|
| 1 | 全フィールドが null の場合 null を返す | ✓ |
| 2 | 10%内訳のみある場合の合計を返す | ✓ |
| 3 | 混在税率の合計を返す | ✓ |
| 4 | 非課税額を含む合計を返す | ✓ |

### ValidationService.validate — 正常系（2 件）

| # | テスト名 | 結果 |
|---|---------|------|
| 1 | 正常データは SUCCESS を返す | ✓ |
| 2 | 混在税率で内訳が一致する場合は SUCCESS を返す | ✓ |

### ValidationService.validate — 要確認 ルール別（7 件）

| # | テスト名 | 対応ルール | 結果 |
|---|---------|-----------|------|
| 1 | 合計金額が null → NEEDS_REVIEW | ルール 1 | ✓ |
| 2 | 利用日・発行日が両方 null → NEEDS_REVIEW | ルール 2 | ✓ |
| 3 | 支払先名が null → NEEDS_REVIEW | ルール 3 | ✓ |
| 4 | 主税率区分が「不明」→ NEEDS_REVIEW | ルール 4 | ✓ |
| 5 | 合計と内訳が不一致（差 100 円）→ NEEDS_REVIEW | ルール 5 | ✓ |
| 6 | 書類種別が「不明」→ NEEDS_REVIEW | ルール 6 | ✓ |
| 7 | Gemini needs_review: true → NEEDS_REVIEW | ルール 7 | ✓ |

### ValidationService.validate — エラー系・その他（4 件）

| # | テスト名 | 結果 |
|---|---------|------|
| 1 | _parseError データは ERROR を返す | ✓ |
| 2 | null データは ERROR を返す | ✓ |
| 3 | 複数条件で review_reason が改行区切りで結合される | ✓ |
| 4 | 差額 1 円は許容範囲内（SUCCESS） | ✓ |
| 5 | 差額 2 円は要確認（NEEDS_REVIEW） | ✓ |

### FileService（12 件）

| # | テスト名 | 結果 |
|---|---------|------|
| 1 | Date オブジェクトを yyyymmdd 形式に変換する | ✓ |
| 2 | ファイル名に使えない文字を _ に置換する | ✓ |
| 3 | 最大長を超えたら切り詰める | ✓ |
| 4 | 最大長以下はそのまま返す | ✓ |
| 5 | 正常データで正しいファイル名を生成する（処理済） | ✓ |
| 6 | 拡張子を小文字に変換する | ✓ |
| 7 | usage_date が null の場合「日付不明」を使用する | ✓ |
| 8 | vendor_name が null の場合「支払先不明」を使用する | ✓ |
| 9 | total_amount が null の場合「金額不明円」を使用する | ✓ |
| 10 | 全フィールド欠損でデフォルト値を使用する | ✓ |
| 11 | エラー時は元のファイル名をそのまま使用する | ✓ |
| 12 | スラッシュを含む支払先名を _ に置換する | ✓ |

## テストデータについて

- `tests/testData.js` に格納したダミー OCR 結果を使用
- 実名・実メールアドレス・実電話番号を含まない
- 店舗名・住所はすべて架空（「テストストア」「サンプルスーパー」等）

## 備考

- GAS 依存モジュール（DriveService, GeminiService, SheetsService, LogService）は Node.js では実行不可のためユニットテスト対象外
- これらのモジュールは GAS 環境での結合テストで確認する
