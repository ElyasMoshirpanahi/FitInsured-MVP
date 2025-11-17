# FitInsured Wallet - Project Documentation

## Project Overview

FitInsured is a modern, gamified health and wellness web application that rewards users with "Fitcoins" for their physical activities. It's a frontend-only React application built with TypeScript and Tailwind CSS that simulates a complete user experience from onboarding to dashboard management, community interaction, and reward redemption.

The application features a sophisticated mock API layer that persists all user and wallet data in the browser's localStorage, creating a self-contained demo without requiring a backend server. The project demonstrates professional UI/UX with responsive design, animations, and a complete user flow.

## Technology Stack

- **Framework**: React 19 (with TypeScript)
- **Language**: TypeScript 5.8+
- **Styling**: Tailwind CSS (loaded from CDN)
- **Icons**: Lucide React
- **Charting**: Recharts
- **State Management**: React Hooks (useState, useEffect, useCallback, useRef)
- **Build Tool**: Vite
- **Local Persistence**: Browser localStorage API

## Project Structure

```
/
├── public/
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
│   │   ├── WalletView.tsx        # Main dashboard and activity sync
│   │   └── NotificationToast.tsx # Toast notifications component
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
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite build configuration
└── README.md
```

## Key Features

1. **Secure User Authentication**: Complete multi-step signup and login flow with persistent sessions in localStorage
2. **Interactive Wallet Dashboard**: Central hub to view Fitcoin balance, today's earnings, and 7-day performance chart
3. **Dynamic Activity Sync**: Simulate syncing data from various health providers (Strava, Apple Health, etc.) with 1-hour cooldown
4. **Metric-Based Fitcoin Calculation**: Sophisticated system calculating rewards based on detailed metrics for various activities
5. **Staking & Savings Tiers**: "Staking Programs" allowing users to lock up Fitcoins to earn annual yield
6. **Provider Rewards Marketplace**: Redeem Fitcoins for exclusive real-world rewards
7. **Engaging Community Hub**: Compete on weekly leaderboard, join community challenges, view live activity feed
8. **Fully Responsive Design**: Beautiful UI adapting to mobile, tablet, and desktop screens
9. **Celebratory UI/UX**: Delightful animations including confetti bursts for achievements

## Core Data Structures

The application uses well-defined TypeScript interfaces in `types.ts`:
- `User`: Contains user profile and authentication information
- `WalletSummary`: Contains balance, staked amount, daily/weekly activity data
- `Activity`: Represents a single activity with title, fitcoin reward, and metric
- `CommunitySummary`: Holds leaderboard and community statistics
- `MarketplaceItem`: Defines items available for redemption
- `Challenge`: Represents community challenges with rewards
- `FeedItem`: Community activity feed items

## Architecture & Data Flow

FitInsured follows a frontend-only architecture with a mock API layer:

```
User Action → UI Component → API Service → LocalStorage → Update UI State
```

The mock API (`services/api.ts`) manages all data persistence using localStorage with keys:
- `fitcoinMockUsers`: User account information
- `fitcoinMockWallets`: Wallet and activity data

## Fitcoin Calculation Engine

The core of the application is its sophisticated mock rewards engine. Instead of simple random values, Fitcoins are calculated based on detailed metrics that mimic real-world health providers:

```typescript
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

## Activity Sync Cooldown

To encourage regular engagement, the "Sync Activity Data" button has a 1-hour cooldown. The button is disabled during this period and displays a clear countdown timer.

## Building and Running

This project is designed to run directly in the browser without a traditional build step:

### Development Setup
1. Ensure Node.js is installed on your system
2. Install dependencies: `npm install`
3. Start development server: `npm run dev` (or `yarn dev` if using Yarn)
4. The application will be available at http://localhost:3000

### Available Commands
- `npm run dev` - Start development server on port 3000
- `npm run build` - Build the application for production
- `npm run preview` - Preview the built application locally

### Direct Browser Usage
Alternatively, since the project uses CDN-loaded dependencies, you can run it directly in environments like Gemini App Builder by opening `index.html` without any installation.

## Development Conventions

1. **Type Safety**: Extensive use of TypeScript interfaces for type safety across components
2. **Component Structure**: Each major view is contained in its own component file
3. **State Management**: Primarily React hooks (useState, useEffect, useCallback) for local component state
4. **API Layer**: All data operations are abstracted through the mock API service
5. **Responsive Design**: Consistent mobile-first approach using Tailwind CSS utility classes
6. **Error Handling**: Proper error handling with try/catch blocks and user feedback
7. **Accessibility**: Proper semantic HTML and ARIA attributes where appropriate

## Testing

Since this is a frontend-only demo application, testing was primarily focused on manual user interaction and visual verification. For a production application, unit tests with Jest and React Testing Library would be recommended.

## Deployment

The application is designed to run in browser environments and can be deployed as a static site. Since it uses localStorage for persistence, each user's data is isolated to their browser.

## Key Dependencies

- `react`: Core framework
- `react-dom`: React DOM renderer
- `recharts`: Charting library for data visualization
- `lucide-react`: Icon library
- `typescript`: Type safety
- `vite`: Build tool and development server
- `@vitejs/plugin-react`: React plugin for Vite

## Special Considerations

1. **No Backend**: All data is stored in browser localStorage, making this a self-contained frontend demo
2. **Mock API**: The API service simulates backend functionality with realistic delays and response patterns
3. **CDN Dependencies**: Dependencies are loaded from CDN in the HTML file, allowing the app to run without local node_modules
4. **State Management**: Since there's no central state management tool, React hooks and localStorage serve as the state layers
5. **Cross-Session Persistence**: Data persists across browser sessions through localStorage

## File Organization

- Components are organized by feature in the `components/` directory
- Business logic is abstracted into the `services/` directory
- Type definitions are centralized in `types.ts`
- All health provider mock data is organized in subdirectories of `data/`
- Configuration files are in the root directory