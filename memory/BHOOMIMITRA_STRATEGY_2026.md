# BhoomiMitra: Project Strategy & Architecture 2026

## 1. Problem Statement
Smallholder ragi farmers in Anekal face declining soil fertility and high fertilizer input costs due to random, non-scientific chemical application and a lack of localized soil nutrient digital records. 

Physical soil health cards (SHCs) issued by central laboratories are often lost, misread, or written in complex scientific jargon. This leads to farmers blindly overusing nitrogenous fertilizers, which destroys soil micro-ecosystems and raises production costs.

## 2. The Solution
A simplified, mobile-accessible web application (PWA) that parses complex chemical metrics from physical Soil Health Cards into clear, step-by-step agricultural application guides. 

By taking a picture of the card (in any language, including Kannada or Hindi), the platform translates the lab data into actionable, easy-to-understand organic and chemical fertilizer prescriptions tailored for Ragi farming.

---

## 3. High-Level Architecture (Monorepo)

The repository is structured as a streamlined monorepo optimizing for speed and low mobile data usage:

bhoomimitra/
├── web/                     # React/Vite PWA (Progressive Web App)
│   ├── src/
│   │   ├── components/      # UI components (large buttons, scanner UI, etc.)
│   │   ├── pages/           # Views: Dashboard, Scanner, Prescription
│   │   ├── locales/         # i18n JSON files (en, kn, hi)
│   │   └── utils/           # Client-side validation & compression
│
├── backend/                 # TypeScript Express Server
│   ├── server.ts            # API endpoints & Core logic
│   └── package.json         # Node dependencies
│
└── memory/                  # Project documentation & guidelines
```

---

## 4. The OCR & AI Pipeline (Optimized for Speed & Cost)

Traditional OCR engines (like Tesseract) fail on tabular data and complex Indian scripts. Instead, we utilize a **Single-Pass Vision-Language Model** approach using Google's **Gemini 3.5 Flash API**.

### The 3-Step Validation Flow
1. **Client-Side Pre-flight (0ms Latency):**
   - **Canvas-based Validation & Aggressive Compression:** Before the image is uploaded, a local HTML Canvas compresses and scales the photo to ~300KB (WebP format) to minimize upload time on spotty 3G/4G networks. If the image is incredibly small, it flags a warning.
2. **Single-Pass Gemini Extraction:**
   - The compressed image is sent to the Node/Express backend, which forwards it to the **Gemini 3.5 Flash** API.
   - Using a **Strict JSON Schema**, the prompt asks the model to validate the document AND extract the data simultaneously.
   - *Example Schema:* `{"is_valid": true, "data": {"ph": 6.5, "n": 120, "p": 30}}`
3. **Deterministic Agronomy Engine:**
   - The exact N-P-K metrics are passed into a hardcoded TypeScript/JS rules engine (`ragiEngine.js`) that calculates the required organic/chemical deficits based on Karnataka's agricultural baselines.

---

## 5. UI / UX Principles for Low-Digital Literacy

The interface must abandon standard web paradigms and mimic tools farmers already know (like WhatsApp and Instagram Stories).

### A. The "WhatsApp Voice Note" Paradigm (Audio-First)
- **Concept:** Farmers prefer listening over reading complex instructions.
- **Execution:** Every instruction step features a massive "Play" button. Tapping it uses text-to-speech to read the exact instructions out loud in the local dialect.

### B. "Instagram Story" Progression (Pagination over Scrolling)
- **Concept:** Long scrolling pages cause cognitive overload.
- **Execution:** Break the prescription down to one step per screen. Users tap a giant "NEXT" arrow to proceed from "Step 1: Soil Prep" to "Step 2: Adding Fertilizer."

### C. Hyper-Local, Physical Measurements
- **Concept:** Scientific jargon (e.g., "50kg/ha") is confusing. 
- **Execution:** Translate math into physical realities. Example: *"For your 1-acre plot, add 1 tractor cart of cow dung and half a bag of Urea."*

### D. Literal Iconography
- **Concept:** Abstract icons (like a gear for settings) are meaningless to first-time users.
- **Execution:** Use high-quality photos or highly literal icons (e.g., a physical fertilizer sack, a watering can, a tractor). Color code steps: Green (Go), Yellow (Wait), Red (Stop).

### E. Phone-Based Onboarding
- **Concept:** Forcing a login via email/password kills adoption, but we must store farmer data and prescriptions persistently.
- **Execution:** Require a simple Phone Number login immediately. We synthesize an email/password under the hood based on the phone number so the farmer never has to type an email or remember a complex password. This allows seamless local and cloud storage of their Soil Health Cards.

---

## 6. Real-World Data Constraints: Soil Health Card (SHC) Characteristics

Based on analysis of actual state-issued SHCs (e.g., Telangana, Himachal Pradesh), the platform must handle the following complexities, which explicitly mandate the use of Vision-Language Models (VLMs) over traditional pipeline OCRs:

- **The "12-Parameter" Grid Disconnect:** SHCs universally display roughly 12 core parameters (pH, EC, OC, N, P, K, etc.) in a wide tabular format. Traditional OCR reads strictly left-to-right and top-to-bottom, frequently losing the horizontal alignment between the parameter name and its corresponding numerical test value due to column spacing.
- **Multilingual Mashups:** Regional cards frequently mix languages on the exact same line (e.g., Telugu script labels for "Organic Carbon" mixed with English digits and unit symbols like `%` or `kg/ha`). VLMs natively resolve this without requiring manual language-pack switching or breaking mid-sentence.
- **Complex Nested Tables:** SHCs include deeply nested recommendation tables with vertically merged cells at the bottom of the card. A targeted VLM prompt allows the platform to completely ignore this noisy, unstructured recommendation data and exclusively extract the raw soil test values from the central grid.
