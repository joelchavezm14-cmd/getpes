import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
test('campaign cards calculate metrics and limit editing to admin',()=>{
 const scope={state:{data:{campaigns:[],campaignMetrics:{leads:214,revenue:4500,meetings:12,sales:8}}},totals:()=>({spend:1866,leads:0,revenue:0,sales:0}),isAdmin:()=>true,money:n=>'S/ '+Number(n).toFixed(2),num:n=>String(n),esc:s=>String(s),empty:s=>s};vm.createContext(scope);vm.runInContext(fs.readFileSync('public/js/campaign-view.js','utf8'),scope);
 const html=scope.campaignDashboard();assert.equal((html.match(/class="campaign-kpi /g)||[]).length,9);assert.equal((html.match(/data-metric=/g)||[]).length,4);assert.match(html,/2.41×/);assert.match(html,/3.74%/);assert.match(html,/S\/ 233.25/);
 scope.isAdmin=()=>false;assert.ok(!scope.campaignDashboard().includes('data-metric='));assert.ok(!scope.campaignDashboard().includes('id="add-campaign"'));
 scope.state.data.companySettings={show_meetings:0};const hidden=scope.campaignDashboard();assert.ok(!/REUNIONES|Reuniones/.test(hidden));assert.equal((hidden.match(/class="campaign-kpi /g)||[]).length,8);
 assert.equal(scope.state.data.campaignMetrics.meetings,12);
 scope.totals=()=>({spend:0,leads:0,sales:0,revenue:0});scope.state.data.campaignMetrics=null;assert.ok(!/NaN|Infinity/.test(scope.campaignDashboard()));
});
