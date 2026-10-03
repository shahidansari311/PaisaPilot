# PaisaPilot 💸

PaisaPilot is a comprehensive, offline-first personal finance and expense-sharing application built for students and young professionals. Keep track of your daily expenses, manage budgets, split bills with friends in real-time, and keep a ledger with roommates—all in one place.

## ✨ Features

### Personal Finance
* **Monthly Budget Tracking**: Set monthly limits and track your spending against them.
* **Calendar View**: See your expenses day-by-day to identify spending trends.
* **SMS Parser**: Quickly paste transaction SMS messages to automatically log expenses without manual entry.
* **Export Data**: Generate professional PDF reports or export your data to CSV/Excel for deeper analysis.

### Social & Sharing
* **Live Split Groups**: Split bills on trips or outings in real-time. Features auto-syncing when online and offline caching for when you lose signal.
* **Shared Rooms / Roommate Ledger**: Keep a running tab with roommates for shared household expenses, rent, and groceries.
* **Borrow & Lend Tracking**: Keep track of who owes you and who you owe. Send one-tap WhatsApp reminders directly from the app.

### Technical Highlights
* **Offline-First Architecture**: View your cached data and use the app fully even without internet access. Data auto-syncs when connectivity returns.
* **Realtime Sync**: Powered by Supabase Realtime for instant updates across devices in shared rooms and groups.
* **Local Database**: Built on Expo SQLite for lightning-fast, local-first data storage.
* **Theme Support**: Full support for system Dark and Light modes.

## 🛠️ Tech Stack

* **Framework**: [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/) (SDK 57)
* **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
* **State Management**: [Zustand](https://github.com/pmndrs/zustand)
* **Local Storage**: `expo-sqlite` & `@react-native-async-storage/async-storage`
* **Backend & Realtime**: [Supabase](https://supabase.com/)
* **Styling**: `expo-linear-gradient` & `lucide-react-native` icons

## 🚀 Getting Started

### Prerequisites
* Node.js (v18 or newer recommended)
* npm or yarn
* [Expo CLI](https://docs.expo.dev/get-started/installation/)
* Android Studio (for Android emulator) or Xcode (for iOS simulator)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/PaisaPilot.git
   cd PaisaPilot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root of the project and add your Supabase credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm start
   ```
   Press `a` to open in Android, or `i` to open in iOS.

## 📦 Publishing & Deployment

PaisaPilot is configured for deployment using [EAS (Expo Application Services)](https://expo.dev/eas).

To create a production build for Android:
```bash
eas build --profile production --platform android
```

## 🔐 Security & Privacy

* **Local Data**: All personal finance data (budgets, local transactions, reminders) is stored locally on the device via SQLite and is never sent to the cloud.
* **Shared Data**: Only data explicitly created within a "Shared Room" or "Live Split Group" is synced to Supabase for collaboration.
* **Production Hardened**: Console logs are stripped from production builds to prevent data leakage.

## 🤝 Contributing

Contributions are welcome! If you have suggestions or find bugs, please open an issue or submit a pull request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
