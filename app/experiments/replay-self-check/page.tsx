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
 async function check(){
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
   setStatus({kind:"ok",message:"本人の履歴を読み取り専用で確認しました。Geminiには送っていません。",total:turns.length,
    users:turns.filter(t=>t.role==="user").length,misaki:turns.filter(t=>t.role==="misaki"||t.role==="model").length});
  }catch(error){
   setStatus({kind:"error",message:error instanceof Error?error.message:"確認できませんでした"});
  }
 }
 return <main style={{maxWidth:620,margin:"40px auto",padding:24,fontFamily:"sans-serif",lineHeight:1.7}}>
  <h1>美咲・実会話A/B事前確認</h1>
  <p>この画面は実験用です。既存の読み取り専用APIを使い、本人の会話件数だけ表示します。会話本文・認証トークンは画面に表示せず、Geminiにも送信しません。</p>
  <label htmlFor="email">ログインしているメールアドレス</label>
  <input id="email" type="email" value={expectedEmail} onChange={e=>setExpectedEmail(e.target.value)}
   autoComplete="email" style={{display:"block",width:"100%",padding:12,margin:"8px 0 16px"}}/>
  <button onClick={check} disabled={status.kind==="loading"} style={{padding:"10px 20px"}}>本人の履歴件数を確認</button>
  <p role="status">{status.message}</p>
  {status.kind==="ok"&&<p>合計: {status.total}件／ユーザー: {status.users}件／美咲: {status.misaki}件</p>}
 </main>;
}
