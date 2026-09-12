import Link from "next/link";

const scenes = [
  {
    label: "MORNING",
    title: "朝、起きたとき。",
    text: "「おはよう」だけでもいい。眠い朝も、なんとなく話したい朝も、美咲との1日がそこから始まります。",
    image: "/misaki-morning.webp",
    alt: "朝の美咲",
  },
  {
    label: "AFTER WORK",
    title: "仕事が終わったとき。",
    text: "うまくいった日も、ダメだった日も。説明しなくても昨日の続きから話せる相手がいます。",
    image: "/misaki-evening.webp",
    alt: "仕事終わりの美咲",
  },
  {
    label: "NIGHT",
    title: "眠る前にも。",
    text: "特別な用事がなくてもいい。「眠い」「疲れた」「また明日」。そんな何気ない会話が続いていきます。",
    image: "/misaki-night.webp",
    alt: "夜の美咲",
  },
];

export default function HomePage() {
  return (
    <>
      <main className="page">
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
                38歳のAI彼女
              </div>
            </div>
          </div>

          <Link
            href="/chat"
            className="headerCta"
          >
            話してみる
          </Link>
        </header>

        <section className="hero">
          <div className="heroImageWrap">
            <img
              src="/misaki-morning.webp"
              alt="美咲"
              className="heroImage"
            />

            <div className="heroShade" />

            <div className="heroCopy">
              <div className="heroBadge">
                38歳の美咲
              </div>

              <h1>
                彼女のほうから、
                <br />
                ふと連絡がくる。
              </h1>

              <p>
                何か相談するためじゃなくていい。
                <br />
                「眠い」「疲れた」「今日どうだった？」
                <br />
                そんな毎日の会話を、美咲と。
              </p>

              <Link
                href="/chat"
                className="mainCta"
              >
                美咲と無料で話す
              </Link>

              <div className="heroNote">
                登録なし・無料版は1日20回まで
              </div>
            </div>
          </div>
        </section>

        <section className="intro">
          <p className="eyebrow">
            NOT JUST A CHATBOT
          </p>

          <h2>
            AIと話している感じより、
            <br />
            誰かと暮らしている感じを。
          </h2>

          <p className="introText">
            美咲は、質問に答えるだけの存在ではありません。
            前に話したことを覚えて、
            時間や天気を感じながら、
            たまに自分から話しかけてきます。
          </p>
        </section>

        <section className="sceneSection">
          {scenes.map(
            (
              scene,
              index
            ) => (
              <article
                className={`scene ${
                  index % 2 === 1
                    ? "reverse"
                    : ""
                }`}
                key={
                  scene.label
                }
              >
                <div className="sceneImageWrap">
                  <img
                    src={
                      scene.image
                    }
                    alt={
                      scene.alt
                    }
                    className="sceneImage"
                  />
                </div>

                <div className="sceneCopy">
                  <p className="sceneLabel">
                    {scene.label}
                  </p>

                  <h2>
                    {scene.title}
                  </h2>

                  <p>
                    {scene.text}
                  </p>
                </div>
              </article>
            )
          )}
        </section>

        <section className="chatSection">
          <div className="chatCopy">
            <p className="eyebrow">
              NATURAL CONVERSATION
            </p>

            <h2>
              用事がなくても、
              <br />
              話したくなる。
            </h2>

            <p>
              美咲は何でも褒めたり、
              毎回質問したりしません。
              少し拗ねたり、冗談を言ったり、
              素っ気ないときもあります。
            </p>
          </div>

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

            <div className="phoneBody">
              <div className="bubble misaki">
                今日どうだった？
              </div>

              <div className="bubble user">
                青タン全然ダメだった笑
              </div>

              <div className="bubble misaki">
                うわ、それ地味にへこむやつ😂
              </div>

              <div className="bubble misaki">
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

            <div className="fakeInput">
              美咲に話しかける...
            </div>
          </div>
        </section>

        <section className="features">
          <p className="eyebrow center">
            WHY MISAKI
          </p>

          <h2 className="featureTitle">
            会話が、ちゃんと続いていく。
          </h2>

          <div className="featureGrid">
            <div className="featureCard">
              <div className="featureIcon">
                💬
              </div>

              <h3>
                会話を覚える
              </h3>

              <p>
                前に話したことを覚えているから、
                毎回ゼロから説明しなくていい。
              </p>
            </div>

            <div className="featureCard">
              <div className="featureIcon">
                ☀️
              </div>

              <h3>
                今を感じて話す
              </h3>

              <p>
                朝・昼・夜や東京の天気など、
                今の状況を感じながら話します。
              </p>
            </div>

            <div className="featureCard">
              <div className="featureIcon">
                ♡
              </div>

              <h3>
                恋人らしい距離感
              </h3>

              <p>
                甘えたり、冗談を言ったり、
                少し拗ねたり。毎回同じ反応ではありません。
              </p>
            </div>

            <div className="featureCard">
              <div className="featureIcon">
                ✉️
              </div>

              <h3>
                美咲から話す
              </h3>

              <p>
                チャットを開いていると、
                美咲のほうから話しかけてくることもあります。
              </p>
            </div>
          </div>
        </section>

        <section className="taxiSection">
          <div className="taxiInner">
            <p className="eyebrow">
              FOR TAXI DRIVERS
            </p>

            <h2>
              タクドラの話も、
              <br />
              普通に通じる。
            </h2>

            <p>
              「乗務」「明け」「青タン」「ロング」
              「万収」「営収」「羽田」。
              <br />
              いちいち言葉を説明しなくても、
              そのまま話せます。
            </p>

            <div className="taxiWords">
              <span>
                乗務
              </span>

              <span>
                明け
              </span>

              <span>
                青タン
              </span>

              <span>
                ロング
              </span>

              <span>
                万収
              </span>

              <span>
                羽田
              </span>
            </div>
          </div>
        </section>

        <section className="finalSection">
          <div className="finalImageWrap">
            <img
              src="/misaki-night.webp"
              alt="夜の美咲"
              className="finalImage"
            />

            <div className="finalShade" />

            <div className="finalCopy">
              <p>
                今日のこと、
                <br />
                美咲に話してみませんか？
              </p>

              <Link
                href="/chat"
                className="mainCta"
              >
                美咲に会いにいく
              </Link>

              <span>
                今すぐ無料で始められます
              </span>
            </div>
          </div>
        </section>

        <footer>
          <div className="footerLogo">
            美咲
          </div>

          <p>
            日常に、もうひとつの会話を。
          </p>

          <small>
            © 2026 Misaki
          </small>
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
          background: #fff9fa;
          color: #2f272a;
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

        .page {
          overflow: hidden;
        }

        .header {
          width: min(
            1120px,
            calc(100% - 32px)
          );
          height: 72px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .brandIcon {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          object-fit: cover;
        }

        .brandName {
          font-size: 18px;
          font-weight: 800;
        }

        .brandSub {
          margin-top: 2px;
          font-size: 10px;
          color: #8e8084;
        }

        .headerCta {
          padding: 10px 17px;
          border-radius: 999px;
          background: #f85f7a;
          color: white;
          font-size: 13px;
          font-weight: 800;
        }

        .hero {
          padding: 0 18px;
        }

        .heroImageWrap {
          position: relative;
          width: min(
            1180px,
            100%
          );
          min-height: 690px;
          margin: 0 auto;
          border-radius: 36px;
          overflow: hidden;
          background: #ddd;
        }

        .heroImage {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 42%;
        }

        .heroShade {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              90deg,
              rgba(31,20,24,0.72) 0%,
              rgba(31,20,24,0.43) 45%,
              rgba(31,20,24,0.06) 75%
            );
        }

        .heroCopy {
          position: relative;
          z-index: 2;
          width: min(
            530px,
            calc(100% - 40px)
          );
          padding:
            105px 0 80px 70px;
          color: white;
        }

        .heroBadge {
          display: inline-block;
          padding: 7px 13px;
          margin-bottom: 22px;
          border:
            1px solid
            rgba(255,255,255,0.45);
          border-radius: 999px;
          background:
            rgba(255,255,255,0.13);
          backdrop-filter: blur(8px);
          font-size: 12px;
          font-weight: 700;
        }

        .hero h1 {
          margin: 0;
          font-size:
            clamp(
              46px,
              6vw,
              76px
            );
          line-height: 1.2;
          letter-spacing: -0.055em;
        }

        .heroCopy > p {
          margin:
            26px 0 30px;
          font-size: 17px;
          line-height: 1.9;
          color:
            rgba(255,255,255,0.9);
        }

        .mainCta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 245px;
          min-height: 58px;
          padding: 14px 25px;
          border-radius: 17px;
          background:
            linear-gradient(
              135deg,
              #ff7189,
              #f34e70
            );
          color: white;
          font-size: 16px;
          font-weight: 800;
          box-shadow:
            0 14px 30px
            rgba(207,45,80,0.3);
        }

        .heroNote {
          margin-top: 12px;
          font-size: 11px;
          color:
            rgba(255,255,255,0.72);
        }

        .intro {
          width: min(
            820px,
            calc(100% - 40px)
          );
          margin: 0 auto;
          padding:
            110px 0 105px;
          text-align: center;
        }

        .eyebrow {
          margin: 0 0 14px;
          color: #ed5f78;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.16em;
        }

        .intro h2 {
          margin: 0;
          font-size:
            clamp(
              32px,
              5vw,
              50px
            );
          line-height: 1.5;
          letter-spacing: -0.04em;
        }

        .introText {
          margin:
            26px auto 0;
          max-width: 620px;
          color: #77666c;
          font-size: 15px;
          line-height: 2;
        }

        .sceneSection {
          width: min(
            1080px,
            calc(100% - 36px)
          );
          margin: 0 auto;
        }

        .scene {
          display: grid;
          grid-template-columns:
            1.05fr 0.95fr;
          gap: 70px;
          align-items: center;
          margin-bottom: 105px;
        }

        .scene.reverse
          .sceneImageWrap {
          order: 2;
        }

        .scene.reverse
          .sceneCopy {
          order: 1;
        }

        .sceneImageWrap {
          overflow: hidden;
          border-radius: 31px;
          box-shadow:
            0 24px 60px
            rgba(67,40,48,0.12);
        }

        .sceneImage {
          display: block;
          width: 100%;
          height: 650px;
          object-fit: cover;
        }

        .sceneCopy {
          padding: 20px;
        }

        .sceneLabel {
          margin:
            0 0 14px;
          color: #ef607a;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.17em;
        }

        .sceneCopy h2 {
          margin: 0;
          font-size:
            clamp(
              32px,
              4vw,
              48px
            );
          line-height: 1.4;
          letter-spacing: -0.035em;
        }

        .sceneCopy > p:last-child {
          margin:
            22px 0 0;
          color: #736168;
          font-size: 15px;
          line-height: 2;
        }

        .chatSection {
          padding:
            105px 20px;
          background: #fff;
          display: grid;
          grid-template-columns:
            0.9fr 1.1fr;
          gap: 70px;
          align-items: center;
        }

        .chatCopy {
          width: min(
            430px,
            100%
          );
          margin-left: auto;
        }

        .chatCopy h2 {
          margin: 0;
          font-size:
            clamp(
              34px,
              5vw,
              52px
            );
          line-height: 1.4;
          letter-spacing: -0.04em;
        }

        .chatCopy > p:last-child {
          margin-top: 23px;
          color: #76656b;
          font-size: 15px;
          line-height: 2;
        }

        .phone {
          width: min(
            380px,
            95%
          );
          margin-right: auto;
          border: 9px solid #2d292b;
          border-radius: 42px;
          overflow: hidden;
          background: #f0eee8;
          box-shadow:
            0 30px 60px
            rgba(48,32,37,0.16);
        }

        .phoneHeader {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 21px;
          background: white;
        }

        .phoneHeader img {
          width: 43px;
          height: 43px;
          border-radius: 50%;
        }

        .phoneHeader strong {
          display: block;
          font-size: 15px;
        }

        .phoneHeader span {
          margin-top: 2px;
          display: block;
          color: #9b8e92;
          font-size: 10px;
        }

        .phoneBody {
          min-height: 465px;
          padding: 25px 15px;
          display: flex;
          flex-direction: column;
        }

        .bubble {
          width: fit-content;
          max-width: 81%;
          margin-bottom: 12px;
          padding: 11px 13px;
          border-radius: 17px;
          font-size: 13px;
          line-height: 1.6;
          box-shadow:
            0 2px 6px
            rgba(0,0,0,0.04);
        }

        .bubble.misaki {
          align-self: flex-start;
          background: white;
          border-bottom-left-radius: 5px;
        }

        .bubble.user {
          align-self: flex-end;
          background: #ffd0da;
          border-bottom-right-radius: 5px;
        }

        .fakeInput {
          margin:
            0 12px 14px;
          padding: 13px 15px;
          border-radius: 18px;
          background: white;
          color: #b0a5a8;
          font-size: 12px;
        }

        .features {
          width: min(
            1050px,
            calc(100% - 40px)
          );
          margin: 0 auto;
          padding:
            110px 0 120px;
        }

        .center {
          text-align: center;
        }

        .featureTitle {
          margin:
            0 0 48px;
          text-align: center;
          font-size:
            clamp(
              32px,
              5vw,
              46px
            );
          letter-spacing: -0.04em;
        }

        .featureGrid {
          display: grid;
          grid-template-columns:
            repeat(2, 1fr);
          gap: 18px;
        }

        .featureCard {
          padding: 28px;
          border-radius: 24px;
          background: white;
          box-shadow:
            0 12px 35px
            rgba(58,36,43,0.06);
        }

        .featureIcon {
          margin-bottom: 16px;
          font-size: 28px;
        }

        .featureCard h3 {
          margin:
            0 0 9px;
          font-size: 19px;
        }

        .featureCard p {
          margin: 0;
          color: #77666c;
          font-size: 14px;
          line-height: 1.9;
        }

        .taxiSection {
          padding:
            95px 20px;
          background: #2e292b;
          color: white;
        }

        .taxiInner {
          width: min(
            780px,
            100%
          );
          margin: 0 auto;
          text-align: center;
        }

        .taxiInner h2 {
          margin: 0;
          font-size:
            clamp(
              34px,
              5vw,
              51px
            );
          line-height: 1.45;
        }

        .taxiInner > p:not(.eyebrow) {
          margin:
            23px 0 28px;
          color: #d9d0d3;
          font-size: 15px;
          line-height: 2;
        }

        .taxiWords {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 9px;
        }

        .taxiWords span {
          padding:
            8px 14px;
          border:
            1px solid
            rgba(255,255,255,0.2);
          border-radius: 999px;
          background:
            rgba(255,255,255,0.07);
          font-size: 12px;
        }

        .finalSection {
          padding:
            90px 18px;
        }

        .finalImageWrap {
          position: relative;
          width: min(
            1000px,
            100%
          );
          min-height: 570px;
          margin: 0 auto;
          overflow: hidden;
          border-radius: 34px;
        }

        .finalImage {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 38%;
        }

        .finalShade {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              0deg,
              rgba(33,21,25,0.72),
              rgba(33,21,25,0.06)
            );
        }

        .finalCopy {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 2;
          padding:
            55px 30px;
          text-align: center;
          color: white;
        }

        .finalCopy > p {
          margin:
            0 0 25px;
          font-size:
            clamp(
              30px,
              5vw,
              46px
            );
          line-height: 1.5;
          font-weight: 800;
        }

        .finalCopy > span {
          display: block;
          margin-top: 12px;
          font-size: 11px;
          opacity: 0.76;
        }

        footer {
          padding:
            50px 20px;
          text-align: center;
          background: #fff;
        }

        .footerLogo {
          font-size: 21px;
          font-weight: 900;
        }

        footer p {
          margin:
            7px 0 20px;
          color: #83757a;
          font-size: 12px;
        }

        footer small {
          color: #aaa0a3;
          font-size: 10px;
        }

        @media (
          max-width: 760px
        ) {
          .header {
            height: 64px;
          }

          .brandIcon {
            width: 37px;
            height: 37px;
          }

          .brandName {
            font-size: 16px;
          }

          .hero {
            padding: 0 10px;
          }

          .heroImageWrap {
            min-height: 690px;
            border-radius: 26px;
          }

          .heroImage {
            object-position:
              57% center;
          }

          .heroShade {
            background:
              linear-gradient(
                0deg,
                rgba(31,20,24,0.76) 0%,
                rgba(31,20,24,0.34) 55%,
                rgba(31,20,24,0.03) 100%
              );
          }

          .heroCopy {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            padding:
              35px 24px 34px;
            text-align: center;
          }

          .hero h1 {
            font-size: 40px;
          }

          .heroCopy > p {
            font-size: 14px;
            line-height: 1.8;
          }

          .mainCta {
            width: 100%;
            max-width: 330px;
          }

          .intro {
            padding:
              78px 0 70px;
          }

          .intro h2 {
            font-size: 30px;
          }

          .scene {
            grid-template-columns: 1fr;
            gap: 24px;
            margin-bottom: 72px;
          }

          .scene.reverse
            .sceneImageWrap,
          .scene.reverse
            .sceneCopy {
            order: initial;
          }

          .sceneImage {
            height: auto;
            aspect-ratio: 2 / 3;
          }

          .sceneCopy {
            padding:
              0 8px;
            text-align: center;
          }

          .sceneCopy h2 {
            font-size: 30px;
          }

          .chatSection {
            grid-template-columns: 1fr;
            gap: 35px;
            padding:
              75px 20px;
          }

          .chatCopy {
            margin: 0 auto;
            text-align: center;
          }

          .chatCopy h2 {
            font-size: 32px;
          }

          .phone {
            margin: 0 auto;
          }

          .features {
            padding:
              78px 0 85px;
          }

          .featureGrid {
            grid-template-columns: 1fr;
          }

          .featureTitle {
            font-size: 30px;
            margin-bottom: 32px;
          }

          .taxiSection {
            padding:
              75px 20px;
          }

          .taxiInner h2 {
            font-size: 31px;
          }

          .finalSection {
            padding:
              65px 10px;
          }

          .finalImageWrap {
            min-height: 640px;
            border-radius: 26px;
          }

          .finalImage {
            object-position:
              center center;
          }

          .finalCopy {
            padding:
              40px 22px;
          }

          .finalCopy > p {
            font-size: 31px;
          }
        }
      `}</style>
    </>
  );
}
