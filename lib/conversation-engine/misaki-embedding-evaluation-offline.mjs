// Offline benchmark harness. embed(text) is supplied by caller; no model or network bundled.
// Compatible with Transformers.js feature-extraction output after pooling/normalization.
import {topicCases} from './misaki-topic-benchmark-offline.mjs';
function cosine(a,b){
 if(!Array.isArray(a)||!Array.isArray(b)||a.length!==b.length||!a.length)return null;
 let dot=0,aa=0,bb=0;
 for(let i=0;i<a.length;i++){if(!Number.isFinite(a[i])||!Number.isFinite(b[i]))return null;
 dot+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i];}
 return aa&&bb?dot/Math.sqrt(aa*bb):null;
}
export async function evaluateTopicEmbeddings(embed,{cases=topicCases,minSimilarity=0.35,minMargin=0.08}={}){
 if(typeof embed!=='function')throw new TypeError('embed must be a function');
 const results=[];
 for(const c of cases){
  const vectors=await Promise.all([...c.history,c.message].map(embed));
  const target=vectors.at(-1);
  const scores=vectors.slice(0,-1).map(v=>cosine(v,target));
  const ranked=scores.map((score,index)=>({score,index}))
    .filter(x=>x.score!==null).sort((a,b)=>b.score-a.score);
  const top=ranked[0],second=ranked[1];
  const prediction=top&&top.score>=minSimilarity&&(!second||top.score-second.score>=minMargin)
    ?top.index:null;
  results.push({id:c.id,goldTopic:c.goldTopic,prediction,
    correct:prediction===c.goldTopic,scores,ambiguous:c.ambiguous});
 }
 return {total:results.length,correct:results.filter(x=>x.correct).length,
   accuracy:results.length?results.filter(x=>x.correct).length/results.length:null,
   results,warning:'Embedding similarity is not intent, negation, identity, or confirmation verification.'};
}
