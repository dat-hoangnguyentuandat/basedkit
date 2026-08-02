function formatBlockedError({path,pattern,tool}){return `Blocked by scout-block: ${tool||'tool'} tried to access ignored path.\nPath: ${path}\nPattern: ${pattern}`}
module.exports={formatBlockedError};
