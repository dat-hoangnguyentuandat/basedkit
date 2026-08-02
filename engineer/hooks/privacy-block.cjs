#!/usr/bin/env node
const fs=require('fs');
const {checkPrivacy}=require('./lib/privacy-checker.cjs');
const {isHookEnabled}=require('./lib/ck-config-utils.cjs');
if(!isHookEnabled('privacy-block'))process.exit(0);
try{const input=fs.readFileSync(0,'utf8').trim();if(!input)process.exit(0);const data=JSON.parse(input);const result=checkPrivacy(data.tool_name,data.tool_input||{});if(result.blocked){console.error(`Privacy block: ${result.reason}`);process.exit(2)}process.exit(0)}catch(err){console.error(`Privacy block error: ${err.message}`);process.exit(0)}
