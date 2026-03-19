import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useSupabase } from '@/hooks/useSupabase';
import { ModalForm } from '@/components/admin/shared/ModalForm';
import type { Cohort, Session, SessionMaterial, SessionStatus } from '@/types/database';

interface SessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    cohortId?: string;
    programs?: Cohort[];
    session?: Session | null;
    defaultSessionNumber?: number;
}

type SessionFormData = {
    title: string;
    session_number: string;
    scheduled_date: string;
    status: SessionStatus;
    recording_url: string;
    description: string;
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
    programs,
    session,
    defaultSessionNumber = 1,
}: SessionModalProps) {
    const supabase = useSupabase();
    const [internalCohortId, setInternalCohortId] = useState(cohortId ?? '');
    const [formData, setFormData] = useState<SessionFormData>({
        title: '',
        session_number: String(defaultSessionNumber),
        scheduled_date: '',
        status: 'scheduled',
        recording_url: '',
        description: '',
    });
    const [materials, setMaterials] = useState<MaterialDraft[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Sync the internal cohort ID when prop changes or modal opens
        setInternalCohortId(cohortId ?? '');

        if (session) {
            setFormData({
                title: session.title,
                session_number: String(session.session_number ?? ''),
                scheduled_date: toDateTimeLocal(session.scheduled_date),
                status: session.status,
                recording_url: session.recording_url ?? '',
                description: (session as Session & { description?: string }).description ?? '',
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
                description: '',
            });
            setMaterials([]);
        }
        setError(null);
    }, [session, defaultSessionNumber, isOpen, cohortId]);

    const addMaterial = () => setMaterials((prev) => [...prev, emptyMaterial()]);

    const updateMaterial = (index: number, patch: Partial<MaterialDraft>) => {
        setMaterials((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));
    };

    const removeMaterial = (index: number) => {
        setMaterials((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate program selection (only required when programs prop is present and no cohortId pre-filled)
        if (programs && !cohortId && !internalCohortId) {
            setError('Please select a program.');
            return;
        }

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

        const scheduledDateISO = new Date(formData.scheduled_date).toISOString();
        const payload = {
            cohort_id: internalCohortId,
            session_number: sessionNumber,
            title: formData.title.trim(),
            scheduled_date: scheduledDateISO,
            session_date: scheduledDateISO,   // mirror field added outside migrations
            status: formData.status,
            recording_url: formData.recording_url.trim() || null,
            description: formData.description.trim() || null,
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

    // Show program picker only when programs list is provided and no cohortId pre-filled
    const showProgramPicker = Boolean(programs && !cohortId);

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

            {showProgramPicker && (
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Program <span className="text-red-400">*</span></label>
                    <select
                        value={internalCohortId}
                        onChange={(e) => setInternalCohortId(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-white focus:outline-none focus:border-lime/50"
                    >
                        <option value="">Select a program…</option>
                        {programs?.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Session Title <span className="text-red-400">*</span></label>
                <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-white focus:outline-none focus:border-lime/50"
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
                        className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-white focus:outline-none focus:border-lime/50"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                    <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as SessionStatus })}
                        className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-white focus:outline-none focus:border-lime/50"
                    >
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Scheduled Date &amp; Time <span className="text-red-400">*</span></label>
                <input
                    type="datetime-local"
                    required
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-white focus:outline-none focus:border-lime/50"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Zoom / Meeting Link</label>
                <input
                    type="url"
                    value={formData.recording_url}
                    onChange={(e) => setFormData({ ...formData, recording_url: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-white focus:outline-none focus:border-lime/50"
                    placeholder="https://zoom.us/j/..."
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description / Agenda</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-white focus:outline-none focus:border-lime/50 resize-none"
                    placeholder="Session agenda or notes…"
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
                                    className="px-2 py-2 bg-bg-elevated border border-border rounded-lg text-xs text-gray-300 focus:outline-none focus:border-lime/50 shrink-0"
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
                                    className="flex-1 min-w-0 px-2 py-2 bg-bg-elevated border border-border rounded-lg text-xs text-white focus:outline-none focus:border-lime/50"
                                />
                                <input
                                    type="url"
                                    value={mat.url}
                                    onChange={(e) => updateMaterial(i, { url: e.target.value })}
                                    placeholder="https://..."
                                    className="flex-1 min-w-0 px-2 py-2 bg-bg-elevated border border-border rounded-lg text-xs text-white focus:outline-none focus:border-lime/50"
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
