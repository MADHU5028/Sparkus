import { useState, useEffect } from 'react';
import { Sidebar, TopBar, StatCard } from '../components';
import { FocusTrendChart, ViolationPieChart, ParticipationBarChart } from '../components/charts';
import { getAuthToken } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import './AnalyticsOverview.css';

const AnalyticsOverview = () => {
    const { user } = useAuth();
    const [dateRange, setDateRange] = useState('7');
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        totalSessions: 0,
        averageFocus: 0,
        totalStudents: 0
    });
    const [focusTrends, setFocusTrends] = useState([]);
    const [participationStats, setParticipationStats] = useState([]);
    const [violationStats, setViolationStats] = useState([]);

    useEffect(() => {
        if (user) {
            fetchAnalyticsData();
        }
    }, [user, dateRange]);

    const fetchAnalyticsData = async () => {
        setLoading(true);
        try {
            const token = getAuthToken();
            const headers = { 'Authorization': `Bearer ${token}` };
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

            const [metricsRes, focusRes, participationRes, violationsRes] = await Promise.all([
                fetch(`${baseUrl}/analytics/overview`, { headers }),
                fetch(`${baseUrl}/analytics/focus-trends?days=${dateRange}`, { headers }),
                fetch(`${baseUrl}/analytics/participation`, { headers }),
                fetch(`${baseUrl}/analytics/violations`, { headers })
            ]);

            setMetrics(await metricsRes.json());
            setFocusTrends(await focusRes.json());
            setParticipationStats(await participationRes.json());
            setViolationStats(await violationsRes.json());

        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <div className="dashboard-main">
                <TopBar
                    title="Analytics Dashboard"
                    subtitle="Insights into student performance and engagement trends"
                    actions={
                        <select
                            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                        >
                            <option value="7">Last 7 Days</option>
                            <option value="30">Last 30 Days</option>
                            <option value="90">Last 3 Months</option>
                        </select>
                    }
                />

                <div className="dashboard-content">
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <StatCard
                            title="Total Sessions"
                            value={metrics.totalSessions}
                            icon="📅"
                            trend="+2 this week"
                            trendUp={true}
                        />
                        <StatCard
                            title="Average Focus Score"
                            value={`${metrics.averageFocus}%`}
                            icon="🎯"
                            trend={metrics.averageFocus > 80 ? 'Excellent' : 'Needs Attention'}
                            trendUp={metrics.averageFocus > 80}
                        />
                        <StatCard
                            title="Active Students"
                            value={metrics.totalStudents}
                            icon="👥"
                            trend="Across all sessions"
                        />
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Focus Trends - Full Width on Mobile, Half on Desktop */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 col-span-1 lg:col-span-2">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Focus Score Trends</h3>
                            <FocusTrendChart data={focusTrends} />
                        </div>

                        {/* Violation Distribution */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Violation Distribution</h3>
                            <ViolationPieChart data={violationStats} />
                        </div>

                        {/* Participation Stats */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recent Session Participation</h3>
                            <ParticipationBarChart data={participationStats} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsOverview;
