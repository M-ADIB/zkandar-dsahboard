import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import logoSrc from '../../assets/logo.png'

const NAV_LINKS = [
    { label: 'Home',           href: '/main'                  },
    { label: 'AI for Teams',   href: '/masterclass-analytics' },
    { label: 'Case Studies',   href: '/case-studies'          },
    { label: 'Not Sure Yet?',  href: '/not-sure'              },
]

interface PublicNavProps {
    topOffset?: number   // extra px to push down (e.g. banner height)
}

export function PublicNav({ topOffset = 0 }: PublicNavProps) {
    const { pathname } = useLocation()
    const [scrolled, setScrolled]     = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    const isActive = (href: string) =>
        !href.includes('#') && href.startsWith('/') && pathname === href

    const pillTop = 20 + topOffset   // px from top of viewport

    return (
        <>
            <div
                className="fixed inset-x-0 z-50 flex justify-center px-4 pointer-events-none"
                style={{ top: pillTop }}
            >
                <motion.nav
                    initial={{ y: -80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className={`pointer-events-auto w-full max-w-[1320px] px-5 sm:px-8 py-3 flex items-center justify-between backdrop-blur-2xl rounded-md border transition-all duration-500 ${
                        scrolled
                            ? 'bg-black/60 border-white/[0.14] shadow-[0_8px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]'
                            : 'bg-white/[0.05] border-white/[0.09] shadow-[0_4px_24px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.08)]'
                    }`}
                >
                    {/* ── Logo + Home ─────────────────────────────────── */}
                    <a href="/main" className="flex items-center gap-2 shrink-0 group">
                        <motion.img
                            src={logoSrc}
                            alt="Zkandar AI"
                            className="h-[32px] w-auto object-contain"
                            whileHover={{ scale: 1.08, rotate: -2 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                        />
                        <span className="hidden sm:block font-heading font-black uppercase text-[0.68rem] tracking-[0.2em] text-white/70 group-hover:text-lime transition-colors duration-300">
                            Zkandar AI
                        </span>
                    </a>

                    {/* ── Centre nav links ─────────────────────────────── */}
                    <div className="hidden md:flex items-center gap-0.5">
                        {NAV_LINKS.map((link, i) => (
                            <motion.a
                                key={link.label}
                                href={link.href}
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.45, delay: 0.15 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                                className={`relative px-3 py-1.5 rounded-md text-[0.63rem] font-bold uppercase tracking-[0.14em] transition-colors duration-200 ${
                                    isActive(link.href) ? 'text-lime' : 'text-white/50 hover:text-white'
                                }`}
                            >
                                {isActive(link.href) && (
                                    <motion.span
                                        layoutId="nav-active-pill"
                                        className="absolute inset-0 rounded-md bg-lime/10 border border-lime/20"
                                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                                    />
                                )}
                                <span className="relative z-10">{link.label}</span>
                            </motion.a>
                        ))}
                    </div>

                    {/* ── Right: CTA (desktop only) + mobile toggle ─── */}
                    <div className="flex items-center gap-2.5 shrink-0">
                        <motion.a
                            href="/find-your-path"
                            initial={{ opacity: 0, scale: 0.88 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.45, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.96 }}
                            className="hidden md:block px-3.5 py-1.5 rounded-md bg-white text-black font-bold text-[0.62rem] uppercase tracking-wider hover:bg-lime hover:shadow-[0_0_18px_rgba(208,255,113,0.4)] transition-all duration-300"
                        >
                            Take the AI Assessment
                        </motion.a>

                        {/* Hamburger — mobile only */}
                        <button
                            onClick={() => setMobileOpen(o => !o)}
                            aria-label="Toggle menu"
                            className="md:hidden flex flex-col justify-center gap-[5px] w-7 h-7 rounded-md hover:bg-white/5 transition-colors p-1.5"
                        >
                            <motion.span
                                animate={mobileOpen ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
                                transition={{ duration: 0.22 }}
                                className="block h-px bg-white origin-center"
                            />
                            <motion.span
                                animate={mobileOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                                transition={{ duration: 0.18 }}
                                className="block h-px bg-white origin-center"
                            />
                            <motion.span
                                animate={mobileOpen ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
                                transition={{ duration: 0.22 }}
                                className="block h-px bg-white origin-center"
                            />
                        </button>
                    </div>
                </motion.nav>
            </div>

            {/* ── Mobile drawer — floats below the pill ────────────── */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                        style={{ originY: 0, top: pillTop + 62 }}
                        className="fixed inset-x-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-[1320px] z-40 rounded-md bg-black/80 backdrop-blur-2xl border border-white/[0.09] px-4 pt-4 pb-5 flex flex-col gap-1 md:hidden shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
                    >
                        <motion.a
                            href="/main"
                            onClick={() => setMobileOpen(false)}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
                            className={`px-4 py-2.5 rounded-md text-sm font-bold uppercase tracking-[0.12em] transition-colors duration-200 ${
                                pathname === '/main'
                                    ? 'text-lime bg-lime/10 border border-lime/15'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            Home
                        </motion.a>
                        {NAV_LINKS.map((link, i) => (
                            <motion.a
                                key={link.label}
                                href={link.href}
                                onClick={() => setMobileOpen(false)}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.04 + i * 0.055, ease: [0.16, 1, 0.3, 1] }}
                                className={`px-4 py-2.5 rounded-md text-sm font-bold uppercase tracking-[0.12em] transition-colors duration-200 ${
                                    isActive(link.href)
                                        ? 'text-lime bg-lime/10 border border-lime/15'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {link.label}
                            </motion.a>
                        ))}
                        <motion.a
                            href="https://calendly.com/zkandarstudio-info/ai-discovery-call"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setMobileOpen(false)}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.04 + NAV_LINKS.length * 0.055, ease: [0.16, 1, 0.3, 1] }}
                            className="px-4 py-2.5 rounded-md text-sm font-bold uppercase tracking-[0.12em] transition-colors duration-200 text-gray-400 hover:text-white hover:bg-white/5"
                        >
                            Book a Talk
                        </motion.a>
                        <div className="mt-2 pt-3 border-t border-white/[0.06]">
                            <a
                                href="/find-your-path"
                                onClick={() => setMobileOpen(false)}
                                className="block w-full text-center px-4 py-3 rounded-md bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-lime transition-colors duration-200"
                            >
                                Take the AI Assessment
                            </a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
