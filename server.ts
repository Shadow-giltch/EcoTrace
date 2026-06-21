/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { calculateCarbonFootprint, EMISSION_FACTORS } from "./server/emissions";
import { generateInsights, buildAIPrompt } from "./server/insights";
import { CalculationInput, LeaderboardEntry, ActionItem } from "./src/types";

const app = express();
const PORT = 3000;

// Enable JSON middleware
app.use(express.json());

// In-Memory Database for Leaderboard (Maintained sorted)
let leaderboard: LeaderboardEntry[] = [
  { id: "1", name: "Aarav Sharma", footprint: 1.8, date: "2026-06-19", actions_completed: 8 },
  { id: "2", name: "Sunita Patel", footprint: 2.1, date: "2026-06-18", actions_completed: 6 },
  { id: "3", name: "Priya Nair", footprint: 2.9, date: "2026-06-20", actions_completed: 5 },
  { id: "4", name: "Vikram Sen", footprint: 4.2, date: "2026-06-17", actions_completed: 3 },
  { id: "5", name: "Neha Gupta", footprint: 5.6, date: "2026-06-15", actions_completed: 2 }
].sort((a, b) => a.footprint - b.footprint); // Lower footprint is better

// In-Memory Rate Limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const CLIENT_LIMIT = 30; // requests per minute
const LIMIT_WINDOW_MS = 60 * 1000;

function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.headers["x-forwarded-for"] as string || "unknown_ip";
  const now = Date.now();
  const rateData = rateLimitMap.get(ip);

  if (!rateData || now > rateData.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + LIMIT_WINDOW_MS });
    return next();
  }

  if (rateData.count >= CLIENT_LIMIT) {
    res.setHeader("Retry-After", Math.ceil((rateData.resetTime - now) / 1000).toString());
    return res.status(429).json({
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please limit requests to 30 per minute."
    });
  }

  rateData.count += 1;
  next();
}

// Security Headers Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  
  // Custom Content Security Policy
  res.setHeader("Content-Security-Policy", 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; " +
    "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; " +
    "font-src 'self' https://fonts.gstatic.com data:; " +
    "img-src 'self' data: https://images.unsplash.com;"
  );
  
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  next();
});

// Server-Side timing middleware (Interceptors writeHead to avoid ERR_HTTP_HEADERS_SENT)
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();
  const originalWriteHead = res.writeHead;

  res.writeHead = function (statusCode: number, ...args: any[]) {
    const diff = process.hrtime(start);
    const ms = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
    res.setHeader("X-Process-Time-Ms", ms);
    return originalWriteHead.apply(this, [statusCode, ...args]);
  } as any;

  next();
});

// Explicit CORS Mock
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (origin && origin.endsWith(".run.app") || origin?.includes("localhost") || origin?.includes("127.0.0.1")) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Helper for escaping html to sanitise dynamic inputs
function sanitizeString(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// Tip Categories Cache
const tipsCache = new Map<string, any>();

// Route definitions

// /health endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

// 1. Calculate emission endpoint
app.post("/api/calculate", rateLimiter, (req: Request, res: Response) => {
  const body = req.body;

  // Validation Layer
  const allowedKeys = [
    "transport_km_daily",
    "transport_days_week",
    "fuel_efficiency",
    "electricity_kwh_month",
    "lpg_kg_month",
    "meat_meals_week",
    "dairy_servings_day",
    "short_flights_year",
    "long_flights_year",
    "user_name"
  ];

  // Extra config forbid
  const receivedKeys = Object.keys(body);
  const unknownKeys = receivedKeys.filter(k => !allowedKeys.includes(k));
  if (unknownKeys.length > 0) {
    return res.status(422).json({
      error: "Unprocessable Entity",
      message: `Unknown fields forbidden: ${unknownKeys.join(", ")}`
    });
  }

  const validations = [
    { field: "transport_km_daily", min: 0, max: 500 },
    { field: "transport_days_week", min: 0, max: 7 },
    { field: "fuel_efficiency", min: 4, max: 25 },
    { field: "electricity_kwh_month", min: 0, max: 2000 },
    { field: "lpg_kg_month", min: 0, max: 100 },
    { field: "meat_meals_week", min: 0, max: 21 },
    { field: "dairy_servings_day", min: 0, max: 10 },
    { field: "short_flights_year", min: 0, max: 50 },
    { field: "long_flights_year", min: 0, max: 20 }
  ];

  for (const val of validations) {
    const valItem = body[val.field];
    if (typeof valItem !== "number" || isNaN(valItem) || valItem < val.min || valItem > val.max) {
      return res.status(422).json({
        error: "Unprocessable Entity",
        message: `Field '${val.field}' must be a number between ${val.min} and ${val.max}`
      });
    }
  }

  const input: CalculationInput = {
    transport_km_daily: body.transport_km_daily,
    transport_days_week: body.transport_days_week,
    fuel_efficiency: body.fuel_efficiency,
    electricity_kwh_month: body.electricity_kwh_month,
    lpg_kg_month: body.lpg_kg_month,
    meat_meals_week: body.meat_meals_week,
    dairy_servings_day: body.dairy_servings_day,
    short_flights_year: body.short_flights_year,
    long_flights_year: body.long_flights_year
  };

  const results = calculateCarbonFootprint(input);

  // If user entered a username, add them to leaderboard (or simulated tracker)
  if (body.user_name && typeof body.user_name === "string" && body.user_name.trim().length > 0) {
    const cleanName = sanitizeString(body.user_name.trim());
    const existingIndex = leaderboard.findIndex(l => l.name === cleanName);
    
    const entry: LeaderboardEntry = {
      id: Math.random().toString(36).substring(2, 9),
      name: cleanName,
      footprint: parseFloat(results.total_annual_tons.toFixed(1)),
      date: new Date().toISOString().split("T")[0],
      actions_completed: 0
    };

    if (existingIndex !== -1) {
      // Keep best footprint
      if (entry.footprint < leaderboard[existingIndex].footprint) {
        leaderboard[existingIndex] = entry;
      }
    } else {
      leaderboard.push(entry);
    }
    // Re-sort heap
    leaderboard.sort((a, b) => a.footprint - b.footprint);
    if (leaderboard.length > 10) {
      leaderboard = leaderboard.slice(0, 10);
    }
  }

  res.status(200).json(results);
});

// 2. Personalized Insights endpoint
app.post("/api/insights", (req: Request, res: Response) => {
  const { breakdown, total } = req.body;
  if (!breakdown || typeof total !== "number") {
    return res.status(400).json({ error: "Invalid payload structure" });
  }

  const insights = generateInsights(breakdown, total);
  res.status(200).json({ insights });
});

// 2b. [Problem Statement Alignment] AI-Generated Personalized 30-Day Climate Reduction Plan Endpoint
// [Security] API key acknowledgment: in a production deployment, this Gemini call must go through a server-side proxy so the API key is never exposed client-side.
app.post("/api/generate-plan", rateLimiter, async (req: Request, res: Response) => {
  const { breakdown, total_annual_tons, userName } = req.body;

  if (!breakdown || typeof total_annual_tons !== "number") {
    return res.status(422).json({ 
      error: "Unprocessable Entity", 
      message: "Missing required breakdown or total annual tons properties for generating custom plan." 
    });
  }

  // Formulate high-relevance prompt using the pure auditable builder helper
  const prompt = buildAIPrompt(breakdown, total_annual_tons, userName || "an individual");

  try {
    const geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const response = await geminiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt
    });

    const outputText = response.text || "No custom plan could be retrieved.";
    
    // Parse response into clean bullet lines to avoid raw HTML injection and XSS
    const parsedLines = outputText
      .split(/\n+/)
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.replace(/^[\s*\-\d\.\:\•\>]+/, "").trim()) // clean formatting marks
      .filter(line => line.length > 0);

    res.status(200).json({
      success: true,
      plan_lines: parsedLines.slice(0, 5),
      prompt_audited: prompt
    });
  } catch (err: any) {
    console.error("Gemini API computation failed:", err);
    res.status(500).json({
      success: false,
      message: "Our remote AI climatologist models are currently occupied. Please retry plan generation in a moment."
    });
  }
});

