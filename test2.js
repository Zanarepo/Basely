const str = '{\n  "a": "line1\nline2"\n}';
const cleaned = str.replace(/(["'])(?:(?=(\\?))\2.)*?\1/gs, match => match.replace(/\n/g, '\\n'));
try { console.log(JSON.parse(cleaned)); } catch(e) { console.log(e.message); }
