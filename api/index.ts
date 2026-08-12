import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(express.json());

app.post("/api/generate-article", async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `You are an expert news writer and cue sports journalist. Please research (simulate if needed) and write a comprehensive, engaging article about the following topic or headline: "${topic}". Focus on professional pool, snooker, or billiards if the topic implies it.
    
    Please return ONLY a JSON object with the following fields:
    {
      "title": "A catchy, SEO-friendly headline",
      "excerpt": "A 2-3 sentence summary of the article",
      "content": "The full article content formatted as HTML (using <h2>, <p>, <strong>, etc.). Write at least 4-5 paragraphs. Make it look good for a rich text editor."
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

export default app;
