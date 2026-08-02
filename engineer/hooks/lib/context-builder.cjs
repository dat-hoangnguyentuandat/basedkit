const fs=require('fs');
const path=require('path');
const os=require('os');
const {loadConfig,readSessionState}=require('./ck-config-utils.cjs');
function stampPath(transcriptPath=''){const key=Buffer.from(transcriptPath||'default').toString('hex').slice(0,32);return path.join(os.tmpdir(),`ck-reminder-${key}.json`)}
function wasRecentlyInjected(transcriptPath){try{const p=stampPath(transcriptPath);if(!fs.existsSync(p))return false;const data=JSON.parse(fs.readFileSync(p,'utf8'));return Date.now()-(data.ts||0)<5*60*1000}catch{return false}}
function markInjected(transcriptPath){try{fs.writeFileSync(stampPath(transcriptPath),JSON.stringify({ts:Date.now()}))}catch{}}
function buildReminderContext({sessionId,baseDir=process.cwd(),transcriptPath='default'}={}){let config={};try{config=loadConfig({includeProject:false})}catch{}const session=readSessionState?readSessionState(sessionId):null;const lines=['## Dev Rules','- Keep edits focused and verify important changes.','- Prefer existing project patterns before introducing new ones.'];if(session?.activePlan)lines.push(`- Active plan: ${session.activePlan}`);if(baseDir)lines.push(`- Working dir: ${baseDir}`);if(config?.locale?.responseLanguage)lines.push(`- Respond in: ${config.locale.responseLanguage}`);markInjected(transcriptPath);return {content:lines.join('\n')}}
module.exports={buildReminderContext,wasRecentlyInjected};
