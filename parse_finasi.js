import fs from 'fs';

const teamCsv = fs.readFileSync('src/assets/Team Submissions Feb 20 2026.csv', 'utf8');
const mgmtCsv = fs.readFileSync('src/assets/Management Submissions Export Feb 20 2026 (1).csv', 'utf8');

function parse(csv) {
  const lines = csv.split('\n').filter(Boolean);
  const headers = lines[0].split(';');
  const companyIdx = headers.indexOf('company_name');
  const emailIdx = headers.indexOf('user_email');
  const nameIdx = headers.indexOf('full_name');
  const roleIdx = headers.indexOf('q1_role');

  return lines.slice(1).map(line => {
    let cols = [];
    let inQuote = false;
    let curr = '';
    for (let char of line) {
      if (char === '"') inQuote = !inQuote;
      else if (char === ';' && !inQuote) {
        cols.push(curr);
        curr = '';
      } else {
        curr += char;
      }
    }
    cols.push(curr);

    return {
      email: cols[emailIdx] || '',
      name: cols[nameIdx] || '',
      company: cols[companyIdx] || '',
      role: cols[roleIdx] || ''
    };
  });
}

const allUsers = [...parse(teamCsv), ...parse(mgmtCsv)];
const finasiUsers = allUsers.filter(u => u.company.toLowerCase().includes('finasi') || u.email.toLowerCase().includes('finasi'));

console.log(JSON.stringify(finasiUsers, null, 2));
