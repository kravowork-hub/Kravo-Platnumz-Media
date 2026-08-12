import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(express.json({ limit: '50mb' }));

app.post("/api/generate-article", async (req, res) => {
  try {
    const { topic, mode } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic/Instructions are required" });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    let prompt = "";
    
    if (mode === 'strict') {
      prompt = `You are a strict content generator. You must NOT hallucinate, research, or rewrite the provided information into a generic news article. Instead, take the exact information provided and format it into a professional article structure exactly as instructed. Do not add outside information.
      
      Information / Instructions:
      "${topic}"
      
      Please return ONLY a JSON object with the following fields:
      {
        "title": "A precise headline based ONLY on the provided information",
        "excerpt": "A short summary of the exact provided information",
        "content": "The full content formatted as HTML (using <h2>, <p>, <strong>, etc.), strictly adhering to the provided information and instructions without adding outside fluff."
      }
      
      Return ONLY valid JSON. Do not include markdown formatting like \`\`\`json around the response.`;
    } else {
      prompt = `You are an expert news writer and cue sports journalist. Please research (simulate if needed) and write a comprehensive, engaging article about the following topic or headline: "${topic}". Focus on professional pool, snooker, or billiards if the topic implies it.
      
      Please return ONLY a JSON object with the following fields:
      {
        "title": "A catchy, SEO-friendly headline",
        "excerpt": "A 2-3 sentence summary of the article",
        "content": "The full article content formatted as HTML (using <h2>, <p>, <strong>, etc.). Write at least 4-5 paragraphs. Make it look good for a rich text editor."
      }
      
      Return ONLY valid JSON. Do not include markdown formatting like \`\`\`json around the response.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    if (!response.text) {
      throw new Error("Failed to generate content");
    }

    const result = JSON.parse(response.text);
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

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
    }

    const ai = new GoogleGenAI({ apiKey });
    
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
    
    Return ONLY valid JSON. Do not include markdown formatting like \`\`\`json around the response.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    if (!response.text) {
      throw new Error("Failed to edit content");
    }

    const result = JSON.parse(response.text);
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

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `You are an expert sports data parser. Given the following raw, unstructured text about a billiards/snooker/pool tournament, extract the matches and format them into a clean JSON array.
    
    Current Tournament Name (if known): ${currentTournament || "Not provided, please infer if possible, or return empty string"}
    
    Raw Text:
    """
    ${rawText}
    """
    
    Please return ONLY a JSON object with this exact structure:
    {
      "tournamentName": "Name of the tournament",
      "matches": [
        {
          "id": "generate-a-unique-random-string-id",
          "player1": "Name of Player 1",
          "player2": "Name of Player 2",
          "score1": "Player 1's score (e.g. '4', '0', or empty string if upcoming)",
          "score2": "Player 2's score (e.g. '2', '0', or empty string if upcoming)",
          "status": "must be exactly one of: 'live', 'completed', or 'upcoming'",
          "matchInfo": "Any extra context (e.g. 'Final', 'Table 1', '8:00 PM', 'Frame 7')"
        }
      ]
    }
    
    Return ONLY valid JSON. Do not include markdown formatting like \`\`\`json around the response.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    if (!response.text) {
      throw new Error("Failed to parse scores");
    }

    let text = response.text;
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const result = JSON.parse(text);
    res.json(result);
  } catch (error: any) {
    console.error("Error parsing scores:", error);
    res.status(500).json({ error: error.message || "Failed to parse scores" });
  }
});

app.post("/api/auto-fetch-news", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
    }
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `You are an automated cue sports news aggregator. 
    Please use Google Search to find the latest, most recent news regarding cue sports (snooker, pool, billiards) worldwide. 
    Select the top 3 most important news items.
    
    For each news item, generate:
    1. A catchy, SEO-friendly headline (title).
    2. A 2-3 sentence summary (excerpt).
    3. The full article content formatted as HTML (using <h2>, <p>, <strong>, etc.) based on the search results. Write at least 3-4 paragraphs.
    
    Return ONLY a JSON array of objects with the following fields:
    [
      {
        "title": "Headline",
        "excerpt": "Summary",
        "content": "HTML content",
        "categories": ["Tournament Updates"]
      }
    ]
    
    Return ONLY valid JSON. Do not include markdown formatting like \`\`\`json around the response.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    if (!response.text) {
      throw new Error("Failed to fetch news");
    }

    let text = response.text;
    if (text.startsWith('\`\`\`json')) {
      text = text.replace(/^\`\`\`json\n/, '').replace(/\n\`\`\`$/, '');
    } else if (text.startsWith('\`\`\`')) {
      text = text.replace(/^\`\`\`\n/, '').replace(/\n\`\`\`$/, '');
    }

    const result = JSON.parse(text);
    res.json({ articles: result });
  } catch (error: any) {
    console.error("Error auto-fetching news:", error);
    res.status(500).json({ error: error.message || "Failed to auto-fetch news" });
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
