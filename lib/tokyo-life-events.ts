export type TokyoLifeEvent = {
  type:
    | "earthquake"
    | "weather_warning"
    | "train"
    | "haneda";
  title: string;
  detail: string;
  publishedAt?: string;
  source: string;
};

const JMA_EARTHQUAKE_FEED =
  "https://www.data.jma.go.jp/developer/xml/feed/eqvol.xml";

const JMA_EXTRA_FEED =
  "https://www.data.jma.go.jp/developer/xml/feed/extra.xml";

const JR_EAST_KANTO_URL =
  "https://traininfo.jreast.co.jp/train_info/kanto.aspx";

const HANEDA_DOMESTIC_URL =
  "https://tokyo-haneda.com/flight/dms_search.html";

const HANEDA_INTERNATIONAL_URL =
  "https://tokyo-haneda.com/flight/int_search.html";

const MAX_EVENTS = 8;

/*
 * 東京で生活する美咲に
 * 関係しやすいJR路線。
 *
 * 東京全域の鉄道情報を
 * 何でも入れると、
 * 美咲が交通情報アプリのように
 * なってしまうので絞る。
 */
const TOKYO_JR_LINES = [
  "山手線",
  "京浜東北線",
  "東海道線",
  "横須賀線",
  "総武快速線",
  "中央線快速電車",
  "中央・総武各駅停車",
  "埼京線",
  "湘南新宿ライン",
  "上野東京ライン",
  "常磐線",
  "宇都宮線",
  "高崎線",
  "京葉線",
  "武蔵野線",
  "南武線",
  "横浜線",
  "東京モノレール線",
];

