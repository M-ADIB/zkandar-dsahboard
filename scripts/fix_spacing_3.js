import fs from 'fs'

const path = '/Users/madibbaroudi/Desktop/zkandar-dashboard/src/pages/admin/CompanyWorkspacePage.tsx'
let content = fs.readFileSync(path, 'utf-8')

// Fix cases like { } inside tags that got broken
content = content.replace(/<\/div >/g, '</div>')
content = content.replace(/<\/motion\.div >/g, '</motion.div>')
content = content.replace(/< \/ /g, '</')
content = content.replace(/ \/ >/g, '/>')
content = content.replace(/\{ \/\* /g, '{/* ')
content = content.replace(/ \*\/ \}/g, ' */}')
content = content.replace(/`([^`]+)`/g, (match, p1) => {
    // Specifically fix the spacing around hyphens that got injected again if any
    let fixed = p1.replace(/ - /g, '-')
    // And extra spaces at edges
    fixed = fixed.trim()
    return '`' + fixed + '`'
})
// Fix cases where a space was injected between object properties in interpolations
// like ${ isActive ? 'text-black' : 'text-gray-400 hover:text-white' }
content = content.replace(/\$\{([^}]+)\}/g, (match, p1) => {
    return '${' + p1.trim() + '}'
})

fs.writeFileSync(path, content)
console.log('Fixed final spacing issues')
