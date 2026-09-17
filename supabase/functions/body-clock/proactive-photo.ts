import type {
  ProactiveDecisionContext,
  ProactiveDirection,
  ProactiveExpressionTag,
  RelationshipAction,
  RelationshipEmotion,
} from "./proactive-decision.ts";

export type MisakiPhotoTime = "morning" | "day" | "evening" | "night" | "any";

export type MisakiPhoto = {
  id: string;
  src: string;
  times: MisakiPhotoTime[];
  tags: ProactiveExpressionTag[];
  directions: ProactiveDirection[];
  actions: RelationshipAction[];
  emotions: RelationshipEmotion[];
  minRelationshipPoints: number;
  weight: number;
};

export type SelectMisakiPhotoInput = {
  currentTime: string;
  reply: string;
  decision: ProactiveDecisionContext;
  recentPhotoIds?: string[];
};

const PHOTO_ATTACH_RATE = 0.34;
const ALL_DIRECTIONS: ProactiveDirection[] = ["MISAKI", "USER", "US", "MISAKI_TO_USER", "MISAKI_TO_US"];
const ALL_ACTIONS: RelationshipAction[] = ["NORMAL", "WAIT", "TEASE", "SULK", "CHASE", "PULL", "RECONNECT"];
const ALL_EMOTIONS: RelationshipEmotion[] = ["neutral", "happy", "lonely", "sulky", "concerned", "affectionate"];

const PHOTOS: MisakiPhoto[] = [
  {
    id: "morning-01",
    src: "/misaki-morning.webp",
    times: ["morning"],
    tags: ["soft", "cheerful", "casual", "check_in"],
    directions: ALL_DIRECTIONS,
    actions: ALL_ACTIONS,
    emotions: ALL_EMOTIONS,
    minRelationshipPoints: 0,
    weight: 5,
  },
  {
    id: "day-01",
    src: "/misaki-day-intro.webp",
    times: ["day"],
    tags: ["cheerful", "casual", "soft", "playful", "encouraging", "check_in"],
    directions: ALL_DIRECTIONS,
    actions: ALL_ACTIONS,
    emotions: ALL_EMOTIONS,
    minRelationshipPoints: 0,
    weight: 5,
  },
  {
    id: "evening-01",
    src: "/misaki-evening.webp",
    times: ["evening"],
    tags: ["calm", "soft", "romantic", "affectionate", "relax", "miss_you"],
    directions: ALL_DIRECTIONS,
    actions: ALL_ACTIONS,
    emotions: ALL_EMOTIONS,
    minRelationshipPoints: 10,
    weight: 5,
  },
  {
    id: "night-01",
    src: "/misaki-night.webp",
    times: ["night"],
    tags: ["calm", "romantic", "sleepy", "soft", "affectionate", "miss_you", "relax"],
    directions: ALL_DIRECTIONS,
    actions: ALL_ACTIONS,
    emotions: ALL_EMOTIONS,
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

function getTimeBucket(currentTime: string): Exclude<MisakiPhotoTime, "any"> {
  const match = currentTime.match(/(\d{1,2}):(\d{2})/);
  const hour = Math.max(0, Math.min(23, Number(match?.[1] ?? 18)));
  if (hour >= 5 && hour < 10) return "morning";
  if (hour >= 10 && hour < 17) return "day";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function scorePhoto(photo: MisakiPhoto, tags: ProactiveExpressionTag[]) {
  return tags.reduce(
    (score, tag) => score + (photo.tags.includes(tag) ? 3 : 0),
    0
  );
}

function weightedPick(photos: MisakiPhoto[], seed: number): MisakiPhoto | null {
  if (!photos.length) return null;
  const total = photos.reduce((sum, photo) => sum + Math.max(1, photo.weight), 0);
  let target = seed % total;
  for (const photo of photos) {
    const weight = Math.max(1, photo.weight);
    if (target < weight) return photo;
    target -= weight;
  }
  return photos[0] ?? null;
}

export function selectMisakiProactivePhoto(input: SelectMisakiPhotoInput): MisakiPhoto | null {
  const { currentTime, reply, decision, recentPhotoIds = [] } = input;
  if (!decision.shouldSend || !reply.trim()) return null;

  const seed = hashText(
    `${currentTime}|${decision.direction}|${decision.action}|${decision.emotion}|${decision.relationshipPoints}|${decision.tags.join(",")}|${reply}`
  );

  if (seed % 10000 >= Math.floor(PHOTO_ATTACH_RATE * 10000)) return null;

  const timeBucket = getTimeBucket(currentTime);
  let candidates = PHOTOS.filter((photo) =>
    decision.relationshipPoints >= photo.minRelationshipPoints &&
    (photo.times.includes(timeBucket) || photo.times.includes("any")) &&
    photo.directions.includes(decision.direction) &&
    photo.actions.includes(decision.action) &&
    photo.emotions.includes(decision.emotion)
  );

  if (!candidates.length) return null;

  const scored = candidates.map((photo) => ({
    photo,
    score: scorePhoto(photo, decision.tags),
  }));
  const bestScore = Math.max(...scored.map((item) => item.score));

  if (bestScore > 0) {
    candidates = scored
      .filter((item) => item.score === bestScore)
      .map((item) => item.photo);
  }

  const withoutRecent = candidates.filter((photo) => !recentPhotoIds.includes(photo.id));
  if (withoutRecent.length) candidates = withoutRecent;

  return weightedPick(
    candidates,
    hashText(`${seed}|${decision.tags.join("|")}|${timeBucket}|${decision.direction}`)
  );
}

export function getMisakiPhotoCatalog() {
  return PHOTOS;
}
