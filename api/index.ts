import express from "express";
import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(express.json({ limit: '50mb' }));

async function generateWithAI(prompt: string): Promise<string> {
  const groqApiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  
  if (!groqApiKey && !geminiApiKey) {
    throw new Error("Neither GROQ_API_KEY nor GEMINI_API_KEY is configured.");
  }

  let lastError = null;

  // Try Groq First (Primary Provider)
  if (groqApiKey) {
    try {
      const groq = new Groq({ apiKey: groqApiKey, timeout: 15000 }); // 15 second timeout for robust fallback
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });
      const text = response.choices[0]?.message?.content;
      if (text) return text;
    } catch (error: any) {
      console.error("Groq generation failed or timed out, falling back to Gemini:", error.message || error);
      lastError = error;
      if (!geminiApiKey) {
        throw new Error(`Groq failed and GEMINI_API_KEY is not configured for fallback. Groq Error: ${error.message}`);
      }
    }
  }

  // Try Gemini as Fallback
  if (geminiApiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      if (response.text) return response.text;
    } catch (error: any) {
      console.error("Gemini fallback generation failed:", error.message || error);
      throw new Error(`AI generation failed. Gemini Error: ${error.message}${lastError ? ` | Groq Error: ${lastError.message}` : ''}`);
    }
  }

  throw new Error("Failed to generate content from any AI provider");
}

app.post("/api/generate-article", async (req, res) => {
  try {
    const { topic, mode } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic/Instructions are required" });
    }

    let prompt = "";
    
    if (mode === 'strict') {
      prompt = `You are a strict content generator. You must NOT hallucinate, research, or rewrite the provided information into a generic news article. Instead, take the exact information provided and format it into a professional article structure exactly as instructed. Do not add outside information.
      
      Information / Instructions:
      "${topic}"
      
      Please return ONLY a JSON object with the following fields:
      {
        "title": "A catchy, SEO-friendly headline",
        "excerpt": "A 2-3 sentence summary of the article",
        "content": "The full article content formatted as HTML (using <h2>, <p>, <strong>, etc.) based ONLY on the provided information and instructions without adding outside fluff."
      }
      
      CRITICAL: You must extract and return EVERY single match mentioned in the text. Do not stop at just one match. Do not provide a partial list. Return ONLY valid JSON. Do not include markdown formatting like \`\`\`json around the response.`;
    } else {
      prompt = `You are an expert news writer and cue sports journalist. Please research (simulate if needed) and write a comprehensive, engaging article about the following topic or headline: "${topic}". Focus on professional pool, snooker, or billiards if the topic implies it.
      
      Please return ONLY a JSON object with the following fields:
      {
        "title": "A catchy, SEO-friendly headline",
        "excerpt": "A 2-3 sentence summary of the article",
        "content": "The full article content formatted as HTML (using <h2>, <p>, <strong>, etc.). Write at least 4-5 paragraphs. Make it look good for a rich text editor."
      }
      
      CRITICAL: You must extract and return EVERY single match mentioned in the text. Do not stop at just one match. Do not provide a partial list. Return ONLY valid JSON. Do not include markdown formatting like \`\`\`json around the response.`;
    }

    let text = await generateWithAI(prompt);
    if (text.startsWith('```json')) text = text.replace(/^```json\n/, '').replace(/\n```$/, '');
    else if (text.startsWith('```')) text = text.replace(/^```\n/, '').replace(/\n```$/, '');

    const result = JSON.parse(text);
    res.json(result);
  } catch (error: any) {
    console.error("Error generating article:", error);
    res.status(500).json({ error: error.message || "Failed to generate article" });
  }
});

app.post("/api/edit-article", async (req, res) => {
  try {
    const { title, excerpt, content, instruction } = req.body;
    if (!instruction) {
      return res.status(400).json({ error: "Instruction is required" });
    }

    const prompt = `You are an expert news writer and editor. Please edit the following article based on this instruction: "${instruction}".
    
    Current Title: ${title || "(Empty)"}
    Current Excerpt: ${excerpt || "(Empty)"}
    Current Content: ${content || "(Empty)"}
    
    Please apply the requested changes and return ONLY a JSON object with the following fields:
    {
      "title": "The updated title (or keep the original if no change needed)",
      "excerpt": "The updated excerpt (or keep the original if no change needed)",
      "content": "The updated full article content formatted as HTML (using <h2>, <p>, <strong>, etc.)"
    }
    
    CRITICAL: You must extract and return EVERY single match mentioned in the text. Do not stop at just one match. Do not provide a partial list. Return ONLY valid JSON. Do not include markdown formatting like \`\`\`json around the response.`;

    let text = await generateWithAI(prompt);
    if (text.startsWith('```json')) text = text.replace(/^```json\n/, '').replace(/\n```$/, '');
    else if (text.startsWith('```')) text = text.replace(/^```\n/, '').replace(/\n```$/, '');

    const result = JSON.parse(text);
    res.json(result);
  } catch (error: any) {
    console.error("Error editing article:", error);
    res.status(500).json({ error: error.message || "Failed to edit article" });
  }
});

