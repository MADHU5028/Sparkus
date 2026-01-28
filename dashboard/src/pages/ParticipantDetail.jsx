import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuthToken } from '../api/client.js';
import { Sidebar, TopBar } from '../components';
import { ScreenRecordingViewer, KeystrokeAnalysis } from '../components';
import { FocusTrendChart } from '../components/charts'; // Reusing existing chart
import toast from 'react-hot-toast';

const ParticipantDetail = () => {
    const { id } = useParams(); // participantId
    const navigate = useNavigate();
    const [participant, setParticipant] = useState(null);
    const [recordings, setRecordings] = useState([]);
    const [keystrokes, setKeystrokes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch data
        const fetchData = async () => {
            try {
                const token = getAuthToken();
                const headers = { 'Authorization': `Bearer ${token}` };
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

                // Fetch basic info, recordings, and keystrokes
                // Note: Assuming we have a route for /api/participants/:id. 
                // Since I haven't built that specific single-participant route yet, 
                // I'll simulate the user wrapper or just fetch the monitoring data for now.

                const [recRes, keyRes] = await Promise.all([
                    fetch(`${baseUrl}/monitoring/recordings/${id}`, { headers }),
                    fetch(`${baseUrl}/monitoring/keystrokes/${id}`, { headers })
                ]);

                if (recRes.ok) setRecordings(await recRes.json());
                if (keyRes.ok) setKeystrokes(await keyRes.json());

                // Mock participant info for now since we don't have a detail endpoint ready
                setParticipant({
                    name: "John Doe",
                    email: "student@example.com",
                    device: "Chrome / Windows 10"
                });

            } catch (error) {
                console.error("Failed to load details", error);
                toast.error("Failed to load participant details");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) return <div className="loading-screen">Loading Details...</div>;

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <div className="dashboard-main">
                <TopBar
                    title="Student Deep Dive"
                    subtitle={`Monitoring details for ${participant?.name}`}
                    actions={
                        <button className="btn-secondary" onClick={() => navigate(-1)}>
                            Back
                        </button>
                    }
                />

                <div className="dashboard-content">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Screen Recordings */}
                        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 col-span-1 lg:col-span-2">
                            <h2 className="text-xl font-semibold mb-4">🎥 Screen Recording Replay</h2>
                            <ScreenRecordingViewer recordings={recordings} />
                        </section>

                        {/* Keystroke Dynamics */}
                        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 col-span-1 lg:col-span-2">
                            <h2 className="text-xl font-semibold mb-4">⌨️ Typing Pattern Analysis</h2>
                            <KeystrokeAnalysis logs={keystrokes} />
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParticipantDetail;
