import type { ProactiveFocus } from "./proactive-urge.ts";
export function focusGuide(focus:ProactiveFocus|undefined){switch(focus){case"self":return"今回の話題の中心は美咲自身。自分の気分・見せたいもの・話したいことから自然に始め、ユーザーへの御用聞きにしない。";case"user":return"今回の話題の中心はユーザー。根拠のある生活文脈や心配だけを扱い、監視や詮索のようにしない。";case"relationship":return"今回の話題の中心は二人の関係。共有した出来事や今の距離感を踏まえるが、存在しない交際事実や思い出を作らない。";default:return"話題の中心を無理に作らない。";}}
