type ContactMessage={sentAt?:string};
export function hoursSinceLastContact(history:ContactMessage[],nowMs=Date.now()){
 const times=history.map(x=>typeof x.sentAt==="string"?new Date(x.sentAt).getTime():NaN).filter(Number.isFinite);
 if(!times.length)return undefined;
 const latest=Math.max(...times),hours=(nowMs-latest)/3600000;
 return Number.isFinite(hours)?Math.max(0,hours):undefined;
}
