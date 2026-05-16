import { useState, useEffect } from 'react'

export function useCountdown(targetDate: Date) {
    const calc = () => {
        const diff = Math.max(0, targetDate.getTime() - Date.now())
        return {
            days: Math.floor(diff / 86400000),
            hours: Math.floor((diff % 86400000) / 3600000),
            minutes: Math.floor((diff % 3600000) / 60000),
            seconds: Math.floor((diff % 60000) / 1000),
            expired: diff <= 0,
        }
    }
    const [time, setTime] = useState(calc)
    useEffect(() => {
        const id = setInterval(() => setTime(calc), 1000)
        return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetDate])
    return time
}