app.post("/api/parse-scores", async (req, res) => {
  try {
    const { rawText, currentTournament } = req.body;
    if (!rawText) {
      return res.status(400).json({ error: "Raw text is required" });
    }

    const prompt = `You are an expert sports data parser. Given the following raw, unstructured text about a billiards/snooker/pool tournament, extract ALL matches (do not leave any out) and format them into a clean JSON array.
    
    Current Tournament Data (if known): ${currentTournament || "Not provided, please infer if possible, or return empty string"}
    
    Raw Text:
    """
    ${rawText}
    """
    
    Please return ONLY a JSON object with this exact structure:
    {
      "tournaments": [
        {
          "id": "generate-a-unique-random-string-id",
          "name": "Name of the tournament",
          "status": "must be exactly one of: 'active' or 'ended'",
          "matches": [
            {
              "id": "generate-a-unique-random-string-id",
              "player1": "Name of Player 1",
              "player1Flag": "ISO 3166-1 alpha-2 country code (e.g. 'ZW', 'ZA', 'GB', 'US') if mentioned or deducible, else empty string",
              "player2": "Name of Player 2",
              "player2Flag": "ISO 3166-1 alpha-2 country code or empty string",
              "score1": "Player 1's score (e.g. '4', '0', or empty string if upcoming)",
              "score2": "Player 2's score (e.g. '2', '0', or empty string if upcoming)",
              "status": "must be exactly one of: 'live', 'completed', or 'upcoming'",
              "category": "Discipline/Category (e.g. 'Harare Pool', 'Zimbabwean Heyball') or empty string",
              "matchInfo": "Any extra context (e.g. 'Final', 'Table 1', '8:00 PM', 'Frame 7')"
            }
          ]
        }
      ]
    }
    
    CRITICAL: You must extract and return EVERY single match mentioned in the text. Do not stop at just one match. Do not provide a partial list. Return ONLY valid JSON. Do not include markdown formatting like \`\`\`json around the response.`;

    let text = await generateWithAI(prompt);
    if (text.startsWith('```json')) text = text.replace(/^```json\n/, '').replace(/\n```$/, '');
    else if (text.startsWith('```')) text = text.replace(/^```\n/, '').replace(/\n```$/, '');

    const result = JSON.parse(text);
    res.json(result);
  } catch (error: any) {
    console.error("Error parsing scores:", error);
    res.status(500).json({ error: error.message || "Failed to parse scores" });
  }
});

app.post("/api/auto-fetch-news", async (req, res) => {
  try {
    const prompt = `You are an automated cue sports news generator. 
    Since you cannot browse the internet, please simulate and write the top 3 most important recent fictional or realistic news items regarding cue sports (snooker, pool, billiards) worldwide.
    Make them sound like real, current events.
    
    For each news item, generate:
    1. A catchy, SEO-friendly headline (title).
    2. A 2-3 sentence summary (excerpt).
    3. The full article content formatted as HTML (using <h2>, <p>, <strong>, etc.). Write at least 3-4 paragraphs.
    
    Return ONLY a JSON object with an "articles" array of objects with the following fields:
    {
      "articles": [
        {
          "title": "Headline",
          "excerpt": "Summary",
          "content": "HTML content",
          "categories": ["Tournament Updates"]
        }
      ]
    }
    
    CRITICAL: You must extract and return EVERY single match mentioned in the text. Do not stop at just one match. Do not provide a partial list. Return ONLY valid JSON. Do not include markdown formatting like \`\`\`json around the response.`;

    let text = await generateWithAI(prompt);
    if (text.startsWith('```json')) text = text.replace(/^```json\n/, '').replace(/\n```$/, '');
    else if (text.startsWith('```')) text = text.replace(/^```\n/, '').replace(/\n```$/, '');

    const result = JSON.parse(text);
    
    if (Array.isArray(result)) {
      res.json({ articles: result });
    } else if (result.articles) {
      res.json(result);
    } else {
      res.json({ articles: [result] });
    }
  } catch (error: any) {
    console.error("Error auto-fetching news:", error);
    res.status(500).json({ error: error.message || "Failed to auto-fetch news" });
  }
});

app.post("/api/parse-rankings", async (req, res) => {
  try {
    const { rawText, disciplineName, currentRankings } = req.body;
    if (!rawText) {
      return res.status(400).json({ error: "Raw text is required" });
    }

    const prompt = `You are an expert cue sports data parser. Given the following raw, unstructured text listing player rankings for the discipline "${disciplineName || 'Unknown'}", extract ALL ranked players (do not leave any out) and format them into a clean JSON array, ordered by rank.

    Current Rankings (if known, for reference/merging context): ${currentRankings || "Not provided"}

    Raw Text:
    """
    ${rawText}
    """

    Please return ONLY a JSON object with this exact structure:
    {
      "rankings": [
        {
          "rank": 1,
          "name": "Full player name",
          "flag": "ISO 3166-1 alpha-2 country code (e.g. 'PH', 'SG', 'US') if mentioned or deducible, else empty string",
          "points": "Points/rating value as a string (e.g. '620') or empty string if not mentioned",
          "club": "Team or club name if mentioned, else empty string"
        }
      ]
    }

    CRITICAL: You must extract and return EVERY single player mentioned in the text, in correct rank order. Do not stop early. Do not provide a partial list. Return ONLY valid JSON. Do not include markdown formatting like \`\`\`json around the response.`;

    let text = await generateWithAI(prompt);
    if (text.startsWith('```json')) text = text.replace(/^```json\n/, '').replace(/\n```$/, '');
    else if (text.startsWith('```')) text = text.replace(/^```\n/, '').replace(/\n```$/, '');

    const result = JSON.parse(text);
    res.json(result);
  } catch (error: any) {
    console.error("Error parsing rankings:", error);
    res.status(500).json({ error: error.message || "Failed to parse rankings" });
  }
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("API Error:", err);
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Payload too large. Please send a smaller text.' });
  }
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

export default app;
