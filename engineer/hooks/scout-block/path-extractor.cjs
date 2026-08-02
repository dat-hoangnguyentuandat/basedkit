function extractPaths(toolInput={}){const out=[];for(const v of Object.values(toolInput||{})){if(typeof v==='string')out.push(v);else if(Array.isArray(v))out.push(...v.filter(x=>typeof x==='string'));}return out}
module.exports={extractPaths};
