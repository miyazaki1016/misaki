# Muse v3 約14秒ループ差し替え比較（2026-10-30）

- 現行の約9秒・24fps透過WebPは変更しない。ラウンジ、縦型ラウンジ、ショートカット比較版も変更なし。
- Museからユーザーが提供した `idle-lounge-person-transparent-loopfix-v3.zip` 内の WebM を確認。1248×704、VP9透過、24fps、約13.917秒。
- 透過を維持しつつ624×352に縮小し、24fps無限ループWebPに変換。
- 変換ファイル: `misaki-lounge-muse-v3-14s-24fps.webp`、334フレーム、RIFF WebP ANMFのフレーム時間合計13,916ms、アルファチャンネル0〜255、約6.9 MB。
- 新設比較ページ: `/lab/transparent-lounge-muse-v3/`。既存の `/lab/transparent-lounge-shortcuts/` のコードを複製し、**WebP参照だけ変更**。オープニング21秒MP4、左右スワイプ、ショートカット、矢印は従来どおり。
- **素材バイナリはGitHubに未アップロード**。素材を同じブランチの `public/lab/transparent-lounge/misaki-lounge-muse-v3-14s-24fps.webp` に配置するまでプレビューは404。PRはドラフトにして本番反映しない。
- 実機テスト: iPhoneで透過、速度、表情変化、つなぎ目、通信時間、既存9秒版との比較。採用判断後に本番の参照先を変更する。

## 2026-10-30 素材アップロード確認
- GitHubブランチに `public/lab/transparent-lounge/misaki-lounge-muse-v3-14s-24fps.webp`（6,886,060 bytes）配置済みを確認。
- 上記『未アップロード』は作業開始時点の記録。現在はアップロード完了。
- GitHub Actions の test と Vercel Preview Comments ともに成功を確認。
- 次の工程は比較版のみマージしてVercelの本番配信を確認。その後iPhone実機で長尺アニメの透明度とループを確認する。現行9秒版の参照は変更しない。
