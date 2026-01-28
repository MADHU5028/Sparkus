import OpenAIService from '../services/OpenAIService.js';
import { query } from '../config/database.js';
import fs from 'fs';

// Generate summary from uploaded audio or existing text
export const generateSummary = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const audioFile = req.file; // From Multer
        let transcription = "";

        // Check if summary already exists
        const existing = await query('SELECT * FROM session_summaries WHERE session_id = $1', [sessionId]);
        if (existing.rows.length > 0) {
            return res.json(existing.rows[0]);
        }

        // 1. Transcribe
        if (audioFile) {
            console.log(`Transcribing file: ${audioFile.path}`);
            transcription = await OpenAIService.transcribeAudio(audioFile.path);

            // Cleanup uploaded file
            fs.unlink(audioFile.path, (err) => {
                if (err) console.error('Failed to delete temp file:', err);
            });
        } else {
            // Retrieve manual notes or placeholder if no audio
            // For MVP, we'll use a placeholder if no audio provided
            transcription = "No audio provided. This is a placeholder transcription for the session.";
        }

        // 2. Generate Insights
        console.log('Generating insights...');
        const insights = await OpenAIService.generateSessionInsights(transcription);

        // 3. Save to Database
        const result = await query(
            `INSERT INTO session_summaries 
             (session_id, summary_text, transcription_text, key_topics, sentiment_score, questions_asked)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                sessionId,
                insights.summary,
                transcription,
                JSON.stringify(insights.keyTopics),
                insights.sentimentScore,
                JSON.stringify(insights.questions)
            ]
        );

        res.json(result.rows[0]);

    } catch (error) {
        console.error('AI Generation Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get existing summary
export const getSummary = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const result = await query('SELECT * FROM session_summaries WHERE session_id = $1', [sessionId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Summary not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
