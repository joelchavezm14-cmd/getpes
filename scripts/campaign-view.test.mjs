import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
test('five primary KPIs, previous period, empty data and permissions',()=>{
 const scope={state:{company:'a',month:'2026-09',data:{campaigns:[],companySettings:{},trend:[{month:'2026-09',entries:1,spend:1866,leads:214,revenue:4500}],previousMonth:'2026-08',previous:{spend:2000,leads:100,sales:4,revenue:2000},campaignMetrics:{leads:214,revenue:4500,meetings:12,sales:8}}},totals:()=>({spend:1866,leads:0,revenue:0,sales:0}),isAdmin:()=>true,money:n=>'S/ '+Number(n).toFixed(2),num:n=>String(n),esc:s=>String(s),empty:s=>s,navIcon:()=>'',monthName:m=>m,MutationObserver:class{observe(){}},document:{getElementById:()=>({})}};scope.can=()=>scope.isAdmin();vm.createContext(scope);for(const f of ['campaign-view','campaign-next'])vm.runInContext(fs.readFileSync('public/js/'+f+'.js','utf8'),scope);
 const html=scope.campaignDashboard(),primary=html.split('<div class="campaign-kpis">')[1].split('</div><aside')[0];assert.equal((primary.match(/class="campaign-kpi /g)||[]).length,5);assert.match(html,/2.41×/);assert.match(html,/114.0%/);assert.equal(scope.metricNumber({spend:1866,sales:8},'cpa'),233.25);assert.match(scope.metricDelta(5,0,'leads'),/Sin base anterior/);
 scope.isAdmin=()=>false;assert.ok(!scope.campaignDashboard().includes('data-metric='));assert.ok(!scope.campaignDashboard().includes('id="add-campaign"'));
 scope.state.data.companySettings.show_meetings=0;assert.ok(!scope.campaignDashboard().includes('Reuniones'));assert.equal(scope.state.data.campaignMetrics.meetings,12);
 scope.state.data.trend=[];scope.state.data.campaignMetrics=null;assert.ok(!/NaN|Infinity/.test(scope.campaignDashboard()));assert.equal(scope.currentCampaignMetrics(),null);
});

test('funnel uses resolved campaign meetings and refreshes quantities and percentages',()=>{
 const scope={state:{data:{companySettings:{},campaignMetrics:null}},isAdmin:()=>false,num:String,MutationObserver:class{observe(){}},document:{getElementById:()=>({})}};
 vm.createContext(scope);vm.runInContext(fs.readFileSync('public/js/campaign-next.js','utf8'),scope);
 scope.campaignInsight=()=>'';
 let html=scope.campaignFunnel({leads:20,meetings:4,sales:2});
 assert.match(html,/<span>Reuniones<\/span><strong>4<\/strong><span>20.0%/);
 html=scope.campaignFunnel({leads:20,meetings:8,sales:2});
 assert.match(html,/<span>Reuniones<\/span><strong>8<\/strong><span>40.0%/);
 assert.match(scope.campaignFunnel({leads:20,meetings:0,sales:0}),/<span>Reuniones<\/span><strong>0<\/strong>/);
 assert.match(scope.campaignFunnel({leads:20,meetings:null,sales:0}),/Sin dato registrado/);
 scope.state.data.companySettings.show_meetings=0;
 assert.ok(!scope.campaignFunnel({leads:20,meetings:8,sales:2}).includes('Reuniones'));
});
