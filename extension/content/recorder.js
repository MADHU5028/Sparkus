/**
 * Sparkus Screen Recorder
 * Captures screen using displayMedia and uploads chunks to backend.
 */

let mediaRecorder;
let recordedChunks = [];
let chunkInterval;
let isRecording = false;

// Listen for start recording command
window.addEventListener('SparkusStartRecording', async (e) => {
    if (isRecording) return;

    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: { mediaSource: "screen" },
            audio: false
        });

        mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
        isRecording = true;

        mediaRecorder.ondataavailable = handleDataAvailable;
        mediaRecorder.start(10000); // 10s chunks

        console.log('Sparkus: Screen recording started');

        // Handle user stopping via browser UI
        stream.getVideoTracks()[0].onended = () => {
            stopRecording();
        };

    } catch (err) {
        console.error("Error: " + err);
    }
});

function handleDataAvailable(event) {
    if (event.data.size > 0) {
        uploadChunk(event.data);
    }
}

function stopRecording() {
    isRecording = false;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    console.log('Sparkus: Screen recording stopped');
}

async function uploadChunk(blob) {
    const formData = new FormData();
    formData.append('video', blob, 'chunk.webm');

    // Get session/participant IDs from storage or page context
    // For now using mock or placeholders, expected to be injected
    const sessionId = localStorage.getItem('sparkus_session_id') || 1;
    const participantId = localStorage.getItem('sparkus_participant_id') || 1;
    const chunkIndex = Date.now(); // Simple timestamp indexing

    formData.append('sessionId', sessionId);
    formData.append('participantId', participantId);
    formData.append('chunkIndex', chunkIndex);

    try {
        await fetch('http://localhost:5000/api/monitoring/upload-chunk', {
            method: 'POST',
            body: formData
        });
    } catch (err) {
        console.error('Upload failed', err);
    }
}
