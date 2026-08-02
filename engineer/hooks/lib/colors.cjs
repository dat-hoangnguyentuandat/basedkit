const RESET='\x1b[0m';
const C={green:'\x1b[32m',yellow:'\x1b[33m',red:'\x1b[31m',cyan:'\x1b[36m',magenta:'\x1b[35m',dim:'\x1b[2m'};
const shouldUseColor=!!process.stdout.isTTY&&!process.env.NO_COLOR;
const wrap=(code)=>(text='')=>shouldUseColor?`${code}${text}${RESET}`:String(text);
const green=wrap(C.green),yellow=wrap(C.yellow),red=wrap(C.red),cyan=wrap(C.cyan),magenta=wrap(C.magenta),dim=wrap(C.dim);
function coloredBar(percent=0,width=12){const p=Math.max(0,Math.min(100,Number(percent)||0));const filled=Math.round((p/100)*width);const empty=Math.max(0,width-filled);const bar=`${'█'.repeat(filled)}${'░'.repeat(empty)}`;const fn=p>=85?red:p>=60?yellow:green;return fn(bar)}
module.exports={RESET,shouldUseColor,green,yellow,red,cyan,magenta,dim,coloredBar};
