import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSession } from '../api/sessions.js';
import { getAuthToken } from '../api/client.js';
import { Sidebar, TopBar } from '../components';
import { SentimentChart } from '../components/charts';
import toast from 'react-hot-toast';
import './AISummary.css';

const AISummary = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [summaryData, setSummaryData] = useState(null);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const token = getAuthToken();
            const headers = { 'Authorization': `Bearer ${token}` };
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

            const [sessionRes, summaryRes] = await Promise.all([
                getSession(id),
                fetch(`${baseUrl}/ai/summary/${id}`, { headers })
            ]);

            setSession(sessionRes.session);

            if (summaryRes.ok) {
                const data = await summaryRes.json();
                setSummaryData(data);
            }
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateSummary = async () => {
        setGenerating(true);
        const toastId = toast.loading('Generating AI summary... This may take a minute.');

        try {
            const token = getAuthToken();
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

            // For MVP, we are not uploading audio here yet, just triggering generation based on session ID
            // Ideally we would have a file upload input
            const response = await fetch(`${baseUrl}/ai/generate-summary`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ sessionId: id })
            });

            if (!response.ok) throw new Error('Generation failed');

            const data = await response.json();
            setSummaryData(data);
            toast.success('Summary generated!', { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error('Failed to generate summary', { id: toastId });
        } finally {
            setGenerating(false);
        }
    };

    if (loading) return <div className="loading-screen">Loading...</div>;

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <div className="dashboard-main">
                <TopBar
                    title="AI Session Insights"
                    subtitle={session?.sessionName || ''}
                    actions={
                        summaryData ? (
                            <button className="btn-secondary">📥 Export PDF</button>
                        ) : (
                            <button
                                className="btn-primary"
                                onClick={handleGenerateSummary}
                                disabled={generating}
                            >
                                {generating ? '✨ Generating...' : '✨ Generate AI Summary'}
                            </button>
                        )
                    }
                />

                <div className="dashboard-content">
                    {!summaryData ? (
                        <div className="empty-state-ai">
                            <div className="ai-icon">🤖</div>
                            <h3>No AI Summary Yet</h3>
                            <p>Generate a summary to see key topics, sentiment analysis, and action items.</p>
                            <button
                                className="btn-primary mt-4"
                                onClick={handleGenerateSummary}
                                disabled={generating}
                            >
                                {generating ? 'Processing...' : 'Generate Now'}
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Main Content Column */}
                            <div className="lg:col-span-2 space-y-8">
                                {/* Summary Section */}
                                <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                        <span>📝</span> Executive Summary
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                        {summaryData.summary_text}
                                    </p>
                                </section>

                                {/* Key Topics */}
                                <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                        <span>🎯</span> Key Topics
                                    </h2>
                                    <div className="flex flex-wrap gap-2">
                                        {summaryData.key_topics?.map((topic, i) => (
                                            <span key={i} className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-sm font-medium">
                                                {topic}
                                            </span>
                                        ))}
                                    </div>
                                </section>

                                {/* Transcription */}
                                <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                        <span>💬</span> Transcription
                                    </h2>
                                    <div className="max-h-96 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                        {summaryData.transcription_text}
                                    </div>
                                </section>
                            </div>

                            {/* Sidebar Column */}
                            <div className="space-y-8">
                                {/* Sentiment Analysis */}
                                <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                        <span>😊</span> Sentiment Analysis
                                    </h2>
                                    <SentimentChart score={summaryData.sentiment_score || 0} />
                                </section>

                                {/* Questions Asked */}
                                <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                        <span>❓</span> Questions Detected
                                    </h2>
                                    <ul className="space-y-3">
                                        {summaryData.questions_asked?.map((q, i) => (
                                            <li key={i} className="flex gap-3 text-sm text-gray-600 dark:text-gray-300">
                                                <span className="text-indigo-500 font-bold">•</span>
                                                {q}
                                            </li>
                                        )) || <p className="text-gray-500 italic">No questions detected.</p>}
                                    </ul>
                                </section>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AISummary;
