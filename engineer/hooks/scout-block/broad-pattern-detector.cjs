function formatBroadPatternError({reason,suggestions=[]}){return ['Blocked by scout-block (broad pattern).',reason||'Pattern too broad.',...suggestions].filter(Boolean).join('\n')}
module.exports={formatBroadPatternError};
