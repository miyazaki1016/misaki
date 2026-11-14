import {writeFileSync,mkdirSync} from 'node:fs';
import {runEvaluation} from './helpers/forget-batch-runner.ts';
const live=process.argv.includes('--live');
if(live&&!process.env.GEMINI_API_KEY)throw Error('Live measurement unavailable: GEMINI_API_KEY is not configured');
const report=await runEvaluation(live?process.env.GEMINI_API_KEY:undefined);
mkdirSync(new URL('./reports/',import.meta.url),{recursive:true});
writeFileSync(new URL(`./reports/forget-batch-${live?'live':'scripted'}.json`,import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({mode:report.mode,scenarios:report.rows.length,disagreements:report.rows.filter(r=>!r.agreement).map(r=>({id:r.id,classification:r.classification})),oracleMismatches:report.rows.filter(r=>r.classification!=='both_match_oracle').map(r=>({id:r.id,classification:r.classification})),semanticEquivalenceProven:false},null,2));
