import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { getAuthToken } from '../api/client.js';

const ExportButton = ({ sessionId, type = 'attendance', buttonClass = 'btn-secondary' }) => {
    const [loading, setLoading] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    const handleDownload = async (format) => {
        setLoading(true);
        setShowOptions(false);
        const toastId = toast.loading(`Generating ${format.toUpperCase()}...`);

        try {
            const token = getAuthToken();
            const response = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/exports/${type}/${sessionId}/${format}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}_report_${sessionId}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success(`${format.toUpperCase()} downloaded successfully`, { id: toastId });
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to download report', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const handleEmail = async (format) => {
        setLoading(true);
        setShowOptions(false);
        const toastId = toast.loading(`Sending email...`);

        try {
            const token = getAuthToken();
            const response = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/exports/email`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ sessionId, format })
                }
            );

            if (!response.ok) throw new Error('Email failed');

            toast.success(`Report emailed successfully`, { id: toastId });
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to email report', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="export-wrapper" style={{ position: 'relative', display: 'inline-block' }}>
            <button
                className={buttonClass}
                onClick={() => setShowOptions(!showOptions)}
                disabled={loading}
            >
                {loading ? 'Processing...' : '📥 Export Report'}
            </button>

            {showOptions && (
                <div className="export-dropdown" style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.5rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 20,
                    minWidth: '200px',
                    padding: '0.5rem 0'
                }}>
                    <div className="export-section">
                        <h4 style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Download</h4>
                        <button
                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.5rem 1rem', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
                            className="hover:bg-gray-100 dark:hover:bg-gray-800"
                            onClick={() => handleDownload('pdf')}
                        >
                            📄 PDF Document
                        </button>
                        <button
                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.5rem 1rem', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
                            className="hover:bg-gray-100 dark:hover:bg-gray-800"
                            onClick={() => handleDownload('csv')}
                        >
                            📊 CSV Spreadsheet
                        </button>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }}></div>
                    <div className="export-section">
                        <h4 style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Share</h4>
                        <button
                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.5rem 1rem', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
                            className="hover:bg-gray-100 dark:hover:bg-gray-800"
                            onClick={() => handleEmail('pdf')}
                        >
                            📧 Email PDF
                        </button>
                    </div>
                </div>
            )}

            {/* Click outside detection could be added here similar to TopBar */}
            {showOptions && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                    onClick={() => setShowOptions(false)}
                />
            )}
        </div>
    );
};

export default ExportButton;
