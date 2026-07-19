# PaisaPilot 🚀

> A modern, offline-first personal finance and expense-splitting application built with Expo and React Native.

PaisaPilot is a comprehensive mobile application designed to help you take control of your personal finances. It offers a sleek, polished interface for tracking daily transactions, managing budgets, and seamlessly splitting expenses with friends or groups. Built with a local-first philosophy, all your data stays securely on your device.

## ✨ Features

- **📊 Expense & Income Tracking**: Quickly log your daily financial activities.
- **🤝 Split Expenses**: Easily manage group expenses, calculate who owes what, and settle up with friends.
- **💸 Borrow/Lend Ledger**: Keep track of personal debts and loans outside of group splits.
- **📅 Calendar View**: Visualize your spending habits and upcoming expenses on a monthly calendar.
- **🎯 Budget Management**: Set spending limits and monitor your progress.
- **🏆 Achievements**: Gamified financial goals to keep you motivated.
- **📥 Imports & Exports**: Support for CSV import/export to manage your data flexibly.
- **📸 Receipt OCR & 💬 SMS Parsing**: Advanced tools to automate expense entry (requires configuration).
- **🎨 Custom UI & Alerts**: A beautiful, theme-aware design system replacing native OS alerts for a seamless user experience.

## 🛠️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/) (SDK 54)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Local Database**: [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) for an offline-first architecture
- **Styling**: Inline styles & custom components (formerly NativeWind)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **Animations**: [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or newer recommended)
- npm or yarn
- Expo CLI
- iOS Simulator (Mac only) or Android Emulator, or a physical device with the Expo Go app.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shahidansari311/PaisaPilot.git
   cd PaisaPilot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npx expo start
   ```

4. **Run on a device:**
   - Press `a` to open in an Android emulator.
   - Press `i` to open in an iOS simulator.
   - Scan the QR code with your phone's camera (iOS) or the Expo Go app (Android) to run it on a physical device.

## 📁 Project Structure

- `app/`: Expo Router file-based routing. Contains all screens and tab layouts.
- `components/`: Reusable UI components (e.g., `CustomAlert`).
- `database/`: SQLite schema definitions and database initialization logic.
- `store/`: Zustand stores for global state management (`useAlertStore`, `useThemeStore`, etc.).
- `types/`: TypeScript type definitions.
- `utils/`: Helper functions for exports, alerts, and other utilities.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/shahidansari311/PaisaPilot/issues) if you want to contribute.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
