import { AlertCircle } from 'lucide-react'

interface DraftBannerProps {
    onRestore: () => void
    onDiscard: () => void
}

export function DraftBanner({ onRestore, onDiscard }: DraftBannerProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 mb-4 mx-6 mt-4 text-sm bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-300">
            <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>You have unsaved changes for this form.</span>
            </div>
            <div className="flex gap-2">
                <button 
                    type="button" 
                    onClick={onDiscard} 
                    className="px-3 py-1.5 hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                    Discard
                </button>
                <button 
                    type="button" 
                    onClick={onRestore} 
                    className="px-3 py-1.5 bg-yellow-500/20 text-yellow-200 rounded-lg hover:bg-yellow-500/30 hover:text-yellow-100 transition-colors font-medium whitespace-nowrap"
                >
                    Restore Draft
                </button>
            </div>
        </div>
    )
}