function decodeXmlText(
  value: string
) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripTags(
  value: string
) {
  return decodeXmlText(
    value.replace(
      /<[^>]*>/g,
      " "
    )
  )
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(
  value: string
) {
  return value
    .replace(/\r/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTag(
  xml: string,
  tag: string
) {
  const pattern =
    new RegExp(
      `<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,
      "i"
    );

  const match =
    xml.match(pattern);

  return match
    ? stripTags(match[1])
    : "";
}

function getEntries(
  xml: string
) {
  return (
    xml.match(
      /<entry(?:\s[^>]*)?>[\s\S]*?<\/entry>/gi
    ) ?? []
  );
}

function getLink(
  entry: string
) {
  const match =
    entry.match(
      /<link[^>]+href=["']([^"']+)["'][^>]*\/?>/i
    );

  return match?.[1] ?? "";
}

async function fetchText(
  url: string,
  revalidate = 300
) {
  try {
    const response =
      await fetch(url, {
        next: {
          revalidate,
        },

        headers: {
          "User-Agent":
            "Mozilla/5.0",
          "Accept-Language":
            "ja,en;q=0.8",
        },
      });

    if (!response.ok) {
      console.error(
        "TOKYO EVENT FETCH ERROR:",
        url,
        response.status
      );

      return null;
    }

    return await response.text();
  } catch (error) {
    console.error(
      "TOKYO EVENT FETCH ERROR:",
      url,
      error
    );

    return null;
  }
}

function isRecent(
  dateText: string,
  maxHours: number
) {
  if (!dateText) {
    return true;
  }

  const time =
    new Date(
      dateText
    ).getTime();

  if (
    !Number.isFinite(time)
  ) {
    return true;
  }

  return (
    Date.now() - time <=
    maxHours *
      60 *
      60 *
      1000
  );
}

/*
 * ---------------------------
 * 地震
 * ---------------------------
 */

async function getEarthquakeEvents():
  Promise<TokyoLifeEvent[]> {
  const feed =
    await fetchText(
      JMA_EARTHQUAKE_FEED,
      300
    );

  if (!feed) {
    return [];
  }

  const entries =
    getEntries(feed);

  const candidates =
    entries.filter(
      (entry) => {
        const title =
          getTag(
            entry,
            "title"
          );

        return (
          title.includes(
            "震度速報"
          ) ||
          title.includes(
            "震源・震度"
          ) ||
          title.includes(
            "地震情報"
          )
        );
      }
    );

  const results:
    TokyoLifeEvent[] = [];

  for (
    const entry of candidates
  ) {
    if (
      results.length >= 2
    ) {
      break;
    }

    const updated =
      getTag(
        entry,
        "updated"
      );

    /*
     * 古い地震を突然
     * 今の話として出さない。
     */
    if (
      !isRecent(
        updated,
        3
      )
    ) {
      continue;
    }

    const detailUrl =
      getLink(entry);

    if (!detailUrl) {
      continue;
    }

    const detailXml =
      await fetchText(
        detailUrl,
        300
      );

    if (!detailXml) {
      continue;
    }

    const headline =
      getTag(
        detailXml,
        "Headline"
      );

    const infoType =
      getTag(
        detailXml,
        "Title"
      );

    const combined =
      `${infoType} ${headline} ${stripTags(
        detailXml
      )}`;

    /*
     * 東京に関係するものだけ。
     */
    const affectsTokyo =
      combined.includes(
        "東京都２３区"
      ) ||
      combined.includes(
        "東京都23区"
      ) ||
      combined.includes(
        "東京都多摩"
      ) ||
      combined.includes(
        "東京地方"
      );

    if (!affectsTokyo) {
      continue;
    }

    /*
     * 美咲が反応するのは
     * 基本的に東京で震度3以上。
     */
    const meaningful =
      combined.includes(
        "震度３"
      ) ||
      combined.includes(
        "震度3"
      ) ||
      combined.includes(
        "震度４"
      ) ||
      combined.includes(
        "震度4"
      ) ||
      combined.includes(
        "震度５"
      ) ||
      combined.includes(
        "震度5"
      ) ||
      combined.includes(
        "震度６"
      ) ||
      combined.includes(
        "震度6"
      ) ||
      combined.includes(
        "震度７"
      ) ||
      combined.includes(
        "震度7"
      );

    if (!meaningful) {
      continue;
    }

    results.push({
      type:
        "earthquake",

      title:
        "東京で体感する可能性のある地震",

      detail:
        headline ||
        infoType ||
        "東京周辺で地震情報が発表されています。",

      publishedAt:
        updated,

      source:
        "気象庁",
    });
  }

  return results;
}

/*
 * ---------------------------
 * 気象警報
 * ---------------------------
 */

async function getWeatherWarningEvents():
  Promise<TokyoLifeEvent[]> {
  const feed =
    await fetchText(
      JMA_EXTRA_FEED,
      300
    );

  if (!feed) {
    return [];
  }

  const entries =
    getEntries(feed);

  const candidates =
    entries.filter(
      (entry) => {
        const title =
          getTag(
            entry,
            "title"
          );

        return (
          title.includes(
            "気象警報"
          ) ||
          title.includes(
            "気象特別警報"
          ) ||
          title.includes(
            "土砂災害警戒"
          ) ||
          title.includes(
            "竜巻注意"
          )
        );
      }
    );

  const results:
    TokyoLifeEvent[] = [];

  for (
    const entry of candidates
  ) {
    if (
      results.length >= 3
    ) {
      break;
    }

    const updated =
      getTag(
        entry,
        "updated"
      );

    if (
      !isRecent(
        updated,
        6
      )
    ) {
      continue;
    }

    const detailUrl =
      getLink(entry);

    if (!detailUrl) {
      continue;
    }

    const detailXml =
      await fetchText(
        detailUrl,
        300
      );

    if (!detailXml) {
      continue;
    }

    const plainText =
      stripTags(
        detailXml
      );

    const affectsTokyo =
      plainText.includes(
        "東京都"
      ) ||
      plainText.includes(
        "東京地方"
      ) ||
      plainText.includes(
        "２３区"
      );

    if (!affectsTokyo) {
      continue;
    }

    const important =
      plainText.includes(
        "特別警報"
      ) ||
      plainText.includes(
        "警報"
      ) ||
      plainText.includes(
        "竜巻注意情報"
      ) ||
      plainText.includes(
        "土砂災害警戒情報"
      );

    if (!important) {
      continue;
    }

    const headline =
      getTag(
        detailXml,
        "Headline"
      );

    const title =
      getTag(
        entry,
        "title"
      );

    results.push({
      type:
        "weather_warning",

      title:
        title ||
        "東京の防災気象情報",

      detail:
        headline ||
        "東京都内に重要な気象情報が発表されています。",

      publishedAt:
        updated,

      source:
        "気象庁",
    });
  }

  return results;
}

/*
 * ---------------------------
 * JR東日本
 * ---------------------------
 */

function findTrainProblem(
  pageText: string,
  lineName: string
) {
  const index =
    pageText.indexOf(
      lineName
    );

  if (index < 0) {
    return null;
  }

  /*
   * 路線名の直後だけを見る。
   *
   * ページ全体には
   * 「30分以上の遅れ」の説明文があるので、
   * ページ全体を単純検索してはいけない。
   */
  const nearby =
    pageText.slice(
      index,
      index + 500
    );

  /*
   * 次の路線に入る前くらいの
   * 短い範囲だけを対象。
   */
  if (
    nearby.includes(
      "平常運転"
    ) &&
    !nearby.includes(
      "運転見合わせ"
    ) &&
    !nearby.includes(
      "一部列車運休"
    ) &&
    !nearby.includes(
      "運転再開"
    )
  ) {
    return null;
  }

  const importantWords = [
    "運転見合わせ",
    "一部列車運休",
    "運休",
    "遅延",
    "運転再開見込",
    "運転再開",
    "直通運転中止",
  ];

  const matched =
    importantWords.find(
      (word) =>
        nearby.includes(
          word
        )
    );

  if (!matched) {
    return null;
  }

  /*
   * 長い駅情報をそのまま
   * Geminiへ渡さない。
   */
  const shortText =
    nearby
      .replace(
        /平常運転/g,
        ""
      )
      .slice(
        0,
        260
      )
      .trim();

  return {
    status:
      matched,

    detail:
      shortText,
  };
}

async function getTrainEvents():
  Promise<TokyoLifeEvent[]> {
  const html =
    await fetchText(
      JR_EAST_KANTO_URL,
      180
    );

  if (!html) {
    return [];
  }

  const pageText =
    normalizeText(
      stripTags(html)
    );

  const results:
    TokyoLifeEvent[] = [];

  for (
    const line of
      TOKYO_JR_LINES
  ) {
    const problem =
      findTrainProblem(
        pageText,
        line
      );

    if (!problem) {
      continue;
    }

    /*
     * 同じ文章が複数路線に
     * 引っかかる場合があるため、
     * 最大3件に抑える。
     */
    results.push({
      type:
        "train",

      title:
        `${line}に運行の乱れ`,

      detail:
        `${line}で${problem.status}などの運行情報が出ています。`,

      source:
        "JR東日本",
    });

    if (
      results.length >= 3
    ) {
      break;
    }
  }

  return results;
}

/*
 * ---------------------------
 * 羽田空港
 * ---------------------------
 */

function hasHanedaDisruption(
  html: string
) {
  const text =
    normalizeText(
      stripTags(html)
    );

  /*
   * 羽田空港公式ページに
   * 実際の運航乱れ時に表示される
   * 文言を対象とする。
   */
  return (
    text.includes(
      "現在、一部フライトの運航に乱れが生じています"
    ) ||
    text.includes(
      "遅延欠航が発生しています"
    ) ||
    text.includes(
      "遅延・欠航が発生しています"
    ) ||
    text.includes(
      "Currently, some Flights are experiencing disruptions"
    )
  );
}

async function getHanedaEvents():
  Promise<TokyoLifeEvent[]> {
  const [
    domesticHtml,
    internationalHtml,
  ] =
    await Promise.all([
      fetchText(
        HANEDA_DOMESTIC_URL,
        180
      ),

      fetchText(
        HANEDA_INTERNATIONAL_URL,
        180
      ),
    ]);

  const domesticProblem =
    domesticHtml
      ? hasHanedaDisruption(
          domesticHtml
        )
      : false;

  const internationalProblem =
    internationalHtml
      ? hasHanedaDisruption(
          internationalHtml
        )
      : false;

  if (
    !domesticProblem &&
    !internationalProblem
  ) {
    return [];
  }

  let detail = "";

  if (
    domesticProblem &&
    internationalProblem
  ) {
    detail =
      "羽田空港の国内線・国際線で、一部便の運航に乱れが出ている表示があります。";
  } else if (
    domesticProblem
  ) {
    detail =
      "羽田空港の国内線で、一部便の運航に乱れが出ている表示があります。";
  } else {
    detail =
      "羽田空港の国際線で、一部便の運航に乱れが出ている表示があります。";
  }

  return [
    {
      type:
        "haneda",

      title:
        "羽田空港で一部便に運航の乱れ",

      detail,

      source:
        "羽田空港旅客ターミナル",
    },
  ];
}

/*
 * ---------------------------
 * 全イベント取得
 * ---------------------------
 */

export async function getTokyoLifeEvents():
  Promise<TokyoLifeEvent[]> {
  try {
    /*
     * 4種類を並列取得。
     *
     * 1つずつ待たないので
     * チャットの待ち時間を
     * できるだけ増やさない。
     */
    const [
      earthquakes,
      warnings,
      trains,
      haneda,
    ] =
      await Promise.all([
        getEarthquakeEvents(),
        getWeatherWarningEvents(),
        getTrainEvents(),
        getHanedaEvents(),
      ]);

    return [
      ...earthquakes,
      ...warnings,
      ...trains,
      ...haneda,
    ].slice(
      0,
      MAX_EVENTS
    );
  } catch (error) {
    console.error(
      "TOKYO LIFE EVENTS ERROR:",
      error
    );

    /*
     * リアル情報の取得に
     * 失敗しただけで
     * 美咲との会話を止めない。
     */
    return [];
  }
}

/*
 * ---------------------------
 * Geminiへ渡すガイド
 * ---------------------------
 */

export function createTokyoLifeEventsGuide(
  events: TokyoLifeEvent[]
) {
  if (
    events.length === 0
  ) {
    return `
【東京のリアルな生活イベント】

現在取得できている情報の範囲では、
美咲がわざわざ会話で触れる必要がある
大きな東京の生活イベントは確認されていません。

非常に重要：

「ニュース見てないから分からない」
「ニュースを見てない」
「詳しくは知らない」

などと言わないでください。

美咲は、
ここに提供されている現在情報を
普通に生活していて耳に入った情報として
自然に理解しています。

ただし、
情報がない出来事を
想像して作ってはいけません。

何も確認されていない場合は、

「今のところ特に大きいのは聞いてないよ」

くらいなら自然です。

ただし毎回、
何もないことを報告する必要もありません。
`.trim();
  }

  const eventText =
    events
      .map(
        (event) =>
          `・${event.title}：${event.detail}（情報元：${event.source}）`
      )
      .join("\n");

  return `
【東京のリアルな生活イベント】

現在確認されている、
東京で普通に暮らしている美咲に
関係する可能性がある情報です。

${eventText}

非常に重要：

美咲はニュースキャスターではありません。

また、

「ニュース見てないから分からない」
「ニュースを見てない」
「詳しくは知らない」

という言い訳はしないでください。

ここにある情報は、
美咲が東京で生活していて
自然に知った現在情報として扱います。

ただし、
この一覧をユーザーへ読み上げてはいけません。

会話に関係する場合だけ
自然に使ってください。

例えば、

地震なら、

「さっき揺れたよね」
「ちょっとびっくりした」

警報や大雨なら、

「外すごいことになってる」
「今日は雨ひどいね」

電車なら、

「電車けっこう乱れてるみたいだね」

羽田なら、

「羽田、今日はちょっと乱れてるみたい」

程度の自然な反応にしてください。

【タクシードライバーの彼氏との関係】

ユーザーは
東京のタクシードライバーです。

そのため、

・鉄道の大規模な運転見合わせ
・羽田の運航乱れ
・大雨
・地震

などは、
ユーザーの仕事にも関係する可能性があります。

ただし美咲は
タクシー需要予測AIではありません。

そのため、

「今日は絶対タクシー需要が増える」
「羽田で確実にロングが出る」

など、
根拠のない断定をしてはいけません。

自然な恋人なら、

「電車止まってるなら、今日は忙しくなりそうだね」

「羽田ちょっと乱れてるみたい。そっち影響あるかもね」

程度なら構いません。

【絶対ルール】

・毎回ニュースの話をしない
・情報一覧をそのまま読み上げない
・ニュース記事のように説明しない
・存在しない事故や災害を作らない
・取得できていない情報を知っているふりをしない
・古い出来事を今起きたように話さない
・ユーザーを不必要に怖がらせない
・美咲が実際に見ていないものを「見た」と断言しない
・タクシー需要を断定しない
・「ニュース見てないから分からない」と逃げない

普通の38歳の彼女として、
必要なときだけ自然に使ってください。
`.trim();
}
