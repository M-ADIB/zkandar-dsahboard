const fs = require('fs');
const content = fs.readFileSync('supabase/functions/invite-user/index.ts', 'utf8');

console.log(JSON.stringify(content));
