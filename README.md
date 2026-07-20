# PaisaPilot 🚀

> A modern, offline-first personal finance and expense-splitting app built with Expo and React Native.

Managing money usually means juggling several apps — one for tracking spending, another spreadsheet for splitting the dinner bill, and a mental note (or ten) for who still owes you money. **PaisaPilot** brings all of that into a single, fast, and polished mobile experience.

It's built **local-first**: every transaction, budget, and ledger entry is stored directly on your device using SQLite, so the app is fully usable offline, loads instantly, and never depends on a remote server to keep your financial data private. Whether you're logging a coffee run, splitting a trip with five friends, or tracking a loan to a family member, PaisaPilot is designed to make the process quick, visual, and genuinely pleasant to use.

---

## ✨ Features

### 📊 Expense & Income Tracking
Log daily income and expenses in just a few taps, with support for categories, notes, and dates. A clean transaction history gives you an at-a-glance view of where your money is actually going, instead of finding out at the end of the month.

### 🤝 Split Expenses
Create shared expense groups for trips, roommates, or one-off outings. Add participants, split costs evenly or by custom amounts, and let PaisaPilot automatically calculate who owes what. A simplified settle-up view shows the minimum number of payments needed to clear everyone's balance.

### 💸 Borrow/Lend Ledger
Not every debt happens in a group. The dedicated borrow/lend ledger lets you track one-off personal loans — money you've lent to a friend or borrowed yourself — separately from group splits, so nothing falls through the cracks.

### 📅 Calendar View
See your financial activity laid out on a monthly calendar. Spot spending spikes, recurring bills, and upcoming due dates visually, rather than scrolling through a flat list of transactions.

### 🎯 Budget Management
Set spending limits per category or time period and track your progress in real time. PaisaPilot surfaces how much of your budget is left so you can course-correct before you overspend, not after.

### 🏆 Achievements
Personal finance is more sustainable when it's motivating. Built-in achievements reward consistent tracking, budget discipline, and savings milestones, turning good financial habits into a bit of a game.

### 📥 Import / Export
Move data in and out freely with CSV import and export support — useful for migrating from another tracker, backing up your history, or doing deeper analysis in a spreadsheet.

### 📸 Receipt OCR & 💬 SMS Parsing
For power users, PaisaPilot includes optional tooling to speed up data entry even further: OCR can extract transaction details from photographed receipts, and SMS parsing can detect bank/payment notifications to pre-fill transactions automatically. Both require additional configuration to enable.

### 🎨 Custom UI & Alerts
Every interaction — including confirmation dialogs and alerts — uses a custom, theme-aware design system built from scratch, rather than falling back to native OS pop-ups. The result is a consistent, branded look and feel across both iOS and Android, in both light and dark mode.

## 🛠️ Tech Stack

PaisaPilot is built entirely in TypeScript on top of the Expo ecosystem, chosen for fast iteration, strong native module support, and a smooth path to production builds on both platforms.

| Layer | Technology | Why it's used |
|---|---|---|
| Framework | [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/) (SDK 54) | Cross-platform iOS/Android app from a single codebase, with managed native tooling |
| Routing | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based) | Screens and tab layouts map directly to files under `app/`, keeping navigation predictable |
| State Management | [Zustand](https://github.com/pmndrs/zustand) | Lightweight, hook-based global state for themes, alerts, and app-wide data without boilerplate |
| Local Database | [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) | Enables the fully offline, local-first data model — no backend or internet connection required |
| Styling | Inline styles & custom components | A hand-built, theme-aware design system (previously NativeWind) for full control over look and feel |
| Forms & Validation | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | Performant form handling paired with schema-based validation for reliable data entry |
| Animations | [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) | Smooth, native-thread animations for a polished, responsive feel |
| Language | TypeScript (99.9% of the codebase) | Type safety across screens, stores, and utilities |

## 🚀 Getting Started

These steps will get a full local copy of PaisaPilot running on a simulator, emulator, or physical device.

### Prerequisites

Make sure you have the following installed before you begin:

- **Node.js** v18 or newer ([download](https://nodejs.org/))
- **npm** or **yarn** as your package manager
- **Expo CLI** (installed automatically via `npx`, no global install required)
- One of the following to actually run the app:
  - **iOS Simulator** (macOS only, via Xcode)
  - **Android Emulator** (via Android Studio)
  - A **physical iOS/Android device** with the [Expo Go](https://expo.dev/client) app installed

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/shahidansari311/PaisaPilot.git
   cd PaisaPilot
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npx expo start
   ```

   This launches the Expo development server and prints a QR code along with keyboard shortcuts in your terminal.

4. **Run on a device or simulator**

   - Press `a` to launch on a connected Android emulator/device
   - Press `i` to launch on the iOS simulator (macOS only)
   - Scan the QR code shown in the terminal with the **Expo Go** app to run it on your own phone
   - Press `w` to try the experimental web build in your browser

Once running, the app will hot-reload as you edit files under `app/`, `components/`, or `store/`.

### Building for production

For creating standalone builds (APK/AAB for Android, IPA for iOS), PaisaPilot is configured for [EAS Build](https://docs.expo.dev/build/introduction/) — see `eas.json` for the available build profiles.

## 📁 Project Structure

The codebase follows a fairly conventional Expo Router layout, with clear separation between UI, data, and state:

```
PaisaPilot/
├── app/          # Expo Router screens & tab layouts (file-based navigation)
├── components/   # Reusable UI components (e.g. CustomAlert, cards, inputs)
├── database/     # SQLite schema definitions & database initialization logic
├── store/        # Zustand stores (useAlertStore, useThemeStore, etc.)
├── types/        # Shared TypeScript type definitions
├── utils/        # Helper functions for CSV export, alerts, formatting, etc.
├── assets/       # Images, icons, and fonts
├── .claude/      # Configuration for AI-assisted development workflows
├── App.tsx       # App entry point
├── app.json      # Expo app configuration
└── eas.json      # EAS Build configuration for production builds
```

A quick mental model:
- **`app/`** decides *what the user sees* and how screens are wired together.
- **`components/`** holds the *reusable building blocks* those screens are made of.
- **`database/`** and **`store/`** together manage *where data lives* and *how it flows* through the app.
- **`utils/`** and **`types/`** are shared, cross-cutting helpers used throughout the codebase.

## 🤝 Contributing

Contributions, bug reports, and feature requests are all welcome — this project is actively evolving and community input is genuinely useful.

To contribute code:

1. **Fork** the project
2. Create your feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Make your changes and commit them
   ```bash
   git commit -m "Add amazing feature"
   ```
4. Push to your branch
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a **pull request** describing what you changed and why

If you'd rather not write code, opening a detailed [issue](https://github.com/shahidansari311/PaisaPilot/issues) for bugs or feature ideas is just as valuable.

## 📝 License

This project is licensed under the **MIT License** — see the `LICENSE` file for the full text. In short: you're free to use, modify, and distribute this project, provided the original copyright notice is retained.

## 🙏 Acknowledgements

Built with the excellent open-source [Expo](https://expo.dev/), [Zustand](https://github.com/pmndrs/zustand), and [React Hook Form](https://react-hook-form.com/) ecosystems, among others listed in the tech stack above.
