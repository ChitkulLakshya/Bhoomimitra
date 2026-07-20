# BhoomiMitra - Agricultural Advisory Platform

## Overview

BhoomiMitra is a comprehensive agricultural advisory platform designed for smallholder ragi (finger millet) farmers in Karnataka, India. The platform transforms complex Soil Health Cards into simple, step-by-step fertilizer plans with bilingual support (English/Kannada).

## Project Structure

The repository contains three main applications:

```
bhoomimitra/
├── web/              # React web application (Vite)
├── frontend/         # React Native mobile app (Expo)
├── backend/          # Python FastAPI backend
├── backend-node/     # Node.js Express backend (alternative)
└── memory/           # Project documentation
```

---

## Web Application (`web/`)

### Technology Stack

- **Framework**: React 19.2.7 with Vite 8.1.1
- **Routing**: React Router DOM 7.18.1
- **Authentication**: Firebase Auth (Email/Phone)
- **Database**: Firebase Firestore
- **Internationalization**: i18next 26.3.6 + react-i18next 17.0.10
- **UI Components**: 
  - lucide-react 1.25.0 (Icons)
  - framer-motion 12.42.2 (Animations)
  - @lottiefiles/dotlottie-react 0.19.10 (Lottie animations)
- **OCR**: tesseract.js 7.0.0 (Client-side OCR)
- **Build Tool**: Vite with @vitejs/plugin-react 6.0.3
- **Linting**: oxlint 1.71.0

### Architecture

#### Directory Structure
```
web/src/
├── components/          # Reusable UI components
│   ├── InteractiveMenu.jsx    # Bottom navigation menu
│   ├── LanguageToggle.jsx      # Language switcher (EN/KN)
│   └── SplashScreen.jsx       # App splash screen
├── context/             # React Context providers
│   ├── AuthContext.jsx        # Authentication state
│   └── LanguageContext.jsx    # Language state
├── pages/               # Page components
│   ├── AuthPage.jsx          # Login/Signup
│   ├── Dashboard.jsx          # Main dashboard with weather
│   ├── NewPlot.jsx            # Plot registration
│   ├── ScanCard.jsx           # Soil card scanning
│   ├── VerifyReading.jsx      # OCR result verification
│   ├── Prescription.jsx       # Fertilizer prescription
│   └── RagiAdvisory.jsx       # Ragi-specific advisory
├── utils/               # Utility functions
│   ├── agronomy.js            # Agronomy calculations
│   ├── ai.js                  # AI integration helpers
│   ├── ocr.js                 # Tesseract OCR wrapper
│   ├── ragiEngine.js          # Ragi recommendation engine
│   ├── ragiRules.js           # Karnataka ragi rules
│   ├── soil.js                # Soil analysis utilities
│   └── weather.js             # Open-Meteo weather API
├── locales/             # Translation files
│   ├── en/translation.json    # English translations
│   └── kn/translation.json    # Kannada translations
├── firebase.js          # Firebase configuration
├── i18n.js              # i18next configuration
├── App.jsx              # Main app component with routing
└── main.jsx             # Entry point
```

#### Key Features

1. **Authentication System**
   - Firebase Auth integration
   - Phone-based signup with synthetic email/password
   - User profile storage in Firestore
   - Protected routes with AuthContext

2. **Bilingual Support**
   - English and Kannada translations
   - Language toggle in navigation
   - All UI components use i18next
   - 150+ translated strings

3. **Weather Integration**
   - Open-Meteo API integration
   - Browser geolocation
   - 30-minute local caching
   - Fallback to Anekal, Karnataka location
   - Real-time weather with soil temperature

4. **Soil Health Card Processing**
   - Client-side OCR using Tesseract.js
   - Regex-based value extraction
   - Progress tracking during OCR
   - Manual verification workflow
   - Confidence scoring

5. **Ragi Advisory System**
   - Karnataka-specific ragi rules
   - Regional baseline (rainfed/irrigated)
   - Soil category adjustments
   - Product recommendations (DAP, Urea, MOP)
   - Crop calendar with task scheduling
   - Deterministic advisory (no AI guesses)

6. **Navigation**
   - Interactive bottom navigation
   - Animated underline for active item
   - Home, Plan, Language toggle
   - Fixed positioning with white background

#### Data Flow

1. **User Registration**
   - Phone number input → Synthetic email generation
   - Firebase Auth signup → Firestore user document
   - Auto-login for existing users

2. **Plot Registration**
   - GPS location capture
   - Plot details (name, area, variety)
   - Firestore storage

3. **Soil Card Processing**
   - Image capture → Tesseract OCR
   - Regex extraction → Manual verification
   - Firestore storage with verification flag

