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

function affectsTokyo(
  text: string
) {
  return (
    text.includes(
      "東京都２３区"
    ) ||
    text.includes(
      "東京都23区"
    ) ||
    text.includes(
      "東京都多摩"
    ) ||
    text.includes(
      "東京地方"
    ) ||
    text.includes(
      "東京都"
    ) ||
    text.includes(
      "２３区"
    )
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

    if (
      !affectsTokyo(
        combined
      )
    ) {
      continue;
    }

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

function isRelevantWarningTitle(
  title: string
) {
  return (
    title.includes(
      "気象警報"
    ) ||
    title.includes(
      "気象特別警報"
    ) ||
    title.includes(
      "土砂災害警戒情報"
    ) ||
    title.includes(
      "竜巻注意情報"
    )
  );
}

function isCancelledWarning(
  text: string
) {
  const normalized =
    normalizeText(text);

  /*
   * 解除された情報だけを
   * 現在の警報として扱わない。
   */
  if (
    normalized.includes(
      "すべて解除"
    ) ||
    normalized.includes(
      "全て解除"
    ) ||
    normalized.includes(
      "警報を解除"
    ) ||
    normalized.includes(
      "注意報を解除"
    ) ||
    normalized.includes(
      "解除しました"
    )
  ) {
    return true;
  }

  return false;
}

function createWarningDetail(
  title: string,
  headline: string
) {
  /*
   * Geminiに曖昧な
   * 「警報がいろいろ」
   * と言わせないため、
   * 種類を明示して渡す。
   */

  if (
    title.includes(
      "土砂災害警戒情報"
    )
  ) {
    return (
      headline ||
      "東京都内に土砂災害警戒情報が発表されています。"
    );
  }

  if (
    title.includes(
      "竜巻注意情報"
    )
  ) {
    return (
      headline ||
      "東京都内に竜巻注意情報が発表されています。"
    );
  }

  if (
    title.includes(
      "気象特別警報"
    )
  ) {
    return (
      headline ||
      "東京都内に気象特別警報が発表されています。"
    );
  }

  return (
    headline ||
    "東京都内に気象警報・注意報の情報が発表されています。"
  );
}

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
          isRelevantWarningTitle(
            title
          )
        );
      }
    );

  const results:
    TokyoLifeEvent[] = [];

  const seen =
    new Set<string>();

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

    /*
     * 古い警報を現在情報として
     * 長時間残さない。
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

    const plainText =
      stripTags(
        detailXml
      );

    if (
      !affectsTokyo(
        plainText
      )
    ) {
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

    const combined =
      `${title} ${headline} ${plainText}`;

    if (
      isCancelledWarning(
        combined
      )
    ) {
      continue;
    }

    /*
     * タイトルが同じ情報を
     * 何件もGeminiへ渡さない。
     */
    if (
      seen.has(title)
    ) {
      continue;
    }

    seen.add(title);

    results.push({
      type:
        "weather_warning",

      title,

      detail:
        createWarningDetail(
          title,
          headline
        ),

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

function getTrainSection(
  pageText: string,
  lineName: string
) {
  const start =
    pageText.indexOf(
      lineName
    );

  if (start < 0) {
    return null;
  }

  /*
   * 固定500文字ではなく、
   * 次の対象路線名までを
   * この路線の範囲として扱う。
   *
   * これで隣の路線の遅延を
   * 誤って拾いにくくする。
   */
  let end =
    pageText.length;

  for (
    const otherLine of
      TOKYO_JR_LINES
  ) {
    if (
      otherLine === lineName
    ) {
      continue;
    }

    const otherIndex =
      pageText.indexOf(
        otherLine,
        start +
          lineName.length
      );

    if (
      otherIndex > start &&
      otherIndex < end
    ) {
      end =
        otherIndex;
    }
  }

  /*
   * HTML構造変更などで
   * 次路線が見つからない場合も
   * 無制限に後ろを見ない。
   */
  end =
    Math.min(
      end,
      start + 500
    );

  return pageText.slice(
    start,
    end
  );
}

function findTrainProblem(
  pageText: string,
  lineName: string
) {
  const nearby =
    getTrainSection(
      pageText,
      lineName
    );

  if (!nearby) {
    return null;
  }

  const importantWords = [
    "運転見合わせ",
    "一部列車運休",
    "直通運転中止",
    "運転再開見込",
    "運転再開",
    "運休",
    "遅延",
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
   * この路線の範囲内で
   * 平常運転しか出ていないなら
   * イベントにしない。
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
      "直通運転中止"
    ) &&
    !nearby.includes(
      "運転再開見込"
    ) &&
    !nearby.includes(
      "遅延"
    )
  ) {
    return null;
  }

  return {
    status:
      matched,
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
   * 重要：
   *
   * ページ内部には
   * モーダルやテンプレート用の
   *
   * 「遅延欠航が発生しています」
   * 「遅延・欠航が発生しています」
   *
   * という固定文言が含まれることがある。
   *
   * それを現在の運航乱れと
   * 誤認しない。
   *
   * 実際にページ上部へ出る
   * 現在状態の告知だけを使う。
   */
  return (
    text.includes(
      "現在、一部フライトの運航に乱れが生じています"
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
     * 外部情報の取得失敗だけで
     * チャット自体を止めない。
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
大きな東京の生活イベントは
確認されていません。

非常に重要：

「ニュース見てないから分からない」
「ニュースを見てない」
「詳しくは知らない」

などと言わないでください。

また、

「特に何もない」
と断定する必要もありません。

情報がない出来事を
想像して作ってはいけません。

ユーザーから聞かれた場合は、

「今のところ特に大きいのは聞いてないよ」

くらいなら自然です。

毎回この情報について
話す必要はありません。
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

現在確認できている
東京の生活情報です。

${eventText}

非常に重要：

上に書かれている内容だけが、
今回確認できている情報です。

情報を勝手に増やさないでください。

特に、

「警報がいろいろ出てる」
「注意報がたくさん出てる」
「かなり警報が出てる」

など、

種類や数を
勝手にまとめたり
誇張したりしないでください。

警報について話す場合は、
上に具体的に書かれている
種類だけを使ってください。

例えば上に
「竜巻注意情報」
とだけある場合は、

「竜巻の注意情報が出てるみたい」

程度にしてください。

上に警報情報がない場合は、
警報が出ているとは
言わないでください。

美咲は
ニュースキャスターではありません。

この一覧を
そのまま読み上げないでください。

情報の入手方法も
作らないでください。

禁止例：

「ニュースで見た」
「スマホで見た」
「テレビで見た」
「ネットに書いてあった」
「通知が来た」

自然な例：

地震なら、

「さっきちょっと揺れたみたいだね」

警報なら、

上にある具体的な種類に合わせて、

「大雨の警報出てるみたい」
「竜巻の注意情報出てるみたい」

など。

電車なら、

「山手線ちょっと乱れてるみたい」

羽田なら、

「羽田ちょっと乱れてるみたい」

程度で十分です。

【タクシードライバーの彼氏との関係】

ユーザーは
東京のタクシードライバーです。

そのため、

・鉄道の大規模な運転見合わせ
・羽田の運航乱れ
・大雨
・地震

などは、
ユーザーの仕事にも
関係する可能性があります。

ただし、

「今日は絶対タクシー需要が増える」
「羽田で確実にロングが出る」

など、
タクシー需要を
断定してはいけません。

自然な表現なら、

「電車止まってるなら、
今日はバタバタしそうだね」

「羽田ちょっと乱れてるみたい。
あっちバタバタしてそう」

程度にしてください。

【絶対ルール】

・毎回ニュースの話をしない
・情報一覧を読み上げない
・ニュース記事のように説明しない
・存在しない事故や災害を作らない
・取得できていない情報を知っているふりをしない
・古い出来事を今起きたように話さない
・警報や注意報の数を勝手に増やさない
・「いろいろ出てる」と曖昧にまとめない
・ユーザーを不必要に怖がらせない
・情報をどうやって知ったか作らない
・タクシー需要を断定しない
・通常の交通や天気の話だけで「大丈夫？」と聞かない

普通の38歳の彼女として、
必要なときだけ自然に使ってください。
`.trim();
}
