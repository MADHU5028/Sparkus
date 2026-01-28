import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const SentimentChart = ({ score }) => {
    // Score is -1 to 1. 
    // We will normalize 0 to be 50% for the gauge needle/chart.

    const normalizedScore = (score + 1) / 2 * 100; // 0 to 100

    const data = [
        { name: 'Negative', value: 33, color: '#EF4444' },
        { name: 'Neutral', value: 33, color: '#F59E0B' },
        { name: 'Positive', value: 34, color: '#10B981' },
    ];

    // Needle rotation calculation
    const rotation = -90 + (normalizedScore * 1.8); // -90 deg to +90 deg

    return (
        <div style={{ width: '100%', height: 200, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ResponsiveContainer>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="70%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            {/* Simple needle using CSS rotation */}
            <div style={{
                position: 'absolute',
                top: '70%',
                left: '50%',
                width: '4px',
                height: '60px',
                backgroundColor: '#374151',
                borderRadius: '2px',
                transformOrigin: 'bottom center',
                transform: `translateX(-50%) translateY(-100%) rotate(${rotation}deg)`,
                transition: 'transform 1s ease-out',
                zIndex: 10
            }}></div>
            <div style={{
                position: 'absolute',
                top: '68%',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#111827',
                zIndex: 11
            }}></div>
            <div style={{ marginTop: '-40px', fontWeight: 'bold', fontSize: '1.25rem' }}>
                {score > 0.3 ? 'Positive' : score < -0.3 ? 'Negative' : 'Neutral'}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                Score: {score.toFixed(2)}
            </div>
        </div>
    );
};

export default SentimentChart;
