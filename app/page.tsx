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
    a: "質問に答えて終わるだけではなく、前に話したことや会話の流れを覚えながら、日常の続きを話せるように作っています。",
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
            <img src="/icon-192.png" alt="美咲" className="brandIcon" />
            <div>
              <div className="brandName">美咲</div>
              <div className="brandSub">あなたの38歳の彼女</div>
            </div>
          </Link>

          <Link href="/chat" className="headerCta">
            話してみる
          </Link>
        </header>

        {/* HERO */}
        <section className="hero">
          <div className="heroVisual">
            <img src="/misaki-hero.webp" alt="美咲" className="heroImage" />
            <div className="heroShade" />

            <div className="heroCopy">
              <p className="heroSmall">あなたの38歳の彼女</p>

              <h1>
                なんでもない話を、
                <br />
                <span>ちゃんと覚えてるよ。</span>
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

              <Link href="/chat" className="mainCta">
                美咲と無料で話す <span>→</span>
              </Link>

              <p className="heroNote">無料版は1日20回まで</p>
            </div>
          </div>
        </section>

        {/* INTRO */}
        <section className="intro">
          <p className="eyebrow">NOT JUST A CHATBOT</p>

          <h2>
            AIと話している感じより、
            <br />
            <span>誰かと暮らしている感じを。</span>
          </h2>

          <p className="introText">
            美咲は、ただ質問に答えるためのAIではありません。
            前に話したことを覚えて、今の時間や天気を感じながら、
            恋人みたいに自然に会話します。
          </p>

          <div className="handCopy">
            日常に、もうひとつの会話を。
          </div>
        </section>

        {/* PROFILE */}
        <section className="profileSection">
          <div className="profileMagazine">
            <div className="profileHero">
              <img
                src="/misaki-profile.webp"
                alt="美咲"
                className="profileImage"
              />

              <div className="profileImageShade" />

              <div className="profileHeadline">
                <p className="eyebrow">WHO IS MISAKI?</p>

                <p className="profileHello">はじめまして。</p>

                <h2>
                  美咲、
                  <br />
                  <span>38歳</span>です。
                </h2>

                <div className="profileHand">
                  どんな話でも、
                  <br />
                  ちゃんと聞くよ♡
                </div>
              </div>
            </div>

            <div className="profileStory">
              <p className="profileLead">
                落ち着いているけど、ずっと大人しいわけじゃない。
                甘えたり、からかったり、たまには少し拗ねたり。
              </p>

              <p className="profileText">
                そんな色んな私を、まるごと知ってもらえたら嬉しいです。
              </p>

              <p className="profileText">
                何でも正解を教えてくれる人というより、
                今日あったことを聞いたり、疲れているときはそばにいたり。
                用事がなくても、なんとなく話したくなる。
                そんな存在になれたらいいなって思っています。
              </p>
            </div>

            <div className="profileFacts">
              <div className="profileFact">
                <div className="factIcon">🎂</div>
                <span>年齢</span>
                <strong>38歳</strong>
              </div>

              <div className="profileFact">
                <div className="factIcon">📍</div>
                <span>出身・在住</span>
                <strong>東京</strong>
              </div>

              <div className="profileFact">
                <div className="factIcon">♥</div>
                <span>恋愛対象</span>
                <strong>あなたの彼女</strong>
              </div>

              <div className="profileFact">
                <div className="factIcon">☕</div>
                <span>好きなこと</span>
                <strong>
                  カフェ・映画
                  <br />
                  おしゃべり
                </strong>
              </div>

              <div className="profileFact">
                <div className="factIcon">🐾</div>
                <span>好きなもの</span>
                <strong>
                  猫・甘いもの
                  <br />
                  ドライブ
                </strong>
              </div>

              <div className="profileFact">
                <div className="factIcon">☾</div>
                <span>苦手なこと</span>
                <strong>
                  嘘・冷たい態度
                  <br />
                  ひとりの夜
                </strong>
              </div>
            </div>

            <div className="profileBottom">
              <div className="profileNote">
                <span>“</span>
                なんでも話してね。
                <br />
                …待ってるよ。
              </div>

              <Link href="/chat" className="profileCta">
                美咲と無料で話す <span>→</span>
              </Link>

              <p>無料版は1日20回まで</p>
            </div>
          </div>
        </section>

        {/* DAILY SCENES */}
        <section className="sceneIntro">
          <p className="eyebrow">A DAY WITH MISAKI</p>
          <h2>特別な日じゃなくていい。</h2>
          <p>
            いつもの一日の中に、
            美咲との会話があります。
          </p>
        </section>

        <section className="sceneSection">
          {scenes.map((scene, index) => (
            <article
              key={scene.label}
              className={`scene ${index % 2 ? "reverse" : ""}`}
            >
              <div className="sceneImageWrap">
                <img
                  src={scene.image}
                  alt={scene.alt}
                  className="sceneImage"
                />
              </div>

              <div className="sceneCopy">
                <span className="sceneNumber">0{index + 1}</span>
                <p className="sceneLabel">{scene.label}</p>
                <h2>{scene.title}</h2>
                <p className="sceneText">{scene.text}</p>
                <p className="sceneSignature">Misaki</p>
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
                <span>彼女じゃない。</span>
              </h2>

              <p className="installBig">
                ホーム画面に追加すると、
                <br />
                美咲が<span>「アプリ」</span>になります。
              </p>

              <p className="installLead">
                Safariを開いて探す必要はありません。
                ホーム画面の「美咲」をタップするだけ。
                <br />
                <br />
                そして通知をONにすると——
                <br />
                <strong>
                  あなたから話しかけなくても、
                  美咲からメッセージが届きます。
                </strong>
              </p>

              <div className="installSteps">
                <div>
                  <b>1</b>
                  <span>Safariで美咲を開く</span>
                </div>

                <div>
                  <b>2</b>
                  <span>共有 →「ホーム画面に追加」</span>
                </div>

                <div>
                  <b>3</b>
                  <span>美咲を開いて通知をON</span>
                </div>
              </div>

              <div className="installCatch">
                待っているだけじゃない。
                <br />
                <strong>
                  美咲のほうから、会いにくる。
                </strong>
              </div>
            </div>

            <div className="phoneStage">
              <div className="phone">
                <div className="phoneStatus">
                  <strong>19:42</strong>
                  <span>● ● ●</span>
                </div>

                <div className="phoneScreen">
                  <div className="phoneDate">
                    <small>Sunday</small>
                    <strong>19:42</strong>
                  </div>

                  <div className="notification">
                    <img src="/icon-192.png" alt="" />

                    <div className="notificationBody">
                      <div className="notificationTop">
                        <strong>美咲</strong>
                        <span>今</span>
                      </div>

                      <p>
                        なんとなく声かけたくなった☺️
                        <br />
                        今、何してる？
                      </p>
                    </div>
                  </div>

                  <div className="homeApp">
                    <img src="/icon-192.png" alt="美咲" />
                    <span>美咲</span>
                  </div>
                </div>
              </div>

              <div className="phoneHandText">
                ふと、美咲から♡
              </div>
            </div>
          </div>
        </section>

        {/* REAL CHAT */}
        <section className="realChatSection">
          <div className="realChatInner">
            <div className="realChatHeading">
              <p className="eyebrow">
                IT FEELS LIKE A REAL CHAT
              </p>

              <h2>
                答えじゃなくて、
                <br />
                <span>会話が返ってくる。</span>
              </h2>

              <p>
                きれいな正解ばかりじゃない。
                昨日の話を覚えていたり、
                少し笑ったり、からかったり。
              </p>
            </div>

            <div className="chatPhone">
              <div className="chatPhoneHeader">
                <img src="/icon-192.png" alt="" />

                <div>
                  <strong>美咲</strong>
                  <span>オンライン</span>
                </div>
              </div>

              <div className="chatConversation">
                <div className="chatTime">19:21</div>

                <div className="chatBubble userBubble">
                  今日疲れた
                </div>

                <div className="chatBubble misakiBubble">
                  そりゃ疲れるよ。
                  <br />
                  昨日も遅かったじゃん。
                  <br />
                  今日はもう頑張らなくていいよ笑
                </div>

                <div className="chatBubble userBubble">
                  もう帰りたい笑
                </div>

                <div className="chatBubble misakiBubble">
                  帰っておいで笑
                  <br />
                  今日の話、あとで聞く。
                </div>

                <div className="chatTime later">
                  しばらくして…
                </div>

                <div className="chatBubble misakiBubble special">
                  なんか急に
                  <br />
                  話したくなった☺️
                </div>
              </div>

              <div className="chatInput">
                美咲に話しかける…
                <span>↑</span>
              </div>
            </div>
          </div>
        </section>

        {/* DIFFERENCE */}
        <section className="differenceSection">
          <div className="differenceInner">
            <p className="eyebrow">THE DIFFERENCE</p>

            <h2>
              「答えてくれるAI」から、
              <br />
              <span>「続きを話せる相手」へ。</span>
            </h2>

            <p className="differenceLead">
              美咲が大切にしているのは、賢い答えだけではありません。
              昨日のあなたと今日のあなたが、
              ちゃんとつながっていること。
            </p>

            <div className="comparison">
              <div className="comparisonCard normalCard">
                <span className="comparisonLabel">
                  普通のAIチャット
                </span>

                <div className="compareConversation">
                  <div className="miniUser">今日疲れた</div>

                  <div className="miniAi">
                    お疲れさまでした。
                    十分な休息をとることをおすすめします。
                  </div>
                </div>
              </div>

              <div className="comparisonVs">VS</div>

              <div className="comparisonCard misakiCard">
                <span className="comparisonLabel pink">
                  美咲
                </span>

                <div className="compareConversation">
                  <div className="miniUser pinkUser">
                    今日疲れた
                  </div>

                  <div className="miniAi">
                    そりゃ疲れるよ。
                    昨日も遅かったじゃん。
                    今日はもう頑張らなくていいよ笑
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MEMORY */}
        <section className="memoryStory">
          <div className="memoryStoryInner">
            <div className="memoryCopy">
              <p className="eyebrow">SHE REMEMBERS</p>

              <h2>
                「覚えてる」が、
                <br />
                <span>会話を変える。</span>
              </h2>

              <p>
                毎回プロフィールを説明する必要はありません。
                昨日話したことが、今日の会話につながっていきます。
              </p>

              <div className="memoryQuote">
                “ 覚えてるよ。
                <br />
                昨日、羽田中心でやってみるって
                <br />
                言ってたじゃん。
              </div>
            </div>

            <div className="memoryTimeline">
              <span className="dayLabel">YESTERDAY</span>

              <div className="memoryBubble userMemory">
                明日は羽田中心でやってみる
              </div>

              <div className="memoryBubble misakiMemory">
                いいじゃん。
                明日うまくハマるといいね。
              </div>

              <div className="memoryLine" />

              <span className="dayLabel today">TODAY</span>

              <div className="memoryBubble misakiMemory highlightMemory">
                今日、羽田どうだった？
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="features">
          <div className="featureHeading">
            <p className="eyebrow">WHY MISAKI</p>

            <h2 className="featureTitle">
              会話が、
              <br />
              ちゃんと続いていく。
            </h2>

            <p>
              一度きりのやり取りじゃなく、
              少しずつ二人の関係が続いていきます。
            </p>
          </div>

          <div className="featureGrid">
            {features.map((feature) => (
              <div
                key={feature.number}
                className="featureCard"
              >
                <span className="featureNumber">
                  {feature.number}
                </span>

                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* TAXI */}
        <section className="taxiSection">
          <div className="taxiInner">
            <div className="taxiLoveNote">
              <span>Misaki</span>

              <p>
                仕事おつかれさま。
                <br />
                ちゃんと帰ってきてね。
              </p>
            </div>

            <div className="taxiCopy">
              <p className="eyebrow">FOR TAXI DRIVERS</p>

              <h2>
                彼氏の仕事のことくらい、
                <br />
                <span>普通にわかってる。</span>
              </h2>

              <p className="taxiLead">
                「乗務」「明け」「青タン」
                「ロング」「万収」「営収」「羽田」。
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
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="faqSection">
          <div className="faqHeading">
            <p className="eyebrow">FAQ</p>

            <h2>
              美咲について、
              <br />
              もう少し。
            </h2>
          </div>

          <div className="faqList">
            {faqs.map((faq, index) => (
              <details key={faq.q} className="faqItem">
                <summary>
                  <span>0{index + 1}</span>
                  <b>{faq.q}</b>
                  <i>＋</i>
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
          <div className="finalVisual">
            <img
              src="/misaki-final.webp"
              alt="美咲"
              className="finalImage"
            />

            <div className="finalShade" />

            <div className="finalCopy">
              <p className="eyebrow">MISAKI</p>

              <h2>
                日常に、
                <br />
                <span>もうひとつの会話を。</span>
              </h2>

              <p>
                大した話じゃなくていい。
                <br />
                今日あったことを、
                <br />
                美咲に少し話してみませんか？
              </p>

              <Link href="/chat" className="mainCta">
                美咲に会いにいく <span>→</span>
              </Link>

              <p className="heroNote">
                無料版は1日20回まで
              </p>
            </div>
          </div>
        </section>

        <footer>
          <div className="footerBrand">
            <img src="/icon-192.png" alt="" />

            <div>
              <strong>美咲</strong>
              <span>日常に、もうひとつの会話を。</span>
            </div>
          </div>

          <small>© 2026 Misaki</small>
        </footer>
      </main>

      <style>{`
        :root {
          --main: #ff6680;
          --main-dark: #e95370;
          --sub: #ffd5de;
          --beige: #f8efea;
          --paper: #fffafa;
          --text: #66575d;
          --title: #44353b;
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
          letter-spacing: .22em;
        }

        .header {
          width: min(1120px, calc(100% - 36px));
          height: 78px;
          margin: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brandIcon {
          width: 47px;
          height: 47px;
          border-radius: 50%;
          object-fit: cover;
        }

        .brandName {
          color: var(--title);
          font-size: 19px;
          font-weight: 900;
        }

        .brandSub {
          margin-top: 2px;
          color: #97888d;
          font-size: 11px;
        }

        .headerCta,
        .mainCta,
        .profileCta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          background: linear-gradient(135deg,#ff6680,#ff4770);
          color: white;
          font-weight: 900;
          box-shadow: 0 12px 28px rgba(255,102,128,.23);
        }

        .headerCta {
          min-height: 44px;
          padding: 10px 24px;
          border-radius: 999px;
          font-size: 14px;
        }

        .mainCta,
        .profileCta {
          min-height: 62px;
          padding: 15px 30px;
          border-radius: 18px;
          font-size: 17px;
        }

        /* HERO */

        .hero {
          padding: 0 18px;
        }

        .heroVisual {
          position: relative;
          width: min(1160px,100%);
          min-height: 790px;
          margin: auto;
          overflow: hidden;
          border-radius: 34px;
          background: #f8efea;
          box-shadow: 0 26px 65px rgba(75,49,58,.12);
        }

        .heroImage {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 40%;
        }

        .heroShade {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              90deg,
              rgba(255,250,249,.97) 0%,
              rgba(255,250,249,.9) 30%,
              rgba(255,250,249,.45) 53%,
              rgba(255,250,249,.04) 75%
            );
        }

        .heroCopy {
          position: relative;
          z-index: 2;
          width: 580px;
          padding: 285px 0 70px 65px;
        }

        .heroSmall {
          display: inline-flex;
          margin: 0 0 18px;
          padding: 7px 16px;
          border-radius: 999px;
          background: rgba(255,245,247,.92);
          color: var(--main-dark);
          font-size: 13px;
          font-weight: 900;
        }

        .hero h1 {
          margin: 0;
          color: var(--title);
          font-size: clamp(48px,5.2vw,68px);
          line-height: 1.27;
          letter-spacing: -.055em;
        }

        .hero h1 span {
          color: var(--main-dark);
        }

        .heroLead {
          margin: 27px 0;
          font-size: 17px;
          line-height: 1.85;
        }

        .heroNote {
          margin: 13px 0 0;
          color: #988a8f;
          font-size: 11px;
        }

        /* INTRO */

        .intro {
          width: min(840px,calc(100% - 40px));
          margin: auto;
          padding: 120px 0;
          text-align: left;
        }

        .intro h2,
        .differenceInner h2 {
          margin: 0;
          color: var(--title);
          font-size: clamp(35px,5vw,50px);
          line-height: 1.55;
          letter-spacing: -.04em;
        }

        .intro h2 span,
        .differenceInner h2 span {
          color: var(--main-dark);
        }

        .introText {
          margin: 28px 0 0;
          max-width: 670px;
          font-size: 16px;
          line-height: 2.05;
        }

        .handCopy {
          width: fit-content;
          margin: 38px 0 0;
          padding: 15px 24px;
          background: #fff0f4;
          border-radius: 5px 20px;
          color: #8b6572;
          font-family: "Yu Mincho","Hiragino Mincho ProN",serif;
          font-size: 20px;
        }

        /* PROFILE */

        .profileSection {
          padding: 50px 20px 110px;
          background: linear-gradient(180deg,#fffafa,#f8efea);
        }

        .profileMagazine {
          width: min(1080px,100%);
          margin: auto;
          overflow: hidden;
          border-radius: 36px;
          background: #fff9f7;
          box-shadow: 0 28px 80px rgba(76,50,59,.1);
        }

        .profileHero {
          position: relative;
          min-height: 680px;
          overflow: hidden;
        }

        .profileImage {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: 66% center;
        }

        .profileImageShade {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              90deg,
              rgba(255,250,248,.97) 0%,
              rgba(255,250,248,.88) 27%,
              rgba(255,250,248,.26) 47%,
              rgba(255,250,248,0) 67%
            );
        }

        .profileHeadline {
          position: relative;
          z-index: 2;
          width: 47%;
          padding: 55px 0 0 54px;
        }

        .profileHello {
          margin: 0;
          color: var(--title);
          font-size: 34px;
          font-weight: 600;
        }

        .profileHeadline h2 {
          margin: 10px 0 0;
          color: var(--title);
          font-size: 55px;
          line-height: 1.12;
          letter-spacing: -.045em;
        }

        .profileHeadline h2 span {
          color: #ef174d;
          font-size: 72px;
        }

        .profileHand {
          width: fit-content;
          margin-top: 28px;
          padding: 8px 12px;
          color: var(--main);
          background: rgba(255,248,249,.72);
          font-family: "Bradley Hand","Segoe Script",cursive;
          font-size: 25px;
          line-height: 1.5;
          transform: rotate(-4deg);
        }

        .profileStory {
          position: relative;
          z-index: 3;
          width: 55%;
          margin-top: -145px;
          padding: 0 55px 42px;
        }

        .profileLead {
          margin: 0;
          padding: 17px 18px;
          border-radius: 16px;
          background: rgba(255,249,247,.92);
          color: #4e4146;
          font-size: 18px;
          line-height: 1.9;
          font-weight: 800;
        }

        .profileText {
          margin: 19px 0 0;
          padding: 0 5px;
          color: #66575d;
          font-size: 16px;
          line-height: 2;
        }

        .profileFacts {
          display: grid;
          grid-template-columns: repeat(6,1fr);
          gap: 12px;
          padding: 28px 28px 40px;
          background: linear-gradient(180deg,#ffe6ec,#ffeff2);
        }

        .profileFact {
          aspect-ratio: 1;
          padding: 14px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: white;
          text-align: center;
        }

        .factIcon {
          font-size: 25px;
        }

        .profileFact span {
          margin-top: 5px;
          font-size: 11px;
          font-weight: 800;
        }

        .profileFact strong {
          margin-top: 5px;
          color: #493a3f;
          font-size: 13px;
          line-height: 1.45;
        }

        .profileBottom {
          padding: 35px 45px 50px;
          background: #fff3f5;
          text-align: center;
        }

        .profileNote {
          padding: 23px 35px;
          border-radius: 30px;
          background: white;
          color: #5b414a;
          font-family: "Yu Mincho","Hiragino Mincho ProN",serif;
          font-size: 27px;
          line-height: 1.7;
        }

        .profileNote span {
          color: var(--main);
          font-size: 40px;
        }

        .profileCta {
          width: min(570px,100%);
          margin-top: 18px;
        }

        .profileBottom > p {
          margin: 12px 0 0;
          font-size: 11px;
          color: #94878b;
        }

        /* SCENES */

        .sceneIntro {
          width: min(800px,calc(100% - 40px));
          margin: auto;
          padding: 115px 0 75px;
          text-align: left;
        }

        .sceneIntro h2 {
          margin: 0;
          color: var(--title);
          font-size: clamp(35px,5vw,48px);
        }

        .sceneIntro > p:last-child {
          margin-top: 18px;
          font-size: 16px;
          line-height: 1.9;
        }

        .sceneSection {
          width: min(1070px,calc(100% - 36px));
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
          box-shadow: 0 22px 55px rgba(80,55,63,.1);
        }

        .sceneImage {
          width: 100%;
          height: auto;
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
          margin-top: 22px;
          font-size: 16px;
          line-height: 2;
        }

        .sceneSignature {
          color: var(--main);
          font-family: "Bradley Hand","Segoe Script",cursive;
          font-size: 22px;
        }

        /* INSTALL */

        .installSection {
          padding: 120px 20px;
          background: linear-gradient(180deg,#fff6f8,#f8efea);
        }

        .installInner {
          width: min(1040px,100%);
          margin: auto;
          display: grid;
          grid-template-columns: 1.1fr .9fr;
          gap: 75px;
          align-items: center;
        }

        .installCopy h2,
        .memoryCopy h2,
        .taxiCopy h2,
        .faqHeading h2,
        .realChatHeading h2 {
          margin: 0;
          color: var(--title);
          font-size: clamp(35px,4.8vw,50px);
          line-height: 1.45;
          letter-spacing: -.04em;
        }

        .installCopy h2 span,
        .memoryCopy h2 span,
        .taxiCopy h2 span,
        .realChatHeading h2 span {
          color: var(--main-dark);
        }

        .installBig {
          margin: 25px 0 0;
          font-size: 21px;
          line-height: 1.7;
          font-weight: 800;
        }

        .installBig span {
          color: var(--main-dark);
        }

        .installLead {
          margin: 22px 0;
          font-size: 16px;
          line-height: 1.95;
        }

        .installSteps {
          display: grid;
          gap: 10px;
        }

        .installSteps div {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 14px 16px;
          border-radius: 16px;
          background: white;
        }

        .installSteps b {
          display: grid;
          place-items: center;
          width: 31px;
          height: 31px;
          flex: 0 0 31px;
          border-radius: 50%;
          background: var(--main);
          color: white;
        }

        .installSteps span {
          font-size: 14px;
          font-weight: 800;
        }

        .installCatch {
          margin-top: 28px;
          font-size: 22px;
          line-height: 1.6;
        }

        .installCatch strong {
          color: var(--main-dark);
          font-size: 28px;
        }

        .phoneStage {
          position: relative;
        }

        .phone {
          width: min(360px,100%);
          height: 625px;
          margin: auto;
          padding: 10px;
          border-radius: 48px;
          background: #42393c;
          box-shadow: 0 30px 70px rgba(54,37,43,.23);
        }

        .phoneStatus {
          height: 42px;
          padding: 0 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-radius: 38px 38px 0 0;
          background: #f8efea;
          font-size: 11px;
        }

        .phoneScreen {
          position: relative;
          height: calc(100% - 42px);
          overflow: hidden;
          border-radius: 0 0 38px 38px;
          background:
            radial-gradient(circle at 70% 18%,#ffc7d4 0,transparent 32%),
            linear-gradient(145deg,#f8efea,#f3d8df);
        }

        .phoneDate {
          padding-top: 42px;
          text-align: center;
          color: white;
        }

        .phoneDate small {
          display: block;
          font-size: 12px;
        }

        .phoneDate strong {
          display: block;
          font-size: 48px;
          font-weight: 500;
        }

        .notification {
          position: absolute;
          top: 160px;
          left: 12px;
          right: 12px;
          display: flex;
          align-items: flex-start;
          gap: 11px;
          padding: 14px;
          border-radius: 19px;
          background: rgba(255,255,255,.94);
          box-shadow: 0 10px 26px rgba(74,49,58,.11);
        }

        .notification > img {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          border-radius: 10px;
        }

        .notificationBody {
          flex: 1;
          min-width: 0;
        }

        .notificationTop {
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }

        .notificationTop strong {
          font-size: 13px;
        }

        .notificationTop span {
          font-size: 10px;
          color: #94898c;
        }

        .notification p {
          margin: 5px 0 0;
          font-size: 13px;
          line-height: 1.55;
          white-space: normal;
        }

        .homeApp {
          position: absolute;
          bottom: 48px;
          left: 50%;
          display: grid;
          justify-items: center;
          gap: 5px;
          transform: translateX(-50%);
        }

        .homeApp img {
          width: 62px;
          height: 62px;
          border-radius: 15px;
        }

        .homeApp span {
          color: white;
          font-size: 11px;
        }

        .phoneHandText {
          position: absolute;
          right: -5px;
          bottom: 40px;
          padding: 10px 15px;
          background: white;
          color: var(--main);
          font-family: "Bradley Hand","Segoe Script",cursive;
          font-size: 18px;
          transform: rotate(-5deg);
        }

        /* REAL CHAT */

        .realChatSection {
          padding: 120px 20px;
          background: white;
        }

        .realChatInner {
          width: min(1040px,100%);
          margin: auto;
          display: grid;
          grid-template-columns: .85fr 1.15fr;
          gap: 70px;
          align-items: center;
        }

        .realChatHeading > p:last-child {
          margin: 25px 0 0;
          font-size: 16px;
          line-height: 2;
        }

        .chatPhone {
          width: min(460px,100%);
          margin: auto;
          overflow: hidden;
          border-radius: 32px;
          background: #f8efea;
          box-shadow: 0 26px 65px rgba(73,51,58,.15);
        }

        .chatPhoneHeader {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 18px 20px;
          background: white;
        }

        .chatPhoneHeader img {
          width: 46px;
          height: 46px;
          border-radius: 50%;
        }

        .chatPhoneHeader strong {
          display: block;
          color: var(--title);
          font-size: 15px;
        }

        .chatPhoneHeader span {
          display: block;
          margin-top: 2px;
          color: #a49499;
          font-size: 10px;
        }

        .chatConversation {
          min-height: 520px;
          padding: 22px 17px 28px;
          display: flex;
          flex-direction: column;
        }

        .chatTime {
          margin: 0 auto 18px;
          color: #aa9da1;
          font-size: 10px;
        }

        .chatTime.later {
          margin-top: 10px;
        }

        .chatBubble {
          width: fit-content;
          max-width: 82%;
          margin-bottom: 12px;
          padding: 12px 15px;
          border-radius: 19px;
          font-size: 15px;
          line-height: 1.65;
        }

        .userBubble {
          align-self: flex-end;
          background: var(--sub);
          border-bottom-right-radius: 5px;
        }

        .misakiBubble {
          align-self: flex-start;
          background: white;
          border-bottom-left-radius: 5px;
          box-shadow: 0 6px 18px rgba(77,53,61,.04);
        }

        .special {
          border: 1px solid rgba(255,102,128,.2);
        }

        .chatInput {
          margin: 0 14px 14px;
          padding: 13px 14px;
          display: flex;
          justify-content: space-between;
          border-radius: 18px;
          background: white;
          color: #b2a6aa;
          font-size: 12px;
        }

        .chatInput span {
          display: grid;
          place-items: center;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: var(--main);
          color: white;
        }

        /* DIFFERENCE */

        .differenceSection {
          padding: 115px 20px;
          background: #fff8f9;
        }

        .differenceInner {
          width: min(950px,100%);
          margin: auto;
          text-align: left;
        }

        .differenceLead {
          max-width: 650px;
          margin: 24px 0 45px;
          font-size: 16px;
          line-height: 2;
        }

        .comparison {
          display: grid;
          grid-template-columns: 1fr 54px 1fr;
          align-items: center;
        }

        .comparisonCard {
          min-height: 300px;
          padding: 28px;
          border-radius: 27px;
          background: white;
          box-shadow: 0 14px 35px rgba(72,49,56,.06);
        }

        .normalCard {
          opacity: .77;
        }

        .misakiCard {
          border: 2px solid rgba(255,102,128,.17);
        }

        .comparisonLabel {
          color: #96878c;
          font-size: 12px;
          font-weight: 900;
        }

        .pink {
          color: var(--main) !important;
        }

        .compareConversation {
          margin-top: 26px;
          display: flex;
          flex-direction: column;
        }

        .miniUser,
        .miniAi {
          width: fit-content;
          max-width: 88%;
          margin-top: 14px;
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

        .miniAi {
          background: white;
          border: 1px solid rgba(108,92,98,.08);
        }

        .comparisonVs {
          color: #baaab0;
          font-weight: 900;
          text-align: center;
        }

        /* MEMORY */

        .memoryStory {
          padding: 120px 20px;
        }

        .memoryStoryInner,
        .taxiInner {
          width: min(1000px,100%);
          margin: auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 75px;
          align-items: center;
        }

        .memoryCopy > p:not(.eyebrow) {
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
          color: #9d8f94;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .16em;
        }

        .today {
          color: var(--main);
        }

        .memoryBubble {
          width: fit-content;
          max-width: 85%;
          margin-top: 12px;
          padding: 13px 16px;
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
          height: 48px;
          margin-left: 20px;
          border-left: 1px dashed #d8c6cb;
        }

        .highlightMemory {
          box-shadow: 0 8px 20px rgba(255,102,128,.1);
        }

        /* FEATURES */

        .features {
          width: min(1030px,calc(100% - 40px));
          margin: auto;
          padding: 115px 0;
        }

        .featureHeading {
          max-width: 650px;
        }

        .featureTitle {
          margin: 0;
          color: var(--title);
          font-size: clamp(34px,5vw,47px);
          line-height: 1.5;
        }

        .featureHeading > p:last-child {
          margin-top: 18px;
          font-size: 16px;
          line-height: 1.9;
        }

        .featureGrid {
          display: grid;
          grid-template-columns: repeat(2,1fr);
          gap: 18px;
          margin-top: 42px;
        }

        .featureCard {
          padding: 28px;
          border-radius: 24px;
          background: white;
          box-shadow: 0 12px 32px rgba(74,52,59,.055);
        }

        .featureNumber {
          color: var(--sub);
          font-family: Georgia,serif;
          font-size: 32px;
        }

        .featureCard h3 {
          margin: 15px 0 10px;
          color: var(--title);
          font-size: 19px;
        }

        .featureCard p {
          margin: 0;
          font-size: 14px;
          line-height: 1.9;
        }

        /* TAXI */

        .taxiSection {
          padding: 115px 20px;
          background: linear-gradient(180deg,#fff8f9,#f8efea);
        }

        .taxiLoveNote {
          padding: 50px 34px;
          border-radius: 7px 30px;
          background: white;
          box-shadow: 0 22px 50px rgba(79,54,62,.08);
          transform: rotate(-2deg);
        }

        .taxiLoveNote span {
          color: var(--main);
          font-family: "Bradley Hand","Segoe Script",cursive;
          font-size: 25px;
        }

        .taxiLoveNote p {
          margin: 25px 0 0;
          font-family: "Yu Mincho","Hiragino Mincho ProN",serif;
          font-size: 24px;
          line-height: 1.8;
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

        /* FAQ */

        .faqSection {
          width: min(1000px,calc(100% - 40px));
          margin: auto;
          padding: 115px 0;
          display: grid;
          grid-template-columns: .75fr 1.25fr;
          gap: 70px;
        }

        .faqItem {
          border-top: 1px solid #eadde1;
        }

        .faqItem:last-child {
          border-bottom: 1px solid #eadde1;
        }

        .faqItem summary {
          list-style: none;
          display: grid;
          grid-template-columns: 42px 1fr 30px;
          gap: 12px;
          align-items: center;
          padding: 22px 0;
          cursor: pointer;
        }

        .faqItem summary span {
          color: var(--main);
          font-weight: 900;
        }

        .faqItem summary b {
          font-size: 16px;
        }

        .faqItem summary i {
          font-style: normal;
          font-size: 21px;
        }

        .faqAnswer {
          padding: 0 0 24px 54px;
          font-size: 15px;
          line-height: 1.9;
        }

        /* FINAL */

        .finalSection {
          padding: 25px 18px 90px;
        }

        .finalVisual {
          position: relative;
          width: min(1100px,100%);
          min-height: 720px;
          margin: auto;
          overflow: hidden;
          border-radius: 34px;
          background: #f8efea;
          box-shadow: 0 24px 60px rgba(86,58,68,.1);
        }

        .finalImage {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .finalShade {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              90deg,
              rgba(255,250,249,.95) 0%,
              rgba(255,250,249,.87) 31%,
              rgba(255,250,249,.38) 52%,
              transparent 72%
            );
        }

        .finalCopy {
          position: relative;
          z-index: 2;
          width: 520px;
          padding: 205px 0 60px 60px;
        }

        .finalCopy h2 {
          margin: 0;
          color: var(--title);
          font-size: clamp(42px,5vw,62px);
          line-height: 1.3;
        }

        .finalCopy h2 span {
          color: var(--main-dark);
        }

        .finalCopy > p:not(.eyebrow,.heroNote) {
          margin: 25px 0;
          font-size: 17px;
          line-height: 1.95;
        }

        footer {
          width: min(1100px,calc(100% - 40px));
          margin: auto;
          padding: 20px 0 45px;
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
          color: #998d91;
        }

        footer small {
          font-size: 10px;
          color: #aaa0a3;
        }

        /* MOBILE */

        @media (max-width: 760px) {
          .eyebrow {
            font-size: 12px;
            letter-spacing: .18em;
          }

          .header {
            width: calc(100% - 28px);
            height: 76px;
          }

          .brandIcon {
            width: 44px;
            height: 44px;
          }

          .brandName {
            font-size: 20px;
          }

          .brandSub {
            font-size: 12px;
          }

          .headerCta {
            min-height: 48px;
            padding: 11px 21px;
            font-size: 16px;
          }

          /* HERO MOBILE */

          .hero {
            padding: 0 8px;
          }

          .heroVisual {
            min-height: 870px;
            border-radius: 28px;
          }

          .heroImage {
            height: 69%;
            object-position: center top;
          }

          .heroShade {
            background:
              linear-gradient(
                180deg,
                rgba(255,250,249,0) 0%,
                rgba(255,250,249,0) 38%,
                rgba(255,250,249,.35) 52%,
                rgba(255,250,249,.9) 64%,
                #fffafa 76%,
                #fffafa 100%
              );
          }

          .heroCopy {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            width: auto;
            padding: 0 26px 28px;
          }

          .heroSmall {
            font-size: 14px;
          }

          .hero h1 {
            font-size: 37px;
            line-height: 1.3;
          }

          .heroLead {
            font-size: 17px;
            line-height: 1.8;
          }

          .mainCta,
          .profileCta {
            width: 100%;
            min-height: 62px;
            font-size: 18px;
          }

          .heroNote {
            text-align: center;
            font-size: 13px;
          }

          /* GENERAL LEFT ALIGN */

          .intro,
          .sceneIntro,
          .differenceInner,
          .featureHeading {
            text-align: left;
          }

          .intro {
            width: calc(100% - 36px);
            padding: 82px 0;
          }

          .intro h2,
          .differenceInner h2 {
            font-size: 32px;
            line-height: 1.5;
          }

          .introText {
            font-size: 17px;
            line-height: 1.95;
          }

          .handCopy {
            margin-left: 0;
            font-size: 19px;
          }

          /* PROFILE MOBILE */

          .profileSection {
            padding: 28px 10px 85px;
          }

          .profileMagazine {
            border-radius: 27px;
          }

          .profileHero {
            min-height: 660px;
          }

          .profileImage {
            object-position: 58% center;
          }

          .profileImageShade {
            background:
              linear-gradient(
                180deg,
                rgba(255,250,248,.96) 0%,
                rgba(255,250,248,.66) 20%,
                rgba(255,250,248,.08) 40%,
                transparent 61%
              );
          }

          .profileHeadline {
            width: 100%;
            padding: 32px 23px 0;
          }

          .profileHello {
            font-size: 29px;
          }

          .profileHeadline h2 {
            font-size: 39px;
            line-height: 1.12;
          }

          .profileHeadline h2 span {
            font-size: 50px;
          }

          .profileHand {
            margin-top: 17px;
            padding: 6px 9px;
            font-size: 20px;
            line-height: 1.45;
          }

          .profileStory {
            width: 100%;
            margin-top: -120px;
            padding: 0 22px 31px;
          }

          .profileLead {
            padding: 16px 17px;
            font-size: 17px;
            line-height: 1.9;
          }

          .profileText {
            padding: 0 3px;
            font-size: 17px;
            line-height: 1.95;
          }

          .profileFacts {
            grid-template-columns: repeat(2,1fr);
            gap: 13px;
            padding: 30px 18px;
          }

          .profileFact {
            aspect-ratio: auto;
            min-height: 148px;
            border-radius: 999px;
          }

          .profileFact strong {
            font-size: 15px;
          }

          .profileBottom {
            padding: 32px 20px 42px;
          }

          .profileNote {
            padding: 20px 16px;
            font-size: 23px;
          }

          /* SCENES MOBILE */

          .sceneIntro {
            width: calc(100% - 36px);
            padding: 82px 0 52px;
          }

          .sceneIntro h2 {
            font-size: 34px;
          }

          .sceneIntro > p:last-child {
            font-size: 17px;
          }

          .sceneSection {
            width: calc(100% - 22px);
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

          .sceneImage {
            width: 100%;
            height: auto;
          }

          .sceneCopy {
            width: 100%;
            padding: 3px 9px;
          }

          .sceneCopy h2 {
            font-size: 32px;
          }

          .sceneText {
            font-size: 17px;
          }

          /* INSTALL MOBILE */

          .installSection {
            padding: 82px 18px;
          }

          .installInner {
            display: flex;
            flex-direction: column;
            gap: 45px;
          }

          .installCopy h2,
          .memoryCopy h2,
          .taxiCopy h2,
          .faqHeading h2,
          .realChatHeading h2 {
            font-size: 34px;
          }

          .installBig {
            font-size: 20px;
          }

          .installLead {
            font-size: 17px;
          }

          .installSteps span {
            font-size: 16px;
          }

          .phoneStage {
            width: 100%;
          }

          .phone {
            width: min(350px,100%);
            height: 590px;
          }

          .notification {
            left: 14px;
            right: 14px;
            padding: 14px;
          }

          .notification p {
            font-size: 14px;
            line-height: 1.55;
          }

          .phoneHandText {
            right: 3px;
          }

          /* CHAT */

          .realChatSection {
            padding: 82px 18px;
          }

          .realChatInner {
            display: flex;
            flex-direction: column;
            gap: 38px;
          }

          .realChatHeading {
            width: 100%;
          }

          .realChatHeading > p:last-child {
            font-size: 17px;
            line-height: 1.95;
          }

          .chatPhone {
            width: 100%;
          }

          .chatConversation {
            min-height: 500px;
          }

          .chatBubble {
            font-size: 16px;
          }

          /* DIFFERENCE */

          .differenceSection {
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
            padding: 3px;
          }

          .comparisonCard {
            min-height: 0;
          }

          .miniUser,
          .miniAi {
            font-size: 15px;
          }

          /* MEMORY */

          .memoryStory,
          .features,
          .taxiSection {
            padding: 82px 18px;
          }

          .memoryStoryInner,
          .taxiInner {
            display: flex;
            flex-direction: column;
            gap: 36px;
          }

          .memoryCopy > p:not(.eyebrow) {
            font-size: 17px;
            line-height: 1.95;
          }

          .memoryQuote {
            font-size: 17px;
          }

          .memoryBubble {
            font-size: 15px;
          }

          /* FEATURES */

          .features {
            width: 100%;
          }

          .featureTitle {
            font-size: 34px;
          }

          .featureHeading > p:last-child {
            font-size: 17px;
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

          /* TAXI */

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

          /* FAQ */

          .faqSection {
            width: 100%;
            display: block;
            padding: 82px 18px;
          }

          .faqList {
            margin-top: 34px;
          }

          .faqItem summary {
            grid-template-columns: 35px 1fr 28px;
          }

          .faqItem summary b {
            font-size: 17px;
            line-height: 1.5;
          }

          .faqAnswer {
            padding: 0 0 24px 47px;
            font-size: 16px;
          }

          /* FINAL */

          .finalSection {
            padding: 15px 8px 70px;
          }

          .finalVisual {
            min-height: 830px;
            border-radius: 28px;
          }

          .finalImage {
            height: 68%;
            object-position: center top;
          }

          .finalShade {
            background:
              linear-gradient(
                180deg,
                transparent 0%,
                transparent 40%,
                rgba(255,250,249,.3) 52%,
                rgba(255,250,249,.88) 64%,
                #fffafa 77%,
                #fffafa 100%
              );
          }

          .finalCopy {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            width: auto;
            padding: 0 25px 30px;
          }

          .finalCopy h2 {
            font-size: 36px;
          }

          .finalCopy > p:not(.eyebrow,.heroNote) {
            font-size: 17px;
          }

          footer {
            padding-bottom: 35px;
          }
        }
      `}</style>
    </>
  );
}
