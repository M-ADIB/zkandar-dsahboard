import fs from 'fs'

const path = '/Users/madibbaroudi/Desktop/zkandar-dashboard/src/pages/admin/CompanyWorkspacePage.tsx'
let content = fs.readFileSync(path, 'utf-8')

// Fix cases like: value={`${avgTeamReadiness} /10`} which might have extra spaces if formatted badly
// But the actual TS errors are:
//   </div >  => </div>
//   className={`... ${ isActive ? ... } `}
//   sub={`${onboardedMembers} onboarded`}

content = content.replace(/<\/div >/g, '</div>')
content = content.replace(/<\/motion\.div >/g, '</motion.div>')

// Fix ${ var } spaces inside template strings
// The original issue might have been TS1005 when spaces were inside ${ } or around it.
// Actually, earlier the replace added spaces like ${ avgTeamReadiness }
content = content.replace(/\$\{ ([a-zA-Z0-9_\[\]\.]+) \}/g, '${$1}')

// Also check for ` } ` at the end of className
content = content.replace(/ \}`/g, '}`')

fs.writeFileSync(path, content)
console.log('Fixed additional spacing issues')
