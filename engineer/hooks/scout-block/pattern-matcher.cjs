function matchPath(value,patterns=[]){const norm=String(value).replace(/\\/g,'/').toLowerCase();for(const p of patterns){const plain=String(p).replace(/^!/,'').replace(/\*\*/g,'').replace(/\*/g,'').replace(/\\/g,'/').toLowerCase();if(plain&&norm.includes(plain))return p}return null}
module.exports={matchPath};
