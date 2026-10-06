let comparisonGrouping=1;
function comparisonGroups(source,year,size){
 const groups=[];
 for(let start=1;start<=12;start+=size){
  const months=Array.from({length:size},(_,i)=>year+'-'+String(start+i).padStart(2,'0'));
  const available=months.filter(m=>m>='2026-09'&&m<='2027-12');if(!available.length)continue;
  const records=source.filter(r=>available.includes(r.month)&&r.entries>0);
  const sum=k=>records.reduce((v,r)=>v+Number(r[k]||0),0);
  groups.push({month:available[0],label:size===1?monthName(available[0]):size===3?'Trimestre '+Math.ceil(start/3):size===6?'Semestre '+Math.ceil(start/6):'Año '+year,spend:sum('spend'),revenue:sum('revenue'),leads:sum('leads'),net:sum('revenue')-sum('spend'),count:records.length,expected:months.length});
 }
 return groups;
}
function comparisonPlot(rows){
 const W=Math.max(700,rows.length*100),H=330,L=80,R=80,T=25,B=60,plotH=H-T-B,step=(W-L-R)/rows.length;
 const min=Math.min(0,...rows.filter(r=>r.count).map(r=>r.net)),max=Math.max(1,...rows.flatMap(r=>[r.revenue,r.spend,r.net]));
 const y=v=>T+(max-v)/max*plotH,zero=T+plotH;
 const netY=v=>T+(max-v)/(max-min)*plotH;
 const bar=(x,value,width,color)=>{const top=y(value),height=zero-top,r=Math.min(width/2,height);return height>0?`<path d="M${x} ${zero}V${top+r}Q${x} ${top} ${x+r} ${top}H${x+width-r}Q${x+width} ${top} ${x+width} ${top+r}V${zero}Z" fill="${color}"/>`:'';};
 let svg=Array.from({length:5},(_,i)=>{const v=max*i/4;return `<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="currentColor" opacity=".12"/><text x="${L-8}" y="${y(v)+4}" text-anchor="end">${num(Math.round(v))}</text>`;}).join('');
 svg+=Array.from({length:5},(_,i)=>{const v=min+(max-min)*i/4;return `<text x="${W-R+10}" y="${netY(v)+4}">${num(Math.round(v))}</text>`;}).join('');
 svg+=`<text x="${L}" y="14">Ingresos / inversión (${currencySymbol()})</text><text x="${W-R}" y="14" text-anchor="end">Diferencia (${currencySymbol()}) · eje derecho</text>`;
 rows.forEach((r,i)=>{const x=L+step*(i+.5),bw=Math.min(28,step*.28);svg+=`<text x="${x}" y="${H-25}" text-anchor="middle">${esc(comparisonGrouping===1?r.label.split(' de ')[0].slice(0,3):r.label)}</text>`;if(!r.count){svg+=`<text x="${x}" y="${zero-12}" text-anchor="middle">—</text>`;return;}svg+=`<g tabindex="0" aria-label="${esc(r.label)}: ingresos ${money(r.revenue)}, inversión ${money(r.spend)}, diferencia ${money(r.net)}"><title>${esc(r.label)}\nIngresos: ${money(r.revenue)}\nInversión: ${money(r.spend)}\nDiferencia: ${money(r.net)}</title>${bar(x-bw-3,r.revenue,bw,'#18bc7b')}${bar(x+3,r.spend,bw,'#738895')}</g>`;if(i&&rows[i-1].count)svg+=`<line x1="${x-step}" y1="${netY(rows[i-1].net)}" x2="${x}" y2="${netY(r.net)}" stroke="#67e6ac" stroke-width="3"/>`;});
 return `<div class="comparison-plot"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Ingresos e inversión con línea de diferencia. Detalle accesible en las tarjetas siguientes.">${svg}</svg></div>`;
}
function renderComparison(){
 const source=state.data.comparison||[],rows=comparisonGroups(source,comparisonYear,comparisonGrouping),recorded=rows.filter(r=>r.count),sum=k=>recorded.reduce((a,r)=>a+r[k],0),revenue=sum('revenue'),spend=sum('spend'),net=revenue-spend,margin=revenue?net/revenue*100:null;
 const cards=[['Ingresos atribuidos',revenue,'↑'],['Inversión publicitaria',spend,'↓'],['Diferencia',net,'▥'],['Margen sobre ingresos',margin,'%']];
 const previous=comparisonGroups(source,String(Number(comparisonYear)-1),comparisonGrouping),priorComplete=previous.reduce((n,r)=>n+r.count,0)===12;
 $('#content').innerHTML=`<div class="comparison-reference"><div class="title-row"><div><h2>Ingresos vs. inversión</h2><p class="muted">Compara los resultados de tus campañas.</p></div><div class="actions"><label>Año<select id="comparison-year"><option ${comparisonYear==='2026'?'selected':''}>2026</option><option ${comparisonYear==='2027'?'selected':''}>2027</option></select></label><label>Vista<select id="comparison-group">${[[1,'Mensual'],[3,'Trimestral'],[6,'Semestral · mitad de año'],[12,'Anual · 1 año']].map(([v,l])=>`<option value="${v}" ${comparisonGrouping===v?'selected':''}>${l}</option>`).join('')}</select></label></div></div><div class="comparison-kpis">${cards.map(([label,value,icon],i)=>`<article class="panel"><span class="comparison-icon">${icon}</span><div><span class="muted">${label}</span><strong>${!recorded.length||value==null?'—':i===3?value.toFixed(1)+'%':money(value)}</strong><small>${priorComplete?'Consulta la variación por periodo abajo':'Sin año anterior completo para comparar'}</small></div></article>`).join('')}</div><section class="panel"><div class="comparison-legend"><span>Ingresos</span><span>Inversión</span><span>— Diferencia</span></div>${comparisonPlot(rows)}</section><div class="comparison-cards">${rows.map((r,i)=>{const prev=i?rows[i-1]:previous.at(-1),delta=prev&&prev.count===prev.expected&&r.count===r.expected&&prev.net!==0?((r.net-prev.net)/Math.abs(prev.net)*100):null;return `<article class="panel"><h3>${esc(r.label)}</h3>${r.count?`<dl><div><dt>Ingresos</dt><dd>${money(r.revenue)}</dd></div><div><dt>Inversión</dt><dd>${money(r.spend)}</dd></div><div class="difference"><dt>Diferencia</dt><dd>${money(r.net)}</dd></div><div><dt>Leads</dt><dd>${num(r.leads)}</dd></div><div><dt>CPL</dt><dd>${r.leads?money(r.spend/r.leads):'—'}</dd></div></dl><small>${r.count}/${r.expected} meses con datos${r.count<r.expected?' · Parcial':''}</small><p class="muted">${delta==null?'Sin base completa para variación':(delta>0?'+':'')+delta.toFixed(1)+'% de diferencia vs. periodo anterior'}</p>`:'<p class="muted">Sin datos registrados</p>'}</article>`;}).join('')}</div><p class="muted">Ingresos = ventas atribuidas. Inversión = gasto publicitario. La diferencia y el margen no descuentan otros costos del negocio y no representan utilidad neta. Los periodos sin registros no se cuentan como cero. Datos disponibles desde setiembre de 2026; el mes actual puede estar incompleto.</p></div>`;
 $('#comparison-year').onchange=e=>{comparisonYear=e.target.value;renderComparison();};$('#comparison-group').onchange=e=>{comparisonGrouping=Number(e.target.value);renderComparison();};
}
