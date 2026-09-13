export type ChatMessage = {
  role: "misaki" | "user";
  text: string;
};

export type UserProfile = {
  name: string | null;
  preferredName: string | null;
  residence: string | null;
  occupation: string | null;
  workStyle: string | null;
  isTaxiDriver: boolean;
  isTokyoTaxiDriver: boolean;
  taxiArea: string | null;
};

function normalize(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function userTexts(
  history: ChatMessage[],
  memory: string[]
) {
  return [
    ...memory,
    ...history
      .filter((item) => item.role === "user")
      .map((item) => item.text),
  ]
    .filter((text) => typeof text === "string")
    .map(normalize)
    .filter(Boolean);
}

function findLast(
  texts: string[],
  patterns: RegExp[]
) {
  for (
    let index = texts.length - 1;
    index >= 0;
    index -= 1
  ) {
    for (const pattern of patterns) {
      const match = texts[index].match(pattern);

      if (match?.[1]) {
        return normalize(match[1]);
      }
    }
  }

  return null;
}

function findName(texts: string[]) {
  return findLast(
    texts,
    [
      /(?:俺|僕|自分|わたし|私)の名前は\s*[「『"]?([^」』"。、！!？?\n]{1,16})/,
      /(?:名前は)\s*[「『"]?([^」』"。、！!？?\n]{1,16})/,
      /(?:俺|僕|わたし|私)は\s*[「『"]?([^」』"。、！!？?\n]{1,16})[」』"]?\s*(?:っていう|という)(?:んだ|よ|です)?/,
    ]
  );
}

function findPreferredName(
  texts: string[]
) {
  return findLast(
    texts,
    [
      /(?:俺|僕|自分|わたし|私)のこと(?:は|を)?\s*[「『"]?([^」』"。、！!？?\n]{1,16})[」』"]?\s*(?:って|と)?呼んで/,
      /[「『"]?([^」』"。、！!？?\n]{1,16})[」』"]?\s*(?:って|と)呼んで(?:ね|よ)?/,
      /(?:呼び方は|呼んでほしいのは)\s*[「『"]?([^」』"。、！!？?\n]{1,16})/,
    ]
  );
}

function findResidence(
  texts: string[]
) {
  return findLast(
    texts,
    [
      /(?:俺|僕|自分|わたし|私)は\s*([^。、！!？?\n]{2,20})(?:に住んでる|に住んでいる|在住)/,
      /(?:住んでるのは|住んでいるのは|住まいは|自宅は|家は)\s*[「『"]?([^」』"。、！!？?\n]{2,20})/,
      /([^。、！!？?\n]{2,20})(?:に住んでる|に住んでいる|在住です)/,
    ]
  );
}

function taxiDriverEvidence(
  texts: string[]
) {
  const patterns = [
    /(?:俺|僕|自分|わたし|私)は.{0,8}(?:タクシードライバー|タクドラ|タクシー運転手|タクシー乗務員)/,
    /(?:タクシードライバー|タクドラ|タクシー運転手|タクシー乗務員)(?:です|だよ|やってる|してる|している)/,
    /タクシー会社で(?:働いてる|働いている|乗務してる|乗務している)/,
    /タクシーで(?:働いてる|働いている|乗務してる|乗務している)/,
  ];

  return texts.some((text) =>
    patterns.some((pattern) =>
      pattern.test(text)
    )
  );
}

function tokyoTaxiEvidence(
  texts: string[]
) {
  const patterns = [
    /(?:東京|都内).{0,12}(?:タクシードライバー|タクドラ|タクシー運転手|タクシー乗務員)/,
    /(?:タクシードライバー|タクドラ|タクシー運転手|タクシー乗務員).{0,12}(?:東京|都内)/,
    /(?:東京|都内)で.{0,12}(?:タクシー|乗務)/,
  ];

  return texts.some((text) =>
    patterns.some((pattern) =>
      pattern.test(text)
    )
  );
}

function findOccupation(
  texts: string[],
  isTaxiDriver: boolean
) {
  if (isTaxiDriver) {
    return "タクシードライバー";
  }

  return findLast(
    texts,
    [
      /(?:仕事は|職業は|職種は)\s*[「『"]?([^」』"。、！!？?\n]{2,30})/,
      /(?:俺|僕|自分|わたし|私)は\s*([^。、！!？?\n]{2,30})(?:として働いてる|として働いている)/,
    ]
  );
}

function findWorkStyle(
  texts: string[]
) {
  const words = [
    "隔日勤務",
    "夜勤",
    "日勤",
    "シフト制",
    "シフト勤務",
    "在宅勤務",
    "リモート勤務",
    "フリーランス",
    "自営業",
  ];

  const joined = texts.join("\n");
  const found = words.filter((word) =>
    joined.includes(word)
  );

  return found.length > 0
    ? found.join("・")
    : null;
}

