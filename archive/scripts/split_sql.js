import fs from 'fs';
const sql = fs.readFileSync('seed_finasi.sql', 'utf8');
const blocks = sql.split(/(?=INSERT INTO auth\.users)/g);
fs.writeFileSync('chunk1.sql', blocks.slice(0, 13).join(''));
fs.writeFileSync('chunk2.sql', blocks.slice(13, 26).join(''));
fs.writeFileSync('chunk3.sql', blocks.slice(26).join(''));
