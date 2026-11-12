# オーナー承認マージAPI：安全設計と準備状況

**状態: 候補実装。未デプロイ・無効が既定値。承認ボードからの直接マージはまだ利用できない。**

GitHub Pages は静的サイトであり、秘密の GitHub 書込資格情報を安全に保管できない。このため、既存の Supabase 環境に隔離された Edge Function `approval-merge` を置き、**GitHub OAuth で認証したオーナー本人の指示のみ**、サーバー内で GitHub API のマージを行う設計。新しい Vercel プロジェクトは不要。現在の美咲・アメふる本体の認証やアプリDBを変更していない。

## 必須の事前設定（まだ行っていない）

1. ダッシュボード用のGitHub OAuthログインを設計・設定する。**既存のアプリ利用者ログインと混同しない**こと。Supabase JWTを `auth.getUser` で検証し、`identities` にある GitHub プロバイダの**確認済みprovider id**が管理者のIDと一致する場合だけ許可する。メールアドレス・表示名・書き換え可能なuser_metadataだけでは許可しない。
2. GitHub **fine-grained PAT**（または将来のGitHub App token）を作成する場合は、二つの対象リポジトリだけに絞り、最低限の書込権限を付与し、既存Supabaseプロジェクトの**Edge Function Secrets**へ `APPROVAL_GITHUB_TOKEN` として保存する。**GitHub Pages、ブラウザー、Gitリポジトリ、ログには保存禁止。** 可能であれば定期ローテーションする。
3. 同じく `APPROVAL_OWNER_GITHUB_ID`（数字のGitHub user ID）と `APPROVAL_MERGE_ENABLED` を設定する。テスト期間中は `false` に保ち、owner認証・CI/規約確認・実機フローが揃ってから有効化を判断する。
4. `services/approval-merge-edge/index.ts` と `policy.mjs` を新規Edge Function `approval-merge` として既存Supabase環境へデプロイする。その際 `verify_jwt: true` にしてJWTを要求し、さらにコード内で `getUser` とGitHub IDを検証する。既存の他Edge Functionを置換しない。
5. GitHub Pages側には**公開してよいSupabase URL・publishable key**だけを設定して認証UIを追加する。書込PATは絶対に渡さない。セッション保持・CSP・Origin・CSRFのレビュー後、まず `dryRun: true` でチェックだけを実行する。
6. プレビュー環境と本番環境で「誤ったGithub ID」「匿名ユーザー」「古いSHA」「CI失敗」「Draft」「非markdown変更」「owner-decisionラベルなし」「古いDB/通知PR」の拒否を確認した後にのみ実マージを有効化する。

## API契約（開発途中）

`POST /functions/v1/approval-merge`、`Authorization: Bearer <Supabase user JWT>`（GitHub本人認証に紐づくもの）。

```json
{
  "repo": "misaki",
  "number": 146,
  "expectedHead": "40文字のPR最新SHA",
  "confirm": "承認してマージ",
  "dryRun": true
}
```

`dryRun: true` は状態照合のみ。 `false` であっても、**API側の ENABLE がtrue** かつ本人認証・PRラベル・非Draft・main向け・同一レポ・完全CI成功・マージ競合なし・**docs配下のMarkdownファイルのみ**・SHA不変を満たすまで拒否する。

このAPIはアプリコード、DB、CI設定、HTML/JavaScript、通知ロジック、マイグレーション、削除・改名ファイルのマージを一切扱わない。重要変更は従来どおりGitHubのレビューを通す。

GitHubのブランチ保護・ルールセットを別途有効化し、バックエンド側の検証だけに依存しないこと。GitHubの成功したmergeはPR履歴に残るが、承認要求の本人・時刻・照合SHAを追加監査する仕組みも本番運用前に確認する。

## 本件で変更しないもの

既存美咲チャット、アメふる通知、既存Supabase Auth/DB、既存Edge Function、Vercel、他PRは変更しない。**未設定のままでも現在の承認ボードは通常通り閲覧とGitHubへのリンクが利用できる。**

## 検証

`node --test services/approval-merge-edge/policy.test.mjs` で純粋な拒否条件を検証。設定値の漏洩、OAuthフロー、実マージのE2Eは別途検証が必要。**マージ機能を本番実行できたとは主張しない。**
