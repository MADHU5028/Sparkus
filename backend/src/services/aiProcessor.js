import openai from '../config/openai.js';
import { query } from '../config/database.js';
import fs from 'fs/promises';

// Process recording: transcribe and generate AI insights
export async function processRecording(recordingId, audioFilePath, sessionId) {
    try {
        console.log(`🎙️ Processing recording ${recordingId}...`);

        // Step 1: Transcribe audio using Whisper
        console.log('Transcribing audio...');
        const transcript = await transcribeAudio(audioFilePath);

        // Update recording with transcript
        await query(
            'UPDATE recordings SET transcript = $1 WHERE id = $2',
            [transcript, recordingId]
        );

        console.log('✅ Transcription complete');

        // Step 2: Generate AI insights using GPT-4
        console.log('Generating AI insights...');
        const insights = await generateInsights(transcript);

        // Step 3: Store AI summary
        await query(
            `INSERT INTO ai_summaries (
        recording_id, session_id, meeting_summary, key_topics,
        important_notes, action_items, slide_contexts
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                recordingId,
                sessionId,
                insights.meetingSummary,
                insights.keyTopics,
                insights.importantNotes,
                insights.actionItems,
                insights.slideContexts || [],
            ]
        );

        // Step 4: Mark recording as completed
        await query(
            'UPDATE recordings SET processing_status = $1, processed_at = CURRENT_TIMESTAMP WHERE id = $2',
            ['completed', recordingId]
        );

        console.log(`✅ Recording ${recordingId} processed successfully`);

        return {
            success: true,
            recordingId,
            insights,
        };
    } catch (error) {
        console.error('Recording processing error:', error);

        // Mark as failed
        await query(
            'UPDATE recordings SET processing_status = $1 WHERE id = $2',
            ['failed', recordingId]
        );

        throw error;
    }
}

// Transcribe audio using OpenAI Whisper
async function transcribeAudio(audioFilePath) {
    try {
        const audioFile = await fs.readFile(audioFilePath);

        const response = await openai.audio.transcriptions.create({
            file: audioFile,
            model: 'whisper-1',
            language: 'en', // Can be made configurable
            response_format: 'text',
        });

        return response;
    } catch (error) {
        console.error('Whisper transcription error:', error);
        throw new Error('Failed to transcribe audio');
    }
}

// Generate AI insights using GPT-4
async function generateInsights(transcript) {
    try {
        const prompt = `You are an AI assistant analyzing a class or meeting transcript. Generate a comprehensive summary with the following sections:

1. **Meeting Summary**: A brief 2-3 sentence overview of what was discussed
2. **Key Topics Covered**: List the main topics as bullet points (5-10 topics)
3. **Important Notes**: Detailed notes highlighting important concepts, explanations, or discussions
4. **Action Items**: Any tasks, assignments, or follow-ups mentioned (if any)

Transcript:
${transcript}

Please provide the output in the following JSON format:
{
  "meetingSummary": "...",
  "keyTopics": ["topic1", "topic2", ...],
  "importantNotes": "...",
  "actionItems": ["item1", "item2", ...]
}`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert educational content analyzer. Provide clear, structured summaries of class sessions.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
        });

        const insights = JSON.parse(response.choices[0].message.content);

        return {
            meetingSummary: insights.meetingSummary || '',
            keyTopics: insights.keyTopics || [],
            importantNotes: insights.importantNotes || '',
            actionItems: insights.actionItems || [],
            slideContexts: [], // Can be enhanced with image analysis later
        };
    } catch (error) {
        console.error('GPT-4 insights generation error:', error);
        throw new Error('Failed to generate insights');
    }
}
