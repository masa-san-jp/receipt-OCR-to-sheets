/**
 * 経費証憑 OCR ツール — 設定
 *
 * 実際の ID・キー・名前はユーザーがここに設定してください。
 * 実値をコミットしないでください（CLAUDE.md 参照）。
 * GEMINI_API_KEY はスクリプトプロパティで管理し、ここには含めません。
 */
const CONFIG = {
  // Google Drive フォルダ ID
  INTAKE_FOLDER_ID:       'ここに取込フォルダIDを貼り付け',
  PROCESSED_FOLDER_ID:    'ここに処理済みフォルダIDを貼り付け',
  NEEDS_REVIEW_FOLDER_ID: 'ここに要確認フォルダIDを貼り付け',
  ERROR_FOLDER_ID:        'ここにエラーフォルダIDを貼り付け',

  // Google Sheets
  SPREADSHEET_ID: 'ここにスプレッドシートIDを貼り付け',
  SHEET_NAME:     '経費証憑台帳',
  LOG_SHEET_NAME: '処理ログ',

  // 精算対象月の決定方式
  // 'fixed'  : EXPENSE_MONTH_FIXED の値を使用
  // 'folder' : 取込フォルダ名（YYYY-MM 形式）から自動取得
  EXPENSE_MONTH_MODE:  'fixed',
  EXPENSE_MONTH_FIXED: '2026-03',

  // 申請者情報
  APPLICANT_NAME: 'ここに申請者名またはメールアドレスを設定',

  // 処理制御（GAS 実行時間制限対応）
  MAX_FILES_PER_RUN: 10,

  // Gemini API モデル名
  GEMINI_MODEL: 'gemini-2.5-flash-lite'
};
