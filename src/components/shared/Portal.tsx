import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

interface PortalProps {
    children: ReactNode
}

/**
 * Renders children into document.body via React portal.
 * Solves the issue where framer-motion transforms on PageTransition
 * create a new containing block that breaks fixed-position modals.
 */
export function Portal({ children }: PortalProps) {
    return createPortal(children, document.body)
}
