import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { ModalForm } from '@/components/admin/shared/ModalForm'
import { ZoomIn, ZoomOut } from 'lucide-react'

interface AvatarCropModalProps {
    isOpen: boolean
    onClose: () => void
    imageSrc: string
    onCropComplete: (blob: Blob) => void | Promise<void>
}

// Utility: Create a cropped image blob from a source image and crop area
async function getCroppedImg(imageSrc: string, crop: Area): Promise<Blob> {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.src = imageSrc

    await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve()
        image.onerror = reject
    })

    const canvas = document.createElement('canvas')
    const size = 256 // Output square avatar size
    canvas.width = size
    canvas.height = size

    const ctx = canvas.getContext('2d')!
    ctx.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        size,
        size,
    )

    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Canvas toBlob failed'))
        }, 'image/webp', 0.85)
    })
}

export function AvatarCropModal({ isOpen, onClose, imageSrc, onCropComplete }: AvatarCropModalProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedArea, setCroppedArea] = useState<Area | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const onCropDone = useCallback((_: Area, croppedAreaPixels: Area) => {
        setCroppedArea(croppedAreaPixels)
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!croppedArea) return

        setIsSaving(true)
        try {
            const blob = await getCroppedImg(imageSrc, croppedArea)
            await onCropComplete(blob)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <ModalForm
            isOpen={isOpen}
            onClose={onClose}
            title="Crop Profile Picture"
            onSubmit={handleSubmit}
            isLoading={isSaving}
            submitLabel="Save"
        >
            <div className="relative w-full" style={{ aspectRatio: '1 / 1' }}>
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropDone}
                    style={{
                        containerStyle: {
                            borderRadius: '1rem',
                            overflow: 'hidden',
                            background: '#0a0a0a',
                        },
                    }}
                />
            </div>

            {/* Zoom slider */}
            <div className="flex items-center gap-3 mt-4">
                <ZoomOut className="h-4 w-4 text-gray-500 shrink-0" />
                <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1 accent-lime h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-lime [&::-webkit-slider-thumb]:shadow-lg"
                />
                <ZoomIn className="h-4 w-4 text-gray-500 shrink-0" />
            </div>
        </ModalForm>
    )
}
