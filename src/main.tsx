import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <App />
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#111111',
                        color: '#fff',
                        border: '1px solid hsl(0, 0%, 15%)',
                    },
                    success: {
                        iconTheme: {
                            primary: '#D0FF71',
                            secondary: '#000',
                        },
                    },
                }}
            />
        </BrowserRouter>
    </StrictMode>,
)
