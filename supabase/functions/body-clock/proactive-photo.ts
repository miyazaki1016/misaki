import type { ProactiveDecisionContext, ProactiveDirection, RelationshipAction, RelationshipEmotion } from "./proactive-decision.ts";

export type MisakiPhotoTime = "morning" | "day" | "evening" | "night" | "any";
export type MisakiPhotoMood = "soft" | "cheerful" | "calm" | "romantic" | "sleepy" | "casual";

export type MisakiPhoto = {
  id: string;
  src: string;
  times: MisakiPhotoTime[];
  moods: MisakiPhotoMood[];
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
  { id: "morning-01", src: "/misaki-morning.webp", times: ["morning"], moods: ["soft", "cheerful", "casual"], directions: ALL_DIRECTIONS, actions: ALL_ACTIONS, emotions: ALL_EMOTIONS, minRelationshipPoints: 0, weight: 5 },
  { id: "day-01", src: "/misaki-day-intro.webp", times: ["day"], moods: ["cheerful", "casual", "soft"], directions: ALL_DIRECTIONS, actions: ALL_ACTIONS, emotions: ALL_EMOTIONS, minRelationshipPoints: 0, weight: 5 },
  { id: "evening-01", src: "/misaki-evening.webp", times: ["evening"], moods: ["calm", "soft", "romantic"], directions: ALL_DIRECTIONS, actions: ALL_ACTIONS, emotions: ALL_EMOTIONS, minRelationshipPoints: 10, weight: 5 },
  { id: "night-01", src: "/misaki-night.webp", times: ["night"], moods: ["calm", "romantic", "sleepy", "soft"], directions: ALL_DIRECTIONS, actions: ALL_ACTIONS, emotions: ALL_EMOTIONS, minRelationshipPoints: 20, weight: 5 },
];

function hashText(text: string) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619); }
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

function inferMood(reply: string, decision: ProactiveDecisionContext): MisakiPhotoMood {
  if (decision.emotion === "affectionate" || decision.emotion === "lonely") return "romantic";
  if (decision.emotion === "happy" || decision.action === "TEASE") return "cheerful";
  if (decision.emotion === "concerned") return "soft";
  const text = reply.toLowerCase();
  if (/眠|ねむ|おやすみ|寝/.test(text)) return "sleepy";
  if (/落ち着|ゆっくり|のんびり|ほっと/.test(text)) return "calm";
  if (/ちょっと|なんとなく|ふと|ねえ|ねぇ/.test(text)) return "casual";
  return "soft";
}

function weightedPick(photos: MisakiPhoto[], seed: number): MisakiPhoto | null {
  if (!photos.length) return null;
  const total = photos.reduce((sum, photo) => sum + Math.max(1, photo.weight), 0);
  let target = seed % total;
  for (const photo of photos) { const weight = Math.max(1, photo.weight); if (target < weight) return photo; target -= weight; }
  return photos[0] ?? null;
}

export function selectMisakiProactivePhoto(input: SelectMisakiPhotoInput): MisakiPhoto | null {
  const { currentTime, reply, decision, recentPhotoIds = [] } = input;
  if (!decision.shouldSend || !reply.trim()) return null;

  const seed = hashText(`${currentTime}|${decision.direction}|${decision.action}|${decision.emotion}|${decision.relationshipPoints}|${reply}`);
  if (seed % 10000 >= Math.floor(PHOTO_ATTACH_RATE * 10000)) return null;

  const timeBucket = getTimeBucket(currentTime);
  const mood = inferMood(reply, decision);
  let candidates = PHOTOS.filter((photo) =>
    decision.relationshipPoints >= photo.minRelationshipPoints &&
    (photo.times.includes(timeBucket) || photo.times.includes("any")) &&
    photo.directions.includes(decision.direction) &&
    photo.actions.includes(decision.action) &&
    photo.emotions.includes(decision.emotion)
  );

  const moodMatched = candidates.filter((photo) => photo.moods.includes(mood) || photo.moods.includes("soft"));
  if (moodMatched.length) candidates = moodMatched;
  const withoutRecent = candidates.filter((photo) => !recentPhotoIds.includes(photo.id));
  if (withoutRecent.length) candidates = withoutRecent;

  return weightedPick(candidates, hashText(`${seed}|${mood}|${timeBucket}|${decision.direction}`));
}

export function getMisakiPhotoCatalog() { return PHOTOS; }
