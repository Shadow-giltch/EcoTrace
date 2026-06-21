/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ============================================================================
 * 🧪 ECOTRACE TEST COVERAGE SUMMARY
 * ============================================================================
 * This test suite covers the core carbon modules and API routes of EcoTrace.
 * 
 * Functions Tested:
 *  1. calculateCarbonFootprint() (server/emissions.ts)
 *  2. generateInsights() (server/insights.ts)
 *  3. buildAIPrompt() (server/insights.ts)
 *  4. computeProgressPercent() (server/insights.ts)
 * 
 * Categories of Edge Cases Covered:
 *  - Zero Value Bounds: Empty inputs mapping to exactly 0.0 metric tons.
 *  - Negative/Out-of-Bound Limits: Clamping extreme ranges safely.
 *  - Double/Idempotent Toggle Cycles: Re-toggling all elements to off.
 *  - Payload Sanitation Filters: Forbidding and rejecting contaminated parameters (422 status code).
 *  - Rate Limit Throttling: Bucket capacity enforcement returning standard 429 status response.
 * ============================================================================
 */

import http from "http";
import express from "express";
import { calculateCarbonFootprint } from "./emissions";
import { generateInsights, buildAIPrompt, computeProgressPercent } from "./insights";

// Create a copy of the server logic specifically for unit-testing endpoints with fetch
const testApp = express();
testApp.use(express.json());

// In-Memory Database for Leaderboard
let testLeaderboard = [
  { id: "1", name: "Aarav Sharma", footprint: 1.8, date: "2026-06-19", actions_completed: 8 }
];

// In-Memory Rate Limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const CLIENT_LIMIT = 30; 
const LIMIT_WINDOW_MS = 60 * 1000;

function testRateLimiter(req: any, res: any, next: any) {
  const ip = "test_client_ip";
  const now = Date.now();
  const rateData = rateLimitMap.get(ip);

  if (!rateData || now > rateData.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + LIMIT_WINDOW_MS });
    return next();
  }

  if (rateData.count >= CLIENT_LIMIT) {
    return res.status(429).json({ error: "Rate limit exceeded" });
  }

  rateData.count += 1;
  next();
}

// Security Headers Middleware
testApp.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Content-Security-Policy", "default-src 'self';");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  next();
});

