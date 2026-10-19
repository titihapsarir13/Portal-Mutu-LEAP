const listLine = /^(\s*)([-+*•]|\d+[.)]|[a-zA-Z]+[.)])\s+(.*)$/;
const roman = (s) => { const vals={i:1,v:5,x:10,l:50,c:100,d:500,m:1000}; let n=0; const t=s.toLowerCase(); for(let i=0;i<t.length;i++) n+=(vals[t[i]] < (vals[t[i+1]]||0) ? -1 : 1)*vals[t[i]]; return n; };
const alpha = (s) => [...s.toLowerCase()].reduce((n,c)=>n*26+c.charCodeAt(0)-96,0);
// Lists copied from Docs can begin at a nested indentation with no parent in
// the current section. Rebase that group; keep the visible alphabetic/roman style.
export function prepareNaskahText(value) {
  const lines=String(value || '').replace(/\t/g,'    ').split('\n'), types={};
  for(let i=0;i<lines.length;i++) {
    if(!listLine.test(lines[i])) continue;
    const group=[]; let j=i;
    while(j<lines.length && (!lines[j].trim() || listLine.test(lines[j]))) { if(lines[j].trim()) group.push(j); j++; }
    const min=Math.min(...group.map(k=>lines[k].match(listLine)[1].length));
    const markers=group.map(k=>lines[k].match(listLine)[2].replace(/[.)]$/,''));
    const alphabetic=markers.some(m=>/^[a-z]+$/i.test(m)&&!/^[ivxlcdm]+$/i.test(m));
    group.forEach(k=>{
      const m=lines[k].match(listLine), marker=m[2], raw=marker.replace(/[.)]$/,''), indent=' '.repeat(Math.max(0,m[1].length-min));
      let kind, number;
      if(/^\d+$/.test(raw)) number=Number(raw);
      else if(/^[a-z]+$/i.test(raw)) { const isRoman=!alphabetic&&/^[ivxlcdm]+$/i.test(raw); kind=isRoman?(raw===raw.toUpperCase()?'I':'i'):(raw===raw.toUpperCase()?'A':'a'); number=isRoman?roman(raw):alpha(raw); }
      if(number!=null) { lines[k]=indent+number+'. '+m[3]; types[k+1]={type:kind,start:number}; }
      else lines[k]=indent+'- '+m[3];
    });
    i=j-1;
  }
  return { text:lines.join('\n'), types };
}
