const ScreenRecordingViewer = ({ recordings }) => {
    if (!recordings || recordings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                <span className="text-4xl mb-2">🎥</span>
                <p className="text-gray-500">No screen recordings available for this session.</p>
            </div>
        );
    }

    // In a real app, we'd stitch these or have a playlist. 
    // For MVP, just showing the first chunk or list them.
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Screen Activity Replay</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recordings.map((rec, index) => (
                    <div key={rec.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="aspect-video bg-black rounded-md overflow-hidden mb-2 relative">
                            <video
                                src={`http://localhost:5000${rec.file_url}`}
                                controls
                                className="w-full h-full object-contain"
                            />
                            <span className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                Chunk {index + 1}
                            </span>
                        </div>
                        <div className="text-xs text-gray-500">
                            Recorded: {new Date(rec.created_at).toLocaleTimeString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ScreenRecordingViewer;
