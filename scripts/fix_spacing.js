import fs from 'fs'

const path = '/Users/madibbaroudi/Desktop/zkandar-dashboard/src/pages/admin/CompanyWorkspacePage.tsx'
let content = fs.readFileSync(path, 'utf-8')

// Fix instances of ` className={`something - else`} `
// E.g. ` px - 2 py - 1 ` -> `px-2 py-1`
// This regex looks for string literals in backticks and removes spaces around hyphens in them
content = content.replace(/`([^`]+)`/g, (match, p1) => {
    // Specifically fix the spacing around hyphens that got injected
    let fixed = p1.replace(/ - /g, '-')
    // And spaces before slash
    fixed = fixed.replace(/ \/ /g, '/')
    // And extra spaces at edges
    fixed = fixed.trim()
    return '`' + fixed + '`'
})

// Specifically fix the ${ var } to ${var}
content = content.replace(/\$\{ ([a-zA-Z0-9_\[\]\.]+) \}/g, '${$1}')

fs.writeFileSync(path, content)
console.log('Fixed JSX spacing in CompanyWorkspacePage.tsx')
