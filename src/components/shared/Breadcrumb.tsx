import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { TITLE_MAP, useDynamicTitle } from '@/hooks/usePageTitle'

export function Breadcrumbs() {
    const location = useLocation()
    const dynamicTitle = useDynamicTitle()

    const pathnames = location.pathname.split('/').filter((x) => x)

    if (pathnames.length === 0) return null
    if (pathnames[0] === 'dashboard' && pathnames.length === 1) return null
    if (pathnames[0] === 'admin' && pathnames.length === 1) return null

    return (
        <nav aria-label="breadcrumb" className="mb-6 hidden sm:block">
            <ol className="flex items-center space-x-2 text-sm text-gray-400">
                <li>
                    <Link to="/" className="flex items-center hover:text-white transition">
                        <Home className="h-4 w-4" />
                    </Link>
                </li>
                {pathnames.map((value, index) => {
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`
                    const isLast = index === pathnames.length - 1

                    // Match route mapping if exists
                    let label = TITLE_MAP[to]

                    // Fallbacks for dynamic segments
                    if (!label) {
                        if (isLast && dynamicTitle) {
                            label = dynamicTitle
                        } else {
                            // Capitalize the segment as fallback
                            label = value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ')
                        }
                    }

                    return (
                        <li key={to} className="flex items-center">
                            <ChevronRight className="h-4 w-4 mx-1 text-gray-600" />
                            {isLast ? (
                                <span className="text-white font-medium" aria-current="page">
                                    {label}
                                </span>
                            ) : (
                                <Link to={to} className="hover:text-white transition">
                                    {label}
                                </Link>
                            )}
                        </li>
                    )
                })}
            </ol>
        </nav>
    )
}
