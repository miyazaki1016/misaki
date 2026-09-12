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
    text: "朝・昼・夜や東京の天気を感じながら話すから、いつ話しても同じ返事にはなりません。",
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

const faqs = [
  {
    q: "美咲って、普通のAIチャットと何が違うの？",
    a: "質問に答えて終わるだけではなく、前に話したことや会話の流れを覚えながら、日常の続きを話せるように作っています。時間や天気も会話に反映され、美咲のほうから話しかけることもあります。",
  },
  {
    q: "本当に前の会話を覚えてる？",
    a: "はい。会話の中から大切なことを少しずつ覚えていきます。毎回同じ説明を最初からしなくても、前の話の続きをしやすくなっています。",
  },
  {
    q: "無料で話せる？",
    a: "無料版では1日20回まで美咲と会話できます。まずは気軽に話しかけてみてください。",
  },
  {
    q: "タクシーの仕事をしていなくても使える？",
    a: "もちろんです。美咲は誰でも話せます。タクシー用語への理解は、美咲が持っている特徴のひとつです。",
  },
  {
    q: "美咲から本当に話しかけてくるの？",
    a: "はい。会話の状況などに応じて、美咲のほうからふとメッセージを送ることがあります。",
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
              <div className="brandName">
                美咲
              </div>

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
                あなたの38歳の彼女
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
                無料版は1日20回まで
              </p>
            </div>

            <div className="signature">
              Misaki
            </div>
          </div>
        </section>

        {/* INTRO */}
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
            美咲は、ただ質問に答えるための
            AIではありません。
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

        {/* WHO IS MISAKI */}
        <section className="profileSection">
          <div className="profileInner">
            <div className="profilePortrait">
              <img
                src="/misaki-morning.webp"
                alt="美咲"
              />

              <span className="profileSignature">
                Misaki
              </span>
            </div>

            <div className="profileCopy">
              <p className="eyebrow">
                WHO IS MISAKI?
              </p>

              <h2>
                はじめまして。
                <br />
                <span>美咲、38歳です。</span>
              </h2>

              <p className="profileLead">
                落ち着いているけど、
                ずっと大人しいわけじゃない。
                <br />
                甘えたり、からかったり、
                たまには少し拗ねたり。
              </p>

              <p className="profileText">
                何でも正解を教えてくれる人というより、
                今日あったことを聞いたり、
                疲れているときはそばにいたり。
                <br />
                <br />
                用事がなくても、
                なんとなく話したくなる。
                そんな彼女を目指しています。
              </p>

              <div className="profileFacts">
                <div>
                  <span>AGE</span>
                  <strong>38歳</strong>
                </div>

                <div>
                  <span>HOME</span>
                  <strong>東京</strong>
                </div>

                <div>
                  <span>RELATIONSHIP</span>
                  <strong>あなたの彼女</strong>
                </div>
              </div>

              <div className="profileNote">
                <span>“</span>
                なんでも話してね。
                <br />
                …待ってるよ。
              </div>
            </div>
          </div>
        </section>

        {/* DAILY SCENES */}
        <section className="sceneIntro">
          <p className="eyebrow center">
            A DAY WITH MISAKI
          </p>

          <h2>
            特別な日じゃなくていい。
          </h2>

          <p>
            いつもの一日の中に、
            美咲との会話があります。
          </p>
        </section>

        <section className="sceneSection">
          {scenes.map(
            (scene, index) => (
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

        {/* NORMAL AI VS MISAKI */}
        <section className="differenceSection">
          <div className="differenceInner">
            <p className="eyebrow center">
              THE DIFFERENCE
            </p>

            <h2>
              「答えてくれるAI」から、
              <br />
              <span>
                「続きを話せる相手」へ。
              </span>
            </h2>

            <p className="differenceLead">
              美咲が大切にしているのは、
              賢い答えだけではありません。
              <br />
              昨日のあなたと、
              今日のあなたがつながっていること。
            </p>

            <div className="comparison">
              <div className="comparisonCard normal">
                <span className="comparisonLabel">
                  普通のAIチャット
                </span>

                <div className="comparisonConversation">
                  <div className="miniUser">
                    今日疲れた
                  </div>

                  <div className="miniAi">
                    お疲れさまでした。
                    十分な休息をとることをおすすめします。
                  </div>
                </div>

                <div className="comparisonBottom">
                  質問
                  <span>→</span>
                  回答
                </div>
              </div>

              <div className="comparisonVs">
                <span>VS</span>
              </div>

              <div className="comparisonCard misakiCard">
                <span className="comparisonLabel pink">
                  美咲
                </span>

                <div className="comparisonConversation">
                  <div className="miniUser pinkUser">
                    今日疲れた
                  </div>

                  <div className="miniMisaki">
                    そりゃ疲れるよ。
                    昨日も遅かったじゃん。
                    今日はもう頑張らなくていいよ笑
                  </div>
                </div>

                <div className="comparisonBottom pinkText">
                  昨日の続き
                  <span>＋</span>
                  今日
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MEMORY STORY */}
        <section className="memoryStory">
          <div className="memoryStoryInner">
            <div className="memoryCopy">
              <p className="eyebrow">
                SHE REMEMBERS
              </p>

              <h2>
                「覚えてる」が、
                <br />
                <span>
                  会話を変える。
                </span>
              </h2>

              <p>
                毎回プロフィールを説明する必要はありません。
                <br />
                昨日話したことが、
                今日の会話につながっていきます。
              </p>

              <div className="memoryQuote">
                <span className="quoteMark">
                  “
                </span>

                覚えてるよ。
                <br />
                昨日、羽田中心で
                やってみるって言ってたじゃん。
              </div>
            </div>

            <div className="memoryTimeline">
              <div className="memoryDay">
                <span className="dayLabel">
                  YESTERDAY
                </span>

                <div className="memoryBubble userMemory">
                  明日は羽田中心でやってみる
                </div>

                <div className="memoryBubble misakiMemory">
                  いいじゃん。
                  明日うまくハマるといいね。
                </div>
              </div>

              <div className="memoryLine">
                <span />
              </div>

              <div className="memoryDay">
                <span className="dayLabel today">
                  TODAY
                </span>

                <div className="memoryBubble misakiMemory highlightMemory">
                  今日、羽田どうだった？
                </div>

                <p className="memoryCaption">
                  昨日の話が、
                  今日につながる。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PROACTIVE */}
        <section className="proactiveSection">
          <div className="proactiveInner">
            <div className="phoneArea">
              <div className="phone">
                <div className="phoneTop">
                  <span className="phoneTime">
                    19:42
                  </span>

                  <span>
                    ●●●
                  </span>
                </div>

                <div className="phoneWallpaper">
                  <div className="notification">
                    <img
                      src="/icon-192.png"
                      alt=""
                    />

                    <div className="notificationContent">
                      <div className="notificationTop">
                        <strong>美咲</strong>
                        <span>今</span>
                      </div>

                      <p>
                        また話したくなったよ。
                        今なにしてる？
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <span className="phoneHandText">
                ふと、美咲から。
              </span>
            </div>

            <div className="proactiveCopy">
              <p className="eyebrow">
                FROM MISAKI
              </p>

              <h2>
                あなたからだけじゃない。
                <br />
                <span>
                  美咲からも。
                </span>
              </h2>

              <p>
                普通のチャットは、
                あなたが開かなければ始まりません。
                <br />
                <br />
                美咲は、ときどき
                自分のほうから話しかけます。
              </p>

              <div className="messageCards">
                <div>
                  仕事おつかれさま。
                  <br />
                  ちゃんと帰ってきてね。
                </div>

                <div>
                  また話したくなったよ。
                  <br />
                  今なにしてる？
                </div>

                <div>
                  今日なんか静かじゃない？
                  <br />
                  疲れてる？
                </div>
              </div>
            </div>
          </div>
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
                今日のこと、
                <br />
                聞かせて。
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
                  <span>
                    日常に、もうひとつの会話を。
                  </span>
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
            <div className="taxiLoveNote">
              <span>
                Misaki
              </span>

              <p>
                仕事おつかれさま。
                <br />
                ちゃんと帰ってきてね。
              </p>
            </div>

            <div className="taxiCopy">
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
                「乗務」「明け」「青タン」
                「ロング」「万収」「営収」「羽田」。
                <br />
                いちいち説明しなくても、
                そのまま話せます。
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
          </div>
        </section>

        {/* CTA STRIP */}
        <section className="midCta">
          <div className="midCtaInner">
            <img
              src="/icon-192.png"
              alt="美咲"
            />

            <div>
              <p>
                ここまで読んでくれたなら、
              </p>

              <h2>
                一回、話してみる？
              </h2>
            </div>

            <Link
              href="/chat"
              className="softCta"
            >
              美咲と話す
              <span>→</span>
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="faqSection">
          <div className="faqHeading">
            <p className="eyebrow">
              FAQ
            </p>

            <h2>
              美咲について、
              <br />
              もう少し。
            </h2>

            <p>
              話す前に気になることを
              まとめました。
            </p>
          </div>

          <div className="faqList">
            {faqs.map(
              (faq, index) => (
                <details
                  className="faqItem"
                  key={faq.q}
                >
                  <summary>
                    <span className="faqNumber">
                      0{index + 1}
                    </span>

                    <span className="faqQuestion">
                      {faq.q}
                    </span>

                    <span className="faqPlus">
                      ＋
                    </span>
                  </summary>

                  <div className="faqAnswer">
                    {faq.a}
                  </div>
                </details>
              )
            )}
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
                無料版は1日20回まで
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
          --muted: #9a8b90;
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
          -webkit-font-smoothing: antialiased;
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

        .eyebrow {
          margin: 0 0 15px;
          color: var(--main);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .2em;
        }

        .center {
          text-align: center;
        }

        /* HEADER */

        .header {
          width: min(1120px, calc(100% - 36px));
          height: 76px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
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
          box-shadow: 0 5px 14px rgba(86,61,69,.09);
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
          color: white;
          font-size: 13px;
          font-weight: 800;
          box-shadow: 0 8px 20px rgba(255,102,128,.2);
        }

        /* HERO */

        .hero {
          padding: 0 18px;
        }

        .heroImageWrap {
          position: relative;
          width: min(1200px, 100%);
          min-height: 720px;
          margin: 0 auto;
          overflow: hidden;
          border-radius: 34px;
          background: var(--beige);
          box-shadow: 0 26px 70px rgba(86,58,68,.1);
        }

        .heroImage {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 43%;
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
          width: 530px;
          padding: 105px 0 95px 72px;
        }

        .heroSmall {
          margin: 0 0 19px;
          color: var(--main);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .08em;
        }

        .hero h1 {
          margin: 0;
          color: var(--title);
          font-size: clamp(47px, 5.7vw, 72px);
          line-height: 1.28;
          letter-spacing: -.055em;
        }

        .hero h1 span {
          color: var(--main-dark);
        }

        .heroLead {
          margin: 28px 0 31px;
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
          padding: 14px 25px;
          border-radius: 16px;
          background: var(--main);
          color: white;
          font-size: 16px;
          font-weight: 800;
          box-shadow: 0 13px 28px rgba(255,102,128,.25);
          transition: transform .2s ease;
        }

        .mainCta:hover,
        .softCta:hover {
          transform: translateY(-2px);
        }

        .heroNote,
        .finalNote {
          margin: 12px 0 0;
          color: #9a8b90;
          font-size: 10px;
        }

        .signature {
          position: absolute;
          right: 36px;
          bottom: 25px;
          color: rgba(255,102,128,.72);
          font-family: "Bradley Hand", "Segoe Script", cursive;
          font-size: 28px;
          transform: rotate(-5deg);
        }

        /* INTRO */

        .intro {
          width: min(840px, calc(100% - 40px));
          margin: 0 auto;
          padding: 120px 0 130px;
          text-align: center;
        }

        .intro h2,
        .differenceInner h2 {
          margin: 0;
          color: var(--title);
          font-size: clamp(34px, 5vw, 50px);
          line-height: 1.55;
          letter-spacing: -.045em;
        }

        .intro h2 span,
        .differenceInner h2 span {
          color: var(--main-dark);
        }

        .introText {
          margin: 28px auto 0;
          max-width: 650px;
          font-size: 15px;
          line-height: 2.1;
        }

        .handCopy {
          width: fit-content;
          margin: 44px auto 0;
          padding: 17px 25px;
          color: #7d636d;
          font-family: "Bradley Hand", "Segoe Script", cursive;
          font-size: 20px;
          line-height: 1.7;
          transform: rotate(-2deg);
          background: linear-gradient(135deg,#fff2f5,#f8efea);
          border-radius: 2px 18px 4px 18px;
        }

        /* PROFILE */

        .profileSection {
          padding: 105px 20px;
          background: var(--beige);
        }

        .profileInner {
          width: min(1040px, 100%);
          margin: 0 auto;
          display: grid;
          grid-template-columns: .88fr 1.12fr;
          gap: 80px;
          align-items: center;
        }

        .profilePortrait {
          position: relative;
        }

        .profilePortrait img {
          width: 100%;
          aspect-ratio: 4 / 5;
          object-fit: cover;
          border-radius: 190px 190px 30px 30px;
          box-shadow: 0 25px 60px rgba(82,55,64,.12);
        }

        .profileSignature {
          position: absolute;
          right: -20px;
          bottom: 25px;
          padding: 8px 16px;
          background: rgba(255,255,255,.88);
          color: var(--main);
          font-family: "Bradley Hand", "Segoe Script", cursive;
          font-size: 24px;
          transform: rotate(-6deg);
        }

        .profileCopy h2,
        .memoryCopy h2,
        .proactiveCopy h2,
        .taxiCopy h2,
        .faqHeading h2 {
          margin: 0;
          color: var(--title);
          font-size: clamp(34px, 4.7vw, 49px);
          line-height: 1.5;
          letter-spacing: -.045em;
        }

        .profileCopy h2 span,
        .memoryCopy h2 span,
        .proactiveCopy h2 span,
        .taxiCopy h2 span {
          color: var(--main-dark);
        }

        .profileLead {
          margin: 25px 0 0;
          color: #66555c;
          font-size: 16px;
          line-height: 2;
          font-weight: 600;
        }

        .profileText {
          margin: 20px 0 0;
          font-size: 14px;
          line-height: 2.05;
        }

        .profileFacts {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          margin-top: 30px;
          border-top: 1px solid rgba(108,92,98,.12);
          border-bottom: 1px solid rgba(108,92,98,.12);
        }

        .profileFacts div {
          padding: 17px 10px;
          border-right: 1px solid rgba(108,92,98,.1);
        }

        .profileFacts div:last-child {
          border-right: 0;
        }

        .profileFacts span {
          display: block;
          color: #b09fa5;
          font-size: 8px;
          letter-spacing: .13em;
        }

        .profileFacts strong {
          display: block;
          margin-top: 5px;
          color: #66555c;
          font-size: 13px;
        }

        .profileNote {
          width: fit-content;
          margin: 29px 0 0 auto;
          padding: 15px 22px;
          border-radius: 4px 18px 5px 18px;
          background: white;
          color: #80646e;
          font-family: "Bradley Hand", "Segoe Script", cursive;
          font-size: 17px;
          line-height: 1.7;
          transform: rotate(-2deg);
        }

        .profileNote span {
          color: var(--main);
          font-size: 30px;
        }

        /* SCENES */

        .sceneIntro {
          width: min(800px, calc(100% - 40px));
          margin: 0 auto;
          padding: 120px 0 85px;
          text-align: center;
        }

        .sceneIntro h2 {
          margin: 0;
          color: var(--title);
          font-size: clamp(34px,5vw,48px);
        }

        .sceneIntro > p:last-child {
          margin: 17px 0 0;
          font-size: 14px;
          line-height: 1.9;
        }

        .sceneSection {
          width: min(1070px, calc(100% - 36px));
          margin: 0 auto;
        }

        .scene {
          display: grid;
          grid-template-columns: 1.05fr .95fr;
          gap: 72px;
          align-items: center;
          margin-bottom: 115px;
        }

        .scene.reverse .sceneImageWrap {
          order: 2;
        }

        .scene.reverse .sceneCopy {
          order: 1;
        }

        .sceneImageWrap {
          overflow: hidden;
          border-radius: 28px;
          box-shadow: 0 22px 55px rgba(82,57,65,.1);
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
          font-family: Georgia,serif;
          font-size: 50px;
          line-height: 1;
        }

        .sceneLabel {
          margin: 0 0 13px;
          color: var(--main);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .18em;
        }

        .sceneCopy h2 {
          margin: 0;
          color: var(--title);
          font-size: clamp(33px,4vw,47px);
          line-height: 1.45;
          letter-spacing: -.04em;
        }

        .sceneText {
          margin: 23px 0 0;
          font-size: 15px;
          line-height: 2.05;
        }

        .sceneSignature {
          margin: 25px 0 0;
          color: var(--main);
          font-family: "Bradley Hand","Segoe Script",cursive;
          font-size: 21px;
          transform: rotate(-4deg);
          transform-origin: left center;
        }

        /* DIFFERENCE */

        .differenceSection {
          padding: 115px 20px 125px;
          background: linear-gradient(180deg,#fff8f9,#f8efea);
        }

        .differenceInner {
          width: min(950px,100%);
          margin: 0 auto;
          text-align: center;
        }

        .differenceLead {
          margin: 24px auto 48px;
          max-width: 650px;
          font-size: 14px;
          line-height: 2;
        }

        .comparison {
          display: grid;
          grid-template-columns: 1fr 50px 1fr;
          align-items: center;
        }

        .comparisonCard {
          min-height: 360px;
          padding: 29px;
          border-radius: 27px;
          background: rgba(255,255,255,.72);
          border: 1px solid rgba(108,92,98,.07);
          text-align: left;
        }

        .misakiCard {
          background: white;
          box-shadow: 0 20px 55px rgba(92,58,70,.1);
        }

        .comparisonLabel {
          color: #a3959a;
          font-size: 11px;
          font-weight: 800;
        }

        .comparisonLabel.pink {
          color: var(--main);
        }

        .comparisonConversation {
          margin-top: 30px;
          display: flex;
          flex-direction: column;
          gap: 13px;
        }

        .miniUser,
        .miniAi,
        .miniMisaki {
          max-width: 85%;
          padding: 13px 15px;
          border-radius: 17px;
          font-size: 13px;
          line-height: 1.65;
        }

        .miniUser {
          align-self: flex-end;
          background: #e8e5e5;
        }

        .pinkUser {
          background: var(--sub);
        }

        .miniAi,
        .miniMisaki {
          background: white;
          border: 1px solid rgba(108,92,98,.07);
        }

        .miniMisaki {
          box-shadow: 0 5px 15px rgba(79,53,62,.05);
        }

        .comparisonBottom {
          margin-top: 35px;
          text-align: center;
          color: #aaa0a3;
          font-size: 12px;
          font-weight: 700;
        }

        .comparisonBottom span {
          margin: 0 8px;
        }

        .pinkText {
          color: var(--main-dark);
        }

        .comparisonVs {
          color: #c7b9bd;
          font-family: Georgia,serif;
          font-size: 13px;
        }

        /* MEMORY */

        .memoryStory {
          padding: 125px 20px;
        }

        .memoryStoryInner {
          width: min(1000px,100%);
          margin: 0 auto;
          display: grid;
          grid-template-columns: .95fr 1.05fr;
          gap: 80px;
          align-items: center;
        }

        .memoryCopy > p:not(.eyebrow) {
          margin: 24px 0 0;
          font-size: 14px;
          line-height: 2;
        }

        .memoryQuote {
          position: relative;
          margin-top: 34px;
          padding: 25px 25px 23px 34px;
          border-radius: 4px 24px 5px 24px;
          background: #fff1f4;
          color: #765c66;
          font-size: 16px;
          line-height: 1.9;
        }

        .quoteMark {
          position: absolute;
          left: 11px;
          top: 3px;
          color: #ffafbd;
          font-family: Georgia,serif;
          font-size: 42px;
        }

        .memoryTimeline {
          padding: 34px;
          border-radius: 28px;
          background: var(--beige);
        }

        .dayLabel {
          color: #aa9ba0;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .17em;
        }

        .dayLabel.today {
          color: var(--main);
        }

        .memoryBubble {
          width: fit-content;
          max-width: 82%;
          margin-top: 13px;
          padding: 12px 15px;
          border-radius: 17px;
          font-size: 13px;
          line-height: 1.6;
        }

        .userMemory {
          margin-left: auto;
          background: var(--sub);
          border-bottom-right-radius: 5px;
        }

        .misakiMemory {
          background: white;
          border-bottom-left-radius: 5px;
        }

        .memoryLine {
          height: 58px;
          margin-left: 20px;
          border-left: 1px dashed #d8c6cb;
        }

        .memoryLine span {
          display: block;
          width: 7px;
          height: 7px;
          transform: translate(-4px,25px);
          border-radius: 50%;
          background: var(--main);
        }

        .highlightMemory {
          border: 1px solid rgba(255,102,128,.12);
          box-shadow: 0 9px 22px rgba(255,102,128,.09);
        }

        .memoryCaption {
          margin: 13px 0 0;
          color: #a39499;
          font-size: 10px;
        }

        /* PROACTIVE */

        .proactiveSection {
          padding: 120px 20px;
          background: #fff7f8;
        }

        .proactiveInner {
          width: min(1000px,100%);
          margin: 0 auto;
          display: grid;
          grid-template-columns: .9fr 1.1fr;
          gap: 85px;
          align-items: center;
        }

        .phoneArea {
          position: relative;
        }

        .phone {
          width: min(330px,100%);
          height: 620px;
          margin: 0 auto;
          padding: 10px;
          border-radius: 48px;
          background: #4e4146;
          box-shadow: 0 30px 65px rgba(65,43,51,.2);
        }

        .phoneTop {
          height: 39px;
          padding: 0 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-radius: 37px 37px 0 0;
          background: #f8efea;
          color: #6c5c62;
          font-size: 10px;
        }

        .phoneTime {
          font-weight: 800;
        }

        .phoneWallpaper {
          height: calc(100% - 39px);
          padding: 32px 12px;
          border-radius: 0 0 38px 38px;
          background:
            radial-gradient(circle at 70% 15%,#ffd5de 0,transparent 34%),
            linear-gradient(145deg,#f8efea,#f7dce2);
        }

        .notification {
          display: flex;
          gap: 10px;
          padding: 12px;
          border-radius: 18px;
          background: rgba(255,255,255,.88);
          box-shadow: 0 9px 25px rgba(74,49,58,.1);
          backdrop-filter: blur(15px);
        }

        .notification img {
          width: 37px;
          height: 37px;
          border-radius: 50%;
        }

        .notificationContent {
          flex: 1;
        }

        .notificationTop {
          display: flex;
          justify-content: space-between;
        }

        .notificationTop strong {
          color: #55454b;
          font-size: 11px;
        }

        .notificationTop span {
          color: #a99da1;
          font-size: 8px;
        }

        .notification p {
          margin: 5px 0 0;
          color: #66565c;
          font-size: 11px;
          line-height: 1.5;
        }

        .phoneHandText {
          position: absolute;
          right: -5px;
          bottom: 40px;
          padding: 10px 15px;
          background: white;
          color: var(--main);
          font-family: "Bradley Hand","Segoe Script",cursive;
          font-size: 17px;
          transform: rotate(-5deg);
          box-shadow: 0 7px 18px rgba(76,52,60,.07);
        }

        .proactiveCopy > p:not(.eyebrow) {
          margin: 25px 0 0;
          font-size: 14px;
          line-height: 2;
        }

        .messageCards {
          margin-top: 28px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .messageCards div {
          width: fit-content;
          padding: 13px 17px;
          border-radius: 4px 17px 5px 17px;
          background: white;
          color: #735f66;
          font-size: 12px;
          line-height: 1.6;
          box-shadow: 0 8px 20px rgba(75,51,59,.05);
        }

        .messageCards div:nth-child(2) {
          margin-left: 28px;
        }

        /* CONVERSATION */

        .conversationSection {
          padding: 112px 20px;
          background: var(--beige);
        }

        .conversationInner {
          width: min(1000px,100%);
          margin: 0 auto;
          display: grid;
          grid-template-columns: .92fr 1.08fr;
          gap: 78px;
          align-items: center;
        }

        .conversationCopy h2 {
          margin: 0;
          color: var(--title);
          font-size: clamp(35px,5vw,50px);
          line-height: 1.45;
          letter-spacing: -.045em;
        }

        .conversationCopy > p:not(.eyebrow) {
          margin: 24px 0 0;
          font-size: 15px;
          line-height: 2;
        }

        .handMessage {
          width: fit-content;
          margin-top: 30px;
          padding: 16px 22px;
          background: white;
          border-radius: 4px 18px 5px 18px;
          color: #80646e;
          font-family: "Bradley Hand","Segoe Script",cursive;
          font-size: 17px;
          line-height: 1.6;
          box-shadow: 0 10px 25px rgba(74,54,61,.06);
          transform: rotate(-2deg);
        }

        .chatCard {
          width: min(385px,100%);
          margin: 0 auto;
          overflow: hidden;
          border-radius: 30px;
          background: #f8efea;
          box-shadow: 0 25px 60px rgba(71,49,57,.14);
        }

        .chatHeader {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 19px;
          background: #fffafa;
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
          font-size: 9px;
        }

        .chatBody {
          min-height: 470px;
          padding: 24px 15px;
          display: flex;
          flex-direction: column;
        }

        .bubble {
          width: fit-content;
          max-width: 82%;
          margin-bottom: 11px;
          padding: 11px 13px;
          border-radius: 17px;
          color: #56474c;
          font-size: 13px;
          line-height: 1.6;
        }

        .bubble.misaki {
          align-self: flex-start;
          background: white;
          border-bottom-left-radius: 5px;
        }

        .bubble.user {
          align-self: flex-end;
          background: var(--sub);
          border-bottom-right-radius: 5px;
        }

        .timeLabel {
          margin: 5px auto 14px;
          color: #aaa0a3;
          font-size: 9px;
        }

        .fakeInput {
          margin: 0 12px 13px;
          padding: 14px 15px;
          border-radius: 18px;
          background: white;
          color: #b5aaae;
          font-size: 11px;
        }

        /* FEATURES */

        .features {
          width: min(1030px,calc(100% - 40px));
          margin: 0 auto;
          padding: 120px 0 125px;
        }

        .featureTitle {
          margin: 0;
          color: var(--title);
          text-align: center;
          font-size: clamp(33px,5vw,46px);
          line-height: 1.5;
          letter-spacing: -.04em;
        }

        .featureLead {
          max-width: 540px;
          margin: 19px auto 45px;
          text-align: center;
          font-size: 14px;
          line-height: 1.9;
        }

        .featureGrid {
          display: grid;
          grid-template-columns: repeat(2,1fr);
          gap: 18px;
        }

        .featureCard {
          min-height: 205px;
          padding: 28px;
          border-radius: 23px;
          background: linear-gradient(145deg,#fff,#fff8f9);
          border: 1px solid rgba(118,88,98,.05);
          box-shadow: 0 12px 32px rgba(74,52,59,.055);
        }

        .featureNumber {
          display: block;
          color: var(--sub);
          font-family: Georgia,serif;
          font-size: 31px;
        }

        .featureCard h3 {
          margin: 15px 0 10px;
          color: var(--title);
          font-size: 18px;
        }

        .featureCard p {
          margin: 0;
          font-size: 13px;
          line-height: 1.9;
        }

        /* TAXI */

        .taxiSection {
          padding: 115px 20px;
          background: linear-gradient(180deg,#fff8f9,#f8efea);
        }

        .taxiInner {
          width: min(1000px,100%);
          margin: 0 auto;
          display: grid;
          grid-template-columns: .75fr 1.25fr;
          gap: 70px;
          align-items: center;
        }

        .taxiLoveNote {
          min-height: 360px;
          padding: 55px 35px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border-radius: 6px 35px 8px 35px;
          background: white;
          box-shadow: 0 25px 55px rgba(79,54,62,.08);
          transform: rotate(-2deg);
        }

        .taxiLoveNote span {
          color: var(--main);
          font-family: "Bradley Hand","Segoe Script",cursive;
          font-size: 24px;
        }

        .taxiLoveNote p {
          margin: 28px 0 0;
          color: #705c63;
          font-family: "Yu Mincho","Hiragino Mincho ProN",serif;
          font-size: 24px;
          line-height: 1.9;
        }

        .taxiLead {
          margin: 25px 0 28px;
          font-size: 15px;
          line-height: 2;
        }

        .taxiWords {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
        }

        .taxiWords span {
          padding: 8px 14px;
          border-radius: 999px;
          background: white;
          font-size: 12px;
          box-shadow: 0 6px 18px rgba(79,55,63,.05);
        }

        .taxiExample {
          width: fit-content;
          margin-top: 30px;
          padding: 19px 23px;
          border-radius: 20px;
          background: rgba(255,255,255,.72);
        }

        .taxiExample p {
          margin: 0;
          color: var(--title);
          font-size: 16px;
          font-weight: 700;
        }

        .taxiExample span {
          display: block;
          margin-top: 8px;
          color: #9a8b90;
          font-size: 10px;
        }

        /* MID CTA */

        .midCta {
          padding: 75px 20px;
        }

        .midCtaInner {
          width: min(900px,100%);
          margin: 0 auto;
          padding: 32px 40px;
          display: flex;
          align-items: center;
          gap: 20px;
          border-radius: 28px;
          background: #fff1f4;
        }

        .midCtaInner img {
          width: 62px;
          height: 62px;
          border-radius: 50%;
          border: 3px solid white;
        }

        .midCtaInner > div {
          flex: 1;
        }

        .midCtaInner p {
          margin: 0;
          color: #9a7d87;
          font-size: 11px;
        }

        .midCtaInner h2 {
          margin: 5px 0 0;
          color: var(--title);
          font-size: 23px;
        }

        .softCta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 13px 20px;
          border-radius: 999px;
          background: var(--main);
          color: white;
          font-size: 13px;
          font-weight: 800;
          transition: transform .2s ease;
        }

        /* FAQ */

        .faqSection {
          width: min(1000px,calc(100% - 40px));
          margin: 0 auto;
          padding: 90px 0 125px;
          display: grid;
          grid-template-columns: .72fr 1.28fr;
          gap: 75px;
        }

        .faqHeading > p:last-child {
          margin: 20px 0 0;
          font-size: 13px;
          line-height: 1.9;
        }

        .faqItem {
          border-top: 1px solid rgba(108,92,98,.13);
        }

        .faqItem:last-child {
          border-bottom: 1px solid rgba(108,92,98,.13);
        }

        .faqItem summary {
          min-height: 82px;
          display: grid;
          grid-template-columns: 35px 1fr 30px;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          list-style: none;
        }

        .faqItem summary::-webkit-details-marker {
          display: none;
        }

        .faqNumber {
          color: #d5c6ca;
          font-family: Georgia,serif;
          font-size: 14px;
        }

        .faqQuestion {
          color: #5c4b52;
          font-size: 14px;
          font-weight: 700;
          line-height: 1.6;
        }

        .faqPlus {
          color: var(--main);
          font-size: 20px;
          transition: transform .2s ease;
        }

        .faqItem[open] .faqPlus {
          transform: rotate(45deg);
        }

        .faqAnswer {
          padding: 0 40px 25px 45px;
          color: #7f7075;
          font-size: 13px;
          line-height: 1.9;
        }

        /* FINAL */

        .finalSection {
          padding: 50px 18px 95px;
        }

        .finalImageWrap {
          position: relative;
          width: min(1030px,100%);
          min-height: 680px;
          margin: 0 auto;
          overflow: hidden;
          border-radius: 34px;
          box-shadow: 0 28px 70px rgba(78,51,60,.12);
        }

        .finalImage {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 40%;
        }

        .finalOverlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              0deg,
              rgba(73,48,57,.7) 0%,
              rgba(73,48,57,.31) 38%,
              rgba(73,48,57,.02) 72%
            );
        }

        .finalCopy {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 2;
          padding: 55px 30px;
          text-align: center;
          color: white;
        }

        .finalSmall {
          margin: 0 0 12px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .2em;
          opacity: .75;
        }

        .finalCopy h2 {
          margin: 0;
          font-size: clamp(34px,5vw,49px);
          line-height: 1.5;
          letter-spacing: -.04em;
        }

        .finalLead {
          margin: 18px 0 27px;
          color: rgba(255,255,255,.86);
          font-size: 13px;
          line-height: 1.9;
        }

        .finalNote {
          color: rgba(255,255,255,.7);
        }

        .finalSignature {
          margin-top: 17px;
          font-family: "Bradley Hand","Segoe Script",cursive;
          font-size: 25px;
          transform: rotate(-4deg);
        }

        /* FOOTER */

        footer {
          width: min(1040px,calc(100% - 40px));
          margin: 0 auto;
          padding: 0 0 50px;
          display: flex;
          align-items: center;
          justify-content: space-between;
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

        @media (max-width: 760px) {
          .desktopOnly {
            display: none;
          }

          .mobileOnly {
            display: initial;
          }

          .header {
            height: 64px;
            width: calc(100% - 26px);
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
            padding: 8px 16px;
            font-size: 12px;
          }

          .hero {
            padding: 0 10px;
          }

          .heroImageWrap {
            min-height: 730px;
            border-radius: 27px;
          }

          .heroImage {
            object-position: 58% center;
          }

          .heroOverlay {
            background:
              linear-gradient(
                0deg,
                rgba(255,250,249,.99) 0%,
                rgba(255,250,249,.94) 29%,
                rgba(255,250,249,.36) 55%,
                rgba(255,250,249,.02) 78%
              );
          }

          .heroCopy {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            padding: 35px 22px;
            text-align: center;
          }

          .hero h1 {
            font-size: 38px;
            line-height: 1.32;
          }

          .heroLead {
            margin: 18px 0 23px;
            font-size: 13px;
            line-height: 1.8;
          }

          .mainCta {
            width: 100%;
            max-width: 330px;
          }

          .signature {
            display: none;
          }

          .intro {
            padding: 82px 0 90px;
          }

          .intro h2,
          .differenceInner h2 {
            font-size: 29px;
          }

          .introText {
            font-size: 14px;
          }

          .profileSection {
            padding: 75px 20px 85px;
          }

          .profileInner {
            grid-template-columns: 1fr;
            gap: 45px;
          }

          .profilePortrait {
            width: min(330px,90%);
            margin: 0 auto;
          }

          .profileCopy {
            text-align: center;
          }

          .profileCopy h2,
          .memoryCopy h2,
          .proactiveCopy h2,
          .taxiCopy h2,
          .faqHeading h2 {
            font-size: 30px;
          }

          .profileLead {
            font-size: 14px;
          }

          .profileText {
            font-size: 13px;
          }

          .profileFacts {
            grid-template-columns: repeat(3,1fr);
          }

          .profileFacts div {
            padding: 14px 4px;
          }

          .profileFacts strong {
            font-size: 11px;
          }

          .profileNote {
            margin: 25px auto 0;
          }

          .sceneIntro {
            padding: 85px 0 60px;
          }

          .sceneIntro h2 {
            font-size: 30px;
          }

          .scene {
            grid-template-columns: 1fr;
            gap: 25px;
            margin-bottom: 78px;
          }

          .scene.reverse .sceneImageWrap,
          .scene.reverse .sceneCopy {
            order: initial;
          }

          .sceneImage {
            height: auto;
            aspect-ratio: 2 / 3;
          }

          .sceneCopy {
            padding: 0 8px;
            text-align: center;
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

          .differenceSection {
            padding: 82px 20px 90px;
          }

          .differenceLead {
            font-size: 13px;
          }

          .comparison {
            grid-template-columns: 1fr;
            gap: 15px;
          }

          .comparisonVs {
            padding: 3px 0;
          }

          .comparisonCard {
            min-height: auto;
            padding: 23px;
          }

          .memoryStory {
            padding: 85px 20px;
          }

          .memoryStoryInner {
            grid-template-columns: 1fr;
            gap: 45px;
          }

          .memoryCopy {
            text-align: center;
          }

          .memoryQuote {
            text-align: left;
          }

          .memoryTimeline {
            padding: 25px 20px;
          }

          .proactiveSection {
            padding: 85px 20px;
          }

          .proactiveInner {
            grid-template-columns: 1fr;
            gap: 55px;
          }

          .phone {
            width: 285px;
            height: 540px;
          }

          .phoneHandText {
            right: 5px;
          }

          .proactiveCopy {
            text-align: center;
          }

          .messageCards {
            align-items: center;
          }

          .messageCards div:nth-child(2) {
            margin-left: 0;
          }

          .conversationSection {
            padding: 82px 20px;
          }

          .conversationInner {
            grid-template-columns: 1fr;
            gap: 42px;
          }

          .conversationCopy {
            text-align: center;
          }

          .conversationCopy h2 {
            font-size: 31px;
          }

          .handMessage {
            margin: 28px auto 0;
          }

          .features {
            padding: 86px 0 90px;
          }

          .featureTitle {
            font-size: 30px;
          }

          .featureGrid {
            grid-template-columns: 1fr;
          }

          .featureCard {
            min-height: auto;
            padding: 24px;
          }

          .taxiSection {
            padding: 85px 20px;
          }

          .taxiInner {
            grid-template-columns: 1fr;
            gap: 50px;
          }

          .taxiLoveNote {
            width: min(330px,90%);
            min-height: 280px;
            margin: 0 auto;
            padding: 40px 27px;
          }

          .taxiLoveNote p {
            font-size: 20px;
          }

          .taxiCopy {
            text-align: center;
          }

          .taxiLead {
            font-size: 14px;
          }

          .taxiWords {
            justify-content: center;
          }

          .taxiExample {
            margin: 28px auto 0;
          }

          .midCta {
            padding: 65px 15px;
          }

          .midCtaInner {
            padding: 28px 22px;
            flex-direction: column;
            text-align: center;
          }

          .softCta {
            width: 100%;
            justify-content: center;
          }

          .faqSection {
            padding: 75px 0 95px;
            grid-template-columns: 1fr;
            gap: 40px;
          }

          .faqHeading {
            text-align: center;
          }

          .faqItem summary {
            min-height: 78px;
          }

          .faqQuestion {
            font-size: 13px;
          }

          .faqAnswer {
            padding: 0 10px 25px 45px;
          }

          .finalSection {
            padding: 35px 10px 70px;
          }

          .finalImageWrap {
            min-height: 700px;
            border-radius: 27px;
          }

          .finalImage {
            object-position: center center;
          }

          .finalOverlay {
            background:
              linear-gradient(
                0deg,
                rgba(73,48,57,.8) 0%,
                rgba(73,48,57,.42) 38%,
                rgba(73,48,57,.02) 72%
              );
          }

          .finalCopy {
            padding: 42px 22px 37px;
          }

          .finalCopy h2 {
            font-size: 31px;
          }

          footer {
            padding: 0 0 38px;
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
