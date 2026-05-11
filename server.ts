import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";
import { parse } from "csv-parse/sync";
import { matchArchetypes, ArchetypeData, SportFamilyStat } from "./src/lib/matcher.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load CSV reliably
function loadCsv(filename: string) {
  const filePath = path.join(__dirname, "data", filename);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, "utf-8");
  return parse(content, { columns: true, skip_empty_lines: true });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

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
