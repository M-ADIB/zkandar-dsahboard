import { useEffect, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { ModalForm } from '@/components/admin/shared/ModalForm';
import type { Session, SessionStatus } from '@/types/database';

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
    zoom_recording_url: string;
};

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
        zoom_recording_url: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (session) {
            setFormData({
                title: session.title,
                session_number: String(session.session_number ?? ''),
                scheduled_date: toDateTimeLocal(session.scheduled_date),
                status: session.status,
                zoom_recording_url: session.zoom_recording_url ?? '',
            });
        } else {
            setFormData({
                title: '',
                session_number: String(defaultSessionNumber),
                scheduled_date: '',
                status: 'scheduled',
                zoom_recording_url: '',
            });
        }
        setError(null);
    }, [session, defaultSessionNumber, isOpen]);

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

        setIsLoading(true);
        setError(null);

        const payload = {
            cohort_id: cohortId,
            session_number: sessionNumber,
            title: formData.title.trim(),
            scheduled_date: new Date(formData.scheduled_date).toISOString(),
            status: formData.status,
            zoom_recording_url: formData.zoom_recording_url.trim() || null,
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
                    className="w-full px-3 py-2 bg-[#0F1219] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
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
                        className="w-full px-3 py-2 bg-[#0F1219] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                    <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as SessionStatus })}
                        className="w-full px-3 py-2 bg-[#0F1219] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                    >
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Scheduled Date & Time</label>
                <input
                    type="datetime-local"
                    required
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0F1219] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Zoom Recording URL</label>
                <input
                    type="url"
                    value={formData.zoom_recording_url}
                    onChange={(e) => setFormData({ ...formData, zoom_recording_url: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0F1219] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-dashboard-accent"
                    placeholder="https://..."
                />
            </div>
        </ModalForm>
    );
}
