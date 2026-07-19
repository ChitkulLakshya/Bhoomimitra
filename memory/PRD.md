# BhoomiMitra — Product Requirements

## Vision
SDG 2 mobile app that transforms complex Soil Health Cards into simple, step-by-step organic fertilizer plans for smallholder ragi farmers in Anekal, Karnataka.

## Users
Smallholder ragi (finger millet) farmers with low literacy, primarily Kannada/English speakers.

## Core Features (v1)
- JWT auth (email/phone + password) with English/Kannada bilingual UI
- Farm plot registry with geo-tagging (Anekal area default)
- Soil Health Card photo upload → Gemini vision OCR → editable extracted values
- AI-generated 4-question personalization survey (irrigation, past crop, FYM availability, budget)
- Rule-based organic fertilizer plan + AI-generated bilingual encouragement summary
- Historical soil trend chart (N/P/K/pH) per plot
- Anonymized community view of nearby plots (opt-in via own plot creation)
- Directory of nearest soil-testing labs & organic fertilizer shops with Navigate/Call

## Tech
- Frontend: Expo Router 6 (SDK 54), React Native, expo-image-picker, expo-location
- Backend: FastAPI + MongoDB (motor)
- LLM: Gemini 2.5 Flash via emergentintegrations (Universal EMERGENT_LLM_KEY)
- Auth: bcrypt + PyJWT

## Design Language
"iOS-Native Clean" adapted for outdoors: earthy palette (moss green, sand, terracotta), 48pt+ touch targets, no glassmorphism, MaterialCommunityIcons for language-agnostic UI.

## Business Enhancement Hook
Directory of local labs and fertilizer shops enables partnerships & lead generation (commission on referrals, sponsored placements).
