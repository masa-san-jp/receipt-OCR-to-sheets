# receipt-OCR-to-sheets

レシートを OCR して Google Sheets に整理するツールです。  
A tool for extracting receipt data with OCR and organizing it in Google Sheets.

## 概要

この README は、このリポジトリの役割を示すための最小 README です。
詳細な使い方、設計、運用ルールが必要な場合は今後追加します。

## 用語としての用例

「receipt-OCR-to-sheets で、Drive に取り込んだ領収書から経費申請の下書きを作る」という使い方を想定します。ここで OCR は証憑画像からの文字・項目抽出、Sheets は抽出結果と確認状態を蓄積する台帳です。経費精算の承認・勘定科目の確定は対象外です。

## 思想的背景

[要件定義書](docs/requirement.md) は、手入力を減らしながら人による確認・修正を残す「申請下書きの自動化」を目的としています。OCR の誤読や欠落を前提に、要確認理由・原本へのリンク・処理ログから確認できる設計です。自動抽出の結果をそのまま確定申請として扱いません。

## 技術的背景

[src/main.js](src/main.js) を入口とする Google Apps Script のバッチです。Drive の未処理ファイルを読み、Gemini API に画像を送り、JSON の解析・検証後に Sheets へ登録し、状態に応じてファイルを移動します。ファイル ID による重複チェックと、1件の失敗で全件を停止しない処理が実装されています。

設定は [src/Config.js](src/Config.js) に集約し、GEMINI_API_KEY はスクリプトプロパティから読み込みます。実際のキー・個人情報をコミットしないでください。導入前に、証憑画像を Gemini API へ送信することが所属組織のデータ取扱方針に適合するか確認してください。

## 歴史的背景

[2026年3月21日付の要件定義](docs/requirement.md) を起点に、開発タスクとエラー処理を整理しています。2026年4月22日の [Phase 1 実装](https://github.com/masa-san-jp/receipt-OCR-to-sheets/commit/eab292824a9e17b668eabdd7cfe6659932317ce9) では GAS ソースと単体テストが追加されました。この開発履歴は、利用者環境での設定・本番稼働を確認した記録ではありません。

## 展開・導入時の確認

- 導入設計は [設計仕様](docs/design-speculation.md)、障害時の判断は [エラー処理](docs/error-handling.md) を参照してください。
- GAS 環境でフォルダ・シート・スクリプトプロパティを設定し、権限と main の実行トリガーを確認してから試験運用します。リポジトリの設定はプレースホルダーです。
- ローカル単体テストの入口は node tests/runAll.js です。Drive / Sheets / Gemini を含む接続試験や本番運用とは別に確認してください。
- 運用手順、再試行、通知連携などの計画は [開発タスクリスト](docs/development-tasks.md) にあります。計画項目を一律に実装済みとは扱わず、対応するコード・試験結果と照合してください。
