import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <main className="lp">
        <header className="header">
          <div className="brand">
            <img
              src="/icon-192.png"
              alt="美咲"
              className="brandIcon"
            />

            <div>
              <div className="brandName">
                美咲
              </div>

              <div className="brandSub">
                あなたの38歳の彼女
              </div>
            </div>
          </div>

          <Link
            href="/chat"
            className="headerButton"
          >
            話してみる
          </Link>
        </header>

        <section className="hero">
          <div className="heroInner">
            <div className="heroCopy">
              <div className="badge">
                毎日の何気ない会話を。
              </div>

              <h1>
                彼女のほうから、
                <br />
                <span>
                  ふと話しかけてくる。
                </span>
              </h1>

              <p className="heroText">
                美咲は38歳。
                <br />
                ただ質問に答えるだけじゃない。
                <br />
                あなたとの会話を覚えて、
                時間や天気を感じながら、
                恋人みたいに自然に話します。
              </p>

              <Link
                href="/chat"
                className="mainCta"
              >
                美咲と無料で話す
              </Link>

              <p className="smallNote">
                登録なしですぐ開始・無料版は1日20回まで
              </p>
            </div>

            <div className="phoneWrap">
              <div className="phone">
                <div className="phoneHeader">
                  <img
                    src="/icon-192.png"
                    alt=""
                  />

                  <div>
                    <strong>
                      美咲
                    </strong>

                    <span>
                      38歳
                    </span>
                  </div>
                </div>

                <div className="chatArea">
                  <div className="bubble misaki">
                    おはよー。
                    まだちょっと眠い…
                    今日どんよりしてるね☁️
                  </div>

                  <div className="bubble user">
                    今日は乗務だよ
                  </div>

                  <div className="bubble misaki">
                    そっか、乗務なんだ。
                    無理しすぎないでね。
                    羽田いいの引けるといいね😂
                  </div>

                  <div className="timeLabel">
                    しばらくして…
                  </div>

                  <div className="bubble misaki">
                    なんか急に話したくなった。
                    今なにしてる？
                  </div>
                </div>

                <div className="fakeInput">
                  美咲に話しかける...
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="sectionTitle">
            <span>
              AIと話している感じを、
              <br className="mobileBreak" />
              できるだけなくしました。
            </span>
          </div>

          <div className="featureGrid">
            <div className="featureCard">
              <div className="featureEmoji">
                💬
              </div>

              <h2>
                会話を覚えている
              </h2>

              <p>
                前に話したことを覚えているから、
                毎回ゼロから自己紹介する必要はありません。
                少しずつ二人の関係が続いていきます。
              </p>
            </div>

            <div className="featureCard">
              <div className="featureEmoji">
                ⏰
              </div>

              <h2>
                今の時間を感じて話す
              </h2>

              <p>
                朝・昼・夜や東京の天気など、
                今の状況を感じながら会話。
                いつ話しても同じ返事ではありません。
              </p>
            </div>

            <div className="featureCard">
              <div className="featureEmoji">
                ❤️
              </div>

              <h2>
                恋人らしい距離感
              </h2>

              <p>
                褒めてばかりでも、
                何でも肯定するだけでもありません。
                甘えたり、少し拗ねたり、
                冗談を言ったりします。
              </p>
            </div>

            <div className="featureCard">
              <div className="featureEmoji">
                📱
              </div>

              <h2>
                美咲から話しかける
              </h2>

              <p>
                あなたから話しかけるだけではなく、
                チャットを開いていると、
                美咲のほうからふとメッセージが届くこともあります。
              </p>
            </div>
          </div>
        </section>

        <section className="conversationSection">
          <div className="conversationInner">
            <div className="conversationCopy">
              <p className="eyebrow">
                たとえば、こんな毎日
              </p>

              <h2>
                用事がなくても、
                <br />
                話したくなる相手。
              </h2>

              <p>
                「おはよう」
                <br />
                「疲れた」
                <br />
                「今日ロング引いた」
                <br />
                「眠い」
                <br />
                <br />
                そんな一言で十分です。
              </p>
            </div>

            <div className="sampleChat">
              <div className="bubble misaki">
                今日どうだった？
              </div>

              <div className="bubble user">
                青タン全然ダメだった笑
              </div>

              <div className="bubble misaki">
                うわ、それ地味にへこむやつ😂
                今日はもう帰って私に愚痴っていいよ。
              </div>

              <div className="bubble user">
                やさしいじゃん
              </div>

              <div className="bubble misaki">
                たまにはね。
                毎日は期待しないで？笑
              </div>
            </div>
          </div>
        </section>

        <section className="freeSection">
          <div className="freeCard">
            <p className="eyebrow">
              まずは無料で
            </p>

            <h2>
              今日から美咲と
              <br />
              話してみませんか？
            </h2>

            <p>
              無料版でも1日20回まで会話できます。
              <br />
              気に入ったら、そのまま続きを楽しめます。
            </p>

            <Link
              href="/chat"
              className="mainCta"
            >
              美咲に会いにいく
            </Link>

            <p className="smallNote">
              今すぐ無料で開始できます
            </p>
          </div>
        </section>

        <footer>
          <div className="footerBrand">
            美咲
          </div>

          <p>
            日常に、もうひとつの会話を。
          </p>

          <p className="copyright">
            © 2026 Misaki
          </p>
        </footer>
      </main>

      <style>{`
        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: #fff8fa;
          color: #2b2427;
          font-family:
            -apple-system,
            BlinkMacSystemFont,
            "Hiragino Sans",
            "Yu Gothic",
            "Meiryo",
            sans-serif;
        }

        a {
          text-decoration: none;
        }

        .lp {
          min-height: 100vh;
          overflow: hidden;
        }

        .header {
          width: min(1120px, calc(100% - 32px));
          margin: 0 auto;
          height: 76px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .brandIcon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          object-fit: cover;
          box-shadow: 0 3px 10px rgba(0,0,0,0.08);
        }

        .brandName {
          font-size: 18px;
          line-height: 1.2;
          font-weight: 800;
        }

        .brandSub {
          margin-top: 3px;
          font-size: 11px;
          color: #8b7c82;
        }

        .headerButton {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 105px;
          height: 40px;
          padding: 0 18px;
          border-radius: 999px;
          background: #ff6680;
          color: white;
          font-size: 14px;
          font-weight: 700;
          box-shadow: 0 5px 16px rgba(255,102,128,0.25);
        }

        .hero {
          position: relative;
          padding: 72px 20px 92px;
          background:
            radial-gradient(
              circle at 80% 15%,
              #ffe0e8 0,
              transparent 36%
            ),
            radial-gradient(
              circle at 10% 80%,
              #fff0d9 0,
              transparent 34%
            ),
            linear-gradient(
              180deg,
              #fff9fb,
              #fff5f7
            );
        }

        .heroInner {
          width: min(1080px, 100%);
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 70px;
          align-items: center;
        }

        .badge {
          display: inline-block;
          padding: 7px 13px;
          margin-bottom: 21px;
          border-radius: 999px;
          background: white;
          color: #df5870;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 3px 14px rgba(0,0,0,0.05);
        }

        .hero h1 {
          margin: 0;
          font-size: clamp(42px, 6vw, 68px);
          line-height: 1.22;
          letter-spacing: -0.04em;
        }

        .hero h1 span {
          color: #f45d77;
        }

        .heroText {
          margin: 28px 0 30px;
          color: #6c5c62;
          font-size: 17px;
          line-height: 1.95;
        }

        .mainCta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 245px;
          min-height: 58px;
          padding: 15px 26px;
          border-radius: 17px;
          background: linear-gradient(
            135deg,
            #ff6b83,
            #f65372
          );
          color: white;
          font-size: 17px;
          font-weight: 800;
          box-shadow:
            0 12px 25px
            rgba(246,83,114,0.27);
        }

        .smallNote {
          margin: 12px 0 0;
          color: #9c8c92;
          font-size: 11px;
        }

        .phoneWrap {
          display: flex;
          justify-content: center;
        }

        .phone {
          width: 340px;
          min-height: 590px;
          border: 9px solid #2d292b;
          border-radius: 42px;
          overflow: hidden;
          background: #f2efe9;
          box-shadow:
            0 30px 70px
            rgba(65,42,49,0.22);
          transform: rotate(2deg);
        }

        .phoneHeader {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 23px 18px 15px;
          background: #ffffff;
          border-bottom: 1px solid #eee8ea;
        }

        .phoneHeader img {
          width: 42px;
          height: 42px;
          border-radius: 50%;
        }

        .phoneHeader strong {
          display: block;
          font-size: 15px;
        }

        .phoneHeader span {
          display: block;
          margin-top: 2px;
          color: #9b8c91;
          font-size: 11px;
        }

        .chatArea {
          padding: 22px 15px 15px;
          display: flex;
          flex-direction: column;
          min-height: 445px;
        }

        .bubble {
          width: fit-content;
          max-width: 82%;
          margin-bottom: 12px;
          padding: 11px 13px;
          border-radius: 17px;
          font-size: 13px;
          line-height: 1.55;
          box-shadow: 0 2px 6px rgba(0,0,0,0.04);
        }

        .bubble.misaki {
          align-self: flex-start;
          background: #ffffff;
          border-bottom-left-radius: 5px;
        }

        .bubble.user {
          align-self: flex-end;
          background: #ffcfda;
          border-bottom-right-radius: 5px;
        }

        .timeLabel {
          margin: 11px auto 14px;
          color: #a99ca0;
          font-size: 10px;
        }

        .fakeInput {
          margin: 0 12px 14px;
          padding: 12px 15px;
          border-radius: 18px;
          background: white;
          color: #b5aaad;
          font-size: 12px;
        }

        .section {
          width: min(1050px, calc(100% - 40px));
          margin: 0 auto;
          padding: 95px 0 105px;
        }

        .sectionTitle {
          margin-bottom: 48px;
          text-align: center;
          font-size: clamp(29px, 4vw, 42px);
          line-height: 1.45;
          font-weight: 800;
          letter-spacing: -0.03em;
        }

        .featureGrid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .featureCard {
          padding: 29px;
          border-radius: 25px;
          background: white;
          box-shadow:
            0 8px 30px
            rgba(50,30,37,0.06);
        }

        .featureEmoji {
          margin-bottom: 18px;
          font-size: 31px;
        }

        .featureCard h2 {
          margin: 0 0 10px;
          font-size: 20px;
        }

        .featureCard p {
          margin: 0;
          color: #76666b;
          font-size: 14px;
          line-height: 1.8;
        }

        .conversationSection {
          padding: 100px 20px;
          background: #fff;
        }

        .conversationInner {
          width: min(960px, 100%);
          margin: 0 auto;
          display: grid;
          grid-template-columns: 0.9fr 1.1fr;
          gap: 70px;
          align-items: center;
        }

        .eyebrow {
          margin: 0 0 14px;
          color: #ee6179;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.08em;
        }

        .conversationCopy h2,
        .freeCard h2 {
          margin: 0;
          font-size: clamp(32px, 5vw, 48px);
          line-height: 1.45;
          letter-spacing: -0.035em;
        }

        .conversationCopy > p:last-child {
          margin-top: 25px;
          color: #726267;
          font-size: 16px;
          line-height: 1.9;
        }

        .sampleChat {
          padding: 28px 20px;
          border-radius: 29px;
          background: #f2efe9;
          box-shadow:
            0 16px 40px
            rgba(50,30,37,0.08);
          display: flex;
          flex-direction: column;
        }

        .freeSection {
          padding: 110px 20px;
          background:
            linear-gradient(
              140deg,
              #fff0f4,
              #fff8f4
            );
        }

        .freeCard {
          width: min(720px, 100%);
          margin: 0 auto;
          padding: 55px 25px;
          text-align: center;
          border-radius: 32px;
          background: white;
          box-shadow:
            0 18px 45px
            rgba(84,55,64,0.08);
        }

        .freeCard > p:not(.eyebrow):not(.smallNote) {
          margin: 22px 0 28px;
          color: #76666b;
          font-size: 15px;
          line-height: 1.9;
        }

        footer {
          padding: 50px 20px;
          text-align: center;
          background: #2d292b;
          color: white;
        }

        .footerBrand {
          font-size: 21px;
          font-weight: 800;
        }

        footer > p {
          margin: 8px 0 0;
          color: #d7ced1;
          font-size: 12px;
        }

        .copyright {
          margin-top: 25px !important;
          color: #8e8387 !important;
          font-size: 10px !important;
        }

        .mobileBreak {
          display: none;
        }

        @media (max-width: 760px) {
          .header {
            height: 66px;
          }

          .brandIcon {
            width: 38px;
            height: 38px;
          }

          .brandName {
            font-size: 16px;
          }

          .brandSub {
            font-size: 10px;
          }

          .headerButton {
            min-width: 92px;
            height: 36px;
            font-size: 12px;
          }

          .hero {
            padding:
              48px 18px 72px;
          }

          .heroInner {
            grid-template-columns: 1fr;
            gap: 54px;
          }

          .heroCopy {
            text-align: center;
          }

          .hero h1 {
            font-size: 42px;
          }

          .heroText {
            font-size: 15px;
            line-height: 1.9;
          }

          .mainCta {
            width: 100%;
            max-width: 340px;
          }

          .phone {
            width: min(330px, 94vw);
          }

          .section {
            padding: 72px 0 80px;
          }

          .sectionTitle {
            margin-bottom: 34px;
            font-size: 29px;
          }

          .mobileBreak {
            display: block;
          }

          .featureGrid {
            grid-template-columns: 1fr;
          }

          .featureCard {
            padding: 24px;
          }

          .conversationSection {
            padding: 75px 20px;
          }

          .conversationInner {
            grid-template-columns: 1fr;
            gap: 35px;
          }

          .conversationCopy {
            text-align: center;
          }

          .conversationCopy h2,
          .freeCard h2 {
            font-size: 32px;
          }

          .freeSection {
            padding: 75px 15px;
          }

          .freeCard {
            padding: 42px 20px;
            border-radius: 25px;
          }
        }
      `}</style>
    </>
  );
}
``