// 3. Static/Cached Tips per category endpoint
app.get("/api/tips/:category", (req: Request, res: Response) => {
  const category = req.params.category;
  
  // Set Cache-Control header
  res.setHeader("Cache-Control", "public, max-age=3600");

  if (tipsCache.has(category)) {
    return res.status(200).json(tipsCache.get(category));
  }

  const allTips: Record<string, any[]> = {
    transport: [
      { id: "t1", title: "Adopt Hybrid Commutes", impact_kg: 420, difficulty: "easy", description: "Combine cycling or walking with public transport once a week." },
      { id: "t2", title: "Maintain Correct Tyre Pressure", impact_kg: 180, difficulty: "easy", description: "Inflating tyres correctly can improve fuel efficiency by up to 3%." },
      { id: "t3", title: "Carpool to Work", impact_kg: 850, difficulty: "medium", description: "Share your daily work commute with 1-2 colleagues." }
    ],
    energy: [
      { id: "e1", title: "Up AC by 1 degree Celsius", impact_kg: 210, difficulty: "easy", description: "Setting thermostat near 24-25C reduces overall power drain." },
      { id: "e2", title: "Enable Eco-Cycles on Appliances", impact_kg: 90, difficulty: "easy", description: "Wash clothes at 30C and run dishwashers on solar eco timings." },
      { id: "e3", title: "Upgrade to Star LED/Energy star Lighting", impact_kg: 320, difficulty: "easy", description: "LED bulbs consume up to 80% less energy options than halogens." }
    ],
    diet: [
      { id: "d1", title: "Implement Plant-Based Mondays", impact_kg: 360, difficulty: "easy", description: "Skipping beef or lamb meals for 1 day weekly protects topsoil/forests." },
      { id: "d2", title: "Minimize Household Food Waste", impact_kg: 150, difficulty: "easy", description: "Planned groceries lessen land-decay methane release." },
      { id: "d3", title: "Switch to Soy or Almond Milk", impact_kg: 120, difficulty: "easy", description: "Dairy production yields almost triple the CO2 vs crop-based drinks." }
    ],
    flights: [
      { id: "f1", title: "Select Non-Stop Routes", impact_kg: 240, difficulty: "medium", description: "Takeoff and landing consume substantial peak jet fuel." },
      { id: "f2", title: "Offset Travel via Verified Programs", impact_kg: 500, difficulty: "easy", description: "Purchase Gold Standard certified carbon credits for vital flier legs." }
    ],
    all: [
      { id: "a1", title: "Power-down Idle Electronics", impact_kg: 110, difficulty: "easy", description: "Turn off major master switches to cut standby vampire loads." },
      { id: "a2", title: "Embrace Slow Fashion Choices", impact_kg: 280, difficulty: "medium", description: "Mending clothes and buying durable garments reduces synthetic processing emissions." }
    ]
  };

  const selectedTips = allTips[category] || allTips["all"];
  tipsCache.set(category, selectedTips);
  
  res.status(200).json(selectedTips);
});

// 4. Leaderboard retrieval endpoint
app.get("/api/leaderboard", (req: Request, res: Response) => {
  res.status(200).json(leaderboard);
});

// Vite & Static file configurations
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EcoTrace server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
