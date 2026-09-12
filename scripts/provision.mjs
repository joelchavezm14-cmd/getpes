import fs from 'node:fs';import {randomBytes} from 'node:crypto';import {hashPassword} from '../src/api.mjs';
fs.mkdirSync('.local',{recursive:true});
if(fs.existsSync('.local/bootstrap.json'))throw new Error('Bootstrap already exists; do not overwrite.');
const admin='Gp!'+randomBytes(12).toString('base64url'),client='Gp!'+randomBytes(12).toString('base64url');
const env={BOOTSTRAP_ADMIN_HASH:await hashPassword(admin),BOOTSTRAP_LGNA_HASH:await hashPassword(client)};
fs.writeFileSync('.local/bootstrap.json',JSON.stringify(env));
fs.writeFileSync('.env',Object.entries(env).map(([k,v])=>`${k}=${v}`).join('\n'));
// Passwords are emitted once for owner handoff, never written to a file.
console.log(JSON.stringify({admin,client}));
