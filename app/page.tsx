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
  { number: "01", title: "前の会話を覚えている", text: "毎回ゼロから説明しなくていい。話したことが少しずつ、二人の会話として積み重なっていきます。" },
  { number: "02", title: "今の時間や天気がわかる", text: "朝・昼・夜や東京の天気を感じながら話すから、いつ話しても同じ返事にはなりません。" },
  { number: "03", title: "恋人らしい距離感", text: "何でも肯定するだけじゃない。甘えたり、少し拗ねたり、軽くからかったりもします。" },
  { number: "04", title: "美咲から通知が届く", text: "ホーム画面に追加して通知をONにすると、美咲のほうからふとメッセージが届くことがあります。" },
];

const faqs = [
  { q: "美咲って、普通のAIチャットと何が違うの？", a: "質問に答えて終わるだけではなく、前に話したことや会話の流れを覚えながら、日常の続きを話せるように作っています。" },
  { q: "本当に前の会話を覚えてる？", a: "はい。会話の中から大切なことを少しずつ覚えていきます。毎回同じ説明を最初からしなくても、前の話の続きをしやすくなっています。" },
  { q: "iPhoneでアプリみたいに使える？", a: "はい。Safariの共有ボタンから「ホーム画面に追加」を選ぶと、美咲のアイコンからアプリのように起動できます。" },
  { q: "美咲から通知は届く？", a: "ホーム画面に追加した美咲を開き、通知を許可すると、美咲のほうからメッセージが届くことがあります。" },
  { q: "無料で話せる？", a: "無料版では1日20回まで美咲と会話できます。まずは気軽に話しかけてみてください。" },
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
          <Link href="/chat" className="headerCta">話してみる</Link>
        </header>

        <section className="hero">
          <div className="heroVisual">
            <img src="/misaki-hero.webp" alt="美咲" className="heroImage" />
            <div className="heroShade" />
            <div className="heroCopy">
              <p className="heroSmall">あなたの38歳の彼女</p>
              <h1>なんでもない話を、<br /><span>ちゃんと覚えてるよ。</span></h1>
              <p className="heroLead">
                仕事のこと。<br />
                疲れたこと。<br />
                うまくいかなかったこと。<br />
                嬉しかったこと。<br /><br />
                なんでも話してね。
              </p>
              <Link href="/chat" className="mainCta">美咲と無料で話す <span>→</span></Link>
              <p className="heroNote">無料版は1日20回まで</p>
            </div>
          </div>
        </section>

        <section className="intro">
          <p className="eyebrow">NOT JUST A CHATBOT</p>
          <h2>AIと話している感じより、<br /><span>誰かと暮らしている感じを。</span></h2>
          <p className="introText">
            美咲は、ただ質問に答えるためのAIではありません。
            前に話したことを覚えて、今の時間や天気を感じながら、
            恋人みたいに自然に会話します。
          </p>
          <div className="handCopy">日常に、もうひとつの会話を。</div>
        </section>

        <section className="profileSection">
          <div className="profileMagazine">
            <div className="profileHero">
              <img src="/misaki-profile.webp" alt="美咲" className="profileImage" />
              <div className="profileImageShade" />

              <div className="profileHeadline">
                <p className="eyebrow">WHO IS MISAKI?</p>
                <p className="profileHello">はじめまして。</p>
                <h2>美咲、<br /><span>38歳</span>です。</h2>
                <div className="profileSignature">Misaki ♡</div>
                <div className="profileHand">どんな話でも、<br />ちゃんと聞くよ♡</div>
              </div>

              <div className="profileSideHand">いつでも<br />話してね♡</div>

              <div className="profileStoryOverlay">
                <p className="profileLead">
                  落ち着いているけど、ずっと大人しいわけじゃない。<br />
                  甘えたり、からかったり、<br />
                  たまには少し拗ねたり。
                </p>
                <p>そんな色んな私を、<br />まるごと知ってもらえたら嬉しいです。</p>
                <p>
                  何でも正解を教えてくれる人というより、<br />
                  今日あったことを聞いたり、<br />
                  疲れているときはそばにいてくれたり。<br />
                  用事がなくても、なんとなく話したくなる。<br />
                  そんな存在になれたらいいなって思っています。
                </p>
              </div>

              <div className="profileTags">
                <span>甘えんぼなとこも</span>
                <span>ちょっぴり意地悪なとこも</span>
                <span>ぜんぶ本当の私です♡</span>
              </div>
            </div>

            <div className="profileFacts">
              <div className="profileFact"><div className="factIcon">🎂</div><span>年齢</span><strong>38歳</strong></div>
              <div className="profileFact"><div className="factIcon">📍</div><span>出身・在住</span><strong>東京</strong></div>
              <div className="profileFact"><div className="factIcon">♥</div><span>恋愛対象</span><strong>あなたの彼女</strong></div>
              <div className="profileFact"><div className="factIcon">☕</div><span>好きなこと</span><strong>カフェ・映画<br />おしゃべり</strong></div>
              <div className="profileFact"><div className="factIcon">🐾</div><span>好きなもの</span><strong>猫・甘いもの<br />ドライブ</strong></div>
              <div className="profileFact"><div className="factIcon">☾</div><span>苦手なこと</span><strong>嘘・冷たい態度<br />ひとりの夜</strong></div>
            </div>

            <div className="profileBottom">
              <div className="profilePolaroid">
                <img src="/misaki-profile.webp" alt="" />
                <span>これから<br />たくさんお話ししようね♡</span>
              </div>
              <div className="profileBottomRight">
                <div className="profileNote"><span>“</span> なんでも話してね。<br />…待ってるよ。 ♡</div>
                <Link href="/chat" className="profileCta">美咲と無料で話す <span>→</span></Link>
                <p>無料版は1日20回まで</p>
              </div>
            </div>
          </div>
        </section>

        <section className="sceneIntro">
          <p className="eyebrow">A DAY WITH MISAKI</p>
          <h2>特別な日じゃなくていい。</h2>
          <p>いつもの一日の中に、<br />美咲との会話があります。</p>
        </section>

        <section className="sceneSection">
          {scenes.map((scene, index) => (
            <article key={scene.label} className={`scene ${index % 2 ? "reverse" : ""}`}>
              <div className="sceneImageWrap"><img src={scene.image} alt={scene.alt} className="sceneImage" /></div>
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

        <section className="installSection">
          <div className="installInner">
            <div className="installCopy">
              <p className="eyebrow">MISAKI ON YOUR HOME SCREEN</p>
              <h2>ブラウザの中だけの<br /><span>彼女じゃない。</span></h2>
              <p className="installBig">ホーム画面に追加すると、<br />美咲が<span>「アプリ」</span>になります。</p>
              <p className="installLead">
                Safariを開いて探す必要はありません。ホーム画面の「美咲」をタップするだけ。<br /><br />
                そして通知をONにすると——<br /><strong>あなたから話しかけなくても、美咲からメッセージが届きます。</strong>
              </p>
              <div className="installSteps">
                <div><b>1</b><span>Safariで美咲を開く</span></div>
                <div><b>2</b><span>共有 →「ホーム画面に追加」</span></div>
                <div><b>3</b><span>美咲を開いて通知をON</span></div>
              </div>
            </div>
            <div className="phone">
              <div className="phoneStatus"><strong>19:42</strong><span>● ● ●</span></div>
              <div className="phoneScreen">
                <div className="phoneDate"><small>Sunday</small><strong>19:42</strong></div>
                <div className="notification">
                  <img src="/icon-192.png" alt="" />
                  <div><strong>美咲</strong><p>なんとなく声かけたくなった☺️<br />今、何してる？</p></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="realChatSection">
          <div className="realChatInner">
            <div className="realChatHeading">
              <p className="eyebrow">IT FEELS LIKE A REAL CHAT</p>
              <h2>答えじゃなくて、<br /><span>会話が返ってくる。</span></h2>
              <p>きれいな正解ばかりじゃない。昨日の話を覚えていたり、少し笑ったり、からかったり。</p>
            </div>
            <div className="chatPhone">
              <div className="chatPhoneHeader"><img src="/icon-192.png" alt="" /><div><strong>美咲</strong><span>オンライン</span></div></div>
              <div className="chatConversation">
                <div className="chatBubble userBubble">今日疲れた</div>
                <div className="chatBubble misakiBubble">そりゃ疲れるよ。<br />昨日も遅かったじゃん。<br />今日はもう頑張らなくていいよ笑</div>
                <div className="chatBubble userBubble">もう帰りたい笑</div>
                <div className="chatBubble misakiBubble">帰っておいで笑<br />今日の話、あとで聞く。</div>
              </div>
            </div>
          </div>
        </section>

        <section className="features">
          <div className="featureHeading">
            <p className="eyebrow">WHY MISAKI</p>
            <h2>会話が、<br />ちゃんと続いていく。</h2>
          </div>
          <div className="featureGrid">
            {features.map((feature) => (
              <div key={feature.number} className="featureCard">
                <span className="featureNumber">{feature.number}</span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="faqSection">
          <div className="faqHeading"><p className="eyebrow">FAQ</p><h2>美咲について、<br />もう少し。</h2></div>
          <div className="faqList">
            {faqs.map((faq, index) => (
              <details key={faq.q} className="faqItem">
                <summary><span>0{index + 1}</span><b>{faq.q}</b><i>＋</i></summary>
                <div className="faqAnswer">{faq.a}</div>
              </details>
            ))}
          </div>
        </section>

        <section className="finalSection">
          <div className="finalVisual">
            <img src="/misaki-final.webp" alt="美咲" className="finalImage" />
            <div className="finalShade" />
            <div className="finalHand">おやすみ♡<br />また明日<br />いっぱい話そうね</div>
            <div className="finalCopy">
              <p className="eyebrow">MISAKI</p>
              <h2>日常に、<br /><span>もうひとつの会話を。</span></h2>
              <p>大した話じゃなくていい。<br />今日あったことを、美咲に少し話してみませんか？</p>
              <Link href="/chat" className="mainCta">美咲に会いにいく <span>→</span></Link>
              <p className="heroNote">無料版は1日20回まで</p>
            </div>
          </div>
        </section>

        <footer>
          <div className="footerBrand"><img src="/icon-192.png" alt="" /><div><strong>美咲</strong><span>日常に、もうひとつの会話を。</span></div></div>
          <small>© 2026 Misaki</small>
        </footer>
      </main>

      <style>{`
        :root{
          --main:#ff5f82;
          --main-dark:#ef3e68;
          --paper:#fffaf9;
          --text:#66575d;
          --title:#44353b;
        }
        *{box-sizing:border-box}
        body{margin:0;background:var(--paper);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Hiragino Sans","Yu Gothic","Meiryo",sans-serif;-webkit-font-smoothing:antialiased}
        a{color:inherit;text-decoration:none}
        img{display:block}
        .page{overflow:hidden}
        .eyebrow{margin:0 0 14px;color:var(--main);font-size:12px;font-weight:900;letter-spacing:.22em}
        .header{width:min(1120px,calc(100% - 36px));height:78px;margin:auto;display:flex;align-items:center;justify-content:space-between}
        .brand{display:flex;align-items:center;gap:12px}.brandIcon{width:47px;height:47px;border-radius:50%;object-fit:cover}.brandName{color:var(--title);font-size:19px;font-weight:900}.brandSub{font-size:11px;color:#97888d}
        .headerCta,.mainCta,.profileCta{display:inline-flex;align-items:center;justify-content:center;gap:18px;background:linear-gradient(135deg,#ff6680,#ff4770);color:#fff;font-weight:900;box-shadow:0 12px 28px rgba(255,102,128,.23)}
        .headerCta{min-height:44px;padding:10px 24px;border-radius:999px;font-size:14px}
        .mainCta,.profileCta{min-height:62px;padding:15px 30px;border-radius:18px;font-size:17px}

        .hero{padding:0 18px}.heroVisual{position:relative;width:min(1160px,100%);min-height:790px;margin:auto;overflow:hidden;border-radius:34px;background:#f8efea}.heroImage{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.heroShade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,250,249,.97),rgba(255,250,249,.75) 38%,rgba(255,250,249,0) 72%)}.heroCopy{position:relative;z-index:2;width:580px;padding:280px 0 70px 65px}.heroSmall{display:inline-flex;padding:7px 16px;border-radius:999px;background:#fff4f7;color:var(--main-dark);font-size:13px;font-weight:900}.hero h1{margin:0;color:var(--title);font-size:clamp(48px,5.2vw,68px);line-height:1.27}.hero h1 span{color:var(--main-dark)}.heroLead{font-size:17px;line-height:1.85}.heroNote{margin:13px 0 0;color:#988a8f;font-size:11px;text-align:center}

        .intro{width:min(840px,calc(100% - 40px));margin:auto;padding:110px 0}.intro h2,.featureHeading h2,.faqHeading h2,.realChatHeading h2,.installCopy h2{margin:0;color:var(--title);font-size:clamp(35px,5vw,50px);line-height:1.5}.intro h2 span,.realChatHeading h2 span,.installCopy h2 span{color:var(--main-dark)}.introText{max-width:670px;font-size:16px;line-height:2}.handCopy{width:fit-content;margin-top:34px;padding:14px 22px;background:#fff0f4;border-radius:5px 20px;font-family:"Yu Mincho",serif;font-size:20px}

        .profileSection{padding:40px 20px 110px;background:linear-gradient(180deg,#fffafa,#f8efea)}
        .profileMagazine{width:min(1080px,100%);margin:auto;overflow:hidden;border-radius:36px;background:#fff7f5;box-shadow:0 28px 80px rgba(76,50,59,.1)}
        .profileHero{position:relative;min-height:965px;overflow:hidden;background:#f9efea}
        .profileImage{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:62% center}
        .profileImageShade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,250,248,.98) 0%,rgba(255,250,248,.9) 27%,rgba(255,250,248,.22) 52%,rgba(255,250,248,0) 73%)}
        .profileHeadline{position:absolute;z-index:3;left:48px;top:34px;width:400px}.profileHello{margin:0;color:var(--title);font-family:"Yu Mincho",serif;font-size:40px}.profileHeadline h2{margin:8px 0 0;color:var(--title);font-size:62px;line-height:1.03;letter-spacing:-.045em}.profileHeadline h2 span{color:#ef174d;font-size:80px}.profileSignature{margin-top:6px;color:var(--main);font-family:"Segoe Script",cursive;font-size:26px}.profileHand{width:fit-content;margin-top:20px;padding:7px 11px;color:var(--main);background:rgba(255,248,249,.72);font-family:"Yu Mincho",serif;font-size:25px;line-height:1.45;transform:rotate(-3deg)}
        .profileSideHand{position:absolute;z-index:3;right:37px;top:190px;color:#4b3840;font-family:"Yu Mincho",serif;font-size:27px;line-height:1.55;transform:rotate(-12deg);text-align:center}
        .profileStoryOverlay{position:absolute;z-index:3;left:48px;bottom:64px;width:445px;color:#3e3438}.profileStoryOverlay p{margin:16px 0 0;font-size:18px;line-height:1.78}.profileStoryOverlay .profileLead{font-weight:800;font-size:19px}
        .profileTags{position:absolute;z-index:3;right:38px;bottom:72px;display:flex;flex-direction:column;gap:14px;align-items:flex-end}.profileTags span{padding:5px 14px;background:rgba(255,243,246,.9);color:#7c5260;font-family:"Yu Mincho",serif;font-size:20px;transform:rotate(-5deg)}
        .profileFacts{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;padding:30px 28px 38px;background:linear-gradient(180deg,#ffe6ec,#ffeff2)}
        .profileFact{aspect-ratio:1;padding:14px 8px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:50%;background:white;text-align:center}.factIcon{font-size:25px}.profileFact span{margin-top:5px;font-size:11px;font-weight:800}.profileFact strong{margin-top:5px;color:#493a3f;font-size:13px;line-height:1.45}
        .profileBottom{display:grid;grid-template-columns:250px 1fr;gap:34px;align-items:center;padding:26px 42px 48px;background:#fff3f5}.profilePolaroid{padding:10px 10px 14px;background:white;box-shadow:0 12px 26px rgba(95,65,75,.12);transform:rotate(-6deg)}.profilePolaroid img{width:100%;aspect-ratio:1.1;object-fit:cover;object-position:center 38%}.profilePolaroid span{display:block;padding:8px 4px 0;color:#4f3e44;font-family:"Yu Mincho",serif;font-size:15px;line-height:1.45}.profileNote{padding:22px 30px;border-radius:28px;background:white;color:#5b414a;font-family:"Yu Mincho",serif;font-size:28px;line-height:1.65}.profileNote span{color:var(--main);font-size:42px}.profileCta{width:100%;margin-top:18px}.profileBottomRight>p{margin:11px 0 0;text-align:center;font-size:11px;color:#94878b}

        .sceneIntro,.features,.faqSection{width:min(1000px,calc(100% - 40px));margin:auto;padding:100px 0}.sceneIntro h2{margin:0;color:var(--title);font-size:44px}.sceneSection{width:min(1070px,calc(100% - 36px));margin:auto}.scene{display:grid;grid-template-columns:1fr 1fr;gap:70px;align-items:center;margin-bottom:100px}.scene.reverse .sceneImageWrap{order:2}.sceneImageWrap{overflow:hidden;border-radius:28px}.sceneImage{width:100%}.sceneCopy{padding:18px}.sceneNumber{font-family:Georgia,serif;font-size:52px;color:#ffd5de}.sceneLabel{font-size:11px;font-weight:900;letter-spacing:.18em;color:var(--main)}.sceneCopy h2{margin:0;color:var(--title);font-size:42px}.sceneText{font-size:16px;line-height:2}.sceneSignature{color:var(--main);font-family:"Segoe Script",cursive}

        .installSection,.realChatSection{padding:110px 20px;background:#fff7f8}.installInner,.realChatInner{width:min(1040px,100%);margin:auto;display:grid;grid-template-columns:1fr 1fr;gap:70px;align-items:center}.installBig,.installLead,.realChatHeading>p:last-child{font-size:16px;line-height:1.95}.installSteps{display:grid;gap:10px}.installSteps div{display:flex;gap:12px;align-items:center;padding:14px 16px;border-radius:16px;background:white}.installSteps b{display:grid;place-items:center;width:31px;height:31px;border-radius:50%;background:var(--main);color:white}.phone{width:min(350px,100%);height:600px;margin:auto;padding:10px;border-radius:48px;background:#42393c}.phoneStatus{height:42px;padding:0 18px;display:flex;align-items:center;justify-content:space-between;background:#f8efea;border-radius:38px 38px 0 0}.phoneScreen{position:relative;height:calc(100% - 42px);overflow:hidden;border-radius:0 0 38px 38px;background:linear-gradient(145deg,#f8efea,#f3d8df)}.phoneDate{padding-top:42px;text-align:center;color:white}.phoneDate strong{display:block;font-size:48px}.notification{position:absolute;top:160px;left:12px;right:12px;display:flex;gap:10px;padding:14px;border-radius:19px;background:rgba(255,255,255,.94)}.notification img{width:42px;height:42px;border-radius:10px}.notification p{font-size:13px;line-height:1.5}
        .realChatSection{background:white}.chatPhone{overflow:hidden;border-radius:32px;background:#f8efea;box-shadow:0 26px 65px rgba(73,51,58,.15)}.chatPhoneHeader{display:flex;align-items:center;gap:11px;padding:18px 20px;background:white}.chatPhoneHeader img{width:46px;height:46px;border-radius:50%}.chatPhoneHeader span{display:block;font-size:10px}.chatConversation{min-height:420px;padding:22px 17px;display:flex;flex-direction:column}.chatBubble{width:fit-content;max-width:82%;margin-bottom:12px;padding:12px 15px;border-radius:19px;font-size:15px;line-height:1.65}.userBubble{align-self:flex-end;background:#ffd5de}.misakiBubble{align-self:flex-start;background:white}

        .featureGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;margin-top:40px}.featureCard{padding:28px;border-radius:24px;background:white;box-shadow:0 12px 32px rgba(74,52,59,.055)}.featureNumber{font-family:Georgia,serif;font-size:32px;color:#ffd5de}.featureCard h3{color:var(--title)}.featureCard p{line-height:1.9}
        .faqSection{display:grid;grid-template-columns:.8fr 1.2fr;gap:60px}.faqItem{border-top:1px solid #eadde1}.faqItem:last-child{border-bottom:1px solid #eadde1}.faqItem summary{list-style:none;display:grid;grid-template-columns:42px 1fr 30px;gap:12px;align-items:center;padding:22px 0;cursor:pointer}.faqItem summary span{color:var(--main);font-weight:900}.faqAnswer{padding:0 0 24px 54px;line-height:1.9}

        .finalSection{padding:28px 18px 90px;background:#fff}.finalVisual{position:relative;width:min(1080px,100%);aspect-ratio:2/3;margin:auto;overflow:hidden;border-radius:42px;background:#f8efea;box-shadow:0 22px 55px rgba(86,58,68,.08)}.finalImage{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 39%}.finalShade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,250,249,0) 0%,rgba(255,250,249,0) 55%,rgba(255,250,249,.14) 61%,rgba(255,250,249,.78) 70%,rgba(255,250,249,.96) 78%,#fffafa 86%,#fffafa 100%)}.finalHand{position:absolute;z-index:2;top:3.3%;left:5.2%;color:#f62f67;font-family:"Yu Mincho","Hiragino Mincho ProN",serif;font-size:clamp(34px,5vw,62px);font-weight:600;line-height:1.48;letter-spacing:.01em;transform:rotate(-7deg);text-shadow:0 1px 0 rgba(255,255,255,.24)}.finalCopy{position:absolute;z-index:2;left:5.4%;right:5.4%;top:56.5%}.finalCopy .eyebrow{margin-bottom:2.3%;font-size:clamp(12px,1.5vw,20px);letter-spacing:.22em}.finalCopy h2{margin:0;color:#49383e;font-size:clamp(46px,6.4vw,78px);font-weight:900;line-height:1.22;letter-spacing:-.045em}.finalCopy h2 span{color:#f43e6d}.finalCopy>p:not(.eyebrow,.heroNote){margin:3.1% 0 4.3%;color:#5e5055;font-size:clamp(17px,2vw,25px);line-height:1.7}.finalCopy .mainCta{width:100%;min-height:clamp(72px,8.6vw,112px);border-radius:28px;font-size:clamp(20px,2.6vw,31px);box-shadow:0 17px 32px rgba(255,72,113,.22)}.finalCopy .heroNote{margin-top:2.4%;font-size:clamp(12px,1.55vw,19px);text-align:center}

        footer{width:min(1100px,calc(100% - 40px));margin:auto;padding:20px 0 45px;display:flex;align-items:center;justify-content:space-between}.footerBrand{display:flex;align-items:center;gap:10px}.footerBrand img{width:42px;height:42px;border-radius:50%}.footerBrand strong,.footerBrand span{display:block}.footerBrand span{font-size:10px;color:#998d91}footer small{font-size:10px;color:#aaa0a3}

        @media(max-width:760px){
          .header{height:72px;width:calc(100% - 26px)}.brandIcon{width:42px;height:42px}.brandSub{display:none}.headerCta{min-height:42px;padding:9px 18px}
          .hero{padding:0}.heroVisual{min-height:830px;border-radius:26px}.heroImage{height:100%;object-position:center top}.heroShade{background:linear-gradient(180deg,transparent 0%,transparent 38%,rgba(255,250,249,.10) 46%,rgba(255,250,249,.72) 58%,rgba(255,250,249,.96) 69%,#fffafa 82%)}.heroCopy{position:absolute;left:0;right:0;bottom:0;width:auto;padding:0 24px 28px}.hero h1{font-size:36px}.heroLead{font-size:16px}.mainCta,.profileCta{width:100%;font-size:18px}
          .intro{padding:76px 0}.intro h2,.featureHeading h2,.faqHeading h2,.realChatHeading h2,.installCopy h2{font-size:32px}
          .profileSection{padding:18px 0 72px;background:#fffafa}.profileMagazine{width:100%;border-radius:0;box-shadow:none}.profileHero{min-height:1100px}.profileImage{object-position:57% center}.profileImageShade{background:linear-gradient(180deg,rgba(255,250,248,.95) 0%,rgba(255,250,248,.68) 21%,rgba(255,250,248,.12) 37%,transparent 56%,rgba(255,250,248,.05) 72%,rgba(255,250,248,.92) 100%)}.profileHeadline{left:28px;right:20px;top:28px;width:auto}.profileHello{font-size:34px}.profileHeadline h2{font-size:44px}.profileHeadline h2 span{font-size:60px}.profileSignature{font-size:22px}.profileHand{font-size:21px}.profileSideHand{right:18px;top:206px;font-size:20px}
          .profileStoryOverlay{left:28px;right:28px;bottom:30px;width:auto}.profileStoryOverlay p{font-size:17px;line-height:1.85}.profileStoryOverlay .profileLead{font-size:18px}.profileTags{display:none}
          .profileFacts{grid-template-columns:repeat(3,1fr);gap:9px;padding:24px 12px 30px}.profileFact{aspect-ratio:1;min-height:0;padding:8px 4px}.factIcon{font-size:20px}.profileFact span{font-size:9px}.profileFact strong{font-size:10px}
          .profileBottom{display:block;padding:22px 22px 38px}.profilePolaroid{display:none}.profileNote{font-size:22px;padding:20px 16px}
          .sceneIntro,.features,.faqSection{width:calc(100% - 36px);padding:78px 0}.sceneIntro h2{font-size:34px}.sceneSection{width:calc(100% - 22px)}.scene{display:flex;flex-direction:column;gap:22px;margin-bottom:72px}.scene.reverse .sceneImageWrap{order:initial}.sceneCopy{width:100%;padding:3px 9px}.sceneCopy h2{font-size:31px}
          .installSection,.realChatSection{padding:78px 18px}.installInner,.realChatInner{display:flex;flex-direction:column;gap:40px}.installLead,.realChatHeading>p:last-child{font-size:17px}
          .featureGrid{grid-template-columns:1fr}.faqSection{display:block}.faqList{margin-top:30px}.faqItem summary b{font-size:16px}.faqAnswer{padding-left:47px}
          .finalSection{padding:12px 9px 60px;background:#fff}.finalVisual{width:100%;aspect-ratio:2/3;min-height:0;border-radius:28px;box-shadow:0 12px 30px rgba(86,58,68,.07)}.finalImage{height:100%;object-position:center 39%}.finalShade{background:linear-gradient(180deg,transparent 0%,transparent 54%,rgba(255,250,249,.12) 60%,rgba(255,250,249,.76) 69%,rgba(255,250,249,.96) 78%,#fffafa 86%,#fffafa 100%)}.finalHand{top:3.2%;left:5.5%;font-size:clamp(27px,8vw,38px);line-height:1.46}.finalCopy{left:5.6%;right:5.6%;top:56.2%;bottom:auto}.finalCopy .eyebrow{margin-bottom:2.1%;font-size:11px}.finalCopy h2{font-size:clamp(35px,10.7vw,48px);line-height:1.22}.finalCopy>p:not(.eyebrow,.heroNote){margin:3% 0 4.1%;font-size:clamp(14px,4.25vw,18px);line-height:1.65}.finalCopy .mainCta{width:100%;min-height:clamp(62px,18vw,78px);font-size:clamp(18px,5.4vw,23px);border-radius:20px}.finalCopy .heroNote{margin-top:2.2%;font-size:12px}
          footer{width:calc(100% - 36px)}
        }
      `}</style>
    </>
  );
}
