# CUPGMSH - Mess Hall Management System

A comprehensive mobile application for managing boarding facility mess hall operations, built with React Native and Expo.

## Overview

CUPGMSH is a complete mess hall management solution designed for boarding facilities. It streamlines meal tracking, expense management, payment processing, and financial reporting across three distinct user roles: Managers, Boarders, and Staff.

Built with modern technologies including React Native, Expo, and Appwrite, the app provides a seamless mobile-first experience with offline capabilities, real-time updates, and push notifications. The system handles everything from daily meal logging to comprehensive financial reports, making mess hall operations efficient and transparent.

📖 **For detailed information, check out**: [Public Launch Documentation](https://www.notion.so/Public-launch-of-CUPG-app-286d2352588f80d784aaef30f807ee9e)

## Features

### For Managers
- **Expense Tracking**: Record and categorize all mess-related expenses with image attachments
- **Payment Approval**: Review and approve boarder payments
- **Financial Reports**: Generate comprehensive summaries and analytics with exportable reports
- **Store Inventory**: Manage store-out items and inventory tracking
- **Meal Management**: Oversee meal operations, costs, and consumption patterns
- **Boarder Management**: View and manage all boarders with complete transaction history

### For Boarders
- **Meal Tracking**: View daily meal records, consumption patterns, and meal history
- **Balance Monitoring**: Real-time balance tracking with detailed breakdowns
- **Payment Management**: Submit payments with image proof and track approval status
- **Transaction History**: Complete history of all financial activities
- **Skip Range**: Mark periods when you'll be away (holidays/leave) to avoid meal charges
- **Push Notifications**: Receive meal reminders and important updates

### For Staff
- **Meal Logging**: Record meal distribution in real-time
- **Boarder Verification**: Quick lookup and meal eligibility verification
- **Daily Reports**: Track meal attendance and distribution patterns

## Tech Stack

- **Framework**: React Native 0.81.4 with Expo ~54.0
- **Backend**: Appwrite 21.2.1 (Cloud-hosted BaaS)
  - Database & Collections (TablesDB)
  - Authentication & Account Management
  - Storage & File Management
  - Serverless Functions
- **Navigation**: Expo Router 6.0 (file-based routing with typed routes)
- **Styling**: NativeWind 4.2 (Tailwind CSS for React Native)
- **State Management**: Zustand 5.0
- **Data Fetching**: TanStack React Query 5.89
- **UI Components**: Custom components with Lucide React Native icons
- **Notifications**: Expo Notifications (Push notifications)
- **Media**: Expo Image, Image Picker, Media Library
- **Additional Features**:
  - AsyncStorage for local data persistence
  - React Native Reanimated for smooth animations
  - React Native Gesture Handler
  - Expo Haptics for tactile feedback
  - DateTime Picker for date/time selection
  - Clipboard functionality
  - Location services

## Project Structure

```
cupg/
├── app/                          # Application screens (file-based routing)
│   ├── (manager)/               # Manager-specific screens
│   │   └── (tabs)/              # Manager tab navigation
│   │       ├── approve.tsx      # Payment approval
│   │       ├── expense.tsx      # Expense tracking
│   │       ├── meals.tsx        # Meal management
│   │       ├── store-out.tsx    # Store inventory
│   │       └── summary.tsx      # Financial reports
│   ├── (boarder)/               # Boarder-specific screens
│   │   ├── (tabs)/              # Boarder tab navigation
│   │   │   ├── meals.tsx        # Meal tracking
│   │   │   ├── balance.tsx      # Balance overview
│   │   │   └── payments.tsx     # Payment management
│   │   └── skip-range.tsx       # Holiday/leave management
│   ├── (staff)/                 # Staff screens
│   │   └── (tabs)/              # Staff tab navigation
│   │       └── meal-log.tsx     # Meal distribution logging
│   ├── auth/                    # Authentication & profile screens
│   │   ├── boarder.tsx          # Boarder login
│   │   ├── manager.tsx          # Manager login
│   │   ├── staff.tsx            # Staff login
│   │   ├── updateBoarder.tsx    # Boarder profile update
│   │   ├── updateManager.tsx    # Manager profile update
│   │   └── updateStaff.tsx      # Staff profile update
│   ├── index.tsx                # Landing/welcome page
│   ├── _layout.tsx              # Root layout
│   └── global.css               # Global styles
├── lib/                         # Core utilities and services
│   ├── actions/                 # Server actions (Appwrite operations)
│   │   ├── auth.actions.ts      # Authentication operations
│   │   ├── billing.actions.ts   # Billing calculations
│   │   ├── boarder.actions.ts   # Boarder operations
│   │   ├── expense.actions.ts   # Expense management
│   │   ├── manager.actions.ts   # Manager operations
│   │   ├── meal.actions.ts      # Meal tracking operations
│   │   ├── notifications.actions.ts  # Push notifications
│   │   ├── payments.actions.ts  # Payment processing
│   │   ├── staff.actions.ts     # Staff operations
│   │   └── store.actions.ts     # Store inventory operations
│   ├── appwrite.ts              # Appwrite client configuration
│   ├── cache.ts                 # Query caching implementation
│   ├── notifications.ts         # Notification utilities
│   ├── utils.ts                 # Utility functions
│   └── seedMeals.ts             # Data seeding utilities
├── stores/                      # Zustand state management
│   ├── auth-store.ts            # Authentication & user state
│   ├── expense-store.ts         # Expense management state
│   └── meal-store.ts            # Meal tracking state
├── types/                       # TypeScript type definitions
│   ├── index.d.ts               # Main type definitions
│   └── images.d.ts              # Image module types
├── assets/                      # Static assets
│   ├── fonts/                   # Quicksand font family
│   └── images/                  # App icons, splash screens, etc.
├── appwrite-functions/          # Serverless Appwrite Functions
│   └── meal-reminders/          # Automated meal reminder function
├── android/                     # Android native build files
├── app.json                     # Expo configuration
├── tailwind.config.js           # Tailwind CSS configuration
└── tsconfig.json                # TypeScript configuration
```

## Getting Started

### Prerequisites

- **Node.js** 18+ installed
- **pnpm** package manager (recommended for this project)
- **Expo CLI** (installed automatically with dependencies)
- **Android Studio** (for Android development) or **Xcode** (for iOS development)
- **Appwrite Cloud** account or self-hosted Appwrite instance

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
   - Update Appwrite credentials in `app.json` under the `extra` section:
     - `EXPO_PUBLIC_APPWRITE_ENDPOINT`
     - `EXPO_PUBLIC_APPWRITE_PROJECT_ID`
     - `EXPO_PUBLIC_APPWRITE_DATABASE_ID`
     - Collection IDs for: boarders, managers, staff, expenses, meals, payments, store, push_tokens
     - `EXPO_PUBLIC_APPWRITE_BUCKET_ID` for file storage
   - Ensure Appwrite backend is properly set up with required collections and permissions

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

### Architecture
- **File-Based Routing**: Expo Router with typed routes for type-safe navigation
- **Screens**: All app screens in `app/` directory with role-based route groups
- **Server Actions**: Appwrite operations centralized in `lib/actions/`
- **State Management**: Zustand stores for global state in `stores/`
- **Styling**: NativeWind 4.x - use Tailwind classes directly in components
- **Type Safety**: Full TypeScript support with strict type checking

### Development Workflow
1. All API calls go through `lib/actions/` - never call Appwrite directly from components
2. Use React Query for data fetching with caching strategies defined in `lib/cache.ts`
3. Follow the existing file-based routing structure for new screens
4. Use Zustand stores for global state that needs to persist across navigation
5. Leverage NativeWind for styling - refer to `tailwind.config.js` for custom theme

### Code Organization
- **Components**: Inline in screen files or create shared components
- **Actions**: Server-side operations in `lib/actions/`
- **Types**: TypeScript definitions in `types/index.d.ts`
- **Utilities**: Helper functions in `lib/utils.ts`

## Documentation

- **[Public Launch Documentation](https://www.notion.so/Public-launch-of-CUPG-app-286d2352588f80d784aaef30f807ee9e)** - Comprehensive launch guide
- **[Bill Tables Format](BillTables_Formatted.md)** - Database schema and billing structure
- **[Privacy Policy](PRIVACY_POLICY.md)** - Data collection and privacy practices
- **[Terms & Conditions](TERMS_AND_CONDITIONS.md)** - Terms of service and legal agreements

## Building for Production

### Local Build
```bash
# Build Android APK locally
pnpm android --variant release

# The APK will be located at:
# android/app/build/outputs/apk/release/app-release.apk
```

### EAS Build (Recommended)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Build Android APK
eas build --platform android --profile preview

# Build Android App Bundle (for Google Play)
eas build --platform android --profile production
```

### Configuration
- **Bundle Identifier**: `com.aftab.cupg`
- **App Name**: CUPGMSH
- **Version**: 1.0.0
- **Expo SDK**: ~54.0
- **New Architecture**: Enabled
- **React Compiler**: Enabled (Experimental)

## Key Features Implementation

### Role-Based Authentication
- **Three distinct user roles**: Manager, Boarder, and Staff
- **Separate authentication flows** with dedicated login screens
- **Automatic routing** based on user role after successful login
- **Profile management** with update screens for each role
- **Persistent state** via Zustand and AsyncStorage

### Caching & Data Strategy
- **TanStack React Query** for server state management
- **Optimistic UI updates** for instant feedback
- **Intelligent cache invalidation** on mutations
- **Query deduplication** to prevent redundant API calls
- **Stale-while-revalidate** pattern for better UX
- **Custom cache keys** defined in `lib/cache.ts`

### Real-Time Balance Tracking
- **Automatic balance calculation** based on meals, payments, and expenses
- **Transaction history** with detailed categorization
- **Payment proof upload** via image picker
- **Payment approval workflow** for managers
- **Real-time updates** across all user roles

### Push Notifications
- **Meal reminders** via Appwrite Functions
- **Payment status updates** for boarders
- **Approval notifications** for managers
- **Token management** with device registration

### Image & Media Handling
- **Receipt uploads** for payments and expenses
- **Image optimization** with expo-image
- **Media library integration** for saving and sharing
- **Storage management** via Appwrite Storage bucket

## Appwrite Backend Structure

### Database Collections
- **boarders** - Boarder profiles and registration data
- **managers** - Manager accounts and permissions
- **staff** - Staff member profiles
- **meals** - Daily meal records and consumption tracking
- **expenses** - Mess-related expenses with receipts
- **payments** - Boarder payment submissions and approvals
- **store** - Store inventory and store-out items
- **push_tokens** - Device tokens for push notifications

### Storage Buckets
- **Default Bucket** - Stores payment receipts, expense receipts, and other uploaded images

### Appwrite Functions
- **meal-reminders** - Automated function for sending meal reminder notifications

### Security & Permissions
- Role-based access control for all collections
- Read/Write permissions configured per user role
- Secure file uploads with validation
- API key authentication for serverless functions

## Contributing

When contributing to this project:
1. **Code Structure**: Follow the existing architecture patterns
2. **Type Safety**: Use TypeScript with strict mode enabled
3. **Routing**: Follow Expo Router file-based routing conventions
4. **API Calls**: All Appwrite operations must go through `lib/actions/`
5. **State Management**: Use React Query for server state, Zustand for global client state
6. **Styling**: Use NativeWind classes (no inline styles)
7. **Testing**: Test on both Android and iOS when possible
8. **Documentation**: Update README and inline comments for significant changes
9. **Commits**: Write clear, descriptive commit messages
10. **Pull Requests**: Include description of changes and any breaking changes

## Environment Variables

All environment configuration is handled through `app.json` under the `extra` section. Required variables:

```
EXPO_PUBLIC_APPWRITE_ENDPOINT          # Appwrite API endpoint
EXPO_PUBLIC_APPWRITE_PROJECT_ID        # Appwrite project ID
EXPO_PUBLIC_APPWRITE_DATABASE_ID       # Database ID
EXPO_PUBLIC_APPWRITE_BOARDERS_TABLE_ID # Boarders collection
EXPO_PUBLIC_APPWRITE_MANAGERS_TABLE_ID # Managers collection
EXPO_PUBLIC_APPWRITE_STAFF_TABLE_ID    # Staff collection
EXPO_PUBLIC_APPWRITE_EXPENSES_TABLE_ID # Expenses collection
EXPO_PUBLIC_APPWRITE_MEALS_TABLE_ID    # Meals collection
EXPO_PUBLIC_APPWRITE_PAYMENTS_TABLE_ID # Payments collection
EXPO_PUBLIC_APPWRITE_STORE_TABLE_ID    # Store collection
EXPO_PUBLIC_APPWRITE_PUSH_TOKENS_TABLE_ID # Push tokens collection
EXPO_PUBLIC_APPWRITE_BUCKET_ID         # Storage bucket ID
```

## Performance Optimizations

- **React Query Caching**: Reduces API calls and improves load times
- **Optimistic Updates**: Instant UI feedback before server confirmation
- **Image Optimization**: Using expo-image for efficient image rendering
- **Code Splitting**: Route-based code splitting via Expo Router
- **React Compiler**: Enabled for automatic memoization (experimental)
- **New Architecture**: Using React Native's new architecture for better performance

## Known Issues & Limitations

- iOS build configuration not yet finalized (Android-focused development)
- Staff role features are minimal (focused on meal logging)
- Offline functionality is limited to read operations
- Push notifications require proper Appwrite Function deployment

## Troubleshooting

### Common Issues

**Appwrite Connection Issues**
- Verify all environment variables in `app.json`
- Check network connectivity
- Ensure Appwrite project is active

**Build Failures**
- Clear cache: `pnpm start --clear`
- Clean Android build: `cd android && ./gradlew clean`
- Reinstall dependencies: `rm -rf node_modules && pnpm install`

**Image Upload Issues**
- Check storage bucket permissions in Appwrite
- Verify file size limits
- Ensure proper MIME type handling

## Support & Contact

For issues, feature requests, or questions:
- Create an issue in the repository
- Contact the developer at [mdalam4884@gmail.com](mailto:mdalam4884@gmail.com)
- Refer to the [Public Launch Documentation](https://www.notion.so/Public-launch-of-CUPG-app-286d2352588f80d784aaef30f807ee9e)

## License

Private project - All rights reserved
