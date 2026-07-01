import fs from 'fs';

const teamCsv = fs.readFileSync('src/assets/Team Submissions Feb 20 2026.csv', 'utf8');
const mgmtCsv = fs.readFileSync('src/assets/Management Submissions Export Feb 20 2026 (1).csv', 'utf8');

const finasiCompanyId = 'b5329df4-1664-4d17-bcbc-f96a2f847a70';
const finasiCohortId = 'a6cd4ab0-2184-40bd-9eb0-1f81a6b3f1d8';

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
            email: cols[emailIdx]?.trim() || '',
            name: cols[nameIdx]?.trim() || 'Unknown',
            company: cols[companyIdx]?.trim() || '',
            role: cols[roleIdx]?.trim() || 'participant'
        };
    });
}

const allUsers = [...parse(teamCsv), ...parse(mgmtCsv)];
const finasiUsersRaw = allUsers.filter(u => u.company.toLowerCase().includes('finasi') || u.email.toLowerCase().includes('finasi'));

// Deduplicate by email
const uniqueUsers = Array.from(new Map(finasiUsersRaw.map(u => [u.email.toLowerCase(), u])).values());

// Generate SQL
let sql = `
-- Insert Finasi mock users
`;

// Helper for UUID v4
function randomUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Ensure test account is there
if (!uniqueUsers.find(u => u.email === 'test@finasi.com')) {
    uniqueUsers.push({
        email: 'test@finasi.com',
        name: 'Test Member',
        company: 'Finasi',
        role: 'participant'
    });
}

const userMap = [];

for (const user of uniqueUsers) {
    if (!user.email) continue;

    // Use the existing auth ID for test@finasi.com, otherwise generate UUID
    const id = user.email === 'test@finasi.com'
        ? '3fbed695-6c1a-43c4-900d-118ebec7e1de'
        : randomUUID();

    userMap.push({ id, ...user });

    // Map roles
    let dbRole = 'participant';
    const roleLow = user.role?.toLowerCase() || '';
    if (roleLow.includes('director') || roleLow.includes('partner') || roleLow.includes('leadership')) {
        dbRole = 'executive';
    }

    if (user.email !== 'test@finasi.com') {
        sql += `
INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, 
    raw_app_meta_data, raw_user_meta_data, is_super_admin
) VALUES (
    '${id}', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '${user.email.replace(/'/g, "''")}', 
    '$2a$10$vN0wDk.Bv0ZqXW.G9jB8uO4U2A7y8uD2bQ8/x1S8vV3Q.XvR6i8hK', -- mock hash for 'password'
    now(), now(), now(), 
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
) ON CONFLICT (id) DO NOTHING;
`;
    }

    sql += `
INSERT INTO public.users (id, email, full_name, role, company_id, onboarding_completed)
VALUES ('${id}', '${user.email.replace(/'/g, "''")}', '${user.name.replace(/'/g, "''")}', '${dbRole}', '${finasiCompanyId}', true)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name, 
    company_id = EXCLUDED.company_id, 
    onboarding_completed = EXCLUDED.onboarding_completed;

INSERT INTO cohort_memberships (cohort_id, user_id)
VALUES ('${finasiCohortId}', '${id}')
ON CONFLICT (cohort_id, user_id) DO NOTHING;
`;
}

console.log(sql);
