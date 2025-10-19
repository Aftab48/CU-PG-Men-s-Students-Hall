# CUPGMSH - Mess Hall Management System

A comprehensive mobile application for managing boarding facility mess hall operations, built with React Native and Expo.

## Overview

CUPGMSH is a complete mess hall management solution designed for boarding facilities. It streamlines meal tracking, expense management, payment processing, and financial reporting across three distinct user roles: Managers, Boarders, and Staff.

📖 **For detailed information, check out**: [Public Launch Documentation](https://www.notion.so/Public-launch-of-CUPG-app-286d2352588f80d784aaef30f807ee9e)

## Features

### For Managers
- **Expense Tracking**: Record and categorize all mess-related expenses
- **Financial Reports**: Generate comprehensive summaries and analytics
- **Store Inventory**: Manage store-out items and inventory
- **Meal Management**: Oversee meal operations and costs
- **Boarder Management**: View and manage all boarders

### For Boarders
- **Meal Tracking**: View daily meal records and consumption
- **Balance Monitoring**: Track personal mess account balance in real-time
- **Payment Management**: Make payments and view transaction history
- **Skip Range**: Mark periods when you'll be away (holidays/leave) to avoid meal charges

### For Staff (Coming Soon)
- **Meal Distribution**: Record meal attendance
- **Boarder Verification**: Check meal eligibility

## Tech Stack

- **Framework**: React Native with Expo
- **Backend**: Appwrite (Database, Authentication, Storage)
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query
- **UI Components**: Custom components with Lucide React Native icons

## Project Structure

```
cupg/
├── app/                          # Application screens (file-based routing)
│   ├── (manager)/               # Manager-specific screens
│   │   └── (tabs)/              # Manager tab navigation
│   │       ├── expense.tsx      # Expense tracking
│   │       ├── meals.tsx        # Meal management
│   │       ├── store-out.tsx    # Store inventory
│   │       └── summary.tsx      # Financial reports
│   ├── (boarder)/               # Boarder-specific screens
│   │   └── (tabs)/              # Boarder tab navigation
│   │       ├── meals.tsx        # Meal tracking
│   │       ├── balance.tsx      # Balance overview
│   │       └── payments.tsx     # Payment management
│   ├── (staff)/                 # Staff screens (in development)
│   ├── auth/                    # Authentication screens
│   └── index.tsx                # Landing page
├── lib/                         # Core utilities and services
│   ├── actions/                 # Server actions (Appwrite operations)
│   ├── appwrite.ts              # Appwrite client configuration
│   ├── cache.ts                 # Caching implementation
│   └── utils.ts                 # Utility functions
├── stores/                      # Zustand state management
│   ├── auth-store.ts            # Authentication state
│   ├── expense-store.ts         # Expense management state
│   └── meal-store.ts            # Meal tracking state
├── types/                       # TypeScript type definitions
├── assets/                      # Images, fonts, and static files
└── android/                     # Android native build files
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- pnpm package manager
- Expo CLI
- Android Studio (for Android development) or Xcode (for iOS development)

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd cupg
   ```

2. Install dependencies
   ```bash
   pnpm install
   ```

3. Configure Appwrite
   - Update Appwrite credentials in `app.json` under `extra` section
   - Ensure Appwrite backend is properly set up with required collections

4. Start the development server
   ```bash
   pnpm start
   ```

5. Run on your preferred platform
   ```bash
   # Android
   pnpm android

   # iOS
   pnpm ios

   # Web
   pnpm web
   ```

## Development

- The project uses **Expo Router** for file-based routing
- All screens are located in the `app/` directory
- Shared logic and API calls are in `lib/actions/`
- State management with Zustand stores in `stores/`
- Styling with NativeWind (use Tailwind classes directly in components)

## Documentation

- [Caching Implementation](CACHING_IMPLEMENTATION.md) - Details on the caching strategy
- [Payment Setup](PAYMENT_SETUP.md) - Payment system configuration
- [Privacy Policy](PRIVACY_POLICY.md) - Data collection and privacy practices
- [Terms & Conditions](TERMS_AND_CONDITIONS.md) - Terms of service and legal agreements

## Building for Production

```bash
# Build Android APK
pnpm android --variant release

# Build for EAS (Expo Application Services)
eas build --platform android
```

## Key Features Implementation

### Role-Based Authentication
- Three distinct user roles with separate authentication flows
- Automatic routing based on user role after login
- Persistent authentication state with Zustand

### Caching Strategy
- Optimistic UI updates for better user experience
- Intelligent cache invalidation
- Offline-first approach for critical data

### Real-Time Balance Tracking
- Automatic calculation of boarder balances
- Transaction history with categorization
- Payment integration

## Contributing

When contributing to this project:
1. Follow the existing code structure and conventions
2. Use TypeScript for type safety
3. Follow the file-based routing patterns
4. Test on both Android and iOS when possible
5. Update documentation for significant changes

## License

Private project - All rights reserved