4. **Advisory Generation**
   - Soil reading + plot data → ragiEngine
   - Rule-based calculations → Product recommendations
   - Display with bilingual support

---

## Mobile Application (`frontend/`)

### Technology Stack

- **Framework**: Expo Router 6.0.24 (SDK 54)
- **React**: React Native 0.81.5, React 19.1.0
- **Navigation**: Expo Router (file-based routing)
- **Authentication**: Firebase Auth
- **Storage**: 
  - expo-secure-store (sensitive data)
  - @react-native-async-storage/async-storage (general data)
- **Camera**: expo-camera, expo-image-picker
- **Location**: expo-location
- **UI Components**:
  - expo-linear-gradient
  - expo-blur
  - @expo/vector-icons
- **Date Handling**: date-fns, dayjs
- **TypeScript**: TypeScript 5.9.3

### Architecture

#### Directory Structure
```
frontend/src/
├── app/                 # Expo Router file-based routing
│   ├── (auth)/          # Auth group
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── welcome.tsx
│   ├── (tabs)/          # Tab navigation
│   │   ├── _layout.tsx
│   │   ├── index.tsx    # Home
│   │   ├── ai-scan.tsx  # AI soil scan
│   │   ├── map.tsx      # Plot map
│   │   └── profile.tsx  # User profile
│   ├── plot/            # Plot management
│   │   ├── new.tsx
│   │   ├── [id].tsx
│   │   ├── card-scan.tsx
│   │   └── verify-reading.tsx
│   ├── prescription/    # Prescription routes
│   │   └── [id].tsx
│   ├── _layout.tsx      # Root layout
│   └── index.tsx        # Root redirect
├── hooks/               # Custom React hooks
│   └── use-icon-fonts.ts
├── utils/               # Utility functions
│   ├── ragi.ts          # Ragi calculations
│   ├── soil.ts          # Soil analysis
│   └── storage/         # Storage abstraction
│       ├── index.ts
│       ├── index.web.ts
│       └── storage-base.ts
├── auth.tsx             # Authentication utilities
├── firebase.ts          # Firebase config
├── i18n.ts              # i18next config
├── theme.ts             # Theme configuration
└── LanguageToggle.tsx   # Language switcher
```

#### Key Features

1. **File-Based Routing**
   - Expo Router with file-based routes
   - Route groups for organization
   - Tab navigation for main sections

2. **Native Integrations**
   - Camera for soil card scanning
   - GPS for plot location
   - Secure storage for auth tokens
   - Image picker for photo selection

3. **Cross-Platform**
   - Web support via expo-web
   - iOS and Android native builds
   - Platform-specific storage abstraction

4. **Design System**
   - Earthy palette (moss green, sand, terracotta)
   - 48pt+ touch targets
   - MaterialCommunityIcons
   - iOS-Native Clean aesthetic

---

## Python Backend (`backend/`)

### Technology Stack

- **Framework**: FastAPI 0.110.1
- **Server**: Uvicorn 0.25.0
- **Database**: MongoDB with Motor (async driver)
- **Authentication**: 
  - bcrypt 4.1.3
  - PyJWT 2.10.1
  - python-jose 3.3.0
- **AI Integration**: emergentintegrations (Gemini 2.5 Flash)
- **Data Processing**:
  - pandas 2.2.0
  - numpy 1.26.0
- **Testing**: pytest 8.0.0, mongomock-motor 0.0.32
- **Code Quality**: black, isort, flake8, mypy

### Architecture

#### Directory Structure
```
backend/
├── server.py            # Main FastAPI application
├── requirements.txt     # Python dependencies
├── emergentintegrations/ # AI integration library
├── tests/               # Test suite
└── .env                 # Environment variables
```

#### API Endpoints

1. **Health Check**
   - `GET /api/` - Service status

2. **Soil Card Analysis**
   - `POST /api/ai/analyze-card`
   - Input: Base64 image
   - Output: Extracted soil parameters (pH, N, P, K, etc.)
   - Uses Gemini 2.5 Flash for OCR
   - Fallback to heuristic defaults

3. **Soil Scan**
   - `POST /api/ai/scan-soil`
   - Input: Base64 image, crop type, language
   - Output: Soil analysis with deficiencies
   - Texture-based multiplier adjustments
   - Baseline deficit calculations

4. **Prescription Generation**
   - `POST /api/ai/prescription`
   - Input: Plot data, soil reading, survey answers
   - Output: Rule-based recommendations + AI summary
   - Bilingual support (English/Kannada)

#### Key Features

