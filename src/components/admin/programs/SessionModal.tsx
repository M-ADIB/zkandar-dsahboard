import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useSupabase } from '@/hooks/useSupabase';
import { ModalForm } from '@/components/admin/shared/ModalForm';
import type { Session, SessionMaterial, SessionStatus } from '@/types/database';

interface SessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    cohortId: string;
    session?: Session | null;
    defaultSessionNumber?: number;
}

type SessionFormData = {
    title: string;
    session_number: string;
    scheduled_date: string;
    status: SessionStatus;
    recording_url: string;
};

type MaterialDraft = {
    name: string;
    url: string;
    type: SessionMaterial['type'];
};

const emptyMaterial = (): MaterialDraft => ({ name: '', url: '', type: 'link' });

const toDateTimeLocal = (isoDate: string | null) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return '';
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export function SessionModal({
    isOpen,
    onClose,
    onSuccess,
    cohortId,
    session,
    defaultSessionNumber = 1,
}: SessionModalProps) {
    const supabase = useSupabase();
    const [formData, setFormData] = useState<SessionFormData>({
        title: '',
        session_number: String(defaultSessionNumber),
        scheduled_date: '',
        status: 'scheduled',
        recording_url: '',
    });
    const [materials, setMaterials] = useState<MaterialDraft[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (session) {
            setFormData({
                title: session.title,
                session_number: String(session.session_number ?? ''),
                scheduled_date: toDateTimeLocal(session.scheduled_date),
                status: session.status,
                recording_url: session.recording_url ?? '',
            });
            const existing = Array.isArray(session.materials) ? session.materials : [];
            setMaterials(existing.map((m) => ({ name: m.name, url: m.url, type: m.type })));
        } else {
            setFormData({
                title: '',
                session_number: String(defaultSessionNumber),
                scheduled_date: '',
                status: 'scheduled',
                recording_url: '',
            });
            setMaterials([]);
        }
        setError(null);
    }, [session, defaultSessionNumber, isOpen]);

    const addMaterial = () => setMaterials((prev) => [...prev, emptyMaterial()]);

    const updateMaterial = (index: number, patch: Partial<MaterialDraft>) => {
        setMaterials((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));
    };

    const removeMaterial = (index: number) => {
        setMaterials((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            setError('Session title is required.');
            return;
        }

        if (!formData.scheduled_date) {
            setError('Scheduled date is required.');
            return;
        }

        const sessionNumber = parseInt(formData.session_number, 10);
        if (Number.isNaN(sessionNumber)) {
            setError('Session number must be a valid number.');
            return;
        }

        // Validate materials
        const validatedMaterials = materials.filter((m) => m.name.trim() && m.url.trim());

        setIsLoading(true);
        setError(null);

        const payload = {
            cohort_id: cohortId,
            session_number: sessionNumber,
            title: formData.title.trim(),
            scheduled_date: new Date(formData.scheduled_date).toISOString(),
            status: formData.status,
            recording_url: formData.recording_url.trim() || null,
            materials: validatedMaterials,
        };

        const { error: saveError } = session
            ? await supabase.from('sessions')
                // @ts-expect-error - Supabase update type inference issue
                .update(payload)
                .eq('id', session.id)
            : await supabase.from('sessions')
                // @ts-expect-error - Supabase insert type inference issue
                .insert(payload);

        setIsLoading(false);

        if (saveError) {
            setError(saveError.message);
            return;
        }

        onSuccess();
    };

    return (
        <ModalForm
            isOpen={isOpen}
            onClose={onClose}
            title={session ? 'Edit Session' : 'Add Session'}
            onSubmit={handleSubmit}
            isLoading={isLoading}
        >
            {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {error}
                </div>
            )}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Session Title</label>
                <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                    placeholder="e.g. Intro to AI Workflows"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Session Number</label>
                    <input
                        type="number"
                        min="1"
                        required
                        value={formData.session_number}
                        onChange={(e) => setFormData({ ...formData, session_number: e.target.value })}
                        className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                    <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as SessionStatus })}
                        className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                    >
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Scheduled Date &amp; Time</label>
                <input
                    type="datetime-local"
                    required
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Recording URL</label>
                <input
                    type="url"
                    value={formData.recording_url}
                    onChange={(e) => setFormData({ ...formData, recording_url: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                    placeholder="https://..."
                />
            </div>

            {/* Materials */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-300">Materials</label>
                    <button
                        type="button"
                        onClick={addMaterial}
                        className="flex items-center gap-1 text-xs text-lime hover:text-lime/80 transition-colors"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add material
                    </button>
                </div>

                {materials.length === 0 ? (
                    <p className="text-xs text-gray-600 italic">No materials added yet.</p>
                ) : (
                    <div className="space-y-3">
                        {materials.map((mat, i) => (
                            <div key={i} className="flex gap-2 items-start">
                                <select
                                    value={mat.type}
                                    onChange={(e) => updateMaterial(i, { type: e.target.value as SessionMaterial['type'] })}
                                    className="px-2 py-2 bg-bg-elevated border border-border rounded-lg text-xs text-gray-300 focus:outline-none focus:border-dashboard-accent shrink-0"
                                >
                                    <option value="link">Link</option>
                                    <option value="pdf">PDF</option>
                                    <option value="video">Video</option>
                                    <option value="image">Image</option>
                                </select>
                                <input
                                    type="text"
                                    value={mat.name}
                                    onChange={(e) => updateMaterial(i, { name: e.target.value })}
                                    placeholder="Label"
                                    className="flex-1 min-w-0 px-2 py-2 bg-bg-elevated border border-border rounded-lg text-xs text-white focus:outline-none focus:border-dashboard-accent"
                                />
                                <input
                                    type="url"
                                    value={mat.url}
                                    onChange={(e) => updateMaterial(i, { url: e.target.value })}
                                    placeholder="https://..."
                                    className="flex-1 min-w-0 px-2 py-2 bg-bg-elevated border border-border rounded-lg text-xs text-white focus:outline-none focus:border-dashboard-accent"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeMaterial(i)}
                                    className="p-2 text-gray-600 hover:text-red-400 transition-colors shrink-0"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </ModalForm>
    );
}