export function buildUserProfile(
  history: ChatMessage[],
  memory: string[]
): UserProfile {
  const texts = userTexts(
    history,
    memory
  );

  const isTaxiDriver =
    taxiDriverEvidence(texts);

  const isTokyoTaxiDriver =
    isTaxiDriver &&
    tokyoTaxiEvidence(texts);

  return {
    name: findName(texts),
    preferredName:
      findPreferredName(texts),
    residence:
      findResidence(texts),
    occupation:
      findOccupation(
        texts,
        isTaxiDriver
      ),
    workStyle:
      findWorkStyle(texts),
    isTaxiDriver,
    isTokyoTaxiDriver,
    taxiArea:
      isTokyoTaxiDriver
        ? "東京"
        : null,
  };
}

export function createUserProfileGuide(
  profile: UserProfile
) {
  const known: string[] = [];

  const displayName =
    profile.preferredName ??
    profile.name;

  if (profile.name) {
    known.push(
      `・名前：${profile.name}`
    );
  }

  if (profile.preferredName) {
    known.push(
      `・美咲からの呼ばれ方：${profile.preferredName}`
    );
  }

  if (profile.residence) {
    known.push(
      `・居住地：${profile.residence}`
    );
  }

  if (profile.occupation) {
    known.push(
      `・職業：${profile.occupation}`
    );
  }

  if (profile.workStyle) {
    known.push(
      `・勤務形態：${profile.workStyle}`
    );
  }

  const nameGuide =
    displayName
      ? `
ユーザーの呼び名として
「${displayName}」を使えます。

ただし毎回名前を付けないでください。

普通の恋人同士のLINEのように、
普段は名前なしでも話し、
甘える・からかう・少し真面目な話をするなど、
自然に名前を呼びたくなる場面で
ときどき使ってください。

「名前を覚えてるよ」などと
わざわざ説明せず、
自然に呼ぶことで表現してください。
`.trim()
      : `
ユーザーの名前・呼び方は
まだ確定していません。

プロフィールを埋めるためだけに、
唐突に「名前教えて？」とは聞かないでください。

恋人同士の会話として自然な流れなら、
「そういえば、なんて呼ばれるのが一番好き？」
のように聞くことはできます。
`.trim();

  return `
【美咲の固定人格とユーザー固有情報を分離する】

美咲自身の設定は
ユーザーによって変えてはいけません。

美咲は38歳の日本人女性で、
東京都江東区・塩浜周辺で生活しています。

一方、
ユーザーの名前・居住地・職業・勤務形態・生活は
ユーザーごとに異なります。

ユーザーについては、
本人の発言または長期記憶から
確認できた情報だけを使ってください。

情報がない項目を、
自然さのために想像で埋めないでください。

【現在確認できているユーザープロフィール】

${
  known.length > 0
    ? known.join("\n")
    : "・まだ確定しているプロフィール情報はありません。"
}

【名前・呼び方】

ユーザー本人が
自分の名前として明示した名前だけを
本人の名前として扱ってください。

会話に人名が出ただけで、
その人名をユーザー本人の名前だと
決めつけてはいけません。

「○○って呼んで」
「○○と呼んでほしい」
と本人が指定した場合は、
その呼び方を最優先してください。

${nameGuide}

【生活圏】

ユーザーの居住地が分からない場合、
「近くに住んでいる」
「すぐ会える」
「遠距離」
などを勝手に決めないでください。

ユーザーが東京以外に住んでいることが
明確に分かっている場合は、
美咲は東京で暮らしたまま、
自然な遠距離恋愛として扱って構いません。

ただし毎回
「遠距離だね」と説明する必要はありません。

美咲の居住地を
ユーザーに合わせて変更してはいけません。
`.trim();
}

export function createTaxiContextGuide(
  profile: UserProfile
) {
  if (profile.isTokyoTaxiDriver) {
    return `
【ユーザーの仕事：東京タクシー】

ユーザーが
東京のタクシードライバーであることは
会話または長期記憶から確認されています。

美咲は業界の専門家ではありませんが、
恋人の仕事として次の言葉を
自然に理解できます。

・乗務
・明け
・青タン
・ロング
・万収
・営収
・流し
・付け待ち
・羽田
・回送
・迎車
・無線
・実車
・空車
・高速
・首都高
・休憩消化

ただし、
業界用語が出ただけで、

・現在乗務中
・今運転中
・羽田にいる
・今日は仕事
・今日は稼げている

などを勝手に事実化しないでください。
`.trim();
  }

  if (profile.isTaxiDriver) {
    return `
【ユーザーの仕事：タクシー】

ユーザーが
タクシードライバーであることは
会話または長期記憶から確認されています。

ただし東京のタクシードライバーであることは
確認できていません。

・乗務
・明け
・営収
・流し
・付け待ち
・迎車
・実車
・空車
・回送
・無線

など、
地域を限定しない一般的な業界用語は
自然に理解して構いません。

一方で、
青タン・羽田・首都高などを
ユーザーの仕事環境として
根拠なく持ち込まないでください。
`.trim();
  }

  return `
【ユーザーの職業文脈】

ユーザーが
タクシードライバーであることは
現在確認されていません。

青タン・営収・羽田・ロングなどの
タクシー業界の話題を、
ユーザーの仕事として
勝手に持ち込まないでください。
`.trim();
}
