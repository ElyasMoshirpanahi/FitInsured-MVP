
# FitInsured Wallet 🏋️‍♂️💰

![FitInsured Banner](https://i.imgur.com/8a6B5N5.png)

<div align="center">

[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-green?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Environment-Gemini_App_Builder-orange?style=for-the-badge&logo=vite)](https://developers.google.com/gemini/app-builder)

</div>

**FitInsured** is a modern web application that gamifies health and wellness by rewarding users with "Fitcoins" for their physical activities. This project demonstrates a complete, professional, and responsive user experience, from a celebratory onboarding flow to a feature-rich wallet dashboard.

---

## ✨ Key Features

-   🔐 **Secure User Authentication:** A complete, multi-step signup and login flow with persistent sessions.
-   📊 **Interactive Wallet Dashboard:** A central hub to view your Fitcoin balance, today's earnings, and a 7-day performance chart.
-   🔄 **Dynamic Activity Sync:** Simulate syncing data from various health providers (Strava, Apple Health, etc.) with a realistic 1-hour cooldown mechanism.
-   💰 **Metric-Based Fitcoin Calculation:** A sophisticated system calculates rewards based on detailed metrics for various activities like running, cycling, and sleeping.
-   📈 **Staking & Savings Tiers:** "Staking Programs" that allow users to lock up their Fitcoins to earn an annual yield, with benefits unlocking at different tiers.
-   🛒 **Provider Rewards Marketplace:** Redeem Fitcoins for exclusive real-world rewards like gym passes, healthy snacks, and wellness app trials.
-   🤝 **Engaging Community Hub:** Compete on a weekly leaderboard, join community challenges, and view a live activity feed from other users.
-   📱 **Fully Responsive Design:** A beautiful and functional UI that seamlessly adapts to mobile, tablet, and desktop screens.
-   🎉 **Celebratory UI/UX:** Delightful animations, including confetti bursts for achievements, animated balance updates, and a smooth, welcoming onboarding experience.

---

## 🚀 Live Demo in Action

Here's a glimpse of the FitInsured user experience, from signing up to syncing an activity and claiming a reward.



---

## 🏗️ Architecture Overview

FitInsured is a **frontend-only application** designed to run directly in the browser without a backend. It uses a robust mock API layer that persists all user and wallet data in the browser's `localStorage`, ensuring a seamless experience across sessions.

This architecture is perfect for rapid prototyping and creating impressive, self-contained demos for competitions.

Here is a diagram illustrating the data flow:

```mermaid
graph TD
    A[User Action e.g., Login, Sync] --> B{UI Component e.g., LoginPage, WalletView};
    B --> C[API Service (api.ts)];
    C --> D[LocalStorage Database];
    D --> C;
    C --> B;
    B --> E[Update UI State];
```

---

## 🧠 Core Concepts Explained

### Fitcoin Calculation Engine

The heart of the application is its mock rewards engine. Instead of simple random values, Fitcoins are calculated based on a detailed set of metrics that mimic real-world health providers.

When a user syncs their data, the app:
1.  Identifies the user's primary health provider (e.g., Strava).
2.  Generates a random set of 1-4 realistic activities based on that provider's typical data (e.g., `run_distance`, `active_calories`).
3.  Calculates the Fitcoin reward for each activity using a predefined conversion rate.

```typescript
// A snippet from services/api.ts
const FITCOIN_METRICS = {
  "strava_metrics": {
    "run_distance": { "unit": "kilometers", "value_per_fitcoin": 2 },
    "cycle_distance": { "unit": "kilometers", "value_per_fitcoin": 4 },
    "moving_time": { "unit": "minutes", "value_per_fitcoin": 15 },
    // ...and many more
  },
  "samsung_health_metrics": {
    "steps": { "unit": "steps", "value_per_fitcoin": 1000 },
    "active_time": { "unit": "minutes", "value_per_fitcoin": 20 },
    // ...and many more
  }
};
```

### Activity Sync Cooldown ⏳

To encourage regular engagement and prevent spamming, the "Sync Activity Data" button has a **1-hour cooldown**. The button is disabled during this period and displays a clear countdown timer, providing excellent user feedback and creating a more balanced user experience.

---

## 🛠️ Technology Stack

-   **Framework:** [React 19](https://react.dev/)
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **Icons:** [Lucide React](https://lucide.dev/)
-   **Charting:** [Recharts](https://recharts.org/)
-   **State Management:** React Hooks (`useState`, `useEffect`, `useCallback`, `useRef`)
-   **Local Persistence:** Browser `localStorage` API

---

## 📂 Project Structure

The project is organized into a clean and maintainable structure.

```
/
├── public/
│   └── (Static assets if any)
├── src/
│   ├── components/
│   │   ├── CommunityView.tsx     # Community tab UI
│   │   ├── Confetti.tsx          # Reusable celebration animation
│   │   ├── LandingPage.tsx       # Initial landing page
│   │   ├── LoginPage.tsx         # User login form
│   │   ├── MainApp.tsx           # Main authenticated app layout
│   │   ├── MarketplaceView.tsx   # Rewards hub UI
│   │   ├── OnboardingPage.tsx    # New user signup flow
│   │   ├── SavingsView.tsx       # Staking and tiers UI
│   │   └── WalletView.tsx        # Main dashboard and activity sync
│   ├── services/
│   │   └── api.ts                # Mock API and data logic
│   ├── data/
│   │   ├── apple_health/         # Mock data files
│   │   ├── fitbit/
│   │   ├── garmin/
│   │   ├── samsung_health/
│   │   └── strava/
│   ├── App.tsx                   # Root component, handles routing
│   ├── index.tsx                 # Application entry point
│   └── types.ts                  # TypeScript interfaces
├── index.html                    # HTML entry point
└── README.md                     # You are here!
```

---

## 🏁 Getting Started

This project is built for a modern browser environment like **Gemini App Builder** and requires no local installation or build step.

1.  **No Installation:** There are no `node_modules` to install.
2.  **Dependencies:** All dependencies (React, Lucide, etc.) are loaded directly from a CDN via the `importmap` in `index.html`.
3.  **Run:** Simply open the `index.html` file in a compatible web environment or a simple live server.

---

## 🔮 Future Work

While this MVP is feature-complete for a demo, here are some exciting next steps:

-   **Backend Integration:** Replace the mock `api.ts` with real HTTPS calls to a production backend (e.g., a Node.js server or a workflow engine like Opus).
-   **Real Health Provider APIs:** Integrate directly with the APIs for Strava, Apple HealthKit, etc., to sync real user data.
-   **Push Notifications:** Implement a service worker to send real push notifications for challenge reminders and rewards.
-   **Advanced Community Features:** Add features like friend lists, direct messaging, and team-based challenges to enhance social engagement.

Enjoy exploring the FitInsured Wallet! 🎉
