// test.js
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function listModels() {
  try {
    console.log("\n✅ Available models for your API key:");
    const pager = await ai.models.list();

    // ✅ Each `page` is actually a single model in Pager
    for await (const model of pager) {
      console.log(`- ${model.name} (${model.displayName || "Unnamed"})`);
    }

  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

listModels();
