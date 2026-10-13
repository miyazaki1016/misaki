/** Deterministic synthetic long-context fixture. No personal data or network. */
export function makeSyntheticLongContext() {
  const recentReplies = Array.from({length:8},(_,i)=>"今日は話題"+(i+1)+"について話してくれてありがとう。続きを聞かせてね。");
  const rule="確認できた事実を優先し、推測で過去の出来事を作らない。\n";
  const systemPromptTemplate="あなたは会話AI美咲です。\n"+rule.repeat(230)+"\n{{RECENT_REPLY_SECTION}}\nJSON形式で答えてください。";
  const history=Array.from({length:60},(_,i)=>({
    role: i%2===0 ? "user" as const : "model" as const,
    text: i%2===0 ? "今日の話題"+i+"について話そう。" : (i>=45 ? recentReplies[(i-45)/2] : "そうなんだね。話してくれてありがとう。")
  }));
  return {systemPromptTemplate,recentReplies,history,userText:"さっきの話の続きを聞かせて"};
}
