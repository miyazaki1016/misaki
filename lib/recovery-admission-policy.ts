// Server-read release switch. OFF refuses only new independent recovery starts.
// Never use this value to gate auth hydration, history, generation or persistence.
export const ACCEPT_NEW_ANONYMOUS_RECOVERY = true;
