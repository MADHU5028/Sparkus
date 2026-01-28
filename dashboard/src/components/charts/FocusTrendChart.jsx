import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const FocusTrendChart = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="chart-empty">No trend data available</div>;
    }

    return (
        <div className="chart-container" style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        domain={[0, 100]}
                        hide={false}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            borderRadius: '8px',
                            border: 'none',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        itemStyle={{ color: '#111827', fontWeight: 'bold' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="avgFocus"
                        stroke="#4F46E5"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorFocus)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default FocusTrendChart;
