# 🎓 Exam Seating System - Frontend

A modern, responsive frontend application for managing exam seating arrangements built with React, TypeScript, and Vite.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Running the Application](#-running-the-application)
- [Available Scripts](#-available-scripts)
- [Project Structure](#-project-structure)
- [Build for Production](#-build-for-production)
- [Contributing](#-contributing)

---

## ✨ Features

- Modern and responsive user interface
- Fast development with Hot Module Replacement (HMR)
- Type-safe development with TypeScript
- Styled with Tailwind CSS
- ESLint configured for code quality

---

## 🛠 Tech Stack

| Technology   | Version | Description                 |
| ------------ | ------- | --------------------------- |
| React        | ^19.2.0 | UI Library                  |
| TypeScript   | ~5.9.3  | Type-safe JavaScript        |
| Vite         | ^7.2.4  | Build tool & Dev server     |
| Tailwind CSS | ^3.4.19 | Utility-first CSS framework |
| ESLint       | ^9.39.1 | Code linting                |

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed on your machine:

- **Node.js** (v18.0.0 or higher) - [Download here](https://nodejs.org/)
- **npm** (v9.0.0 or higher) or **yarn** (v1.22.0 or higher)
- **Git** - [Download here](https://git-scm.com/)

To verify your installations, run:

```bash
node --version
npm --version
```

---

## 🚀 Installation

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd exam_seating_system/frontend
```

### Step 2: Install Dependencies

Using npm:

```bash
npm install
```

Or using yarn:

```bash
yarn install
```

This will install all the required dependencies listed in `package.json`.

---

## ▶️ Running the Application

### Development Mode

To start the development server with hot-reload:

```bash
npm run dev
```

Or using yarn:

```bash
yarn dev
```

The application will be available at:

```
http://localhost:5173
```

> 💡 **Tip:** The development server supports Hot Module Replacement (HMR), so changes you make to the code will automatically reflect in the browser without a full page reload.

---

## 📜 Available Scripts

| Script      | Command           | Description                                   |
| ----------- | ----------------- | --------------------------------------------- |
| **dev**     | `npm run dev`     | Starts the development server                 |
| **build**   | `npm run build`   | Compiles TypeScript and builds for production |
| **preview** | `npm run preview` | Preview the production build locally          |
| **lint**    | `npm run lint`    | Run ESLint to check code quality              |

---

## 📁 Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── assets/          # Images, fonts, and other assets
│   ├── App.tsx          # Main application component
│   ├── App.css          # Application styles
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global styles (Tailwind imports)
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── postcss.config.js    # PostCSS configuration
├── tsconfig.json        # TypeScript configuration
├── tsconfig.app.json    # TypeScript config for app
├── tsconfig.node.json   # TypeScript config for Node
└── eslint.config.js     # ESLint configuration
```

---

## 🏗 Build for Production

To create an optimized production build:

```bash
npm run build
```

This will:

1. Compile TypeScript files
2. Bundle and optimize all assets
3. Output the build to the `dist/` folder

### Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

The preview will be available at:

```
http://localhost:4173
```

---

---

## 📄 License

This project is part of the Exam Seating System mini project.

---