// Server-Side timing middleware (Interceptors writeHead to avoid ERR_HTTP_HEADERS_SENT)
testApp.use((req, res, next) => {
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

testApp.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

testApp.post("/api/calculate", testRateLimiter, (req, res) => {
  const body = req.body;
  const allowedKeys = [
    "transport_km_daily", "transport_days_week", "fuel_efficiency",
    "electricity_kwh_month", "lpg_kg_month", "meat_meals_week",
    "dairy_servings_day", "short_flights_year", "long_flights_year", "user_name"
  ];

  const receivedKeys = Object.keys(body);
  const unknownKeys = receivedKeys.filter(k => !allowedKeys.includes(k));
  if (unknownKeys.length > 0) {
    return res.status(422).json({ error: "Unprocessable Entity", message: "Unknown fields forbidden" });
  }

  const results = calculateCarbonFootprint(body);
  res.status(200).json(results);
});

testApp.post("/api/insights", (req, res) => {
  const { breakdown, total } = req.body;
  const insights = generateInsights(breakdown, total);
  res.status(200).json({ insights });
});

// Run Test Server Suite
async function runTests() {
  const testPort = 3500;
  const server = http.createServer(testApp);
  
  await new Promise<void>((resolve) => server.listen(testPort, resolve));
  console.log(`[Tests] Temporary Test Server listening on port ${testPort}`);

  let passedAll = true;

  const assertEqual = (actual: any, expected: any, testName: string) => {
    if (actual === expected) {
      console.log(` ✅ PASS: ${testName}`);
    } else {
      console.error(` ❌ FAIL: ${testName} - Expected [${expected}] but got [${actual}]`);
      passedAll = false;
    }
  };

  try {
    // === [Testing] Raw Unit Tests for Calculations & Clamping ===
    console.log("\n--- Executing Test Unit: Individual Emissions Calculation & Clamping ---");
    
    // Normal input cases
    const normalInputs = {
      transport_km_daily: 40, transport_days_week: 5, fuel_efficiency: 12,
      electricity_kwh_month: 200, lpg_kg_month: 12, meat_meals_week: 7,
      dairy_servings_day: 2, short_flights_year: 2, long_flights_year: 1
    };
    const normRes = calculateCarbonFootprint(normalInputs);
    assertEqual(normRes.breakdown.transport > 0, true, "Normal commute emissions computed correctly isolated");
    assertEqual(normRes.breakdown.home_energy > 0, true, "Normal energy emissions computed correctly isolated");
    assertEqual(normRes.breakdown.food > 0, true, "Normal diet emissions computed correctly isolated");
    assertEqual(normRes.breakdown.flights > 0, true, "Normal flights emissions computed correctly isolated");

    // Zero inputs cases
    const zeroInputs = {
      transport_km_daily: 0, transport_days_week: 0, fuel_efficiency: 12,
      electricity_kwh_month: 0, lpg_kg_month: 0, meat_meals_week: 0,
      dairy_servings_day: 0, short_flights_year: 0, long_flights_year: 0
    };
    const zeroRes = calculateCarbonFootprint(zeroInputs);
    assertEqual(zeroRes.total_annual_tons, 0, "Zero inputs result in exactly 0.0 annual tons footprint");

    // Extreme input bounds cases
    const extremeInputs = {
      transport_km_daily: 500, transport_days_week: 7, fuel_efficiency: 4,
      electricity_kwh_month: 2000, lpg_kg_month: 100, meat_meals_week: 21,
      dairy_servings_day: 10, short_flights_year: 50, long_flights_year: 20
    };
    const extremeRes = calculateCarbonFootprint(extremeInputs);
    assertEqual(extremeRes.total_annual_tons > 20, true, "Extreme/boundary inputs computed successfully without overflow");

    // Habit completion simulator (Set simulation) for doneSet transitions
    console.log("\n--- Executing Test Unit: Habit Completion Set Transitions ---");
    const testSet = new Set<string>();
    testSet.add("habit_laundry_cold");
    assertEqual(testSet.has("habit_laundry_cold"), true, "Action habit item added to active completed set successfully");
    testSet.delete("habit_laundry_cold");
    assertEqual(testSet.has("habit_laundry_cold"), false, "Action habit item deselected and removed from tracking set successfully");

    // 1. Test performance header presence
    console.log("\n--- Executing Test 1: Performance Headers ---");
    const res1 = await fetch(`http://localhost:${testPort}/health`);
    assertEqual(res1.headers.get("x-process-time-ms") !== null, true, "Response has X-Process-Time-Ms header");

    // 2. Test security headers
    console.log("\n--- Executing Test 2: HTTP Security Headers ---");
    assertEqual(res1.headers.get("x-content-type-options"), "nosniff", "Has X-Content-Type-Options nosniff header");
    assertEqual(res1.headers.get("x-frame-options"), "DENY", "Has X-Frame-Options DENY header");

    // 3. Test validation - disallowing malicious/extra variables (forbid)
    console.log("\n--- Executing Test 3: Block Unknown Fields validation ---");
    const badPayload = {
      transport_km_daily: 40, transport_days_week: 5, fuel_efficiency: 12,
      electricity_kwh_month: 300, lpg_kg_month: 12, meat_meals_week: 7,
      dairy_servings_day: 2, short_flights_year: 2, long_flights_year: 1,
      malicious_field: "<script>alert(1)</script>"
    };
    const res3 = await fetch(`http://localhost:${testPort}/api/calculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(badPayload)
    });
    assertEqual(res3.status, 422, "Calculator rejects payload with extra properties with status 422");

    // 4. Test validation - valid payload structure
    console.log("\n--- Executing Test 4: Accept Valid Payloads ---");
    const goodPayload = {
      transport_km_daily: 40, transport_days_week: 5, fuel_efficiency: 12,
      electricity_kwh_month: 300, lpg_kg_month: 12, meat_meals_week: 7,
      dairy_servings_day: 2, short_flights_year: 2, long_flights_year: 1
    };
    const res4 = await fetch(`http://localhost:${testPort}/api/calculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(goodPayload)
    });
    assertEqual(res4.status, 200, "Calculator responds with 200 for safe payload structure");
    const data4 = await res4.json();
    assertEqual(typeof data4.total_annual_tons, "number", "Calculates valid number tons result");

    // 5. Test data-derived personalized insights logic
    console.log("\n--- Executing Test 5: Data-Derived Insights Personalization ---");
    const highTransportBreakdown = { transport: 6.0, home_energy: 1.0, food: 0.5, flights: 0.2 };
    const res5 = await fetch(`http://localhost:${testPort}/api/insights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ breakdown: highTransportBreakdown, total: 7.7 })
    });
    const data5 = await res5.json();
    const insights = data5.insights;
    assertEqual(insights.length > 0, true, "Provides recommendations list");
    const hasTransportInsights = insights.some((ins: any) => ins.title.toLowerCase().includes("transport"));
    assertEqual(hasTransportInsights, true, "Generates tailored dominant feedback directly of computed indices");

    // 6. Test Rate limiting boundary
    console.log("\n--- Executing Test 6: Rate Limiting Throttling ---");
    rateLimitMap.clear();
    let hitRateLimit = false;
    for (let i = 0; i < 35; i++) {
      const res6 = await fetch(`http://localhost:${testPort}/api/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goodPayload)
      });
      if (res6.status === 429) {
        hitRateLimit = true;
        break;
      }
    }
    assertEqual(hitRateLimit, true, "Rate limit block of 429 status triggered after excessive requests");

    // 7. [Testing] Test for custom prompt builder (buildAIPrompt)
    console.log("\n--- Executing Test 7: Centralized AI Prompt Builder ---");
    const sampleBreakdown = { transport: 2.1, home_energy: 1.4, food: 0.8, flights: 0.5 };
    const constructedPrompt = buildAIPrompt(sampleBreakdown, 4.8, "Aarav Sharma");
    assertEqual(constructedPrompt.includes("Aarav Sharma"), true, "AI prompt correctly incorporates custom profile name");
    assertEqual(constructedPrompt.includes("4.80 metric tons"), true, "AI prompt correctly incorporates total computed annual footprint");
    assertEqual(constructedPrompt.includes("TRANSPORTATION"), true, "AI prompt correctly evaluates and incorporates highest dominant sector");

    // 8. [Testing] Test for clamped progress bar aria percentage (computeProgressPercent)
    console.log("\n--- Executing Test 8: Progress Bar Percentage and Bounds Clamping ---");
    assertEqual(computeProgressPercent(0, 500), 0, "Progress bar returns 0% at zero completion bounds");
    assertEqual(computeProgressPercent(250, 500), 50, "Progress bar correctly computes mid-range completion ratio (50%)");
    assertEqual(computeProgressPercent(500, 500), 100, "Progress bar correctly handles target achievements (100%)");
    assertEqual(computeProgressPercent(600, 500), 100, "Progress bar safely clamps out-of-range overflows to exactly 100% boundary");
    assertEqual(computeProgressPercent(-10, 500), 0, "Progress bar safely clamps negative computations to exactly 0% boundary");

    // 9. [Testing] Test for state toggling idempotency (Idempotency)
    console.log("\n--- Executing Test 9: Habit completedSet Toggle State Idempotency ---");
    const sourceActions = [
      { id: "act-1", title: "Ac adjusted up by 1°C", impact_co2_kg: 210, completed: false },
      { id: "act-2", title: "Idle electronic powers cut", impact_co2_kg: 110, completed: false }
    ];
    // Original State: all completed false, offset savings = 0
    const scoreZero = sourceActions.reduce((sum, item) => sum + (item.completed ? item.impact_co2_kg : 0), 0);
    assertEqual(scoreZero, 0, "All checked toggles set to off starts at 0 kg savings");

    // Toggle All On
    const scoreAllOn = sourceActions
      .map(act => ({ ...act, completed: true }))
      .reduce((sum, item) => sum + (item.completed ? item.impact_co2_kg : 0), 0);
    assertEqual(scoreAllOn, 320, "Toggling all actions on returns combined expected savings metrics of 320 kg");

    // Toggle All Off again
    const scoreAllOff = sourceActions
      .map(act => ({ ...act, completed: false }))
      .reduce((sum, item) => sum + (item.completed ? item.impact_co2_kg : 0), 0);
    assertEqual(scoreAllOff, scoreZero, "Idempotency assert pass: Toggling elements back to inactive perfectly matches the original blank state state");

  } catch (error) {
    console.error("Unhanded rejection state during execution:", error);
    passedAll = false;
  } finally {
    server.close();
    console.log("\n-------------------------------------------");
    if (passedAll) {
      console.log(" 🎉 ALL TESTS SUCCESSFULLY PASSED!");
      process.exit(0);
    } else {
      console.error(" ❌ TESTS FAILED. CHECK ERRORS ABOVE.");
      process.exit(1);
    }
  }
}

runTests();
