import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import logoSrc from '../../assets/logo.png'

const NAV_LINKS = [
    { label: 'Home',           href: '/main'                  },
    { label: 'AI for Teams',   href: '/ai-masterclass' },
    { label: 'Case Studies',   href: '/case-studies'          },
    { label: 'Book a Talk',    href: '/events-apply'          },
]

interface PublicNavProps {
    topOffset?: number   // extra px to push down (e.g. banner height)
}

export function PublicNav({ topOffset = 0 }: PublicNavProps) {
    const { pathname } = useLocation()
    const [scrolled, setScrolled]   = useState(false)
    const [menuOpen, setMenuOpen]   = useState(false)
    const navRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    // Close menu on route change
    useEffect(() => { setMenuOpen(false) }, [pathname])

    // Close on outside click
    useEffect(() => {
        if (!menuOpen) return
        const handler = (e: MouseEvent) => {
            if (navRef.current && !navRef.current.contains(e.target as Node)) {
                setMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [menuOpen])

    // Lock body scroll when menu is open
    useEffect(() => {
        if (menuOpen) document.body.style.overflow = 'hidden'
        else document.body.style.overflow = ''
        return () => { document.body.style.overflow = '' }
    }, [menuOpen])

    const isActive = (href: string) =>
        !href.includes('#') && href.startsWith('/') && pathname === href

    const pillTop = 20 + topOffset

    return (
        <>
            {/* Backdrop */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setMenuOpen(false)}
                        className="fixed inset-0 z-[49] bg-black/50 backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            <div
                ref={navRef}
                className="fixed inset-x-0 z-50 flex justify-center px-4"
                style={{ top: pillTop }}
            >
                {/* ── Nav pill ─────────────────────────────────────── */}
                <motion.nav
                    initial={{ y: -80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className={`w-full max-w-[1320px] px-5 sm:px-8 py-3 flex items-center justify-between backdrop-blur-2xl border transition-all duration-500 ${
                        menuOpen
                            ? 'rounded-t-2xl bg-black/80 border-white/[0.14] border-b-transparent shadow-[0_8px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]'
                            : scrolled
                                ? 'rounded-2xl bg-black/60 border-white/[0.14] shadow-[0_8px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]'
                                : 'rounded-2xl bg-white/[0.05] border-white/[0.09] shadow-[0_4px_24px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.08)]'
                    }`}
                >
                    {/* Logo + Wordmark */}
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

                    {/* Right: CTA (hidden on mobile) + Hamburger */}
                    <div className="flex items-center gap-2.5 shrink-0">
                        <motion.a
                            href="/find-your-path"
                            initial={{ opacity: 0, scale: 0.88 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.45, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.96 }}
                            className="hidden sm:block px-3.5 py-1.5 rounded-md bg-white text-black font-bold text-[0.62rem] uppercase tracking-wider hover:bg-lime hover:shadow-[0_0_18px_rgba(208,255,113,0.4)] transition-all duration-300"
                        >
                            Take the AI Assessment
                        </motion.a>

                        <button
                            onClick={() => setMenuOpen(o => !o)}
                            aria-label="Toggle menu"
                            className="flex flex-col justify-center gap-[5px] w-8 h-8 rounded-md hover:bg-white/5 transition-colors p-1.5"
                        >
                            <motion.span
                                animate={menuOpen ? { rotate: 45, y: 5.5 } : { rotate: 0, y: 0 }}
                                transition={{ duration: 0.22 }}
                                className="block h-[1.5px] bg-white origin-center"
                            />
                            <motion.span
                                animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                                transition={{ duration: 0.18 }}
                                className="block h-[1.5px] bg-white origin-center"
                            />
                            <motion.span
                                animate={menuOpen ? { rotate: -45, y: -5.5 } : { rotate: 0, y: 0 }}
                                transition={{ duration: 0.22 }}
                                className="block h-[1.5px] bg-white origin-center"
                            />
                        </button>
                    </div>
                </motion.nav>

                {/* ── Dropdown — attached directly below the nav pill ─── */}
                <AnimatePresence>
                    {menuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute left-4 right-4 overflow-hidden flex justify-center"
                            style={{ top: '100%' }}
                        >
                            <div className="w-full max-w-[1320px] bg-black/90 backdrop-blur-2xl border border-white/[0.09] border-t-0 rounded-b-2xl px-5 sm:px-8 pt-2 pb-5 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                                <div className="space-y-0.5">
                                    {NAV_LINKS.map((link, i) => (
                                        <motion.a
                                            key={link.label}
                                            href={link.href}
                                            onClick={() => setMenuOpen(false)}
                                            initial={{ opacity: 0, x: -12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.06 + i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                                            className={`block px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-[0.12em] transition-colors duration-200 ${
                                                isActive(link.href)
                                                    ? 'text-lime bg-lime/10 border border-lime/15'
                                                    : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                                            }`}
                                        >
                                            {link.label}
                                        </motion.a>
                                    ))}
                                </div>

                                {/* CTA inside menu — mobile only */}
                                <div className="mt-3 pt-3 border-t border-white/[0.06] sm:hidden">
                                    <a
                                        href="/find-your-path"
                                        onClick={() => setMenuOpen(false)}
                                        className="block w-full text-center px-4 py-3 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-lime transition-colors duration-200"
                                    >
                                        Take the AI Assessment
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    )
}
