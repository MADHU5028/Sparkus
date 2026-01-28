import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const KeystrokeAnalysis = ({ logs }) => {
    if (!logs || logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                <span className="text-4xl mb-2">⌨️</span>
                <p className="text-gray-500">No keystroke data collected.</p>
            </div>
        );
    }

    // Prepare data for chart
    const data = logs.map((log, i) => ({
        time: i * 30 + 's', // Assuming 30s intervals
        wpm: log.wpm,
        flight: log.flight_time_avg,
        dwell: log.dwell_time_avg
    }));

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Keystroke Dynamics</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* WPM Chart */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-64">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Typing Speed (WPM)</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="time" hide />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="wpm" stroke="#10B981" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Rhythm Chart */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-64">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Typing Rhythm (ms)</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="time" hide />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="flight" name="Flight Time" stroke="#3B82F6" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="dwell" name="Dwell Time" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="text-sm text-gray-500 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                ℹ️ <strong>Analysis:</strong> Sudden spikes in WPM &gt; 100 or drastic changes in rhythm may indicate copy-pasting or a different user typing.
            </div>
        </div>
    );
};

export default KeystrokeAnalysis;
