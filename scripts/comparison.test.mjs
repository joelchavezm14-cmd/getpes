import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
test('comparison renders recorded positive and negative values and missing periods',()=>{
 const scope={num:String,money:n=>'S/ '+n,esc:String};vm.createContext(scope);
 vm.runInContext(fs.readFileSync('public/js/comparison.js','utf8'),scope);
 const rows=[{label:'Setiembre',count:1,revenue:800,spend:200,net:600},{label:'Octubre',count:1,revenue:100,spend:300,net:-200},{label:'Noviembre',count:0,revenue:0,spend:0,net:0}];
 for(const size of [1,3,6,12]){
 vm.runInContext('comparisonGrouping='+size,scope);
 const html=scope.comparisonPlot(rows);
 assert.match(html,/Diferencia: S\/ -200/);assert.match(html,/Diferencia: S\/ 600/);
 assert.doesNotMatch(html,/NaN|Infinity|<circle/);
 assert.equal((html.match(/V270Z/g)||[]).length,4,'all four bars must touch the bottom baseline');
 }
 assert.doesNotMatch(scope.comparisonPlot([rows[2]]),/NaN|Infinity/);
});
