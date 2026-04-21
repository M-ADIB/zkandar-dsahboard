import { useLocation } from 'react-router-dom'
import logoSrc from '../../assets/logo.png'

const NAV_LINKS = [
    { label: 'Sprint Workshop', href: '/test-landingpage#sprint' },
    { label: 'For Studios',     href: '/masterclass-analytics'   },
    { label: 'Case Studies',    href: '/test-landingpage#case-studies' },
    { label: 'Not Sure Yet',    href: '/not-sure'                },
]

export function PublicNav() {
    const { pathname } = useLocation()

    const isActive = (href: string) =>
        href.startsWith('/') && pathname === href.split('#')[0]

    return (
        <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.05] bg-black/85 backdrop-blur-md px-5 sm:px-10 py-3 flex items-center justify-between">
            <a href="/test-landingpage" className="flex items-center gap-3 shrink-0">
                <img src={logoSrc} alt="Zkandar AI" className="h-8 object-contain" />
            </a>

            {/* Centre links — hidden on small screens */}
            <div className="hidden md:flex items-center gap-1">
                {NAV_LINKS.map(link => (
                    <a
                        key={link.label}
                        href={link.href}
                        className={`px-3.5 py-1.5 rounded-full text-[0.7rem] font-bold uppercase tracking-[0.15em] transition-colors duration-200
                            ${isActive(link.href)
                                ? 'text-lime bg-lime/10'
                                : 'text-gray-500 hover:text-white'
                            }`}
                    >
                        {link.label}
                    </a>
                ))}
            </div>

            {/* Right CTA */}
            <a
                href="/submit-form"
                className="px-4 py-2 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-lime transition-colors duration-200 shrink-0"
            >
                Apply Now
            </a>
        </nav>
    )
}
