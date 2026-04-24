import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import logoSrc from '../../assets/logo.png'

const NAV_LINKS = [
    { label: 'Sprint Workshop', href: '/test-landingpage#sprint' },
    { label: 'For Studios',     href: '/masterclass-analytics'   },
    { label: 'Case Studies',    href: '/test-landingpage#case-studies' },
    { label: 'Find Your Path',  href: '/find-your-path'          },
]

export function PublicNav() {
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

    return (
        <>
            <div className="fixed top-5 sm:top-7 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
                <motion.nav
                    initial={{ y: -80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className={`pointer-events-auto w-full max-w-[1200px] px-5 sm:px-7 py-3 flex items-center justify-between backdrop-blur-xl rounded-[22px] border transition-all duration-500 ${
                        scrolled
                            ? 'bg-[rgba(12,10,22,0.88)] border-white/[0.12] shadow-[0_8px_48px_rgba(0,0,0,0.55)]'
                            : 'bg-[rgba(45,42,65,0.18)] border-white/[0.07]'
                    }`}
                >
                    {/* ── Logo + brand name ───────────────────────────── */}
                    <a href="/test-landingpage" className="flex items-center gap-2.5 shrink-0 group">
                        <motion.img
                            src={logoSrc}
                            alt="Zkandar AI"
                            className="h-[37px] w-auto object-contain"
                            whileHover={{ scale: 1.08, rotate: -2 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                        />
                        <span className="hidden sm:block font-heading font-black uppercase text-[0.72rem] tracking-[0.22em] text-white/80 group-hover:text-lime transition-colors duration-300">
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
                                className={`relative px-3.5 py-1.5 rounded-full text-[0.68rem] font-bold uppercase tracking-[0.15em] transition-colors duration-200 ${
                                    isActive(link.href) ? 'text-lime' : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                {isActive(link.href) && (
                                    <motion.span
                                        layoutId="nav-active-pill"
                                        className="absolute inset-0 rounded-full bg-lime/10 border border-lime/25"
                                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                                    />
                                )}
                                <span className="relative z-10">{link.label}</span>
                            </motion.a>
                        ))}
                    </div>

                    {/* ── Right: CTA + mobile toggle ───────────────────── */}
                    <div className="flex items-center gap-3 shrink-0">
                        <motion.a
                            href="/find-your-path"
                            initial={{ opacity: 0, scale: 0.88 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.45, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.96 }}
                            className="px-4 py-2 rounded-lg bg-white text-black font-bold text-[0.65rem] uppercase tracking-wider hover:bg-lime hover:shadow-[0_0_22px_rgba(208,255,113,0.45)] transition-all duration-300"
                        >
                            See Where You're At
                        </motion.a>

                        {/* Hamburger — mobile only */}
                        <button
                            onClick={() => setMobileOpen(o => !o)}
                            aria-label="Toggle menu"
                            className="md:hidden flex flex-col justify-center gap-[5px] w-8 h-8 rounded-lg hover:bg-white/5 transition-colors p-1.5"
                        >
                            <motion.span
                                animate={mobileOpen ? { rotate: 45, y: 5.5 } : { rotate: 0, y: 0 }}
                                transition={{ duration: 0.22 }}
                                className="block h-px bg-white origin-center"
                            />
                            <motion.span
                                animate={mobileOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                                transition={{ duration: 0.18 }}
                                className="block h-px bg-white origin-center"
                            />
                            <motion.span
                                animate={mobileOpen ? { rotate: -45, y: -5.5 } : { rotate: 0, y: 0 }}
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
                        initial={{ opacity: 0, y: -12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                        style={{ originY: 0 }}
                        className="fixed top-[82px] sm:top-[90px] inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-[1200px] z-40 rounded-[18px] bg-[rgba(12,10,22,0.97)] backdrop-blur-xl border border-white/[0.08] px-4 pt-4 pb-5 flex flex-col gap-1 md:hidden shadow-[0_16px_48px_rgba(0,0,0,0.6)]"
                    >
                        {NAV_LINKS.map((link, i) => (
                            <motion.a
                                key={link.label}
                                href={link.href}
                                onClick={() => setMobileOpen(false)}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.04 + i * 0.055, ease: [0.16, 1, 0.3, 1] }}
                                className={`px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-[0.12em] transition-colors duration-200 ${
                                    isActive(link.href)
                                        ? 'text-lime bg-lime/10 border border-lime/15'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {link.label}
                            </motion.a>
                        ))}
                        <div className="mt-2 pt-3 border-t border-white/[0.06]">
                            <a
                                href="/find-your-path"
                                onClick={() => setMobileOpen(false)}
                                className="block w-full text-center px-4 py-3 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-lime transition-colors duration-200"
                            >
                                See Where You're At
                            </a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
