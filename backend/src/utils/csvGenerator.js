import Papa from 'papaparse';

export const generateAttendanceCSV = (session, participants) => {
    // Format data for CSV
    const data = participants.map(p => ({
        'Roll Number': p.roll_number,
        'Full Name': p.full_name,
        'Email': p.email,
        'Focus Score': `${p.final_focus_score}%`,
        'Status': p.attendance_status || (parseFloat(p.final_focus_score) > 40 ? 'Present' : 'Absent'),
        'Joined At': new Date(p.joined_at).toLocaleString(),
        'Last Heartbeat': p.last_heartbeat ? new Date(p.last_heartbeat).toLocaleString() : 'N/A'
    }));

    // Generate CSV string
    const csv = Papa.unparse(data);

    return csv;
};
