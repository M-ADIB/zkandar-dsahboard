import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export function NotFoundPage() {
    const navigate = useNavigate()

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] p-6 text-center">
            <div className="space-y-6 max-w-md w-full">
                <div className="text-[120px] font-black text-lime leading-none select-none">
                    404
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-white">Page not found</h1>
                    <p className="text-sm text-gray-400">
                        The page you're looking for doesn't exist or you don't have access to it.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-sm text-gray-300 hover:bg-white/5 transition"
                    >
                        <ArrowLeft className="h-4 w-4" /> Go back
                    </button>
                    <button
                        onClick={() => navigate('/', { replace: true })}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-lime text-black font-medium text-sm hover:bg-[#B8F23E] transition"
                    >
                        <Home className="h-4 w-4" /> Dashboard
                    </button>
                </div>
            </div>
        </div>
    )
}
