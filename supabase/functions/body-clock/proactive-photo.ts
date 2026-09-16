export type MisakiPhotoTime =
  | "morning"
  | "day"
  | "evening"
  | "night"
  | "any";

export type MisakiPhotoMood =
  | "soft"
  | "cheerful"
  | "calm"
  | "romantic"
  | "sleepy"
  | "casual";

export type MisakiPhoto = {
  id: string;
  src: string;
  times: MisakiPhotoTime[];
  moods: MisakiPhotoMood[];
  minRelationshipPoints: number;
  weight: number;
};

export type SelectMisakiPhotoInput = {
  currentTime: string;
  relationshipPoints: number;
  reply: string;
  recentPhotoIds?: string[];
};

const PHOTO_ATTACH_RATE = 0.34;

const PHOTOS: MisakiPhoto[] = [
  {
    id: "morning-01",
    src: "/misaki-morning.webp",
    times: ["morning"],
    moods: ["soft", "cheerful", "casual"],
    minRelationshipPoints: 0,
    weight: 5,
  },
  {
    id: "day-01",
    src: "/misaki-day-intro.webp",
    times: ["day"],
    moods: ["cheerful", "casual", "soft"],
    minRelationshipPoints: 0,
    weight: 5,
  },
  {
    id: "evening-01",
    src: "/misaki-evening.webp",
    times: ["evening"],
    moods: ["calm", "soft", "romantic"],
    minRelationshipPoints: 10,
    weight: 5,
  },
  {
    id: "night-01",
    src: "/misaki-night.webp",
    times: ["night"],
    moods: ["calm", "romantic", "sleepy", "soft"],
    minRelationshipPoints: 20,
    weight: 5,
  },
];

function hashText(text: string) {
  let hash = 2166136261;

  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function getHour(currentTime: string) {
  const match = currentTime.match(/(\d{1,2}):(\d{2})/);

  if (!match) {
    return 18;
  }

  const hour = Number(match[1]);

  if (!Number.isFinite(hour)) {
    return 18;
  }

  return Math.max(0, Math.min(23, hour));
}

function getTimeBucket(currentTime: string): Exclude<MisakiPhotoTime, "any"> {
  const hour = getHour(currentTime);

  if (hour >= 5 && hour < 10) {
    return "morning";
  }

  if (hour >= 10 && hour < 17) {
    return "day";
  }

  if (hour >= 17 && hour < 21) {
    return "evening";
  }

  return "night";
}

function inferMood(reply: string): MisakiPhotoMood {
  const text = reply.toLowerCase();

  if (
    /眠|ねむ|おやすみ|寝/.test(text)
  ) {
    return "sleepy";
  }

  if (
    /好き|会いた|ぎゅ|甘え|寂し|さみし/.test(text)
  ) {
    return "romantic";
  }

  if (
    /笑|ふふ|えへ|嬉|うれし|やった|元気/.test(text)
  ) {
    return "cheerful";
  }

  if (
    /落ち着|ゆっくり|のんびり|ほっと/.test(text)
  ) {
    return "calm";
  }

  if (
    /ちょっと|なんとなく|ふと|ねえ|ねぇ/.test(text)
  ) {
    return "casual";
  }

  return "soft";
}

function weightedPick(
  photos: MisakiPhoto[],
  seed: number
): MisakiPhoto | null {
  if (photos.length === 0) {
    return null;
  }

  const totalWeight = photos.reduce(
    (sum, photo) => sum + Math.max(1, photo.weight),
    0
  );

  let target = seed % totalWeight;

  for (const photo of photos) {
    const weight = Math.max(1, photo.weight);

    if (target < weight) {
      return photo;
    }

    target -= weight;
  }

  return photos[0] ?? null;
}

export function selectMisakiProactivePhoto(
  input: SelectMisakiPhotoInput
): MisakiPhoto | null {
  const {
    currentTime,
    relationshipPoints,
    reply,
    recentPhotoIds = [],
  } = input;

  if (!reply.trim()) {
    return null;
  }

  const seed = hashText(
    `${currentTime}|${relationshipPoints}|${reply}`
  );

  const attachThreshold = Math.floor(
    PHOTO_ATTACH_RATE * 10000
  );

  if (seed % 10000 >= attachThreshold) {
    return null;
  }

  const timeBucket = getTimeBucket(currentTime);
  const mood = inferMood(reply);

  let candidates = PHOTOS.filter(
    (photo) =>
      relationshipPoints >= photo.minRelationshipPoints &&
      (photo.times.includes(timeBucket) ||
        photo.times.includes("any"))
  );

  const moodMatched = candidates.filter(
    (photo) =>
      photo.moods.includes(mood) ||
      photo.moods.includes("soft")
  );

  if (moodMatched.length > 0) {
    candidates = moodMatched;
  }

  const withoutRecent = candidates.filter(
    (photo) => !recentPhotoIds.includes(photo.id)
  );

  if (withoutRecent.length > 0) {
    candidates = withoutRecent;
  }

  return weightedPick(
    candidates,
    hashText(`${seed}|${mood}|${timeBucket}`)
  );
}

export function getMisakiPhotoCatalog() {
  return PHOTOS;
}
