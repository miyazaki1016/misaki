import { POST as baseChatPost } from "../chat/route";

// The base route authenticates, loads canonical context, consumes/refunds usage,
// and commits a successful turn atomically. Never retry it in the wrapper.
export async function POST(request: Request) {
  return baseChatPost(request);
}
