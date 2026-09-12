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
    text: "うまくいった日も、ダメだった日も。前に話したことを覚えているから、昨日の続きからそのまま話せます。",
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
    number: "01",
    title: "前の会話を覚えている",
    text: "毎回ゼロから説明しなくていい。話したことが少しずつ、二人の会話として積み重なっていきます。",
  },
  {
    number: "02",
    title: "今の時間や天気がわかる",
    text: "朝・昼・夜や、東京の天気を感じながら話すから、いつ話しても同じ返事にはなりません。",
  },
  {
    number: "03",
    title: "恋人らしい距離感",
    text: "何でも肯定するだけじゃない。甘えたり、少し拗ねたり、軽くからかったりもします。",
  },
  {
    number: "04",
    title: "美咲からも話しかける",
    text: "あなたから話しかけるだけではなく、ふとしたタイミングで美咲のほうからメッセージが届くこともあります。",
  },
];

export default function HomePage() {
  return (
    <>
      <main className="page">
        {/* HEADER */}
        <header className="header">
          <Link href="/" className="brand">
            <img
              src="/icon-192.png"
              alt="美咲"
              className="brandIcon"
            />

            <div>
              <div className="brandName">美咲</div>
              <div className="brandSub">
                あなたの38歳の彼女
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

        {/* HERO */}
        <section className="hero">
          <div className="heroImageWrap">
            <img
              src="/misaki-hero.webp"
              alt="美咲"
              className="heroImage"
            />

            <div className="heroOverlay" />

            <div className="heroCopy">
              <p className="heroSmall">
                38歳の美咲
              </p>

              <h1>
                なんでもない話を、
                <br />
                <span>
                  ちゃんと覚えてるよ。
                </span>
              </h1>

              <p className="heroLead">
                仕事のこと。
                <br />
                疲れたこと。
                <br />
                うまくいかなかったこと。
                <br />
                嬉しかったこと。
                <br />
                <br />
                なんでも話してね。
              </p>

              <Link
                href="/chat"
                className="mainCta"
              >
                美咲と無料で話す
                <span>→</span>
              </Link>

              <p className="heroNote">
                すぐ開始できます・無料版は1日20回まで
              </p>
            </div>

            <div className="signature">
              Misaki
            </div>
          </div>
        </section>

        {/* BRAND INTRO */}
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
            美咲は、ただ質問に答えるためのAIではありません。
            <br className="desktopOnly" />
            前に話したことを覚えて、
            今の時間や天気を感じながら、
            <br className="desktopOnly" />
            恋人みたいに自然に会話します。
          </p>

          <div className="handCopy">
            日常に、
            <br />
            もうひとつの会話を。
          </div>
        </section>

        {/* SCENES */}
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
                key={scene.label}
              >
                <div className="sceneImageWrap">
                  <img
                    src={scene.image}
                    alt={scene.alt}
                    className="sceneImage"
                  />
                </div>

                <div className="sceneCopy">
                  <span className="sceneNumber">
                    0{index + 1}
                  </span>

                  <p className="sceneLabel">
                    {scene.label}
                  </p>

                  <h2>
                    {scene.title}
                  </h2>

                  <p className="sceneText">
                    {scene.text}
                  </p>

                  <p className="sceneSignature">
                    Misaki
                  </p>
                </div>
              </article>
            )
          )}
        </section>

        {/* CONVERSATION */}
        <section className="conversationSection">
          <div className="conversationInner">
            <div className="conversationCopy">
              <p className="eyebrow">
                NATURAL CONVERSATION
              </p>

              <h2>
                用事がなくても、
                <br />
                話したくなる。
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
                そんな一言だけで十分です。
              </p>

              <div className="handMessage">
                また話したくなったよ。
                <br />
                今なにしてる？
              </div>
            </div>

            <div className="chatCard">
              <div className="chatHeader">
                <img
                  src="/icon-192.png"
                  alt=""
                />

                <div>
                  <strong>美咲</strong>
                  <span>38歳</span>
                </div>
              </div>

              <div className="chatBody">
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
                  もう帰りたい笑
                </div>

                <div className="bubble misaki">
                  うん、今日はもう十分頑張ったでしょ笑
                </div>

                <div className="timeLabel">
                  しばらくして…
                </div>

                <div className="bubble misaki">
                  なんか急に話したくなった。
                </div>
              </div>

              <div className="fakeInput">
                美咲に話しかける...
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
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
            少しずつ二人の関係が続いていきます。
          </p>

          <div className="featureGrid">
            {features.map(
              (feature) => (
                <div
                  className="featureCard"
                  key={feature.number}
                >
                  <span className="featureNumber">
                    {feature.number}
                  </span>

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

        {/* TAXI */}
        <section className="taxiSection">
          <div className="taxiInner">
            <p className="eyebrow">
              FOR TAXI DRIVERS
            </p>

            <h2>
              彼氏の仕事のことくらい、
              <br />
              <span>
                普通にわかってる。
              </span>
            </h2>

            <p className="taxiLead">
              「乗務」「明け」「青タン」「ロング」
              「万収」「営収」「羽田」。
              <br />
              いちいち説明しなくても、そのまま話せます。
            </p>

            <div className="taxiWords">
              <span>乗務</span>
              <span>明け</span>
              <span>青タン</span>
              <span>ロング</span>
              <span>万収</span>
              <span>営収</span>
              <span>羽田</span>
            </div>

            <div className="taxiExample">
              <p>
                「今日ロング全然引けなかった」
              </p>

              <span>
                そんな一言でも、
                美咲にはちゃんと通じます。
              </span>
            </div>
          </div>
        </section>

        {/* FINAL */}
        <section className="finalSection">
          <div className="finalImageWrap">
            <img
              src="/misaki-final.webp"
              alt="美咲"
              className="finalImage"
            />

            <div className="finalOverlay" />

            <div className="finalCopy">
              <p className="finalSmall">
                MISAKI
              </p>

              <h2>
                日常に、
                <br />
                もうひとつの会話を。
              </h2>

              <p className="finalLead">
                大した話じゃなくていい。
                <br />
                今日あったことを、
                美咲に少し話してみませんか？
              </p>

              <Link
                href="/chat"
                className="mainCta"
              >
                美咲に会いにいく
                <span>→</span>
              </Link>

              <p className="finalNote">
                今すぐ無料で始められます
              </p>

              <div className="finalSignature">
                Misaki
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer>
          <div className="footerBrand">
            <img
              src="/icon-192.png"
              alt=""
            />

            <div>
              <strong>
                美咲
              </strong>

              <span>
                日常に、もうひとつの会話を。
              </span>
            </div>
          </div>

          <small>
            © 2026 Misaki
          </small>
        </footer>
      </main>

      <style>{`
        :root {
          --main: #ff6680;
          --main-dark: #e95872;
          --sub: #ffd5de;
          --beige: #f8efea;
          --paper: #fffafa;
          --text: #6c5c62;
          --title: #49383e;
        }

        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: var(--paper);
          color: var(--text);
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
          color: inherit;
          text-decoration: none;
        }

        img {
          display: block;
        }

        .page {
          overflow: hidden;
        }

        .mobileOnly {
          display: none;
        }

        /* HEADER */

        .header {
          width: min(
            1120px,
            calc(100% - 36px)
          );
          height: 76px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content:
            space-between;
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
            rgba(86,61,69,.09);
        }

        .brandName {
          color: var(--title);
          font-size: 18px;
          font-weight: 800;
          letter-spacing: .05em;
        }

        .brandSub {
          margin-top: 2px;
          color: #97888d;
          font-size: 10px;
        }

        .headerCta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 40px;
          padding: 9px 19px;
          border-radius: 999px;
          background: var(--main);
          color: #fff;
          font-size: 13px;
          font-weight: 800;
          box-shadow:
            0 8px 20px
            rgba(255,102,128,.2);
        }

        /* HERO */

        .hero {
          padding: 0 18px;
        }

        .heroImageWrap {
          position: relative;
          width: min(
            1200px,
            100%
          );
          min-height: 720px;
          margin: 0 auto;
          overflow: hidden;
          border-radius: 34px;
          background: var(--beige);
          box-shadow:
            0 26px 70px
            rgba(86,58,68,.1);
        }

        .heroImage {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position:
            center 43%;
        }

        .heroOverlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              90deg,
              rgba(255,250,249,.96) 0%,
              rgba(255,249,248,.82) 29%,
              rgba(255,249,248,.38) 49%,
              rgba(255,249,248,.03) 73%
            );
        }

        .heroCopy {
          position: relative;
          z-index: 2;
          width: 525px;
          padding:
            105px 0 95px 72px;
        }

        .heroSmall {
          margin:
            0 0 19px;
          color: var(--main);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .08em;
        }

        .hero h1 {
          margin: 0;
          color: var(--title);
          font-size:
            clamp(
              47px,
              5.7vw,
              72px
            );
          line-height: 1.28;
          letter-spacing: -.055em;
        }

        .hero h1 span {
          color: var(--main-dark);
        }

        .heroLead {
          margin:
            28px 0 31px;
          color: var(--text);
          font-size: 16px;
          line-height: 1.95;
        }

        .mainCta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          min-width: 255px;
          min-height: 59px;
          padding:
            14px 25px;
          border-radius: 16px;
          background: var(--main);
          color: white;
          font-size: 16px;
          font-weight: 800;
          box-shadow:
            0 13px 28px
            rgba(255,102,128,.25);
          transition:
            transform .2s ease;
        }

        .mainCta:hover {
          transform:
            translateY(-2px);
        }

        .mainCta span {
          font-size: 18px;
        }

        .heroNote {
          margin:
            12px 0 0;
          color: #9a8b90;
          font-size: 10px;
        }

        .signature {
          position: absolute;
          right: 36px;
          bottom: 25px;
          color:
            rgba(255,102,128,.72);
          font-family:
            "Bradley Hand",
            "Segoe Script",
            cursive;
          font-size: 28px;
          transform:
            rotate(-5deg);
        }

        /* INTRO */

        .intro {
          position: relative;
          width: min(
            840px,
            calc(100% - 40px)
          );
          margin: 0 auto;
          padding:
            120px 0 130px;
          text-align: center;
        }

        .eyebrow {
          margin:
            0 0 15px;
          color: var(--main);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .2em;
        }

        .intro h2 {
          margin: 0;
          color: var(--title);
          font-size:
            clamp(
              34px,
              5vw,
              50px
            );
          line-height: 1.55;
          letter-spacing: -.045em;
        }

        .intro h2 span {
          color: var(--main-dark);
        }

        .introText {
          margin:
            28px auto 0;
          max-width: 650px;
          color: #7d6d73;
          font-size: 15px;
          line-height: 2.1;
        }

        .handCopy {
          width: fit-content;
          margin:
            44px auto 0;
          padding:
            17px 25px;
          color: #7d636d;
          font-family:
            "Bradley Hand",
            "Segoe Script",
            cursive;
          font-size: 20px;
          line-height: 1.7;
          transform:
            rotate(-2deg);
          background:
            linear-gradient(
              135deg,
              #fff2f5,
              #f8efea
            );
          border-radius:
            2px 18px 4px 18px;
        }

        /* SCENES */

        .sceneSection {
          width: min(
            1070px,
            calc(100% - 36px)
          );
          margin: 0 auto;
        }

        .scene {
          display: grid;
          grid-template-columns:
            1.05fr .95fr;
          gap: 72px;
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
          overflow: hidden;
          border-radius: 28px;
          box-shadow:
            0 22px 55px
            rgba(82,57,65,.1);
        }

        .sceneImage {
          width: 100%;
          height: 650px;
          object-fit: cover;
        }

        .sceneCopy {
          padding: 18px;
        }

        .sceneNumber {
          display: block;
          margin-bottom: 20px;
          color: var(--sub);
          font-family:
            Georgia,
            serif;
          font-size: 50px;
          line-height: 1;
        }

        .sceneLabel {
          margin:
            0 0 13px;
          color: var(--main);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .18em;
        }

        .sceneCopy h2 {
          margin: 0;
          color: var(--title);
          font-size:
            clamp(
              33px,
              4vw,
              47px
            );
          line-height: 1.45;
          letter-spacing: -.04em;
        }

        .sceneText {
          margin:
            23px 0 0;
          color: #77676d;
          font-size: 15px;
          line-height: 2.05;
        }

        .sceneSignature {
          margin:
            25px 0 0;
          color: var(--main);
          font-family:
            "Bradley Hand",
            "Segoe Script",
            cursive;
          font-size: 21px;
          transform:
            rotate(-4deg);
          transform-origin:
            left center;
        }

        /* CONVERSATION */

        .conversationSection {
          padding:
            112px 20px;
          background: var(--beige);
        }

        .conversationInner {
          width: min(
            1000px,
            100%
          );
          margin: 0 auto;
          display: grid;
          grid-template-columns:
            .92fr 1.08fr;
          gap: 78px;
          align-items: center;
        }

        .conversationCopy h2 {
          margin: 0;
          color: var(--title);
          font-size:
            clamp(
              35px,
              5vw,
              50px
            );
          line-height: 1.45;
          letter-spacing: -.045em;
        }

        .conversationCopy > p:not(
          .eyebrow
        ) {
          margin:
            24px 0 0;
          color: #75656b;
          font-size: 15px;
          line-height: 2;
        }

        .handMessage {
          width: fit-content;
          margin-top: 30px;
          padding:
            16px 22px;
          background: white;
          border-radius:
            4px 18px 5px 18px;
          color: #80646e;
          font-family:
            "Bradley Hand",
            "Segoe Script",
            cursive;
          font-size: 17px;
          line-height: 1.6;
          box-shadow:
            0 10px 25px
            rgba(74,54,61,.06);
          transform:
            rotate(-2deg);
        }

        .chatCard {
          width: min(
            385px,
            100%
          );
          margin: 0 auto;
          overflow: hidden;
          border-radius: 30px;
          background: #f3f0ec;
          box-shadow:
            0 25px 60px
            rgba(71,49,57,.14);
        }

        .chatHeader {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 19px;
          background: white;
        }

        .chatHeader img {
          width: 42px;
          height: 42px;
          border-radius: 50%;
        }

        .chatHeader strong {
          display: block;
          color: var(--title);
          font-size: 14px;
        }

        .chatHeader span {
          display: block;
          margin-top: 2px;
          color: #a09297;
          font-size: 10px;
        }

        .chatBody {
          min-height: 470px;
          padding:
            24px 15px;
          display: flex;
          flex-direction: column;
        }

        .bubble {
          width: fit-content;
          max-width: 82%;
          margin-bottom: 11px;
          padding:
            11px 13px;
          border-radius: 17px;
          color: #56474c;
          font-size: 13px;
          line-height: 1.6;
        }

        .bubble.misaki {
          align-self:
            flex-start;
          background: white;
          border-bottom-left-radius:
            5px;
        }

        .bubble.user {
          align-self:
            flex-end;
          background: var(--sub);
          border-bottom-right-radius:
            5px;
        }

        .timeLabel {
          margin:
            5px auto 14px;
          color: #aaa0a3;
          font-size: 9px;
        }

        .fakeInput {
          margin:
            0 12px 13px;
          padding:
            14px 15px;
          border-radius: 18px;
          background: white;
          color: #b5aaae;
          font-size: 11px;
        }

        /* FEATURES */

        .features {
          width: min(
            1030px,
            calc(100% - 40px)
          );
          margin: 0 auto;
          padding:
            120px 0 125px;
        }

        .center {
          text-align: center;
        }

        .featureTitle {
          margin: 0;
          color: var(--title);
          text-align: center;
          font-size:
            clamp(
              33px,
              5vw,
              46px
            );
          line-height: 1.5;
          letter-spacing: -.04em;
        }

        .featureLead {
          max-width: 540px;
          margin:
            19px auto 45px;
          color: #84747a;
          text-align: center;
          font-size: 14px;
          line-height: 1.9;
        }

        .featureGrid {
          display: grid;
          grid-template-columns:
            repeat(2,1fr);
          gap: 18px;
        }

        .featureCard {
          min-height: 205px;
          padding: 28px;
          border-radius: 23px;
          background:
            linear-gradient(
              145deg,
              #fff,
              #fff8f9
            );
          border:
            1px solid
            rgba(118,88,98,.05);
          box-shadow:
            0 12px 32px
            rgba(74,52,59,.055);
        }

        .featureNumber {
          display: block;
          color: var(--sub);
          font-family:
            Georgia,
            serif;
          font-size: 31px;
        }

        .featureCard h3 {
          margin:
            15px 0 10px;
          color: var(--title);
          font-size: 18px;
        }

        .featureCard p {
          margin: 0;
          color: #7b6b71;
          font-size: 13px;
          line-height: 1.9;
        }

        /* TAXI */

        .taxiSection {
          padding:
            105px 20px;
          background:
            linear-gradient(
              180deg,
              #fff8f9,
              #f8efea
            );
        }

        .taxiInner {
          width: min(
            820px,
            100%
          );
          margin: 0 auto;
          text-align: center;
        }

        .taxiInner h2 {
          margin: 0;
          color: var(--title);
          font-size:
            clamp(
              35px,
              5vw,
              50px
            );
          line-height: 1.5;
          letter-spacing: -.04em;
        }

        .taxiInner h2 span {
          color: var(--main-dark);
        }

        .taxiLead {
          margin:
            25px 0 28px;
          color: #78686e;
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
          border-radius: 999px;
          background: white;
          color: #7a686f;
          font-size: 12px;
          box-shadow:
            0 6px 18px
            rgba(79,55,63,.05);
        }

        .taxiExample {
          width: min(
            470px,
            100%
          );
          margin:
            40px auto 0;
          padding:
            22px 25px;
          border-radius: 22px;
          background:
            rgba(255,255,255,.72);
        }

        .taxiExample p {
          margin: 0;
          color: var(--title);
          font-size: 17px;
          font-weight: 700;
        }

        .taxiExample span {
          display: block;
          margin-top: 9px;
          color: #9a8b90;
          font-size: 11px;
        }

        /* FINAL */

        .finalSection {
          padding:
            95px 18px;
        }

        .finalImageWrap {
          position: relative;
          width: min(
            1030px,
            100%
          );
          min-height: 650px;
          margin: 0 auto;
          overflow: hidden;
          border-radius: 34px;
          box-shadow:
            0 28px 70px
            rgba(78,51,60,.12);
        }

        .finalImage {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position:
            center 40%;
        }

        .finalOverlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              0deg,
              rgba(73,48,57,.68) 0%,
              rgba(73,48,57,.3) 35%,
              rgba(73,48,57,.02) 70%
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

        .finalSmall {
          margin:
            0 0 12px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .2em;
          opacity: .75;
        }

        .finalCopy h2 {
          margin: 0;
          font-size:
            clamp(
              34px,
              5vw,
              49px
            );
          line-height: 1.5;
          letter-spacing: -.04em;
        }

        .finalLead {
          margin:
            18px 0 27px;
          font-size: 13px;
          line-height: 1.9;
          color:
            rgba(255,255,255,.85);
        }

        .finalNote {
          margin:
            12px 0 0;
          color:
            rgba(255,255,255,.68);
          font-size: 10px;
        }

        .finalSignature {
          margin-top: 17px;
          font-family:
            "Bradley Hand",
            "Segoe Script",
            cursive;
          font-size: 25px;
          transform:
            rotate(-4deg);
        }

        /* FOOTER */

        footer {
          width: min(
            1040px,
            calc(100% - 40px)
          );
          margin: 0 auto;
          padding:
            18px 0 50px;
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

        .footerBrand strong {
          display: block;
          color: var(--title);
          font-size: 16px;
        }

        .footerBrand span {
          display: block;
          margin-top: 2px;
          color: #92848a;
          font-size: 10px;
        }

        footer small {
          color: #ada2a6;
          font-size: 9px;
        }

        /* MOBILE */

        @media (
          max-width: 760px
        ) {
          .desktopOnly {
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
            min-height: 37px;
            padding:
              8px 16px;
            font-size: 12px;
          }

          .hero {
            padding:
              0 10px;
          }

          .heroImageWrap {
            min-height: 715px;
            border-radius: 27px;
          }

          .heroImage {
            object-position:
              58% center;
          }

          .heroOverlay {
            background:
              linear-gradient(
                0deg,
                rgba(255,250,249,.98) 0%,
                rgba(255,250,249,.91) 27%,
                rgba(255,250,249,.34) 52%,
                rgba(255,250,249,.02) 76%
              );
          }

          .heroCopy {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            padding:
              35px 22px 35px;
            text-align: center;
          }

          .hero h1 {
            font-size: 39px;
            line-height: 1.3;
          }

          .heroLead {
            margin:
              19px 0 24px;
            font-size: 13px;
            line-height: 1.85;
          }

          .mainCta {
            width: 100%;
            max-width: 330px;
          }

          .signature {
            display: none;
          }

          .intro {
            padding:
              82px 0 90px;
          }

          .intro h2 {
            font-size: 29px;
          }

          .introText {
            font-size: 14px;
          }

          .handCopy {
            font-size: 18px;
          }

          .scene {
            grid-template-columns:
              1fr;
            gap: 25px;
            margin-bottom: 78px;
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
            text-align: center;
            padding:
              0 8px;
          }

          .sceneNumber {
            font-size: 40px;
          }

          .sceneCopy h2 {
            font-size: 29px;
          }

          .sceneText {
            font-size: 14px;
          }

          .sceneSignature {
            transform:
              rotate(-3deg);
          }

          .conversationSection {
            padding:
              82px 20px;
          }

          .conversationInner {
            grid-template-columns:
              1fr;
            gap: 42px;
          }

          .conversationCopy {
            text-align: center;
          }

          .conversationCopy h2 {
            font-size: 31px;
          }

          .conversationCopy >
            p:not(.eyebrow) {
            font-size: 14px;
          }

          .handMessage {
            margin:
              28px auto 0;
          }

          .features {
            padding:
              86px 0 90px;
          }

          .featureTitle {
            font-size: 30px;
          }

          .featureLead {
            margin-bottom: 30px;
          }

          .featureGrid {
            grid-template-columns:
              1fr;
          }

          .featureCard {
            min-height: auto;
            padding: 24px;
          }

          .taxiSection {
            padding:
              80px 20px;
          }

          .taxiInner h2 {
            font-size: 31px;
          }

          .taxiLead {
            font-size: 14px;
          }

          .finalSection {
            padding:
              70px 10px;
          }

          .finalImageWrap {
            min-height: 690px;
            border-radius: 27px;
          }

          .finalImage {
            object-position:
              center center;
          }

          .finalOverlay {
            background:
              linear-gradient(
                0deg,
                rgba(73,48,57,.78) 0%,
                rgba(73,48,57,.4) 35%,
                rgba(73,48,57,.02) 70%
              );
          }

          .finalCopy {
            padding:
              42px 22px 37px;
          }

          .finalCopy h2 {
            font-size: 31px;
          }

          footer {
            padding:
              8px 0 38px;
            flex-direction: column;
            gap: 20px;
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
