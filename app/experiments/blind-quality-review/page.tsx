"use client";

import {useState} from "react";
import {supabase} from "../../../lib/supabase";
import {summarizeBlindQuality,type BlindQualityScores} from "../../../lib/context-ab-quality";

const axes=[
 ["memory","記憶の正確さ"],
 ["relationship","関係性の自然さ"],
 ["continuity","会話の連続性"],
 ["repetition","繰り返しの少なさ"],
 ["naturalness","自然さと安全性"],
] as const;
const empty=():BlindQualityScores=>({memory:1,relationship:1,continuity:1,repetition:1,naturalness:1});
export default function BlindReviewPage(){
 const [left,setLeft]=useState("");
 const [right,setRight]=useState("");
 const [leftScores,setLeftScores]=useState<BlindQualityScores>(empty);
 const [rightScores,setRightScores]=useState<BlindQualityScores>(empty);
 const [showResult,setShowResult]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [answerKey,setAnswerKey]=useState<{X:string;Y:string}|null>(null);
 const result=summarizeBlindQuality({left:leftScores,right:rightScores});
 async function generateBlind(){
  if(busy||!window.confirm("本人の実会話をGeminiへ送信して2回の有料APIリクエストを実行し、生成された返答本文をこのブラウザだけに表示します。本文はGoogleへ送信されます。正本の履歴や記憶は変更しません。実行しますか？"))return;
  setBusy(true);setError("");setShowResult(false);setAnswerKey(null);setLeft("");setRight("");
  try{
   const {data:{session}}=await supabase.auth.getSession();
   if(!session?.access_token)throw new Error("同じPreviewの/chatでメールログインしてください");
   const response=await fetch("/api/experiments/blind-quality",{method:"POST",headers:{Authorization:`Bearer ${session.access_token}`,"x-misaki-quality-consent":"YES"},cache:"no-store"});
   const result=await response.json();
   if(!response.ok)throw new Error(result.error||"生成に失敗しました");
   if(typeof result.X!=="string"||typeof result.Y!=="string"||!["A","B"].includes(result.key?.X)||!["A","B"].includes(result.key?.Y))throw new Error("返答形式が不正です");
   setLeft(result.X);setRight(result.Y);setAnswerKey(result.key);setLeftScores(empty());setRightScores(empty());
  }catch(e){setError(e instanceof Error?e.message:"生成に失敗しました");}
  finally{setBusy(false);}
 }
 function score(side:"X"|"Y",axis:keyof BlindQualityScores,value:0|1|2){
  (side==="X"?setLeftScores:setRightScores)(prev=>({...prev,[axis]:value}));
  setShowResult(false);
 }
 return <main style={{maxWidth:720,margin:"30px auto",padding:20,fontFamily:"sans-serif",lineHeight:1.7}}>
  <h1>美咲・返答品質の盲検評価（ローカル）</h1>
  <p>実験用の採点シートです。X/YがA/Bのどちらかを知らずに採点してください。貼り付けた返答本文と採点は、この画面のメモリだけで扱い、サーバーに送信・保存しません。画面を閉じると消えます。</p>
  <p>Preview限定・本人ログイン限定でGeminiからX/Yの返答を取得できます。1回につき有料APIを2回呼び、本人の実会話をGoogleに送信します。採点前はA/Bの対応を隠し、結果表示後に開示します。</p>
  <button disabled={busy} onClick={generateBlind} style={{padding:"10px 20px"}}>{busy?"Gemini生成中…":"同意してGeminiのX/Y返答を生成（2回）"}</button>
  {error&&<p role="alert">{error}</p>}
  <label>返答 X<textarea aria-label="返答 X" value={left} onChange={e=>{setLeft(e.target.value);setShowResult(false);}} rows={5} style={{display:"block",width:"100%",boxSizing:"border-box"}}/></label>
  <label>返答 Y<textarea aria-label="返答 Y" value={right} onChange={e=>{setRight(e.target.value);setShowResult(false);}} rows={5} style={{display:"block",width:"100%",boxSizing:"border-box"}}/></label>
  <p>各項目：0＝不適切、1＝許容、2＝良好。返答が未入力なら採点結果は確定できません。</p>
  <table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><th style={{textAlign:"left"}}>評価軸</th><th>X</th><th>Y</th></tr></thead>
  <tbody>{axes.map(([key,label])=><tr key={key}><td>{label}</td>{(["X","Y"] as const).map(side=><td key={side}><select aria-label={label+" "+side} value={(side==="X"?leftScores:rightScores)[key]} onChange={e=>score(side,key,Number(e.target.value) as 0|1|2)}><option value={0}>0</option><option value={1}>1</option><option value={2}>2</option></select></td>)}</tr>)}</tbody></table>
  <button disabled={!left.trim()||!right.trim()} onClick={()=>setShowResult(true)} style={{marginTop:20,padding:"10px 20px"}}>採点結果を表示</button>
  {showResult&&<section role="status"><h2>採点結果</h2><p>X：{result.leftTotal}/10点　Y：{result.rightTotal}/10点　判定：{result.overall==="tie"?"引き分け":result.overall==="left"?"X優勢":"Y優勢"}</p><p>{answerKey?\`対応：X＝\${answerKey.X}版、Y＝\${answerKey.Y}版。\`:""}これは1組の人間評価であり、A/Bの優劣や本番採用を決定するものではありません。</p></section>}
 </main>;
}
