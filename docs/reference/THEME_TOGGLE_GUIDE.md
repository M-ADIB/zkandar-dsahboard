# 🌓 Theme Toggle Implementation Guide

**Dark/Light Mode Toggle for Zkandar AI Dashboard**

---

## Overview

This guide provides the implementation for adding a dark/light mode toggle to the Zkandar AI dashboard. **Dark mode is the default** (brand standard).

---

## Implementation

### 1. Theme Context (`src/context/ThemeContext.tsx`)

```tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme
    return stored || 'dark'
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
```

---

### 2. Toggle Button Component

```tsx
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  )
}
```

---

### 3. CSS Variables (Add to `index.css`)

```css
/* Light mode overrides */
.light {
  --bg-primary: #FAFAFA;
  --bg-elevated: #FFFFFF;
  --bg-card: #FFFFFF;
  --text-primary: #111111;
  --text-muted: #666666;
  --border: hsl(0, 0%, 85%);
}

.light body::before {
  opacity: 0.02;
}
```

---

### 4. Usage

```tsx
// In main.tsx
import { ThemeProvider } from '@/context/ThemeContext'

<ThemeProvider>
  <App />
</ThemeProvider>

// In Navbar.tsx or Settings
import { ThemeToggle } from '@/components/shared/ThemeToggle'

<ThemeToggle />
```

---

## Notes

- Dark mode is the brand default
- Light mode uses same lime/green accents
- Toggle persists via localStorage
- Add toggle to Navbar or Settings page
