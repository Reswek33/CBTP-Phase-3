---

# 🚀 Frontend Authentication System

A modular, type-safe React application built with **TypeScript** and **Vite**. This project features a robust authentication flow, including form validation with Zod, context-based state management, and protected routing.

## 🛠️ Tech Stack

* **Framework:** [React 18](https://reactjs.org/)
* **Build Tool:** [Vite](https://vitejs.dev/)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Form Management:** [React Hook Form](https://react-hook-form.com/)
* **Validation:** [Zod](https://zod.dev/)
* **Routing:** [React Router Dom v6](https://reactrouter.com/)
* **HTTP Client:** [Axios](https://axios-http.com/)

---

## 📁 Project Structure

```text
└── 📁client
    └── 📁src
        └── 📁components
            └── 📁auth/Login      # UI components for authentication
            └── ProtectedRoute.tsx # Route guard for authenticated users
        └── 📁contexts             # Global State (Auth, Theme, etc.)
        └── 📁pages                # Page-level components
        └── 📁router               # Centralized route definitions
        └── 📁schemas              # Zod validation schemas
        └── 📁services/api         # Axios instances and API endpoints
        └── 📁util                 # Global helper functions & Error handlers
        ├── App.tsx                # Root component
        └── main.tsx               # Entry point
```

---

## 🔑 Key Features

### 1. Type-Safe Forms

Uses **Zod** schemas to enforce strict data validation both at the component level and in the API layer.

### 2. Authentication Context

The `AuthContext` provides a global `user` object and `isAuthenticated` flag, persisting login states across the application.

### 3. Protected Routes

The `ProtectedRoute` component wraps sensitive pages, automatically redirecting unauthenticated users to the login page while preserving their intended destination.

### 4. Centralized API Service

All backend communication is handled via `api-client.ts`, featuring interceptors for automatic token injection and standardized error handling via `errorHandler.ts`.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v24.0.0 or higher)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Reswek33/CBTP-Phase-3.git
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

### Building for Production

Create an optimized production build in the `dist/` folder:

```bash
npm run build
```

---

## 🧪 Development Guidelines

- **Schemas:** Always define a Zod schema in `src/schemas` before creating a new form.
- **Components:** Keep UI components in `src/components` and business logic/page layouts in `src/pages`.
- **Services:** Do not call Axios directly inside components. Use the services defined in `src/services/api`.
- **Styling:** Use Tailwind utility classes. For complex components, break them down into smaller sub-components rather than using long class strings.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
