import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { ReactNode } from 'react'

interface PageTransitionProps {
    children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
    const location = useLocation()

    return (
        <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
            transition={{
                type: 'spring',
                stiffness: 260,
                damping: 20,
                mass: 0.5,
                duration: 0.3
            }}
            className="w-full h-full"
        >
            {children}
        </motion.div>
    )
}
