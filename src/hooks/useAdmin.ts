import { useState } from 'react';

export function useAdmin() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    return {
        loading,
        error,
        setLoading,
        setError
    };
}
