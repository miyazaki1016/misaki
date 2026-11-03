# 開発承認ボード（美咲 × アメふる）

## 目的
Vercelの追加プロジェクトを使わず、GitHub Pages上で2つのリポジトリの**open PR**をiPhoneからまとめて確認する。既存の開発台帳や棚卸しを置き換えない。

## 表示と操作
- GitHub公開APIから `miyazaki1016/misaki` と `miyazaki1016/emergencyalert` のopen PRを読み取り専用で取得。
- Draft以外を「承認候補」、Draftを「準備中」と表示。**承認候補＝マージ安全の判定ではない。** 台帳更新PRも、別途自動マージの安全ゲートが整うまでは表示する。
- 「GitHubで確認・マージ」からGitHubのPR画面へ移動し、ログイン済みのユーザーが差分・CI・承認条件を確認してマージする。**このダッシュボード内からの直接マージは未実装。**
- CIチェックはカードを展開した時だけ取得。GitHub APIの制限に達した場合はエラーを表示する。
- 個人アクセストークンは保存・要求しない。GitHub Pagesは公開サイトとなるので秘密情報は載せない。

## GitHub Pages公開
`.github/workflows/approval-dashboard-pages.yml` をmainへ統合後、GitHubリポジトリの **Settings → Pages → Build and deployment → Source: GitHub Actions** を設定する。以降、ダッシュボードを変更した時またはActionsの手動実行で公開できる。

想定URL（GitHub Pages有効化後。**現時点で公開確認したURLではない**）:
`https://miyazaki1016.github.io/misaki/`

## 実際にページ上で直接マージする将来拡張
GitHub Pagesは静的配信でサーバー側の機密資格情報を安全に保管できない。直接マージには認証済みのバックエンド／GitHub App・最小権限・実行前のCI/branch保護再検証・監査ログが必要。これらなしにトークンをブラウザーへ埋め込まない。
