import { useState, useEffect, useCallback } from 'react'

export function useFormDraft<T>(formId: string) {
    const storageKey = `zkandar_draft_${formId}`
    const [hasDraft, setHasDraft] = useState(false)
    const [draftData, setDraftData] = useState<T | null>(null)
    const [isRestored, setIsRestored] = useState(false)

    useEffect(() => {
        const saved = localStorage.getItem(storageKey)
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                setDraftData(parsed)
                setHasDraft(true)
            } catch (e) {
                localStorage.removeItem(storageKey)
            }
        }
    }, [storageKey])

    const saveDraft = useCallback((data: T) => {
        localStorage.setItem(storageKey, JSON.stringify(data))
    }, [storageKey])

    const clearDraft = useCallback(() => {
        localStorage.removeItem(storageKey)
        setHasDraft(false)
        setDraftData(null)
        setIsRestored(false)
    }, [storageKey])

    const restoreDraft = useCallback((): T | null => {
        if (draftData) {
            setIsRestored(true)
            setHasDraft(false)
            return draftData
        }
        return null
    }, [draftData])

    const discardDraft = useCallback(() => {
        clearDraft()
    }, [clearDraft])

    return {
        hasDraft: hasDraft && !isRestored,
        draftData,
        saveDraft,
        clearDraft,
        restoreDraft,
        discardDraft
    }
}
