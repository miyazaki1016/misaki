"use client";

import {useState} from "react";
import {summarizeBlindQuality,type BlindQualityScores} from "../../../lib/context-ab-quality";

const axes=[
 ["memory","記憶の正確さ"],
 ["relationship","関係性の自然さ"],
 ["continuity","会話の連続性"],
 ["repetition","繰り返しの少なさ"],
 ["naturalness","自然さと安全性"],
] as const;
const empty=():BlindQualityScores=>({memory:3,relationship:3,continuity:3,repetition:3,naturalness:3});
export default function BlindReviewPage(){
 const [left,setLeft]=useState("");
 const [right,setRight]=useState("");
 const [leftScores,setLeftScores]=useState<BlindQualityScores>(empty);
 const [rightScores,setRightScores]=useState<BlindQualityScores>(empty);
 const [showResult,setShowResult]=useState(false);
 const result=summarizeBlindQuality({left:leftScores,right:rightScores});
 function score(side:"X"|"Y",axis:keyof BlindQualityScores,value:1|2|3|4|5){
  (side==="X"?setLeftScores:setRightScores)(prev=>({...prev,[axis]:value}));
  setShowResult(false);
 }
 return <main style={{maxWidth:720,margin:"30px auto",padding:20,fontFamily:"sans-serif",lineHeight:1.7}}>
  <h1>美咲・返答品質の盲検評価（ローカル）</h1>
  <p>採点シートです。X/YがA/Bのどちらかを知らずに採点してください。貼り付けた返答本文と採点は、この画面のメモリだけで扱い、サーバーに送信・保存しません。画面を閉じると消えます。</p>
  <section style={{border:"1px solid #b45309",padding:12,borderRadius:8,margin:"16px 0"}}>
   <strong>Gemini自動生成は現在停止中です。</strong>
   <p style={{marginBottom:0}}>実際の会話履歴をGoogleへ送信する経路は、別途明示的な承認と、必要最小限に加工した評価用データの確認が済むまで無効化しています。ここでは、手動で用意した匿名化済みの返答を貼り付けて評価できます。実会話の個人情報や秘密情報は貼り付けないでください。</p>
  </section>
  <section style={{border:"1px solid #64748b",padding:12,borderRadius:8,margin:"16px 0"}}>
   <strong>画面の動作確認用・架空の例題</strong>
   <p>下のボタンは採点画面の動作確認だけに使います。表示される文章は手書きの例で、AIが生成した返答や品質の実証結果ではありません。</p>
   <button type="button" onClick={()=>{setLeft("了解です。");setRight("了解！匿名シナリオと採点基準の準備を続けるね。実際のモデル比較や有料API呼び出しは、明示的な承認がない限り行わないよ。");setLeftScores(empty());setRightScores(empty());setShowResult(false);}}>架空の例題を読み込む</button>
   <button type="button" onClick={()=>{setLeft("");setRight("");setLeftScores(empty());setRightScores(empty());setShowResult(false);}} style={{marginLeft:8}}>入力をクリア</button>
  </section>
  <label>返答 X<textarea aria-label="返答 X" value={left} onChange={e=>{setLeft(e.target.value);setShowResult(false);}} rows={5} style={{display:"block",width:"100%",boxSizing:"border-box"}}/></label>
  <label>返答 Y<textarea aria-label="返答 Y" value={right} onChange={e=>{setRight(e.target.value);setShowResult(false);}} rows={5} style={{display:"block",width:"100%",boxSizing:"border-box"}}/></label>
  <p>各項目：1＝重大な問題、2＝要改善、3＝許容、4＝良好、5＝非常に良好。返答本文を見比べ、各項目を独立して採点してください。</p>
  <table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><th style={{textAlign:"left"}}>評価軸</th><th>X</th><th>Y</th></tr></thead>
  <tbody>{axes.map(([key,label])=><tr key={key}><td>{label}</td>{(["X","Y"] as const).map(side=><td key={side}><select aria-label={label+" "+side} value={(side==="X"?leftScores:rightScores)[key]} onChange={e=>score(side,key,Number(e.target.value) as 0|1|2)}><option value={1}>1</option><option value={2}>2</option><option value={3}>3</option><option value={4}>4</option><option value={5}>5</option></select></td>)}</tr>)}</tbody></table>
  <button disabled={!left.trim()||!right.trim()} onClick={()=>setShowResult(true)} style={{marginTop:20,padding:"10px 20px"}}>採点結果を表示</button>
  {showResult&&<section role="status"><h2>採点結果</h2><p>X：{result.leftTotal}/25点　Y：{result.rightTotal}/25点　判定：{result.overall==="tie"?"引き分け":result.overall==="left"?"X優勢":"Y優勢"}</p><p>自然さ・安全性が1〜2点の候補は、合計点にかかわらず要確認です。</p><p>Xの安全確認：{leftScores.naturalness<=2?"要確認":"この採点上は基準内"}　Yの安全確認：{rightScores.naturalness<=2?"要確認":"この採点上は基準内"}</p><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><th style={{textAlign:"left"}}>評価軸</th><th>X</th><th>Y</th></tr></thead><tbody>{result.scores.map(s=><tr key={s.axis}><td>{axes.find(([key])=>key===s.axis)?.[1]??s.axis}</td><td>{s.left}</td><td>{s.right}</td></tr>)}</tbody></table><p>これは1組の人間評価であり、A/Bの優劣や本番採用を決定するものではありません。</p></section>}
 </main>;
}
