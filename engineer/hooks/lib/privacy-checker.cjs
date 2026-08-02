const path=require('path');
const SENSITIVE_PATHS=['.env','.pem','.p12','.key','.kdbx','id_rsa','id_ed25519','.npmrc','.pypirc','.aws/credentials','.ssh/'];
const SECRET_RE=/(api[_-]?key|secret|token|password|private[_-]?key)/i;
function normalize(value=''){return String(value).replace(/\\/g,'/').toLowerCase()}
function isSensitivePath(value=''){const v=normalize(value);return SENSITIVE_PATHS.some(x=>v.includes(x.toLowerCase()))}
function extractCandidateStrings(toolInput={}){const out=[];for(const [k,v] of Object.entries(toolInput||{})){if(typeof v==='string')out.push(v);else if(Array.isArray(v))out.push(...v.filter(x=>typeof x==='string'));}return out}
function checkPrivacy(toolName,toolInput={}){const values=extractCandidateStrings(toolInput);for(const v of values){if(isSensitivePath(v))return{blocked:true,reason:`Sensitive path detected: ${v}`}; if(toolName==='Bash'&&SECRET_RE.test(v)&&/(cat|type|Get-Content|copy|scp|curl)/i.test(v))return{blocked:true,reason:'Command appears to access secret material'};}return{blocked:false}}
module.exports={checkPrivacy,isSensitivePath};
