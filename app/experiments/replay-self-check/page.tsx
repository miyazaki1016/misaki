"use client";

import {useState} from "react";
import {supabase} from "../../../lib/supabase";

type HistoryTurn={role?:unknown;text?:unknown};
type Status={kind:"idle"|"loading"|"ok"|"error";message:string;total?:number;users?:number;misaki?:number};

/**
 * Experimental, read-only self-check. Runs entirely in the signed-in browser.
 * Does not transmit conversation text to another service or save it anywhere.
 */
export default function ReplaySelfCheckPage(){
 const [status,setStatus]=useState<Status>({kind:"idle",message:"未確認"});
 const [expectedEmail,setExpectedEmail]=useState("");
 const [abStatus,setAbStatus]=useState("未実行");
 const [abResult,setAbResult]=useState<unknown>(null);
 const [numericHistory,setNumericHistory]=useState<{aMs:number;bMs:number;aTokens:number;bTokens:number}[]>([]);
 const [approvedTurns,setApprovedTurns]=useState<{role:string;text:string}[]|null>(null);
 async function check(){
  setApprovedTurns(null);
  setStatus({kind:"loading",message:"本人確認と履歴件数を確認中…"});
  try{
   const {data:{session},error:sessionError}=await supabase.auth.getSession();
   if(sessionError||!session?.access_token) throw new Error("美咲にログインしてください");
   const {data:{user},error:userError}=await supabase.auth.getUser();
   if(userError||!user||user.is_anonymous) throw new Error("メールアカウントでログインしてください");
   if(!expectedEmail.trim()||user.email?.toLowerCase()!==expectedEmail.trim().toLowerCase()){
    throw new Error("入力したメールとログイン中のアカウントが一致しません");
   }
   const response=await fetch("/api/persona/history",{
    method:"GET",headers:{Authorization:`Bearer ${session.access_token}`},cache:"no-store",
   });
   if(!response.ok) throw new Error("履歴の読み込みに失敗しました");
   const state=await response.json();
   if(!Array.isArray(state.history)) throw new Error("履歴形式が想定と異なります");
   const turns=state.history as HistoryTurn[];
   if(turns.some(turn=>!turn||typeof turn.text!=="string"||!["user","misaki","model"].includes(String(turn.role)))){
    throw new Error("一部の履歴形式が想定と異なります");
   }
   setApprovedTurns(turns.map(t=>({role:String(t.role),text:String(t.text)})));
   setStatus({kind:"ok",message:"本人の履歴を読み取り専用で確認しました。Geminiには送っていません。",total:turns.length,
    users:turns.filter(t=>t.role==="user").length,misaki:turns.filter(t=>t.role==="misaki"||t.role==="model").length});
  }catch(error){
   setStatus({kind:"error",message:error instanceof Error?error.message:"確認できませんでした"});
  }
 }
 async function runAB(){
  if(!approvedTurns||!window.confirm("実際の会話本文をGeminiへ送信し、A/B各1回（計2回）の有料API比較を実行します。会話本文は外部モデルに送信されます。本番の履歴・記憶は変更しません。実行しますか？"))return;
  setAbStatus("GeminiでA/B比較中…");setAbResult(null);
  try{
   const {data:{session}}=await supabase.auth.getSession();
   if(!session?.access_token)throw new Error("再ログインしてください");
   const response=await fetch("/api/experiments/replay-ab",{method:"POST",headers:{Authorization:`Bearer ${session.access_token}`},cache:"no-store"});
   const result=await response.json();
   if(!response.ok)throw new Error(result.error||"比較失敗");
   setAbResult(result);setAbStatus("A/B比較完了（本文は表示しません）");
   if(result?.A?.success===true&&result?.B?.success===true&&
    [result.A.latencyMs,result.B.latencyMs,result.A.promptTokens,result.B.promptTokens].every((n:unknown)=>typeof n==="number"&&Number.isFinite(n))){
    setNumericHistory(prev=>[...prev,{aMs:result.A.latencyMs,bMs:result.B.latencyMs,aTokens:result.A.promptTokens,bTokens:result.B.promptTokens}]);
   }
  }catch(error){setAbStatus(error instanceof Error?error.message:"比較失敗");}
 }
 function saveLocalCopy(){
  if(!approvedTurns) return;
  const payload={format:"misaki-approved-replay-v1",exportedAt:new Date().toISOString(),history:approvedTurns};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const anchor=document.createElement("a");
  anchor.href=url;anchor.download="misaki-approved-replay.json";anchor.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 return <main style={{maxWidth:620,margin:"40px auto",padding:24,fontFamily:"sans-serif",lineHeight:1.7}}>
  <h1>美咲・実会話A/B事前確認</h1>
  <p>この画面は実験用です。履歴確認だけではGeminiに送信しません。下のA/B実行ボタンに同意した場合のみ、会話本文をGeminiへ送信します。会話本文・認証トークンは画面に表示しません。</p>
  <label htmlFor="email">ログインしているメールアドレス</label>
  <input id="email" type="email" value={expectedEmail} onChange={e=>setExpectedEmail(e.target.value)}
   autoComplete="email" style={{display:"block",width:"100%",padding:12,margin:"8px 0 16px"}}/>
  <button onClick={check} disabled={status.kind==="loading"} style={{padding:"10px 20px"}}>本人の履歴件数を確認</button>
  <p role="status">{status.message}</p>
  {status.kind==="ok"&&<><p>合計: {status.total}件／ユーザー: {status.users}件／美咲: {status.misaki}件</p>
  <p><strong>次のステップ（任意）</strong>：会話本文を含むJSONファイルを、この端末に保存できます。個人的な発言も含まれます。保存したファイルは自動送信されません。内容を確認し、共有してよい場合だけアップロードしてください。</p>
  <button onClick={saveLocalCopy} style={{padding:"10px 20px"}}>会話履歴をこの端末に保存（JSON）</button>
  <hr/><p><strong>Gemini実会話A/B実測（各1回・実験）</strong>：同じ実会話履歴をA/Bにそれぞれ1回送信します。4回測定版はまだ未接続です。API費用が発生し、会話本文はGoogle Geminiに送信されます。実験用の簡略プロンプトであり、本番プロンプトそのものではありません。</p>
  <button onClick={runAB} style={{padding:"10px 20px"}}>同意してGemini A/Bを2回実行</button><p role="status">{abStatus}</p>
  {numericHistory.length>0&&<p>この画面を開いてからの成功測定：{numericHistory.length}組／平均応答時間 A {Math.round(numericHistory.reduce((s,x)=>s+x.aMs,0)/numericHistory.length)}ms・B {Math.round(numericHistory.reduce((s,x)=>s+x.bMs,0)/numericHistory.length)}ms／平均入力トークン A {Math.round(numericHistory.reduce((s,x)=>s+x.aTokens,0)/numericHistory.length)}・B {Math.round(numericHistory.reduce((s,x)=>s+x.bTokens,0)/numericHistory.length)}。この集計は画面を閉じると消え、サーバーには保存されません。</p>}
  {abResult!==null&&<pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{JSON.stringify(abResult,null,2)}</pre>}</>}
 </main>;
}
