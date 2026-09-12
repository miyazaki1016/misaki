export type TokyoLifeEvent = {
  type:
    | "earthquake"
    | "weather_warning"
    | "weather_forecast"
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

/*
 * 美咲の生活圏。
 *
 * ユーザーの現在地ではなく、
 * 美咲が普段生活している場所として
 * 江東区周辺の代表座標を固定で使う。
 */
const MISAKI_LATITUDE =
  35.6728;

const MISAKI_LONGITUDE =
  139.8174;

const MAX_EVENTS = 9;

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
    .replace(
      /&lt;/g,
      "<"
    )
    .replace(
      /&gt;/g,
      ">"
    )
    .replace(
      /&amp;/g,
      "&"
    )
    .replace(
      /&quot;/g,
      '"'
    )
    .replace(
      /&#39;/g,
      "'"
    )
    .replace(
      /&nbsp;/g,
      " "
    );
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
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

function normalizeText(
  value: string
) {
  return value
    .replace(
      /\r/g,
      ""
    )
    .replace(
      /\n+/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
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
    xml.match(
      pattern
    );

  return match
    ? stripTags(
        match[1]
      )
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

  return (
    match?.[1] ??
    ""
  );
}

async function fetchText(
  url: string,
  revalidate = 300
) {
  try {
    const response =
      await fetch(
        url,
        {
          next: {
            revalidate,
          },

          headers: {
            "User-Agent":
              "Mozilla/5.0",

            "Accept-Language":
              "ja,en;q=0.8",
          },
        }
      );

    if (
      !response.ok
    ) {
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

async function fetchJson<T>(
  url: string,
  revalidate = 300
): Promise<T | null> {
  try {
    const response =
      await fetch(
        url,
        {
          next: {
            revalidate,
          },
        }
      );

    if (
      !response.ok
    ) {
      console.error(
        "WEATHER FORECAST ERROR:",
        response.status
      );

      return null;
    }

    return (
      await response.json()
    ) as T;
  } catch (error) {
    console.error(
      "WEATHER FORECAST ERROR:",
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
    !Number.isFinite(
      time
    )
  ) {
    return true;
  }

  return (
    Date.now() -
      time <=
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

function affectsKoto(
  text: string
) {
  return (
    text.includes(
      "江東区"
    ) ||
    text.includes(
      "東京都２３区"
    ) ||
    text.includes(
      "東京都23区"
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
 * ===========================
 * 地震
 * ===========================
 */

async function getEarthquakeEvents():
  Promise<
    TokyoLifeEvent[]
  > {
  const feed =
    await fetchText(
      JMA_EARTHQUAKE_FEED,
      300
    );

  if (!feed) {
    return [];
  }

  const entries =
    getEntries(
      feed
    );

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
    const entry
    of candidates
  ) {
    if (
      results.length >=
      2
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
      getLink(
        entry
      );

    if (
      !detailUrl
    ) {
      continue;
    }

    const detailXml =
      await fetchText(
        detailUrl,
        300
      );

    if (
      !detailXml
    ) {
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
      /震度[３3４4５5６6７7]/.test(
        combined
      );

    if (
      !meaningful
    ) {
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
 * ===========================
 * 気象警報
 * ===========================
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
    normalizeText(
      text
    );

  return (
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
  );
}

function createWarningDetail(
  title: string,
  headline: string
) {
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
  Promise<
    TokyoLifeEvent[]
  > {
  const feed =
    await fetchText(
      JMA_EXTRA_FEED,
      300
    );

  if (!feed) {
    return [];
  }

  const entries =
    getEntries(
      feed
    );

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
    const entry
    of candidates
  ) {
    if (
      results.length >=
      3
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
      getLink(
        entry
      );

    if (
      !detailUrl
    ) {
      continue;
    }

    const detailXml =
      await fetchText(
        detailUrl,
        300
      );

    if (
      !detailXml
    ) {
      continue;
    }

    const plainText =
      stripTags(
        detailXml
      );

    if (
      !affectsKoto(
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

    if (
      seen.has(
        title
      )
    ) {
      continue;
    }

    seen.add(
      title
    );

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
 * ===========================
 * 江東区周辺
 * 今後6時間の天気
 * ===========================
 */

type OpenMeteoHourly = {
  time?: string[];

  precipitation_probability?:
    number[];

  precipitation?:
    number[];

  rain?:
    number[];

  weather_code?:
    number[];
};

type OpenMeteoResponse = {
  hourly?:
    OpenMeteoHourly;
};

type HourlyWeather = {
  time: string;

  probability:
    number;

  precipitation:
    number;

  rain:
    number;

  weatherCode:
    number;
};

function weatherCodeToText(
  code: number
) {
  if (
    code === 0
  ) {
    return "晴れ";
  }

  if (
    code === 1 ||
    code === 2
  ) {
    return (
      "晴れ時々くもり"
    );
  }

  if (
    code === 3
  ) {
    return "くもり";
  }

  if (
    code === 45 ||
    code === 48
  ) {
    return "霧";
  }

  if (
    code >= 51 &&
    code <= 57
  ) {
    return "霧雨";
  }

  if (
    code >= 61 &&
    code <= 67
  ) {
    return "雨";
  }

  if (
    code >= 71 &&
    code <= 77
  ) {
    return "雪";
  }

  if (
    code >= 80 &&
    code <= 82
  ) {
    return "にわか雨";
  }

  if (
    code >= 85 &&
    code <= 86
  ) {
    return "にわか雪";
  }

  if (
    code >= 95
  ) {
    return "雷雨";
  }

  return "不明";
}

function formatHour(
  value: string
) {
  const match =
    value.match(
      /T(\d{2}):(\d{2})/
    );

  if (
    !match
  ) {
    return value;
  }

  return `${Number(
    match[1]
  )}時`;
}

function buildHourlyWeather(
  hourly:
    OpenMeteoHourly
) {
  const times =
    hourly.time ??
    [];

  const probabilities =
    hourly
      .precipitation_probability ??
    [];

  const precipitation =
    hourly.precipitation ??
    [];

  const rain =
    hourly.rain ??
    [];

  const codes =
    hourly.weather_code ??
    [];

  const result:
    HourlyWeather[] =
    [];

  for (
    let i = 0;
    i < times.length;
    i += 1
  ) {
    const time =
      times[i];

    if (
      !time
    ) {
      continue;
    }

    result.push({
      time,

      probability:
        typeof probabilities[
          i
        ] === "number"
          ? probabilities[i]
          : 0,

      precipitation:
        typeof precipitation[
          i
        ] === "number"
          ? precipitation[i]
          : 0,

      rain:
        typeof rain[
          i
        ] === "number"
          ? rain[i]
          : 0,

      weatherCode:
        typeof codes[
          i
        ] === "number"
          ? codes[i]
          : 0,
    });
  }

  return result;
}

function hasMeaningfulWeather(
  points:
    HourlyWeather[]
) {
  return points.some(
    (point) =>
      point.probability >=
        40 ||
      point.precipitation >=
        0.2 ||
      point.rain >=
        0.2 ||
      point.weatherCode >=
        95
  );
}

function createForecastDetail(
  points:
    HourlyWeather[]
) {
  const rainy =
    points.filter(
      (point) =>
        point.probability >=
          40 ||
        point.precipitation >=
          0.2 ||
        point.rain >=
          0.2
    );

  const thunder =
    points.filter(
      (point) =>
        point.weatherCode >=
        95
    );

  const maxProbability =
    points.reduce(
      (
        current,
        point
      ) =>
        Math.max(
          current,
          point.probability
        ),
      0
    );

  const maxRain =
    points.reduce(
      (
        current,
        point
      ) =>
        Math.max(
          current,
          point.rain,
          point.precipitation
        ),
      0
    );

  const parts:
    string[] = [];

  if (
    rainy.length > 0
  ) {
    const first =
      rainy[0];

    const last =
      rainy[
        rainy.length -
          1
      ];

    if (
      first &&
      last
    ) {
      if (
        first.time ===
        last.time
      ) {
        parts.push(
          `${formatHour(
            first.time
          )}ごろに雨の可能性があります。`
        );
      } else {
        parts.push(
          `${formatHour(
            first.time
          )}ごろから${formatHour(
            last.time
          )}ごろにかけて雨の可能性があります。`
        );
      }
    }
  }

  if (
    maxProbability >=
    40
  ) {
    parts.push(
      `今後6時間の最大降水確率は約${Math.round(
        maxProbability
      )}%です。`
    );
  }

  if (
    maxRain >= 0.2
  ) {
    parts.push(
      `時間帯によっては1時間あたり約${maxRain.toFixed(
        1
      )}mm程度の降水が見込まれます。`
    );
  }

  if (
    thunder.length >
    0
  ) {
    parts.push(
      `${formatHour(
        thunder[0].time
      )}ごろを中心に雷雨の可能性があります。`
    );
  }

  /*
   * WMOコードの数字が一番大きいものを
   * 「強い状態」の目安として使う。
   */
  let strongest =
    points[0];

  for (
    const point
    of points
  ) {
    if (
      !strongest ||
      point.weatherCode >
        strongest.weatherCode
    ) {
      strongest =
        point;
    }
  }

  if (
    strongest
  ) {
    parts.push(
      `主な予報状態は「${weatherCodeToText(
        strongest.weatherCode
      )}」です。`
    );
  }

  return parts.join(
    " "
  );
}

async function getKotoWeatherForecastEvents():
  Promise<
    TokyoLifeEvent[]
  > {
  const hourly =
    [
      "precipitation_probability",
      "precipitation",
      "rain",
      "weather_code",
    ].join(
      ","
    );

  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${MISAKI_LATITUDE}` +
    `&longitude=${MISAKI_LONGITUDE}` +
    `&hourly=${hourly}` +
    "&forecast_hours=6" +
    "&timezone=Asia%2FTokyo";

  const data =
    await fetchJson<
      OpenMeteoResponse
    >(
      url,
      300
    );

  if (
    !data?.hourly
  ) {
    return [];
  }

  const points =
    buildHourlyWeather(
      data.hourly
    ).slice(
      0,
      6
    );

  if (
    points.length ===
    0
  ) {
    return [];
  }

  /*
   * 晴れ・くもりだけなら
   * わざわざイベントとして
   * Geminiへ渡さない。
   *
   * 雨や雷など、
   * 会話に意味がある時だけ渡す。
   */
  if (
    !hasMeaningfulWeather(
      points
    )
  ) {
    return [];
  }

  const detail =
    createForecastDetail(
      points
    );

  if (
    !detail
  ) {
    return [];
  }

  return [
    {
      type:
        "weather_forecast",

      title:
        "江東区周辺の今後6時間の天気変化",

      detail,

      source:
        "Open-Meteo",
    },
  ];
}

/*
 * ===========================
 * JR東日本
 * ===========================
 */

function getTrainSection(
  pageText: string,
  lineName: string
) {
  const start =
    pageText.indexOf(
      lineName
    );

  if (
    start < 0
  ) {
    return null;
  }

  let end =
    pageText.length;

  for (
    const otherLine
    of TOKYO_JR_LINES
  ) {
    if (
      otherLine ===
      lineName
    ) {
      continue;
    }

    const index =
      pageText.indexOf(
        otherLine,
        start +
          lineName.length
      );

    if (
      index > start &&
      index < end
    ) {
      end =
        index;
    }
  }

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

  if (
    !nearby
  ) {
    return null;
  }

  const words = [
    "運転見合わせ",
    "一部列車運休",
    "直通運転中止",
    "運転再開見込",
    "運転再開",
    "運休",
    "遅延",
  ];

  const matched =
    words.find(
      (word) =>
        nearby.includes(
          word
        )
    );

  if (
    !matched
  ) {
    return null;
  }

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
  Promise<
    TokyoLifeEvent[]
  > {
  const html =
    await fetchText(
      JR_EAST_KANTO_URL,
      180
    );

  if (
    !html
  ) {
    return [];
  }

  const pageText =
    normalizeText(
      stripTags(
        html
      )
    );

  const results:
    TokyoLifeEvent[] =
    [];

  for (
    const line
    of TOKYO_JR_LINES
  ) {
    const problem =
      findTrainProblem(
        pageText,
        line
      );

    if (
      !problem
    ) {
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
      results.length >=
      3
    ) {
      break;
    }
  }

  return results;
}

/*
 * ===========================
 * 羽田空港
 * ===========================
 */

function hasHanedaDisruption(
  html: string
) {
  const text =
    normalizeText(
      stripTags(
        html
      )
    );

  /*
   * ページ内の固定テンプレート文章ではなく、
   * 現在状態として表示される文章だけを見る。
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
  Promise<
    TokyoLifeEvent[]
  > {
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

  let detail =
    "";

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
 * ===========================
 * 全イベント取得
 * ===========================
 */

export async function getTokyoLifeEvents():
  Promise<
    TokyoLifeEvent[]
  > {
  try {
    const [
      earthquakes,
      warnings,
      weatherForecast,
      trains,
      haneda,
    ] =
      await Promise.all([
        getEarthquakeEvents(),

        getWeatherWarningEvents(),

        getKotoWeatherForecastEvents(),

        getTrainEvents(),

        getHanedaEvents(),
      ]);

    return [
      ...earthquakes,
      ...warnings,
      ...weatherForecast,
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
     * 外部情報の取得エラーで
     * 美咲とのチャットそのものを
     *止めない。
     */
    return [];
  }
}

/*
 * ===========================
 * Geminiへ渡すガイド
 * ===========================
 */

export function createTokyoLifeEventsGuide(
  events:
    TokyoLifeEvent[]
) {
  if (
    events.length ===
    0
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
        (
          event
        ) =>
          `・${event.title}：${event.detail}（情報元：${event.source}）`
      )
      .join(
        "\n"
      );

  const hasWeatherForecast =
    events.some(
      (
        event
      ) =>
        event.type ===
        "weather_forecast"
    );

  const weatherGuide =
    hasWeatherForecast
      ? `
【江東区周辺のこれからの天気】

上の
「江東区周辺の今後6時間の天気変化」
は、

美咲自身が生活している
江東区周辺の
これからの天気として扱ってください。

美咲は天気予報士ではありません。

数字をそのまま全部読み上げず、
日常会話として使ってください。

自然な例：

「このあと雨ちょっと強くなりそう」

「夕方くらい雨きそうだね☔️」

「雷くるかも。やだなー笑」

「このあと雨っぽいから気をつけてね」

「今はそんなでもないけど、
あとで降りそうだよ」

ユーザーが乗務中なら、

「このあと雨強くなるなら、
少し動き出るかもね」

くらいなら自然です。

ただし、

「絶対忙しくなる」

「確実に需要が増える」

「羽田でロングが出る」

などと断定しないでください。
`.trim()
      : "";

  return `
【東京のリアルな生活イベント】

現在確認できている
東京の生活情報です。

${eventText}

${weatherGuide}

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

「竜巻の注意情報出てるみたい」

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

天気なら、

「このあと雨強くなりそう」

「雷くるかも」

「夕方くらい降りそうだね」

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
・雷雨
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

「このあと雨強くなるなら、
少し動き出るかもね」

程度にしてください。

【絶対ルール】

・毎回ニュースの話をしない

・毎回天気予報をしない

・情報一覧を読み上げない

・ニュース記事のように説明しない

・存在しない事故や災害を作らない

・取得できていない情報を
知っているふりをしない

・古い出来事を
今起きたように話さない

・警報や注意報の数を
勝手に増やさない

・「いろいろ出てる」と
曖昧にまとめない

・ユーザーを
不必要に怖がらせない

・情報をどうやって知ったか
作らない

・タクシー需要を断定しない

・通常の交通や天気の話だけで
毎回「大丈夫？」と聞かない

・降水確率や雨量などの数字は
ユーザーから聞かれない限り
毎回読み上げない

普通の38歳の彼女として、
必要なときだけ
自然に使ってください。
`.trim();
}
