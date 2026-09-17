export type MisakiPhotoTime =
  | "morning"
  | "day"
  | "evening"
  | "night"
  | "any";

// Legacy /api/proactive compatibility shape.
// Semantic expression tags are now derived only by the Body Clock decision engine.
export type MisakiProactiveContext = {
  tags?: string[];
};

export type MisakiPhoto = {
  id: string;
  src: string;
  times: MisakiPhotoTime[];
  minRelationshipPoints: number;
  weight: number;
};

export type SelectMisakiPhotoInput = {
  currentTime: string;
  relationshipPoints: number;
  reply: string;
  context?: MisakiProactiveContext;
  recentPhotoIds?: string[];
};

const PHOTO_ATTACH_RATE = 0.34;

const PHOTOS: MisakiPhoto[] = [
  {
    id: "morning-01",
    src: "/misaki-morning.webp",
    times: ["morning"],
    minRelationshipPoints: 0,
    weight: 5,
  },
  {
    id: "day-01",
    src: "/misaki-day-intro.webp",
    times: ["day"],
    minRelationshipPoints: 0,
    weight: 5,
  },
  {
    id: "evening-01",
    src: "/misaki-evening.webp",
    times: ["evening"],
    minRelationshipPoints: 10,
    weight: 5,
  },
  {
    id: "night-01",
    src: "/misaki-night.webp",
    times: ["night"],
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

  // This selector is kept only for the legacy /api/proactive route.
  // It deliberately does not infer semantic tags from generated text.
  // The active Body Clock flow owns semantic decisions via ProactiveDecisionContext.
  const seed = hashText(
    `${currentTime}|${relationshipPoints}|${reply}`
  );

  const attachThreshold = Math.floor(PHOTO_ATTACH_RATE * 10000);

  if (seed % 10000 >= attachThreshold) {
    return null;
  }

  const timeBucket = getTimeBucket(currentTime);

  let candidates = PHOTOS.filter(
    (photo) =>
      relationshipPoints >= photo.minRelationshipPoints &&
      (photo.times.includes(timeBucket) || photo.times.includes("any"))
  );

  if (candidates.length === 0) {
    return null;
  }

  const withoutRecent = candidates.filter(
    (photo) => !recentPhotoIds.includes(photo.id)
  );

  if (withoutRecent.length > 0) {
    candidates = withoutRecent;
  }

  return weightedPick(
    candidates,
    hashText(`${seed}|${timeBucket}`)
  );
}

export function getMisakiPhotoCatalog() {
  return PHOTOS;
}
