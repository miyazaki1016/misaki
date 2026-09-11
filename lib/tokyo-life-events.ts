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

const MAX_EVENTS = 6;

function decodeXmlText(
  value: string
) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(
  value: string
) {
  return decodeXmlText(
    value.replace(
      /<[^>]*>/g,
      ""
    )
  )
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
  url: string
) {
  try {
    const response =
      await fetch(url, {
        next: {
          revalidate: 300,
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

async function getEarthquakeEvents():
  Promise<TokyoLifeEvent[]> {
  const feed =
    await fetchText(
      JMA_EARTHQUAKE_FEED
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

    // 古い地震を突然話題にしない
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
        detailUrl
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
     * 東京に関係する地震だけを
     * 美咲の生活イベントとして扱う。
     *
     * 東京都23区・東京都多摩などが
     * 電文に含まれる場合を対象にする。
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
     * 小さすぎる地震を
     * 毎回美咲が話題にすると
     * 逆に不自然なので、
     * 東京で震度3以上が示される
     * 情報を優先する。
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
      type: "earthquake",
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

async function getWeatherWarningEvents():
  Promise<TokyoLifeEvent[]> {
  const feed =
    await fetchText(
      JMA_EXTRA_FEED
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
        detailUrl
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

    /*
     * 注意報だけで頻繁に反応すると
     * 美咲が防災アプリのようになるため、
     * 基本は警報・特別警報・
     * 竜巻など生活への影響が大きいもの。
     */
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

export async function getTokyoLifeEvents():
  Promise<TokyoLifeEvent[]> {
  try {
    const [
      earthquakes,
      warnings,
    ] =
      await Promise.all([
        getEarthquakeEvents(),
        getWeatherWarningEvents(),
      ]);

    return [
      ...earthquakes,
      ...warnings,
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
     * 外部情報取得に失敗しても
     * 美咲との会話そのものは
     * 絶対に止めない。
     */
    return [];
  }
}

export function createTokyoLifeEventsGuide(
  events: TokyoLifeEvent[]
) {
  if (
    events.length === 0
  ) {
    return `
【東京のリアルな生活イベント】

現在、美咲が会話で触れる必要がある
大きな生活イベントは確認されていません。

地震・警報などを
想像で作ってはいけません。

何も起きていない場合は、
この項目には触れないでください。
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
東京で生活する美咲に関係する
重要な出来事です。

${eventText}

非常に重要：

これはニュース読み上げ用の情報ではありません。

美咲はニュースキャスターではなく、
東京で普通に暮らしている38歳の女性です。

会話に関係がある場合だけ、
生活している本人の感覚として
自然に使ってください。

例えば地震なら、

「さっき結構揺れたよね」
「びっくりした…」

のような反応はできます。

大雨や警報なら、

「外すごいことになってる」
「今日は出たくないなぁ」

程度の自然な反応にしてください。

ただし、

・毎回イベントを話題にしない
・ニュース記事のように説明しない
・震度や警報名を必要以上に読み上げない
・取得できていない出来事を作らない
・古い出来事を今起きたように話さない
・ユーザーを不必要に怖がらせない
・美咲が実際に見ていないものを「見た」と断言しない

というルールを守ってください。
`.trim();
}
