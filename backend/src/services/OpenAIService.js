import OpenAI from 'openai';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

class OpenAIService {
    constructor() {
        if (process.env.OPENAI_API_KEY) {
            this.openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });
        } else {
            console.warn('⚠️ OPENAI_API_KEY missing. AI features will run in mock mode.');
            this.openai = null;
        }
    }

    // Transcribe audio file using Whisper
    async transcribeAudio(filePath) {
        if (!this.openai) {
            return "This is a mock transcription because the OpenAI API key is missing. The session was about web development and React hooks.";
        }

        try {
            const transcription = await this.openai.audio.transcriptions.create({
                file: fs.createReadStream(filePath),
                model: "whisper-1",
            });
            return transcription.text;
        } catch (error) {
            console.error('OpenAI Transcription Error:', error);
            throw new Error('Failed to transcribe audio');
        }
    }

    // Generate summary, key topics, and sentiment from text
    async generateSessionInsights(text) {
        if (!this.openai) {
            return {
                summary: "Mock Summary: The instructor discussed the importance of React hooks, specifically useState and useEffect. Students asked about dependency arrays and infinite loops.",
                keyTopics: ["React Hooks", "State Management", "Side Effects", "Performance"],
                sentimentScore: 0.8,
                questions: ["When should I use useLayoutEffect?", "How does useMemo work?"]
            };
        }

        try {
            const prompt = `
            Analyze the following session transcript and provide a JSON response with the following fields:
            1. summary: A concise paragraph summarizing the session.
            2. keyTopics: An array of 3-5 main topics discussed.
            3. sentimentScore: A float between -1.0 (negative) and 1.0 (positive) representing the overall engagement/mood.
            4. questions: An array of questions asked by participants (if any).

            Transcript:
            "${text.substring(0, 15000)}" -- Truncated to avoid token limits if necessary
            `;

            const completion = await this.openai.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "gpt-4o-mini", // Cost efficient model
                response_format: { type: "json_object" },
            });

            const content = JSON.parse(completion.choices[0].message.content);
            return {
                summary: content.summary,
                keyTopics: content.keyTopics,
                sentimentScore: content.sentimentScore,
                questions: content.questions
            };
        } catch (error) {
            console.error('OpenAI Summary Error:', error);
            throw new Error('Failed to generate insights');
        }
    }
}

export default new OpenAIService();
