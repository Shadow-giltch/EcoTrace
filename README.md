# EcoTrace v2.1 🌿

EcoTrace is a highly-polished, full-stack **Carbon Footprint Awareness Platform** designed specifically to help individuals **track**, **understand**, and **reduce** their lifestyle emissions (Challenge 3). 

Built using a modern architecture, EcoTrace pairs interactive React components with a safe, rate-limited Node/Express backend that computes emission indexes, validates payloads, enforces robust security controls, and simulates real-world timing parameters.

---

## 🚀 Key Features

### 📊 1. Track Effectively
*   **Granular Lifestyle Sliders:** Log daily commute distances, fuel efficiency, monthly electricity/LPG usage, meals containing meat, dairy consumption, and annual flight frequencies.
*   **Active Carbon Calculation:** Calculate real-time, personalized annual carbon footprints in metric tons of $CO_2e$ ($t\text{ }CO_2e/\text{year}$).
*   **Dynamic Client Reductions:** See your footprint drop instantly as you check off domestic carbon reduction habits.

### 💡 2. Understand Fully
*   **Global & Local Comparisons:** View interactive, professional visualizations comparing your footprint against national (India per-capita average), global averages, and the ambitious **Paris Climate Agreement Target** (2.0 tonnes threshold by 2030).
*   **Relatable Equivalences:** Translate abstract $CO_2$ values into concrete physical terms, such as equivalent driving mileage (km) and the exact number of mature forest trees needed to offset the emissions in 1 year.
*   **Dynamic Personalized Insights:** The dashboard computes which lifestyle sector is your dominant carbon contributor and creates high-leverage alert cards.

### 🌱 3. Reduce Impact
*   **Completed Habit Set Tracker:** Actionable habit checklist (easy, medium, hard steps) with specific calculated annual savings.
*   **Habit Impact Simulation:** Checked actions directly calculate a projected "after" footprint so you can see your trajectory toward carbon sustainability.

---

## 🎨 Design Philosophy: Professional Polish

The application implements the **Professional Polish** design theme:
*   **Header Rail:** Slate-900 navbar with high-contrast emerald green accents embodying clean environmental sustainability.
*   **Typography:** Elegant pairing using "Inter" for high UI readability, and monospace layouts for performance statistics.
*   **Responsive Layout:** Fully optimized responsive navbar and fluid grids for perfect desktop, tablet, and mobile alignments.
*   **Reduced-Motion Safe:** Full compliance with `prefers-reduced-motion` to disable/reduce high-frequency canvas drawing transformations when the user desires.
*   **Subresource Integrity (SRI):** Fully validated third-party libraries loaded securely with integrity checks.

---

## 🔒 Security Hardening

EcoTrace adheres to strict web security guidelines:
*   **Content Security Policy (CSP):** Configured via meta tags (`default-src 'self'`) to block all unauthorized cross-site executions and inline script risks.
*   **HTTP Security Headers:** Embedded middleware asserting `X-Content-Type-Options: nosniff` and `X-Frame-Options: DENY`.
*   **Extra Key Validation:** The backend blocks and rejects requests containing unsolicited extra payload parameters with status `422 Unprocessable Entity`.
*   **Rate Limiting Middleware:** Protects critical calculation routes via local IP buckets, throttling excessively rapid triggers with status `429 Too Many Requests`.
*   **API Key Protection:** The layout uses dedicated server-side proxy architecture to isolate third-party secrets and keys, maintaining client-side safety.

---

## 🧪 Robust Testing Suite

EcoTrace features an integrated automatic test-runner (`server/test_server.ts`) covering:
1.  **Pure Emission Calculations:** Normal inputs, zero-input cases, and edge/extreme input boundaries.
2.  **Habit Set Transitions:** Verifies addition, removal, and state consistency of tracking habits.
3.  **HTTP Headers Verification:** Ensures `X-Process-Time-Ms`, `X-Content-Type-Options`, and `X-Frame-Options` exist.
4.  **Payload Validation:** Asserts automatic rejection of invalid or contaminated parameters mapping.
5.  **Rate Limiter Throt-checks:** Confirms active blocking after exceeding standard invocation counts.

---

## ⚙️ Execution & Commands

Ensure you have all dependencies installed before executing operations.

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```

### Run Tests and Validation Suites
Our test script spins up a temporary server, exercises calculations, tests limits, verifies security parameters, then exits safely with code 0.
```bash
npm run test
```

### Build Production Artifacts
Compiles the client bundle using Vite and compiles the custom Express server into a single standalone, type-stripped `./dist/server.cjs` file using esbuild.
```bash
npm run build
```

### Start Production Server
```bash
npm run start
```
