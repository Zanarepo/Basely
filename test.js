const str = '{\n  "a": "line1\nline2"\n}';
try { JSON.parse(str); console.log('success1'); } catch(e) { console.log('err1:', e.message); }
const clean = str.replace(/[\n\r]+/g, '\\n').replace(/\t/g, '\\t');
try { JSON.parse(clean); console.log('success2'); } catch(e) { console.log('err2:', e.message); }
