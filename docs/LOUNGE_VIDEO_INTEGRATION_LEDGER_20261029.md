# 美咲ラウンジ動画自動表示・開発台帳（2026-10-29）

## 確認済み基準
- main: `0b5ab6758861e2a4916b6b82ec196ed579559d0a`（作業開始時点）
- 対象: `public/lab/transparent-lounge/index.html`、本番確認ページ `/lab/transparent-lounge/`
- 既存ラウンジのソファ位置・拡大率・左右仮カード・スワイプ・動画終了/スキップ動作を維持する。
- 既存チャット、DB、RPC、Relationship Engineは変更しない。
- 元実験ブランチ `experiment/transparent-lounge-20261027` は main と分岐（ahead 26/behind 4）。そのまま main にマージしない。

## 今回実装したHTML変更（未公開）
- 手動 WebP 選択UI/JSを削除し、`/lab/transparent-lounge/misaki-lounge-24fps.webp` を自動表示する参照に変更。
- 古い横型プレビューMP4参照を廃止し、`/lab/transparent-lounge/misaki-opening-vertical-21s.mp4` を参照。
- 縦型video要素を `aspect-ratio:9/16`、モバイル画面高上限で表示。
- ソファ背景は既存実験ブランチの素材URLを維持（新ブランチ main には背景画像がないため）。
- HTMLのみ変更。**動画ファイル2本はまだGitHubの公開フォルダに存在しない。**

## 素材／検証
- ラウンジ: `misaki-lounge-24fps.webp`（元: `misaki_lounge_24fps(1).webp`）、約4.40MB、624×352、24fps/約9秒、ユーザーiPhoneでループと透過確認済み。
- オープニング: `misaki-opening-vertical-21s.mp4`（元: `misaki-opening-vertical-21s-iphone(1).mp4`）、2,936,765 bytes、512×910、21.000秒、30fps、H.264/AAC。
- 配置場所（GitHub）: `public/lab/transparent-lounge/`
- ユーザーへ提供したZIP: `misaki-lounge-deploy-assets.zip`（上記2ファイルを所定の相対パスで収録）。
- ブラウザ配信後、WebP 200 + image/webp、MP4 200 + video/mp4、再生・スキップ・終了・画面遷移をiPhone実機で確認する。

## 残作業／リリース判定
1. ZIP内のバイナリ2本をGitHubの本ブランチへコミットする（GitHubテキストAPIではこの環境からバイナリを直接転送できず、未実施）。
2. PRの変更ファイルがHTML + 2アセット + 文書だけであることを確認し、マージ後にVercel本番配信を検証。
3. iPhone実機で、9秒アニメーションループ、縦21秒再生、スキップ、動画終了→既存確認画面を確認。
4. 次の工程で既存チャット入口を調査・接続する。チャットの複製実装は禁止。

**現時点では本番公開・実機検証未完了。動画ファイル未配置のままPRをマージしない。**

## 2026-10-29 追記：素材アップロードの現物確認
- 作業ブランチに `public/lab/transparent-lounge/misaki_lounge_24fps.webp`（4,402,574 bytes）および `misaki_lounge_12fps.webp`（2,375,926 bytes）を確認。
- HTMLのWebP参照を実在する `misaki_lounge_24fps.webp` に修正済み。旧手動選択は不要。
- `misaki-opening-vertical-21s.mp4` は**依然として未配置**（リポジトリツリー確認）。縦21秒オープニング再生はまだ検証不可。
- 21秒MP4が同一フォルダにアップロードされるまでマージ・本番公開しない。

## 2026-10-29 追記：21秒MP4到着・HTML参照修正
- GitHubの同フォルダに `misaki-opening-vertical-21s-iphone.mp4`（2,936,765 bytes）を確認。以前アップロード済みのユーザー素材とファイルサイズが一致する。
- HTMLのMP4参照を実際のアップロード名 `misaki-opening-vertical-21s-iphone.mp4` に修正。WebP参照も実在する `misaki_lounge_24fps.webp`。
- 以前の文書内の「動画2本未配置」「MP4未配置」は当時の記録。現時点では2本とも配置済み。
- 次のゲート: GitHub CI成功、PR取り込み、本番HTTP/再生/iPhone実機確認。
