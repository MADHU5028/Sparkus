import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const ParticipationBarChart = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="chart-empty">No participation data available</div>;
    }

    return (
        <div className="chart-container" style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <BarChart data={data} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <Tooltip
                        cursor={{ fill: '#F3F4F6' }}
                        contentStyle={{
                            backgroundColor: '#fff',
                            borderRadius: '8px',
                            border: 'none',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                    />
                    <Legend iconType="circle" />
                    <Bar dataKey="present" name="Present" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="absent" name="Absent" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ParticipationBarChart;
