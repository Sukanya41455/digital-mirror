import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";
import { parse } from "csv-parse/sync";
import { VertexAI } from "@google-cloud/vertexai";
import { matchArchetypes, ArchetypeData, SportFamilyStat } from "./src/lib/matcher.ts";
import { enforceConditionalLanguage } from "./src/lib/safety.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
const LOCATION = process.env.VERTEX_AI_LOCATION || "us-central1";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

const vertexModel = PROJECT_ID
  ? new VertexAI({ project: PROJECT_ID, location: LOCATION }).getGenerativeModel({
      model: GEMINI_MODEL,
    })
  : null;

// Helper to load CSV reliably
function loadCsv(filename: string) {
  const filePath = path.join(__dirname, "data", filename);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, "utf-8");
  return parse(content, { columns: true, skip_empty_lines: true });
}

function getVertexText(response: any) {
  return (
    response?.candidates?.[0]?.content?.parts
      ?.map((part: any) => part.text || "")
      .join("")
      .trim() || ""
  );
}

function requireVertexModel() {
  if (!vertexModel) {
    throw new Error("Missing GOOGLE_CLOUD_PROJECT, GCLOUD_PROJECT, or GCP_PROJECT for Vertex AI.");
  }

  return vertexModel;
}

function cleanAnalysis(analysis: any) {
  if (analysis.archetypes) {
    analysis.archetypes = analysis.archetypes.map((a: any) => ({
      ...a,
      description: enforceConditionalLanguage(a.description),
      justification: enforceConditionalLanguage(a.justification)
    }));
  }

  if (analysis.historicalJourney) {
    analysis.historicalJourney.narrative = enforceConditionalLanguage(analysis.historicalJourney.narrative);
  }

  if (analysis.regionalAlignment) {
    analysis.regionalAlignment = enforceConditionalLanguage(analysis.regionalAlignment);
  }

  if (analysis.regionalReflection) {
    analysis.regionalReflection.story = enforceConditionalLanguage(analysis.regionalReflection.story);
    analysis.regionalReflection.connection = enforceConditionalLanguage(analysis.regionalReflection.connection);
  }

  if (analysis.mirrorNarrative) {
    analysis.mirrorNarrative = enforceConditionalLanguage(analysis.mirrorNarrative);
  }

  if (analysis.paralympicExplorer) {
    analysis.paralympicExplorer.personalizedInsight = enforceConditionalLanguage(analysis.paralympicExplorer.personalizedInsight || "");
    analysis.paralympicExplorer.systems = analysis.paralympicExplorer.systems.map((s: any) => ({
      ...s,
      description: enforceConditionalLanguage(s.description)
    }));
  }

  return analysis;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Load Data Assets
  const archetypesData = (loadCsv("archetypes.csv") || []) as ArchetypeData[];
  const sportFamilyStats = (loadCsv("sportFamilyStats.csv") || []) as SportFamilyStat[];
  const paralympicData = loadCsv("paralympicClassifications.csv") || [];
  const regionalStories = loadCsv("regionalStories.csv") || [];
  const eraStats = loadCsv("eraStats.csv") || [];

  // API Route for Context Data
  app.get("/api/data", (req, res) => {
    res.json({
      archetypes: archetypesData,
      sportStats: sportFamilyStats,
      paralympic: paralympicData,
      regions: regionalStories,
      eraStats: eraStats
    });
  });

  // API Route for Athlete Analysis (now just for deterministic baseline)
  app.post("/api/analyze-baseline", async (req, res) => {
    try {
      const { biometrics } = req.body;
      const { height, weight, age, region, sportInterest, pathway, impairment } = biometrics;

      const deterministicBaseline = matchArchetypes({
        heightCm: height,
        weightKg: weight,
        age,
        region,
        sportInterest,
        pathway: pathway as any,
        impairmentContext: impairment,
        archetypes: archetypesData,
        sportStats: sportFamilyStats,
        paralympicData: paralympicData
      });

      res.json(deterministicBaseline);
    } catch (error) {
      console.error("Baseline Error:", error);
      res.status(500).json({ error: "Failed to calculate baseline" });
    }
  });

  app.post("/api/analyze", async (req, res) => {
    try {
      const model = requireVertexModel();
      const { biometrics, baseline } = req.body;
      const bmi = biometrics.weight / ((biometrics.height / 100) ** 2);

      const prompt = `You are the "Team USA Digital Mirror" analyst.
Analyze the following user profile:
- Biometrics: Height ${biometrics.height}cm, Weight ${biometrics.weight}kg, BMI ${bmi.toFixed(1)}, Age ${biometrics.age}
- Identity: Gender ${biometrics.gender}, Regional Origin ${biometrics.region}
- Interests: Goal is ${biometrics.primaryGoal}, Sport ${biometrics.sportInterest}
- Pathway: ${biometrics.pathway} (${biometrics.impairment})

Baseline: ${JSON.stringify(baseline?.matches || [])}

Tasks:
1. Suggest 2 archetypes.
   - title: 2 words max.
   - description: ONE short sentence.
   - justification: ONE short sentence.
2. Journey Analysis: Map against ERA DATA.
3. Narrative: MAX 2 SHORT sentences. BE EXTREMELY BRIEF.

Return JSON only:
{
  "archetypes": [
    { "title": "...", "description": "...", "justification": "...", "confidence": "...", "matchScore": number, "breakdown": { ... } }
  ],
  "mirrorNarrative": "...",
  "chartData": [...],
  "radarData": [...],
  "historicalJourney": { "eras": [...], "narrative": "..." }
}`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0,
        },
      });

      const text = getVertexText(result.response);
      res.json(cleanAnalysis(JSON.parse(text || "{}")));
    } catch (error) {
      console.error("Vertex Analysis Error:", error);
      res.status(500).json({ error: "Failed to analyze with Vertex AI" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const model = requireVertexModel();
      const { message, profile, results } = req.body;

      const systemInstruction = `You are the Team USA Digital Mirror Agent.

Rules:
- Be EXTREMELY BRIEF (max 2 sentences).
- No paragraphs.
- Use conditional language (could, may).
- Never diagnose.

Context:
- Profile: ${JSON.stringify(profile)}
- Top Match: ${results?.archetypes?.[0]?.title || "Unknown"}
- Era: ${results?.historicalJourney?.eras?.[0]?.era || "Historical"}`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: message }] }],
        systemInstruction,
        generationConfig: {
          temperature: 0,
        },
      });

      const text = getVertexText(result.response);
      res.json({ text: enforceConditionalLanguage(text || "Connection unstable. Historical mapping paused.") });
    } catch (error) {
      console.error("Vertex Chat Error:", error);
      res.status(500).json({ error: "Failed to chat with Vertex AI" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
