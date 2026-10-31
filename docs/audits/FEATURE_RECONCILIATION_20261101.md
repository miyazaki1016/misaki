# 機能単位の追加照合（2026-11-01）

## 外部AIレビューPreview
- `preview/external-ai-review-20261028:public/lab/external-ai-review/index.html` はGitHub上に存在（blob `de261a2fed34c15b2eba399e98938e8ecd1bda25`、5439文字）。
- mainの**同一パスは存在しない**。HTMLには外部レビュー用の説明、未公開企画の記載、`noindex,nofollow,noarchive`、共有先限定の注意がある。
- **結論：保全・非公開継続**。mainの公開 `public/` 配下へ無審査でコピーしない。noindexはアクセス制御ではない。共有範囲・公開可否・情報更新を確認する。

## ラウンジPreview
- `experiment/transparent-lounge-20261027:public/lab/transparent-lounge/index.html` とmainの同一パスは両方存在し、blobは異なる（branch `e45c13c44e85cf31d636746d66ec9c8f3ad4aa30` / main `1bb9e45aea4a1692e235c7fcbc48b5b5022c7e57`）。
- **結論：差分あり・採用未判断**。別チャットで進行中の独立HTTPS静的UI実機検証と競合するため、旧HTMLをmainへ上書きしない。動作・素材同一性の比較は未実施。

## 次工程
- 外部レビュー資料の機密性・共有先・現行内容との一致を確認。
- ラウンジは静的UI検証結果が揃ってから遷移・動画・資産を機能単位で照合。
- 本記録はGitHubファイル存在とblob比較のみ。実機テスト・デプロイ・公開変更なし。
