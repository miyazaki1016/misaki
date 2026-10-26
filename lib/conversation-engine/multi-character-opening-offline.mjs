// Offline-only opening state machine. No downloads, browser storage, or chat navigation.
// A shared model may be reused by multiple characters; relationship data never enters this module.
export function createOpeningState({characterId,modelKey,modelReady=false}={}){
 if(typeof characterId!=='string'||!characterId.trim())throw new Error('characterId required');
 if(typeof modelKey!=='string'||!modelKey.trim())throw new Error('modelKey required');
 return {characterId,modelKey,phase:modelReady?'ready':'loading',progress:null,
   scene:0,skipped:false,ready:Boolean(modelReady),error:null};
}
export function advanceOpening(state,event){
 if(!state||!event)return state;
 switch(event.type){
  case 'progress':{
   if(state.ready||state.error)return state;
   const value=Number(event.value);
   if(!Number.isFinite(value))return state;
   return {...state,progress:Math.max(state.progress??0,Math.min(100,Math.max(0,value)))};
  }
  case 'next-scene':return {...state,scene:Math.min(3,state.scene+1)};
  case 'skip':return {...state,skipped:true,phase:state.ready?'ready':'loading'};
  case 'model-ready':return {...state,ready:true,progress:100,phase:'ready',error:null};
  case 'model-error':return {...state,phase:'error',error:String(event.message??'model unavailable')};
  case 'retry':return {...state,phase:state.ready?'ready':'loading',error:null};
  default:return state;
 }
}
export function mayEnterChat(state){return Boolean(state?.ready);}
export function openingCopy(state,characterName){
 const name=String(characterName||'キャラクター');
 const lines=['物語の扉が、いま開く。','言葉のかけらが、光になって集まる。',name+'との出会いが近づいている。','準備が整ったら、物語を始めよう。'];
 return {title:lines[state.scene]??lines[0],status:state.error?'準備に失敗しました。再試行できます。':state.ready?'準備完了！':'AIの準備中…',
   progress:state.progress,canSkip:true,canChat:mayEnterChat(state)};
}
