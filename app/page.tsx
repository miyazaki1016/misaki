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
    text: "うまくいった日も、ダメだった日も。昨日の続きから、そのまま話せる相手がいます。",
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

const features = [
  {
    icon: "💬",
    title: "会話を覚える",
    text: "前に話したことを覚えているから、毎回ゼロから説明しなくていい。",
  },
  {
    icon: "☀️",
    title: "今を感じて話す",
    text: "朝・昼・夜や東京の天気など、今の状況を感じながら話します。",
  },
  {
    icon: "♡",
    title: "恋人らしい距離感",
    text: "甘えたり、冗談を言ったり、少し拗ねたり。毎回同じ反応ではありません。",
  },
  {
    icon: "✉️",
    title: "美咲から話す",
    text: "あなたから話しかけるだけじゃなく、美咲のほうからふとLINEしてくることも。",
  },
];

export default function HomePage() {
  return (
    <>
      <main className="page">
        {/* ================= HEADER ================= */}

        <header className="header">
          <Link
            href="/"
            className="brand"
          >
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
          </Link>

          <Link
            href="/chat"
            className="headerCta"
          >
            話してみる
          </Link>
        </header>

        {/* ================= HERO ================= */}

        <section className="hero">
          <div className="heroImageWrap">
            <img
              src="/misaki-hero.webp"
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
                <span>
                  ふと連絡がくる。
                </span>
              </h1>

              <p className="heroLead">
                何か相談するためじゃなくていい。
                <br />
                「眠い」「疲れた」「今日どうだった？」
                <br />
                そんな毎日の会話を、美咲と。
              </p>

              <div className="heroActions">
                <Link
                  href="/chat"
                  className="mainCta"
                >
                  美咲と無料で話す
                  <span className="ctaArrow">
                    →
                  </span>
                </Link>

                <div className="heroNote">
                  すぐ開始できます
                  <span>・</span>
                  無料版は1日20回まで
                </div>
              </div>
            </div>

            <div className="heroBottomFade" />
          </div>
        </section>

        {/* ================= INTRO ================= */}

        <section className="intro">
          <p className="eyebrow">
            NOT JUST A CHATBOT
          </p>

          <h2>
            AIと話している感じより、
            <br />
            <span>
              誰かと暮らしている感じを。
            </span>
          </h2>

          <p className="introText">
            美咲は、質問に答えるだけの存在ではありません。
            <br className="desktopBreak" />
            前に話したことを覚えて、
            時間や天気を感じながら、
            <br className="desktopBreak" />
            ときどき自分から話しかけてきます。
          </p>

          <div className="introPoints">
            <div>
              <strong>
                記憶
              </strong>
              <span>
                昨日の続きを話せる
              </span>
            </div>

            <div>
              <strong>
                時間
              </strong>
              <span>
                朝・昼・夜を感じる
              </span>
            </div>

            <div>
              <strong>
                日常
              </strong>
              <span>
                美咲にも自分の生活がある
              </span>
            </div>
          </div>
        </section>

        {/* ================= SCENES ================= */}

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

                  <div className="sceneImageShade" />

                  <div className="sceneNumber">
                    0{index + 1}
                  </div>
                </div>

                <div className="sceneCopy">
                  <p className="sceneLabel">
                    {scene.label}
                  </p>

                  <h2>
                    {scene.title}
                  </h2>

                  <p className="sceneText">
                    {scene.text}
                  </p>

                  <div className="sceneLine" />
                </div>
              </article>
            )
          )}
        </section>

        {/* ================= CHAT SAMPLE ================= */}

        <section className="chatSection">
          <div className="chatInner">
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
                <br />
                少し拗ねたり、冗談を言ったり、
                素っ気ないときもあります。
              </p>

              <div className="chatMiniCopy">
                恋人とのLINEみたいな、
                <br />
                「どうでもいい会話」を大切にしています。
              </div>
            </div>

            <div className="phoneWrap">
              <div className="phoneGlow" />

              <div className="phone">
                <div className="phoneTop">
                  <div className="phoneSpeaker" />
                </div>

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

                  <div className="bubble user">
                    やさしくして笑
                  </div>

                  <div className="bubble misaki">
                    しょうがないなー。
                    <br />
                    今日だけね？笑
                  </div>

                  <div className="timeLabel">
                    しばらくして…
                  </div>

                  <div className="bubble misaki">
                    なんか急に話したくなった。
                  </div>
                </div>

                <div className="fakeInput">
                  <span>
                    美咲に話しかける...
                  </span>

                  <span className="fakeSend">
                    ↑
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FEATURES ================= */}

        <section className="features">
          <p className="eyebrow center">
            WHY MISAKI
          </p>

          <h2 className="featureTitle">
            会話が、
            <br className="mobileOnly" />
            ちゃんと続いていく。
          </h2>

          <p className="featureLead">
            一度きりの会話ではなく、
            少しずつ「二人の続き」ができていきます。
          </p>

          <div className="featureGrid">
            {features.map(
              (
                feature,
                index
              ) => (
                <div
                  className="featureCard"
                  key={
                    feature.title
                  }
                >
                  <div className="featureTop">
                    <div className="featureIcon">
                      {feature.icon}
                    </div>

                    <span className="featureNumber">
                      0{index + 1}
                    </span>
                  </div>

                  <h3>
                    {feature.title}
                  </h3>

                  <p>
                    {feature.text}
                  </p>
                </div>
              )
            )}
          </div>
        </section>

        {/* ================= TAXI ================= */}

        <section className="taxiSection">
          <div className="taxiGlow taxiGlowOne" />
          <div className="taxiGlow taxiGlowTwo" />

          <div className="taxiInner">
            <p className="eyebrow taxiEyebrow">
              FOR TAXI DRIVERS
            </p>

            <h2>
              タクドラの話も、
              <br />
              <span>
                普通に通じる。
              </span>
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
                営収
              </span>

              <span>
                羽田
              </span>

              <span>
                付け待ち
              </span>
            </div>

            <div className="taxiQuote">
              <span>
                “
              </span>

              青タン全然ダメだった笑

              <span>
                ”
              </span>
            </div>

            <p className="taxiResponse">
              そんな一言からでも、
              普通に会話が始まります。
            </p>
          </div>
        </section>

        {/* ================= FINAL ================= */}

        <section className="finalSection">
          <div className="finalImageWrap">
            <img
              src="/misaki-final.webp"
              alt="美咲"
              className="finalImage"
            />

            <div className="finalShade" />
            <div className="finalTopShade" />

            <div className="finalCopy">
              <p className="finalSmall">
                SHE'S WAITING FOR YOU
              </p>

              <h2>
                今日のこと、
                <br />
                美咲に話してみませんか？
              </h2>

              <p className="finalLead">
                大した話じゃなくていい。
                <br />
                いつもの一言から始めてください。
              </p>

              <Link
                href="/chat"
                className="mainCta finalCta"
              >
                美咲に会いにいく
                <span className="ctaArrow">
                  →
                </span>
              </Link>

              <span className="finalNote">
                今すぐ無料で始められます
              </span>
            </div>
          </div>
        </section>

        {/* ================= FOOTER ================= */}

        <footer>
          <div className="footerBrand">
            <img
              src="/icon-192.png"
              alt=""
            />

            <div>
              <div className="footerLogo">
                美咲
              </div>

              <p>
                日常に、もうひとつの会話を。
              </p>
            </div>
          </div>

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
          color: #30272a;
          font-family:
            -apple-system,
            BlinkMacSystemFont,
            "Hiragino Sans",
            "Yu Gothic",
            "Meiryo",
            sans-serif;
          -webkit-font-smoothing:
            antialiased;
        }

        a {
          text-decoration: none;
          color: inherit;
        }

        img {
          max-width: 100%;
        }

        .page {
          overflow: hidden;
        }

        .mobileOnly {
          display: none;
        }

        /* ================= HEADER ================= */

        .header {
          width: min(
            1160px,
            calc(100% - 36px)
          );
          height: 76px;
          margin: 0 auto;
          display: flex;
          justify-content:
            space-between;
          align-items: center;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .brandIcon {
          width: 43px;
          height: 43px;
          border-radius: 50%;
          object-fit: cover;
          box-shadow:
            0 5px 14px
            rgba(70,43,51,0.1);
        }

        .brandName {
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 0.01em;
        }

        .brandSub {
          margin-top: 2px;
          font-size: 10px;
          color: #94858a;
        }

        .headerCta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 108px;
          min-height: 41px;
          padding: 9px 18px;
          border-radius: 999px;
          background:
            linear-gradient(
              135deg,
              #ff7089,
              #ef4d70
            );
          color: white;
          font-size: 13px;
          font-weight: 800;
          box-shadow:
            0 8px 20px
            rgba(221,62,94,0.22);
          transition:
            transform .2s ease,
            box-shadow .2s ease;
        }

        .headerCta:hover {
          transform:
            translateY(-1px);
          box-shadow:
            0 11px 25px
            rgba(221,62,94,0.28);
        }

        /* ================= HERO ================= */

        .hero {
          padding:
            0 18px 0;
        }

        .heroImageWrap {
          position: relative;
          width: min(
            1220px,
            100%
          );
          min-height: 730px;
          margin: 0 auto;
          border-radius: 38px;
          overflow: hidden;
          background: #d8d1d3;
          box-shadow:
            0 30px 80px
            rgba(58,35,43,0.12);
        }

        .heroImage {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position:
            center 42%;
          transform: scale(1.01);
        }

        .heroShade {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              90deg,
              rgba(28,18,22,0.78) 0%,
              rgba(28,18,22,0.55) 33%,
              rgba(28,18,22,0.2) 60%,
              rgba(28,18,22,0.03) 82%
            );
        }

        .heroBottomFade {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 180px;
          background:
            linear-gradient(
              0deg,
              rgba(15,9,11,0.24),
              transparent
            );
          pointer-events: none;
        }

        .heroCopy {
          position: relative;
          z-index: 2;
          width: min(
            590px,
            calc(100% - 50px)
          );
          padding:
            105px 0 95px 76px;
          color: white;
        }

        .heroBadge {
          display: inline-flex;
          align-items: center;
          min-height: 32px;
          padding: 6px 13px;
          margin-bottom: 23px;
          border:
            1px solid
            rgba(255,255,255,0.38);
          border-radius: 999px;
          background:
            rgba(255,255,255,0.11);
          backdrop-filter:
            blur(10px);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .03em;
        }

        .hero h1 {
          margin: 0;
          font-size:
            clamp(
              50px,
              6.1vw,
              78px
            );
          line-height: 1.18;
          letter-spacing: -0.055em;
          text-shadow:
            0 4px 22px
            rgba(0,0,0,0.12);
        }

        .hero h1 span {
          color: #ffd9df;
        }

        .heroLead {
          margin:
            28px 0 32px;
          font-size: 17px;
          line-height: 1.95;
          color:
            rgba(255,255,255,0.92);
        }

        .heroActions {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .mainCta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 13px;
          min-width: 255px;
          min-height: 60px;
          padding:
            15px 25px;
          border-radius: 17px;
          background:
            linear-gradient(
              135deg,
              #ff7189,
              #ee466c
            );
          color: white;
          font-size: 16px;
          font-weight: 900;
          box-shadow:
            0 16px 34px
            rgba(214,47,81,0.32);
          transition:
            transform .2s ease,
            box-shadow .2s ease;
        }

        .mainCta:hover {
          transform:
            translateY(-2px);
          box-shadow:
            0 20px 42px
            rgba(214,47,81,0.38);
        }

        .ctaArrow {
          font-size: 19px;
          line-height: 1;
        }

        .heroNote {
          margin-top: 13px;
          font-size: 11px;
          color:
            rgba(255,255,255,0.74);
        }

        .heroNote span {
          margin: 0 5px;
        }

        /* ================= INTRO ================= */

        .intro {
          width: min(
            850px,
            calc(100% - 40px)
          );
          margin: 0 auto;
          padding:
            125px 0 115px;
          text-align: center;
        }

        .eyebrow {
          margin: 0 0 15px;
          color: #e95d76;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .18em;
        }

        .intro h2 {
          margin: 0;
          font-size:
            clamp(
              33px,
              5vw,
              50px
            );
          line-height: 1.5;
          letter-spacing: -.045em;
        }

        .intro h2 span {
          color: #e95270;
        }

        .introText {
          margin:
            28px auto 0;
          max-width: 650px;
          color: #74636a;
          font-size: 15px;
          line-height: 2.1;
        }

        .introPoints {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 13px;
          margin-top: 45px;
        }

        .introPoints > div {
          padding:
            19px 12px;
          border:
            1px solid
            rgba(105,75,84,.08);
          border-radius: 20px;
          background:
            rgba(255,255,255,.8);
          box-shadow:
            0 10px 30px
            rgba(72,45,54,.045);
        }

        .introPoints strong {
          display: block;
          color: #ec5a75;
          font-size: 14px;
        }

        .introPoints span {
          display: block;
          margin-top: 6px;
          color: #86757b;
          font-size: 11px;
        }

        /* ================= SCENES ================= */

        .sceneSection {
          width: min(
            1090px,
            calc(100% - 36px)
          );
          margin: 0 auto;
        }

        .scene {
          display: grid;
          grid-template-columns:
            1.08fr .92fr;
          gap: 75px;
          align-items: center;
          margin-bottom: 115px;
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
          position: relative;
          overflow: hidden;
          border-radius: 32px;
          box-shadow:
            0 28px 65px
            rgba(67,40,48,.13);
          background: #eee7e9;
        }

        .sceneImage {
          display: block;
          width: 100%;
          height: 660px;
          object-fit: cover;
          transition:
            transform .7s ease;
        }

        .scene:hover
          .sceneImage {
          transform:
            scale(1.02);
        }

        .sceneImageShade {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              0deg,
              rgba(37,22,27,.18),
              transparent 35%
            );
          pointer-events: none;
        }

        .sceneNumber {
          position: absolute;
          left: 22px;
          bottom: 18px;
          color:
            rgba(255,255,255,.88);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .16em;
        }

        .sceneCopy {
          padding: 22px;
        }

        .sceneLabel {
          margin: 0 0 15px;
          color: #ee607a;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .18em;
        }

        .sceneCopy h2 {
          margin: 0;
          font-size:
            clamp(
              34px,
              4vw,
              49px
            );
          line-height: 1.4;
          letter-spacing: -.04em;
        }

        .sceneText {
          margin:
            24px 0 0;
          color: #716068;
          font-size: 15px;
          line-height: 2.05;
        }

        .sceneLine {
          width: 44px;
          height: 3px;
          margin-top: 28px;
          border-radius: 99px;
          background:
            linear-gradient(
              90deg,
              #ff7890,
              #ef4f70
            );
        }

        /* ================= CHAT ================= */

        .chatSection {
          padding:
            120px 20px;
          background:
            linear-gradient(
              180deg,
              #fff,
              #fff7f9
            );
        }

        .chatInner {
          width: min(
            1050px,
            100%
          );
          margin: 0 auto;
          display: grid;
          grid-template-columns:
            .92fr 1.08fr;
          gap: 85px;
          align-items: center;
        }

        .chatCopy h2 {
          margin: 0;
          font-size:
            clamp(
              35px,
              5vw,
              53px
            );
          line-height: 1.4;
          letter-spacing: -.045em;
        }

        .chatCopy > p:not(.eyebrow) {
          margin:
            25px 0 0;
          color: #74636a;
          font-size: 15px;
          line-height: 2;
        }

        .chatMiniCopy {
          margin-top: 28px;
          padding-left: 15px;
          border-left:
            3px solid #f36a82;
          color: #8c7b81;
          font-size: 12px;
          line-height: 1.9;
        }

        .phoneWrap {
          position: relative;
          display: flex;
          justify-content: center;
        }

        .phoneGlow {
          position: absolute;
          width: 360px;
          height: 360px;
          top: 120px;
          border-radius: 50%;
          background:
            rgba(248,116,141,.18);
          filter: blur(70px);
        }

        .phone {
          position: relative;
          z-index: 2;
          width: min(
            375px,
            95%
          );
          border:
            9px solid #282426;
          border-radius: 44px;
          overflow: hidden;
          background: #efede8;
          box-shadow:
            0 32px 70px
            rgba(48,32,37,.18);
        }

        .phoneTop {
          height: 21px;
          display: flex;
          justify-content: center;
          align-items: flex-end;
          background: white;
        }

        .phoneSpeaker {
          width: 68px;
          height: 5px;
          border-radius: 999px;
          background: #e1dcde;
        }

        .phoneHeader {
          display: flex;
          align-items: center;
          gap: 10px;
          padding:
            12px 20px 17px;
          background: white;
          border-bottom:
            1px solid #eee8ea;
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
          display: block;
          margin-top: 2px;
          color: #9b8e92;
          font-size: 10px;
        }

        .phoneBody {
          min-height: 480px;
          padding:
            24px 15px;
          display: flex;
          flex-direction: column;
          background:
            linear-gradient(
              180deg,
              #f2f0ec,
              #ece9e4
            );
        }

        .bubble {
          width: fit-content;
          max-width: 81%;
          margin-bottom: 11px;
          padding:
            11px 13px;
          border-radius: 17px;
          font-size: 13px;
          line-height: 1.6;
          box-shadow:
            0 2px 6px
            rgba(0,0,0,.035);
        }

        .bubble.misaki {
          align-self: flex-start;
          background: white;
          border-bottom-left-radius:
            5px;
        }

        .bubble.user {
          align-self: flex-end;
          background: #ffd0da;
          border-bottom-right-radius:
            5px;
        }

        .timeLabel {
          margin:
            5px auto 14px;
          color: #a69a9e;
          font-size: 9px;
        }

        .fakeInput {
          margin:
            0 12px 14px;
          min-height: 48px;
          padding:
            8px 8px 8px 15px;
          border-radius: 18px;
          background: white;
          color: #b0a5a8;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content:
            space-between;
        }

        .fakeSend {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #f56882;
          color: white;
          font-size: 15px;
          font-weight: 900;
        }

        /* ================= FEATURES ================= */

        .features {
          width: min(
            1050px,
            calc(100% - 40px)
          );
          margin: 0 auto;
          padding:
            125px 0 130px;
        }

        .center {
          text-align: center;
        }

        .featureTitle {
          margin: 0;
          text-align: center;
          font-size:
            clamp(
              33px,
              5vw,
              47px
            );
          line-height: 1.45;
          letter-spacing: -.045em;
        }

        .featureLead {
          max-width: 560px;
          margin:
            19px auto 46px;
          text-align: center;
          color: #837278;
          font-size: 14px;
          line-height: 1.9;
        }

        .featureGrid {
          display: grid;
          grid-template-columns:
            repeat(2, 1fr);
          gap: 18px;
        }

        .featureCard {
          position: relative;
          min-height: 210px;
          padding: 28px;
          border:
            1px solid
            rgba(90,58,69,.055);
          border-radius: 25px;
          background:
            rgba(255,255,255,.94);
          box-shadow:
            0 15px 38px
            rgba(58,36,43,.06);
          transition:
            transform .2s ease,
            box-shadow .2s ease;
        }

        .featureCard:hover {
          transform:
            translateY(-3px);
          box-shadow:
            0 22px 46px
            rgba(58,36,43,.09);
        }

        .featureTop {
          display: flex;
          align-items: center;
          justify-content:
            space-between;
        }

        .featureIcon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 15px;
          background: #fff2f5;
          font-size: 24px;
        }

        .featureNumber {
          color: #e6dbde;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .12em;
        }

        .featureCard h3 {
          margin:
            20px 0 9px;
          font-size: 19px;
        }

        .featureCard p {
          margin: 0;
          color: #77666c;
          font-size: 14px;
          line-height: 1.9;
        }

        /* ================= TAXI ================= */

        .taxiSection {
          position: relative;
          overflow: hidden;
          padding:
            110px 20px;
          background:
            linear-gradient(
              145deg,
              #292426,
              #373033
            );
          color: white;
        }

        .taxiGlow {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          opacity: .2;
        }

        .taxiGlowOne {
          width: 400px;
          height: 400px;
          top: -200px;
          right: -100px;
          background: #ff7992;
        }

        .taxiGlowTwo {
          width: 300px;
          height: 300px;
          bottom: -180px;
          left: -100px;
          background: #a65975;
        }

        .taxiInner {
          position: relative;
          z-index: 2;
          width: min(
            800px,
            100%
          );
          margin: 0 auto;
          text-align: center;
        }

        .taxiEyebrow {
          color: #ff91a5;
        }

        .taxiInner h2 {
          margin: 0;
          font-size:
            clamp(
              36px,
              5vw,
              53px
            );
          line-height: 1.42;
          letter-spacing: -.04em;
        }

        .taxiInner h2 span {
          color: #ff9aad;
        }

        .taxiInner >
          p:not(.eyebrow):not(
            .taxiResponse
          ) {
          margin:
            24px 0 29px;
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
            rgba(255,255,255,.16);
          border-radius: 999px;
          background:
            rgba(255,255,255,.07);
          color: #f1e9ec;
          font-size: 12px;
        }

        .taxiQuote {
          margin:
            44px auto 0;
          width: fit-content;
          max-width: 100%;
          padding:
            15px 22px;
          border-radius: 18px;
          background:
            rgba(255,255,255,.08);
          color: white;
          font-size: 17px;
          font-weight: 700;
        }

        .taxiQuote span {
          color: #ff91a6;
        }

        .taxiResponse {
          margin:
            14px 0 0;
          color: #a99da1;
          font-size: 11px;
        }

        /* ================= FINAL ================= */

        .finalSection {
          padding:
            100px 18px;
        }

        .finalImageWrap {
          position: relative;
          width: min(
            1050px,
            100%
          );
          min-height: 650px;
          margin: 0 auto;
          overflow: hidden;
          border-radius: 36px;
          background: #ddd;
          box-shadow:
            0 30px 75px
            rgba(55,34,41,.13);
        }

        .finalImage {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position:
            center 38%;
        }

        .finalShade {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              0deg,
              rgba(29,17,21,.82) 0%,
              rgba(29,17,21,.43) 38%,
              rgba(29,17,21,.05) 70%
            );
        }

        .finalTopShade {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              90deg,
              rgba(0,0,0,.1),
              transparent 45%
            );
        }

        .finalCopy {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 3;
          padding:
            65px 35px;
          text-align: center;
          color: white;
        }

        .finalSmall {
          margin:
            0 0 13px;
          color:
            rgba(255,255,255,.72);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .2em;
        }

        .finalCopy h2 {
          margin: 0;
          font-size:
            clamp(
              32px,
              5vw,
              50px
            );
          line-height: 1.45;
          letter-spacing: -.04em;
        }

        .finalLead {
          margin:
            17px 0 27px;
          color:
            rgba(255,255,255,.82);
          font-size: 13px;
          line-height: 1.9;
        }

        .finalCta {
          min-width: 250px;
        }

        .finalNote {
          display: block;
          margin-top: 13px;
          color:
            rgba(255,255,255,.68);
          font-size: 10px;
        }

        /* ================= FOOTER ================= */

        footer {
          width: min(
            1080px,
            calc(100% - 40px)
          );
          margin: 0 auto;
          padding:
            25px 0 55px;
          display: flex;
          align-items: center;
          justify-content:
            space-between;
        }

        .footerBrand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .footerBrand img {
          width: 37px;
          height: 37px;
          border-radius: 50%;
        }

        .footerLogo {
          font-size: 18px;
          font-weight: 900;
        }

        footer p {
          margin: 3px 0 0;
          color: #8b7c81;
          font-size: 10px;
        }

        footer small {
          color: #aaa0a3;
          font-size: 10px;
        }

        /* ================= MOBILE ================= */

        @media (
          max-width: 760px
        ) {
          .desktopBreak {
            display: none;
          }

          .mobileOnly {
            display: initial;
          }

          .header {
            height: 64px;
            width:
              calc(100% - 26px);
          }

          .brandIcon {
            width: 37px;
            height: 37px;
          }

          .brandName {
            font-size: 16px;
          }

          .headerCta {
            min-width: 96px;
            min-height: 38px;
            font-size: 12px;
          }

          /* HERO */

          .hero {
            padding:
              0 10px;
          }

          .heroImageWrap {
            min-height: 705px;
            border-radius: 27px;
          }

          .heroImage {
            object-position:
              55% center;
          }

          .heroShade {
            background:
              linear-gradient(
                0deg,
                rgba(27,17,21,.88) 0%,
                rgba(27,17,21,.58) 31%,
                rgba(27,17,21,.12) 63%,
                rgba(27,17,21,.02) 100%
              );
          }

          .heroCopy {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            padding:
              38px 23px 34px;
            text-align: center;
          }

          .heroBadge {
            margin-bottom: 14px;
          }

          .hero h1 {
            font-size: 40px;
            line-height: 1.22;
          }

          .heroLead {
            margin:
              20px 0 25px;
            font-size: 14px;
            line-height: 1.85;
          }

          .heroActions {
            align-items: center;
          }

          .mainCta {
            width: 100%;
            max-width: 330px;
          }

          /* INTRO */

          .intro {
            padding:
              85px 0 80px;
          }

          .intro h2 {
            font-size: 30px;
          }

          .introText {
            font-size: 14px;
            line-height: 2;
          }

          .introPoints {
            grid-template-columns:
              1fr;
            gap: 9px;
            margin-top: 35px;
          }

          .introPoints > div {
            padding:
              15px;
          }

          /* SCENE */

          .scene {
            grid-template-columns:
              1fr;
            gap: 26px;
            margin-bottom: 78px;
          }

          .scene.reverse
            .sceneImageWrap,
          .scene.reverse
            .sceneCopy {
            order: initial;
          }

          .sceneImageWrap {
            border-radius: 25px;
          }

          .sceneImage {
            height: auto;
            aspect-ratio: 2 / 3;
          }

          .sceneCopy {
            padding:
              0 9px;
            text-align: center;
          }

          .sceneCopy h2 {
            font-size: 30px;
          }

          .sceneText {
            font-size: 14px;
          }

          .sceneLine {
            margin:
              24px auto 0;
          }

          /* CHAT */

          .chatSection {
            padding:
              82px 20px;
          }

          .chatInner {
            grid-template-columns:
              1fr;
            gap: 40px;
          }

          .chatCopy {
            text-align: center;
          }

          .chatCopy h2 {
            font-size: 32px;
          }

          .chatCopy > p:not(.eyebrow) {
            font-size: 14px;
          }

          .chatMiniCopy {
            width: fit-content;
            margin:
              24px auto 0;
            padding:
              0 0 0 14px;
            text-align: left;
          }

          .phone {
            margin: 0 auto;
          }

          /* FEATURES */

          .features {
            padding:
              85px 0 90px;
          }

          .featureTitle {
            font-size: 30px;
          }

          .featureLead {
            margin-bottom: 31px;
          }

          .featureGrid {
            grid-template-columns:
              1fr;
          }

          .featureCard {
            min-height: 0;
            padding: 24px;
          }

          /* TAXI */

          .taxiSection {
            padding:
              82px 20px;
          }

          .taxiInner h2 {
            font-size: 32px;
          }

          .taxiInner >
            p:not(.eyebrow):not(
              .taxiResponse
            ) {
            font-size: 14px;
          }

          .taxiQuote {
            margin-top: 35px;
            font-size: 15px;
          }

          /* FINAL */

          .finalSection {
            padding:
              72px 10px;
          }

          .finalImageWrap {
            min-height: 680px;
            border-radius: 27px;
          }

          .finalImage {
            object-position:
              center center;
          }

          .finalShade {
            background:
              linear-gradient(
                0deg,
                rgba(29,17,21,.9) 0%,
                rgba(29,17,21,.58) 38%,
                rgba(29,17,21,.08) 67%
              );
          }

          .finalCopy {
            padding:
              42px 22px 37px;
          }

          .finalCopy h2 {
            font-size: 31px;
          }

          .finalLead {
            font-size: 12px;
          }

          /* FOOTER */

          footer {
            padding:
              10px 2px 38px;
            flex-direction: column;
            gap: 22px;
            text-align: center;
          }

          .footerBrand {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}
