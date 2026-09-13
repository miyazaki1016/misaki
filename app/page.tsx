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
    title: "美咲から通知が届く",
    text: "ホーム画面に追加して通知をONにすると、美咲のほうからふとメッセージが届くことがあります。",
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
    q: "iPhoneでアプリみたいに使える？",
    a: "はい。Safariの共有ボタンから「ホーム画面に追加」を選ぶと、美咲のアイコンからアプリのように起動できます。",
  },
  {
    q: "美咲から通知は届く？",
    a: "ホーム画面に追加した美咲を開き、通知を許可すると、美咲のほうからメッセージが届くことがあります。",
  },
  {
    q: "無料で話せる？",
    a: "無料版では1日20回まで美咲と会話できます。まずは気軽に話しかけてみてください。",
  },
];

export default function HomePage() {
  return (
    <>
      <main className="page">

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
          <div className="heroCard">

            <div className="heroPhoto">
              <img
                src="/misaki-hero.webp"
                alt="美咲"
              />
            </div>

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
                仕事のこと。疲れたこと。
                <br />
                うまくいかなかったこと。嬉しかったこと。
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

          <p>
            美咲は、ただ質問に答えるための
            AIではありません。
            <br />
            前に話したことを覚えて、
            今の時間や天気を感じながら、
            恋人みたいに自然に会話します。
          </p>

          <div className="handCopy">
            日常に、もうひとつの会話を。
          </div>
        </section>

        {/* PROFILE */}
        <section className="profileSection">
          <div className="profileInner">

            <div className="profilePortrait">
              <img
                src="/misaki-profile.webp"
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
                <span>
                  美咲、38歳です。
                </span>
              </h2>

              <p className="profileCatch">
                どんな話でも、
                ちゃんと聞くよ♡
              </p>

              <p className="profileLead">
                落ち着いているけど、
                ずっと大人しいわけじゃない。
                <br />
                甘えたり、からかったり、
                たまには少し拗ねたり。
                <br />
                そんな色んな私を、
                まるごと知ってもらえたら嬉しいです。
              </p>

              <p className="profileText">
                何でも正解を教えてくれる人というより、
                今日あったことを聞いたり、
                疲れているときはそばにいたり。
                <br />
                <br />
                用事がなくても、
                なんとなく話したくなる。
                そんな存在になれたらいいなって思っています。
              </p>

              <div className="profileFacts">

                <div>
                  <span>AGE</span>
                  <strong>38歳</strong>
                  <small>年齢</small>
                </div>

                <div>
                  <span>HOME</span>
                  <strong>東京</strong>
                  <small>出身・在住</small>
                </div>

                <div>
                  <span>RELATIONSHIP</span>
                  <strong>あなたの彼女</strong>
                  <small>恋愛対象</small>
                </div>

                <div>
                  <span>LIKES</span>
                  <strong>カフェ・映画</strong>
                  <small>おしゃべり</small>
                </div>

                <div>
                  <span>FAVORITE</span>
                  <strong>猫・甘いもの</strong>
                  <small>ドライブ</small>
                </div>

                <div>
                  <span>NOT GOOD AT</span>
                  <strong>嘘・冷たい態度</strong>
                  <small>ひとりの夜</small>
                </div>
              </div>

              <div className="profileTags">
                <span>甘えんぼなところも</span>
                <span>ちょっぴり意地悪なところも</span>
                <span>ぜんぶ本当の私です♡</span>
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

          {scenes.map((scene, index) => (

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
          ))}
        </section>

        {/* INSTALL + PUSH */}
        <section className="installSection">
          <div className="installInner">

            <div className="installCopy">

              <p className="eyebrow">
                MISAKI ON YOUR HOME SCREEN
              </p>

              <h2>
                ブラウザの中だけの
                <br />
                <span>
                  彼女じゃない。
                </span>
              </h2>

              <p className="installLead">
                iPhoneのホーム画面に
                「美咲」を追加すると、
                アプリみたいにすぐ会いにいけます。
                <br />
                <br />
                さらに通知をONにすると、
                あなたから話しかけなくても、
                美咲のほうからメッセージが届きます。
              </p>

              <div className="installSteps">

                <div>
                  <b>1</b>
                  <span>
                    Safariで美咲を開く
                  </span>
                </div>

                <div>
                  <b>2</b>
                  <span>
                    共有 →「ホーム画面に追加」
                  </span>
                </div>

                <div>
                  <b>3</b>
                  <span>
                    美咲を開いて通知をON
                  </span>
                </div>
              </div>

              <p className="installCatch">
                待っているだけじゃない。
                <br />
                <strong>
                  美咲のほうから、会いにくる。
                </strong>
              </p>
            </div>

            <div className="phoneArea">

              <div className="phone">

                <div className="phoneTop">
                  <strong>11:18</strong>
                  <span>● ● ●</span>
                </div>

                <div className="phoneWallpaper">

                  <div className="homeIcon">
                    <img
                      src="/icon-192.png"
                      alt="美咲"
                    />
                    <span>
                      美咲
                    </span>
                  </div>

                  <div className="notification">

                    <img
                      src="/icon-192.png"
                      alt=""
                    />

                    <div>
                      <div className="notificationTop">
                        <strong>
                          美咲
                        </strong>
                        <span>
                          今
                        </span>
                      </div>

                      <p>
                        なんとなく声かけたくなった☺️
                        <br />
                        今、何してる？
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <span className="phoneHandText">
                ふと、美咲から。
              </span>
            </div>
          </div>
        </section>

        {/* DIFFERENCE */}
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
              昨日のあなたと、
              今日のあなたがつながっていること。
            </p>

            <div className="comparison">

              <div className="comparisonCard">

                <span className="comparisonLabel">
                  普通のAIチャット
                </span>

                <div className="miniUser">
                  今日疲れた
                </div>

                <div className="miniAi">
                  お疲れさまでした。
                  十分な休息をとることをおすすめします。
                </div>
              </div>

              <div className="comparisonVs">
                VS
              </div>

              <div className="comparisonCard misakiCard">

                <span className="comparisonLabel pink">
                  美咲
                </span>

                <div className="miniUser pinkUser">
                  今日疲れた
                </div>

                <div className="miniMisaki">
                  そりゃ疲れるよ。
                  昨日も遅かったじゃん。
                  今日はもう頑張らなくていいよ笑
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MEMORY */}
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
                昨日話したことが、
                今日の会話につながっていきます。
              </p>

              <div className="memoryQuote">
                “ 覚えてるよ。
                昨日、羽田中心でやってみるって
                言ってたじゃん。
              </div>
            </div>

            <div className="memoryTimeline">

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

              <div className="memoryLine" />

              <span className="dayLabel today">
                TODAY
              </span>

              <div className="memoryBubble misakiMemory highlightMemory">
                今日、羽田どうだった？
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
                「疲れた」
                「今日ロング引いた」
                「眠い」
                <br />
                <br />
                そんな一言だけで十分です。
              </p>

              <div className="handMessage">
                今日のこと、
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
                  <strong>
                    美咲
                  </strong>

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
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="features">

          <p className="eyebrow center">
            WHY MISAKI
          </p>

          <h2 className="featureTitle">
            会話が、ちゃんと続いていく。
          </h2>

          <div className="featureGrid">

            {features.map((feature) => (

              <div
                className="featureCard"
                key={feature.number}
              >

                <span>
                  {feature.number}
                </span>

                <h3>
                  {feature.title}
                </h3>

                <p>
                  {feature.text}
                </p>
              </div>
            ))}
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
            </div>
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
          </div>

          <div className="faqList">

            {faqs.map((faq, index) => (

              <details
                className="faqItem"
                key={faq.q}
              >

                <summary>

                  <span>
                    0{index + 1}
                  </span>

                  <b>
                    {faq.q}
                  </b>

                  <i>
                    ＋
                  </i>
                </summary>

                <div className="faqAnswer">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* FINAL */}
        <section className="finalSection">

          <div className="finalCard">

            <div className="finalPhoto">
              <img
                src="/misaki-final.webp"
                alt="美咲"
              />
            </div>

            <div className="finalCopy">

              <p className="eyebrow">
                MISAKI
              </p>

              <h2>
                日常に、
                <br />
                <span>
                  もうひとつの会話を。
                </span>
              </h2>

              <p>
                大した話じゃなくていい。
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

              <p className="heroNote">
                無料版は1日20回まで
              </p>
            </div>
          </div>
        </section>

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

        .eyebrow {
          margin: 0 0 16px;
          color: var(--main);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .2em;
        }

        .center {
          text-align: center;
        }

        .header {
          width: min(1120px, calc(100% - 36px));
          height: 76px;
          margin: auto;
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
        }

        .brandName {
          color: var(--title);
          font-size: 18px;
          font-weight: 800;
        }

        .brandSub {
          margin-top: 2px;
          color: #97888d;
          font-size: 11px;
        }

        .headerCta,
        .mainCta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          border-radius: 999px;
          background: var(--main);
          color: white;
          font-weight: 800;
          box-shadow:
            0 10px 25px rgba(255,102,128,.22);
        }

        .headerCta {
          padding: 11px 20px;
          font-size: 14px;
        }

        .mainCta {
          min-height: 58px;
          padding: 15px 26px;
          font-size: 17px;
        }

        .hero {
          padding: 0 18px;
        }

        .heroCard {
          width: min(1200px, 100%);
          margin: auto;
          display: grid;
          grid-template-columns: 1.1fr .9fr;
          overflow: hidden;
          border-radius: 34px;
          background: white;
          box-shadow:
            0 24px 60px rgba(86,58,68,.1);
        }

        .heroPhoto {
          min-height: 720px;
          background: var(--beige);
        }

        .heroPhoto img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 40%;
        }

        .heroCopy {
          padding: 95px 58px;
          align-self: center;
        }

        .heroSmall {
          margin: 0 0 18px;
          color: var(--main);
          font-size: 13px;
          font-weight: 800;
        }

        .hero h1,
        .finalCopy h2 {
          margin: 0;
          color: var(--title);
          font-size: clamp(42px,5vw,68px);
          line-height: 1.28;
          letter-spacing: -.05em;
        }

        .hero h1 span,
        .finalCopy h2 span {
          color: var(--main-dark);
        }

        .heroLead {
          margin: 28px 0;
          font-size: 17px;
          line-height: 2;
        }

        .heroNote {
          margin: 13px 0 0;
          color: #94858a;
          font-size: 12px;
        }

        .intro {
          width: min(850px, calc(100% - 40px));
          margin: auto;
          padding: 115px 0 125px;
          text-align: center;
        }

        .intro h2,
        .differenceInner h2 {
          margin: 0;
          color: var(--title);
          font-size: clamp(34px,5vw,50px);
          line-height: 1.5;
        }

        .intro h2 span,
        .differenceInner h2 span {
          color: var(--main-dark);
        }

        .intro > p:last-of-type {
          margin: 28px auto 0;
          font-size: 16px;
          line-height: 2;
        }

        .handCopy,
        .profileNote,
        .handMessage {
          width: fit-content;
          padding: 16px 22px;
          background: #fff1f4;
          border-radius: 8px 20px;
          color: #80646e;
          font-family:
            "Bradley Hand",
            "Segoe Script",
            cursive;
        }

        .handCopy {
          margin: 38px auto 0;
          font-size: 20px;
        }

        .profileSection {
          padding: 110px 20px;
          background: var(--beige);
        }

        .profileInner {
          width: min(1080px,100%);
          margin: auto;
          display: grid;
          grid-template-columns: .9fr 1.1fr;
          gap: 72px;
          align-items: center;
        }

        .profilePortrait {
          position: relative;
        }

        .profilePortrait img {
          width: 100%;
          aspect-ratio: 4 / 5;
          object-fit: cover;
          border-radius: 34px;
          box-shadow:
            0 24px 55px rgba(82,55,64,.13);
        }

        .profileSignature {
          position: absolute;
          right: 18px;
          bottom: 18px;
          padding: 8px 14px;
          background: rgba(255,255,255,.88);
          color: var(--main);
          font-family:
            "Bradley Hand",
            "Segoe Script",
            cursive;
          font-size: 25px;
          transform: rotate(-5deg);
        }

        .profileCopy h2,
        .memoryCopy h2,
        .installCopy h2,
        .taxiCopy h2,
        .faqHeading h2,
        .conversationCopy h2 {
          margin: 0;
          color: var(--title);
          font-size: clamp(34px,4.7vw,49px);
          line-height: 1.45;
        }

        .profileCopy h2 span,
        .memoryCopy h2 span,
        .installCopy h2 span,
        .taxiCopy h2 span {
          color: var(--main-dark);
        }

        .profileCatch {
          margin: 20px 0 0;
          color: var(--main-dark);
          font-size: 24px;
          font-weight: 800;
        }

        .profileLead {
          margin: 18px 0 0;
          color: #5f4f55;
          font-size: 17px;
          line-height: 1.95;
          font-weight: 600;
        }

        .profileText {
          margin: 18px 0 0;
          font-size: 16px;
          line-height: 2;
        }

        .profileFacts {
          display: grid;
          grid-template-columns:
            repeat(3,1fr);
          margin-top: 28px;
          border:
            1px solid rgba(108,92,98,.11);
          border-radius: 20px;
          overflow: hidden;
          background: rgba(255,255,255,.55);
        }

        .profileFacts div {
          padding: 16px 11px;
          text-align: center;
          border-right:
            1px solid rgba(108,92,98,.09);
          border-bottom:
            1px solid rgba(108,92,98,.09);
        }

        .profileFacts span {
          display: block;
          color: #b09fa5;
          font-size: 9px;
          letter-spacing: .12em;
        }

        .profileFacts strong {
          display: block;
          margin-top: 5px;
          color: #66555c;
          font-size: 14px;
        }

        .profileFacts small {
          display: block;
          margin-top: 3px;
          color: #a09196;
          font-size: 10px;
        }

        .profileTags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 22px;
        }

        .profileTags span {
          padding: 8px 12px;
          border-radius: 999px;
          background: white;
          color: #8a6874;
          font-size: 12px;
        }

        .profileNote {
          margin: 24px 0 0 auto;
          font-size: 18px;
          line-height: 1.7;
        }

        .profileNote span {
          color: var(--main);
          font-size: 28px;
        }

        .sceneIntro {
          width: min(800px, calc(100% - 40px));
          margin: auto;
          padding: 115px 0 72px;
          text-align: center;
        }

        .sceneIntro h2 {
          margin: 0;
          color: var(--title);
          font-size: clamp(34px,5vw,48px);
        }

        .sceneIntro > p:last-child {
          margin: 18px 0 0;
          font-size: 16px;
        }

        .sceneSection {
          width: min(1070px, calc(100% - 36px));
          margin: auto;
        }

        .scene {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 70px;
          align-items: center;
          margin-bottom: 110px;
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
          box-shadow:
            0 20px 50px rgba(82,57,65,.1);
        }

        .sceneImage {
          width: 100%;
          aspect-ratio: 9 / 17;
          object-fit: cover;
        }

        .sceneCopy {
          padding: 18px;
        }

        .sceneNumber {
          display: block;
          color: var(--sub);
          font-family: Georgia,serif;
          font-size: 52px;
        }

        .sceneLabel {
          margin: 12px 0;
          color: var(--main);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .18em;
        }

        .sceneCopy h2 {
          margin: 0;
          color: var(--title);
          font-size: clamp(33px,4vw,47px);
        }

        .sceneText {
          margin: 22px 0 0;
          font-size: 16px;
          line-height: 2;
        }

        .sceneSignature {
          color: var(--main);
          font-family:
            "Bradley Hand",
            "Segoe Script",
            cursive;
          font-size: 22px;
        }

        .installSection {
          padding: 120px 20px;
          background:
            linear-gradient(
              180deg,
              #fff6f8,
              #f8efea
            );
        }

        .installInner {
          width: min(1050px,100%);
          margin: auto;
          display: grid;
          grid-template-columns: 1.12fr .88fr;
          gap: 80px;
          align-items: center;
        }

        .installLead {
          margin: 24px 0;
          font-size: 17px;
          line-height: 2;
        }

        .installSteps {
          display: grid;
          gap: 11px;
        }

        .installSteps div {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 16px;
          background: white;
          border-radius: 15px;
          box-shadow:
            0 7px 20px rgba(74,52,59,.05);
        }

        .installSteps b {
          display: grid;
          place-items: center;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: var(--main);
          color: white;
        }

        .installSteps span {
          font-size: 15px;
          font-weight: 700;
        }

        .installCatch {
          margin: 27px 0 0;
          font-size: 22px;
          line-height: 1.6;
        }

        .installCatch strong {
          color: var(--main-dark);
          font-size: 28px;
        }

        .phoneArea {
          position: relative;
        }

        .phone {
          width: min(330px,100%);
          height: 620px;
          margin: auto;
          padding: 10px;
          border-radius: 48px;
          background: #473c40;
          box-shadow:
            0 30px 65px rgba(65,43,51,.2);
        }

        .phoneTop {
          height: 42px;
          padding: 0 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-radius:
            38px 38px 0 0;
          background: #f8efea;
          font-size: 11px;
        }

        .phoneWallpaper {
          position: relative;
          height: calc(100% - 42px);
          padding: 34px 14px;
          border-radius:
            0 0 38px 38px;
          background:
            linear-gradient(
              145deg,
              #f8efea,
              #f7dce2
            );
        }

        .homeIcon {
          display: grid;
          justify-items: center;
          gap: 6px;
          width: 70px;
          margin: 35px auto;
        }

        .homeIcon img {
          width: 62px;
          height: 62px;
          border-radius: 15px;
        }

        .homeIcon span {
          font-size: 11px;
        }

        .notification {
          position: absolute;
          left: 12px;
          right: 12px;
          top: 175px;
          display: flex;
          gap: 10px;
          padding: 14px;
          border-radius: 18px;
          background:
            rgba(255,255,255,.9);
          box-shadow:
            0 10px 28px rgba(74,49,58,.12);
        }

        .notification > img {
          width: 40px;
          height: 40px;
          border-radius: 50%;
        }

        .notification > div {
          flex: 1;
        }

        .notificationTop {
          display: flex;
          justify-content: space-between;
        }

        .notificationTop strong {
          font-size: 13px;
        }

        .notificationTop span {
          font-size: 10px;
          color: #999;
        }

        .notification p {
          margin: 5px 0 0;
          font-size: 13px;
          line-height: 1.55;
        }

        .phoneHandText {
          position: absolute;
          right: -8px;
          bottom: 40px;
          padding: 10px 15px;
          background: white;
          color: var(--main);
          font-family:
            "Bradley Hand",
            "Segoe Script",
            cursive;
          font-size: 18px;
          transform: rotate(-5deg);
        }

        .differenceSection,
        .taxiSection {
          padding: 115px 20px;
          background:
            linear-gradient(
              180deg,
              #fff8f9,
              #f8efea
            );
        }

        .differenceInner {
          width: min(950px,100%);
          margin: auto;
          text-align: center;
        }

        .differenceLead {
          margin: 24px auto 45px;
          max-width: 650px;
          font-size: 16px;
          line-height: 2;
        }

        .comparison {
          display: grid;
          grid-template-columns:
            1fr 52px 1fr;
          align-items: center;
        }

        .comparisonCard {
          min-height: 280px;
          padding: 29px;
          border-radius: 27px;
          background: white;
          text-align: left;
        }

        .comparisonLabel {
          font-size: 13px;
          font-weight: 800;
          color: #96878c;
        }

        .pink {
          color: var(--main) !important;
        }

        .miniUser,
        .miniAi,
        .miniMisaki {
          width: fit-content;
          max-width: 88%;
          margin-top: 20px;
          padding: 13px 15px;
          border-radius: 17px;
          font-size: 14px;
          line-height: 1.65;
        }

        .miniUser {
          margin-left: auto;
          background: #e8e5e5;
        }

        .pinkUser {
          background: var(--sub);
        }

        .miniAi,
        .miniMisaki {
          background: white;
          border:
            1px solid rgba(108,92,98,.09);
        }

        .comparisonVs {
          font-weight: 900;
          color: #beaeb3;
          text-align: center;
        }

        .memoryStory {
          padding: 120px 20px;
        }

        .memoryStoryInner,
        .conversationInner,
        .taxiInner {
          width: min(1000px,100%);
          margin: auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 78px;
          align-items: center;
        }

        .memoryCopy > p:not(.eyebrow),
        .conversationCopy > p:not(.eyebrow) {
          font-size: 16px;
          line-height: 2;
        }

        .memoryQuote {
          margin-top: 28px;
          padding: 22px;
          border-radius: 20px;
          background: #fff1f4;
          font-size: 17px;
          line-height: 1.8;
        }

        .memoryTimeline {
          padding: 30px;
          border-radius: 28px;
          background: var(--beige);
        }

        .dayLabel {
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .17em;
        }

        .today {
          color: var(--main);
        }

        .memoryBubble {
          width: fit-content;
          max-width: 85%;
          margin-top: 12px;
          padding: 12px 15px;
          border-radius: 17px;
          background: white;
          font-size: 14px;
          line-height: 1.6;
        }

        .userMemory {
          margin-left: auto;
          background: var(--sub);
        }

        .memoryLine {
          height: 45px;
          border-left:
            1px dashed #d8c6cb;
          margin-left: 20px;
        }

        .highlightMemory {
          box-shadow:
            0 8px 20px rgba(255,102,128,.08);
        }

        .conversationSection {
          padding: 110px 20px;
          background: var(--beige);
        }

        .handMessage {
          margin-top: 28px;
          font-size: 18px;
        }

        .chatCard {
          width: min(390px,100%);
          margin: auto;
          overflow: hidden;
          border-radius: 30px;
          background: #f8efea;
          box-shadow:
            0 24px 60px rgba(71,49,57,.14);
        }

        .chatHeader {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 18px;
          background: white;
        }

        .chatHeader img {
          width: 44px;
          height: 44px;
          border-radius: 50%;
        }

        .chatHeader strong {
          display: block;
        }

        .chatHeader span {
          font-size: 10px;
          color: #999;
        }

        .chatBody {
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
          font-size: 14px;
          line-height: 1.6;
        }

        .bubble.misaki {
          background: white;
        }

        .bubble.user {
          align-self: flex-end;
          background: var(--sub);
        }

        .timeLabel {
          margin: 5px auto 14px;
          font-size: 10px;
          color: #aaa;
        }

        .features {
          width: min(1030px,calc(100% - 40px));
          margin: auto;
          padding: 115px 0;
        }

        .featureTitle {
          margin: 0;
          color: var(--title);
          text-align: center;
          font-size: clamp(34px,5vw,46px);
        }

        .featureGrid {
          display: grid;
          grid-template-columns:
            repeat(2,1fr);
          gap: 18px;
          margin-top: 42px;
        }

        .featureCard {
          padding: 28px;
          border-radius: 23px;
          background: white;
          border:
            1px solid rgba(118,88,98,.05);
        }

        .featureCard > span {
          color: var(--sub);
          font:
            32px Georgia,
            serif;
        }

        .featureCard h3 {
          margin: 14px 0 9px;
          color: var(--title);
          font-size: 19px;
        }

        .featureCard p {
          margin: 0;
          font-size: 14px;
          line-height: 1.9;
        }

        .taxiLoveNote {
          padding: 45px 32px;
          border-radius: 24px;
          background: white;
          box-shadow:
            0 20px 50px rgba(79,54,62,.08);
        }

        .taxiLoveNote span {
          color: var(--main);
          font-family:
            "Bradley Hand",
            "Segoe Script",
            cursive;
          font-size: 25px;
        }

        .taxiLoveNote p {
          font-family:
            "Yu Mincho",
            "Hiragino Mincho ProN",
            serif;
          font-size: 24px;
          line-height: 1.9;
        }

        .taxiLead {
          font-size: 16px;
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
          font-size: 13px;
        }

        .faqSection {
          width: min(1000px,calc(100% - 40px));
          margin: auto;
          padding: 115px 0;
          display: grid;
          grid-template-columns: .75fr 1.25fr;
          gap: 70px;
        }

        .faqItem {
          border-top:
            1px solid #eadde1;
        }

        .faqItem:last-child {
          border-bottom:
            1px solid #eadde1;
        }

        .faqItem summary {
          list-style: none;
          display: grid;
          grid-template-columns:
            42px 1fr 30px;
          gap: 12px;
          align-items: center;
          padding: 22px 0;
          cursor: pointer;
        }

        .faqItem summary span {
          color: var(--main);
          font-weight: 800;
        }

        .faqItem summary b {
          font-size: 16px;
        }

        .faqItem summary i {
          font-style: normal;
          font-size: 22px;
        }

        .faqAnswer {
          padding: 0 0 24px 54px;
          font-size: 15px;
          line-height: 1.9;
        }

        .finalSection {
          padding: 30px 18px 90px;
        }

        .finalCard {
          width: min(1100px,100%);
          margin: auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          overflow: hidden;
          border-radius: 34px;
          background: white;
          box-shadow:
            0 24px 60px rgba(86,58,68,.1);
        }

        .finalPhoto img {
          width: 100%;
          height: 100%;
          min-height: 620px;
          object-fit: cover;
          object-position: center 35%;
        }

        .finalCopy {
          padding: 70px 55px;
          align-self: center;
        }

        .finalCopy > p:not(.eyebrow,.heroNote) {
          font-size: 17px;
          line-height: 2;
        }

        footer {
          width: min(1100px,calc(100% - 40px));
          margin: auto;
          padding: 25px 0 45px;
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
          width: 42px;
          height: 42px;
          border-radius: 50%;
        }

        .footerBrand strong,
        .footerBrand span {
          display: block;
        }

        .footerBrand span {
          font-size: 10px;
          color: #999;
        }

        footer small {
          font-size: 10px;
          color: #aaa;
        }

        @media (max-width: 760px) {

          .eyebrow {
            font-size: 12px;
            letter-spacing: .17em;
            margin-bottom: 14px;
          }

          .header {
            height: 72px;
            width: calc(100% - 26px);
          }

          .brandIcon {
            width: 42px;
            height: 42px;
          }

          .brandName {
            font-size: 19px;
          }

          .brandSub {
            font-size: 12px;
          }

          .headerCta {
            font-size: 15px;
            padding: 12px 19px;
          }

          .hero {
            padding: 0 10px;
          }

          .heroCard {
            display: block;
            border-radius: 28px;
          }

          .heroPhoto {
            min-height: 0;
          }

          .heroPhoto img {
            width: 100%;
            height: auto;
            object-fit: contain;
          }

          .heroCopy {
            padding: 30px 24px 34px;
            text-align: left;
          }

          .heroSmall {
            font-size: 14px;
          }

          .hero h1 {
            font-size: 36px;
            line-height: 1.35;
          }

          .heroLead {
            font-size: 17px;
            line-height: 1.95;
          }

          .mainCta {
            width: 100%;
            font-size: 18px;
            min-height: 62px;
          }

          .heroNote {
            text-align: center;
            font-size: 13px;
          }

          .intro {
            padding: 82px 0;
            width: calc(100% - 32px);
          }

          .intro h2,
          .differenceInner h2 {
            font-size: 32px;
            line-height: 1.5;
          }

          .intro > p:last-of-type {
            font-size: 17px;
            line-height: 2;
          }

          .handCopy {
            font-size: 19px;
          }

          .profileSection {
            padding: 78px 18px;
          }

          .profileInner {
            display: flex;
            flex-direction: column;
            gap: 34px;
          }

          .profilePortrait {
            width: 100%;
          }

          .profilePortrait img {
            aspect-ratio: auto;
            height: auto;
            object-fit: contain;
            border-radius: 26px;
          }

          .profileCopy {
            text-align: left;
          }

          .profileCopy h2,
          .memoryCopy h2,
          .installCopy h2,
          .taxiCopy h2,
          .faqHeading h2,
          .conversationCopy h2 {
            font-size: 34px;
            line-height: 1.45;
          }

          .profileCatch {
            font-size: 22px;
          }

          .profileLead,
          .profileText {
            font-size: 17px;
            line-height: 1.95;
          }

          .profileFacts {
            grid-template-columns:
              repeat(2,1fr);
          }

          .profileFacts strong {
            font-size: 15px;
          }

          .profileFacts small {
            font-size: 11px;
          }

          .profileTags span {
            font-size: 13px;
          }

          .profileNote {
            font-size: 19px;
          }

          .sceneIntro {
            padding: 82px 0 52px;
            width: calc(100% - 32px);
          }

          .sceneIntro h2 {
            font-size: 34px;
            line-height: 1.4;
          }

          .sceneIntro > p:last-child {
            font-size: 17px;
            line-height: 1.8;
          }

          .sceneSection {
            width: calc(100% - 24px);
          }

          .scene {
            display: flex;
            flex-direction: column;
            gap: 22px;
            margin-bottom: 78px;
          }

          .scene.reverse .sceneImageWrap,
          .scene.reverse .sceneCopy {
            order: initial;
          }

          .sceneImageWrap {
            width: 100%;
            border-radius: 25px;
          }

          .sceneImage {
            width: 100%;
            height: auto;
            aspect-ratio: auto;
            object-fit: contain;
          }

          .sceneCopy {
            width: 100%;
            padding: 4px 10px;
          }

          .sceneNumber {
            font-size: 48px;
          }

          .sceneLabel {
            font-size: 12px;
          }

          .sceneCopy h2 {
            font-size: 32px;
          }

          .sceneText {
            font-size: 17px;
            line-height: 1.95;
          }

          .sceneSignature {
            font-size: 22px;
          }

          .installSection {
            padding: 82px 18px;
          }

          .installInner {
            display: flex;
            flex-direction: column;
            gap: 45px;
          }

          .installLead {
            font-size: 17px;
            line-height: 1.95;
          }

          .installSteps span {
            font-size: 16px;
          }

          .installCatch {
            font-size: 20px;
          }

          .installCatch strong {
            font-size: 27px;
          }

          .phone {
            height: 585px;
          }

          .notification p {
            font-size: 14px;
          }

          .notificationTop strong {
            font-size: 14px;
          }

          .differenceSection,
          .memoryStory,
          .conversationSection,
          .features,
          .taxiSection {
            padding: 82px 18px;
          }

          .differenceLead {
            font-size: 17px;
          }

          .comparison {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .comparisonVs {
            padding: 2px;
          }

          .comparisonCard {
            min-height: 0;
          }

          .miniUser,
          .miniAi,
          .miniMisaki {
            font-size: 15px;
          }

          .memoryStoryInner,
          .conversationInner,
          .taxiInner {
            display: flex;
            flex-direction: column;
            gap: 35px;
          }

          .memoryCopy > p:not(.eyebrow),
          .conversationCopy > p:not(.eyebrow) {
            font-size: 17px;
          }

          .memoryQuote {
            font-size: 17px;
          }

          .memoryBubble {
            font-size: 15px;
          }

          .chatCard {
            width: 100%;
          }

          .bubble {
            font-size: 15px;
          }

          .featureTitle {
            font-size: 34px;
          }

          .featureGrid {
            grid-template-columns: 1fr;
          }

          .featureCard h3 {
            font-size: 20px;
          }

          .featureCard p {
            font-size: 16px;
          }

          .taxiLoveNote {
            width: 100%;
          }

          .taxiLoveNote p {
            font-size: 23px;
          }

          .taxiLead {
            font-size: 17px;
          }

          .taxiWords span {
            font-size: 14px;
          }

          .faqSection {
            padding: 82px 18px;
            width: 100%;
            display: block;
          }

          .faqList {
            margin-top: 35px;
          }

          .faqItem summary {
            grid-template-columns:
              36px 1fr 28px;
            padding: 20px 0;
          }

          .faqItem summary b {
            font-size: 17px;
            line-height: 1.5;
          }

          .faqAnswer {
            padding:
              0 0 24px 48px;
            font-size: 16px;
            line-height: 1.9;
          }

          .finalSection {
            padding:
              15px 10px 70px;
          }

          .finalCard {
            display: block;
            border-radius: 28px;
          }

          .finalPhoto img {
            width: 100%;
            height: auto;
            min-height: 0;
            object-fit: contain;
          }

          .finalCopy {
            padding:
              30px 24px 34px;
          }

          .finalCopy h2 {
            font-size: 36px;
            line-height: 1.35;
          }

          .finalCopy > p:not(.eyebrow,.heroNote) {
            font-size: 17px;
            line-height: 1.95;
          }

          footer {
            padding-bottom: 35px;
          }

          .footerBrand span {
            font-size: 11px;
          }
        }
      `}</style>
    </>
  );
}