1. **Rule-Based Recommendations**
   - Soil status analysis (pH, N, P, K, organic carbon)
   - Organic fertilizer recommendations
   - Priority-based action items
   - Crop-specific baselines

2. **AI Integration**
   - Gemini 2.5 Flash via emergentintegrations
   - Vision capabilities for OCR
   - Streaming responses
   - JSON parsing with error handling

3. **Crop Baselines**
   - Multi-crop support (Ragi, Bajra, Sorghum, Maize, Rice, etc.)
   - Texture-based multipliers
   - Regional adjustments
   - Deficit calculations

4. **CORS Support**
   - All origins allowed (development)
   - Credentials support
   - All methods/headers allowed

---

## Node.js Backend (`backend-node/`)

### Technology Stack

- **Framework**: Express 5.2.1
- **AI**: @google/generative-ai 0.24.1
- **Middleware**: cors 2.8.6
- **Config**: dotenv 17.4.2

### Architecture

Simplified Express backend as alternative to Python FastAPI. Currently minimal implementation with Google Generative AI integration.

---

## Data Flow & Integrations

### Firebase Integration

**Configuration** (`web/src/firebase.js`)
- Project: bhoomimitra-4a101
- Services: Auth, Firestore
- Used by: Web app, Mobile app

**Firestore Collections**
- `users`: User profiles (phone, name, createdAt)
- `plots`: Farm plot data (location, area, variety)
- `readings`: Soil card readings (OCR results, verification status)
- `prescriptions`: Generated fertilizer plans

### Weather Integration

**Open-Meteo API** (`web/src/utils/weather.js`)
- Current weather data
- Soil temperature
- Daily forecasts
- 30-minute local caching
- Fallback to Anekal location

### AI Integration

**Gemini 2.5 Flash** (`backend/server.py`)
- Soil card OCR
- Soil image analysis
- Prescription summaries
- Bilingual support

### OCR Integration

**Tesseract.js** (`web/src/utils/ocr.js`)
- Client-side OCR
- No backend upload required
- Progress tracking
- Regex-based extraction
- Confidence scoring

---

## Language & Framework Features

### Web App Features

1. **React 19**
   - Latest React features
   - Concurrent rendering
   - Automatic batching

2. **Vite**
   - Fast HMR
   - Optimized builds
   - ES modules support

3. **i18next**
   - Namespace support
   - Interpolation
   - Pluralization
   - Lazy loading

4. **Firebase**
   - Real-time sync
   - Offline support
   - Authentication
   - Cloud Firestore

### Mobile App Features

1. **Expo Router 6**
   - File-based routing
   - Route groups
   - Deep linking
   - Type-safe navigation

2. **Expo SDK 54**
   - Latest Expo features
   - Platform APIs
   - Updated modules

3. **TypeScript**
   - Type safety
   - Better IDE support
   - Compile-time checks

### Backend Features

1. **FastAPI**
   - Async support
   - Automatic docs
   - Type validation
   - Dependency injection

2. **MongoDB**
   - Document storage
   - Flexible schema
   - Async operations

---

## Development Setup

### Web Application

```bash
cd web
npm install
npm run dev
```

### Mobile Application

```bash
cd frontend
yarn install
yarn start
```

### Python Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

### All Services (Root)

```bash
npm install
npm run dev
```

---

## Deployment Recommendations

### Web Application
- **Platform**: Vercel (recommended)
- **Reason**: Optimized for React/Vite, free SSL, CDN
- **Alternative**: Netlify, GitHub Pages

### Mobile Application
- **Platform**: Expo Application Services (EAS)
- **Build**: iOS and Android via EAS Build
- **Distribution**: EAS Submit or manual store upload

### Backend
- **Platform**: Render, Railway, or AWS
- **Database**: MongoDB Atlas
- **Environment Variables**: EMERGENT_LLM_KEY, MongoDB URI

---

## Design Language

### Color Palette
- Primary Green: #688C31
- Dark Green: #4A6B22
- Background: #F5F7F2
- White: #FFFFFF
- Text: #1A1A1A

### Typography
- Large touch targets (48pt+)
- High contrast for readability
- Bilingual font support

### UI Principles
- No glassmorphism
- Earthy, outdoor aesthetic
- Language-agnostic icons
- Simple, clear navigation

---

## Business Features

### Directory Integration
- Soil testing labs directory
- Fertilizer shops directory
- Navigate/Call functionality
- Partnership opportunities

### Community Features
- Anonymized plot sharing
- Nearby plot comparison
- Opt-in community view

---

## License

Proprietary - BhoomiMitra Agricultural Advisory Platform

## Contact

For inquiries about BhoomiMitra, please contact the development team.
