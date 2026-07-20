# 🛠️ BhoomiMitra Technical Stack

This document outlines the technology stack, frameworks, database systems, and key libraries used in the **BhoomiMitra** project.

---

## 🎨 Frontend Stack

The frontend is a cross-platform mobile and web application built using the React Native ecosystem under **Expo**.

| Technology / Library | Version | Description |
| :--- | :--- | :--- |
| **Expo** | `54.0.35` | Universal app platform built on top of React Native, allowing the app to run on iOS, Android, and Web. |
| **React Native** | `0.81.5` | Component framework for rendering native views. |
| **React / React DOM** | `19.1.0` | Library for building user interfaces. |
| **Expo Router** | `6.0.24` | File-system based router for React Native apps (similar to Next.js). |
| **TypeScript** | `5.9.3` | Type-safe programming language wrapping JavaScript. |
| **React Native Reanimated**| `4.1.1` | High-performance animation library. |
| **Expo Camera** | `~17.0.10` | Camera component for taking photographs of soil. |
| **Expo Image Picker** | `~17.0.11` | Image selection library for choosing pictures from gallery. |
| **Expo Location** | `~19.0.8` | GPS/Geolocation library for plotting farm coordinates. |
| **Async Storage** | `2.2.0` | Key-value local storage utility for persistent auth tokens and configurations. |

---

## ⚙️ Backend Stack

The backend is built with a modern Python web framework designed for asynchronous execution, safety, and performance.

| Technology / Library | Version | Description |
| :--- | :--- | :--- |
| **Python** | `3.14.6` | Modern Python programming runtime. |
| **FastAPI** | `0.110.1` | High-performance web framework for building APIs with auto-generated documentation (Swagger/Redoc). |
| **Uvicorn** | `0.25.0` | Lightning-fast ASGI web server implementation. |
| **Pydantic** | `>=2.6.4` | Data validation and settings management using python type annotations. |
| **PyJWT** | `>=2.10.1` | JWT (JSON Web Tokens) encoding and decoding library for session authentication. |
| **Bcrypt** | `4.1.3` | Strong password hashing algorithm. |
| **Pandas / NumPy** | `>=2.2.0` | Data manipulation and mathematical analysis for soil health cards. |
| **Boto3** | `>=1.34.129` | AWS SDK for Python (integrations with S3/AWS resources). |

---

## 🗄️ Database Stack

The application uses **MongoDB** as its primary document-based data repository, wrapped in async drivers, with a full mock database capability for local execution.

| Technology / Library | Version | Description |
| :--- | :--- | :--- |
| **MongoDB** | *(Target DB)*| Document-oriented NoSQL database used to store users, plots, readings, and community data. |
| **Motor** | `3.3.1` | Asynchronous Python driver for MongoDB. |
| **PyMongo** | `4.6.3` | Standard Python MongoDB driver. |
| **mongomock-motor** | `0.0.32` | Asynchronous mock client mimicking Motor to support in-memory local testing and development. |
| **mongomock** | `4.3.0` | Synchronous engine simulating MongoDB for unit test cases and local development. |
