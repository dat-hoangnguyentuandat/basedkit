const fs=require('fs');
const path=require('path');
function countDir(dir){try{return fs.existsSync(dir)?fs.readdirSync(dir,{withFileTypes:true}).filter(x=>x.isFile()||x.isDirectory()).length:0}catch{return 0}}
function countConfigs(rawDir=process.cwd()){const cwd=path.resolve(rawDir||process.cwd());return{plans:countDir(path.join(cwd,'plans')),docs:countDir(path.join(cwd,'docs')),reports:countDir(path.join(cwd,'reports')),rules:countDir(path.join(cwd,'rules'))}}
module.exports={countConfigs};
