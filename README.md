---

# 🌐 CBTP - Phase III

This project is a mono-repo containing a modern full-stack web application. It features a **React (Vite)** frontend and a **Node.js (Express)** backend, unified by **TypeScript** and **Prisma ORM**.

## 🏗️ Architecture Overview

The project is divided into two main packages:
* **`/client`**: Frontend built with React, Tailwind CSS, and React Hook Form.
* **`/server`**: REST API built with Express, Prisma, and JWT Authentication.
* **`/docs`**: API documentation and architectural notes.

---

## 📂 Root Directory Structure

```text
└── 📁cbtp
    ├── 📁client      # Frontend React Application
    ├── 📁server      # Backend Node.js API
    └── 📁docs        # Project documentation (API.md)
```

---

## 🚀 Quick Start (Full Project)

To get the entire system running, follow these steps:

### 1. Backend Setup

```bash
cd server
Read md file
```

### 2. Frontend Setup

```bash
cd client
npm install
Read md file
```

---

## 🛠️ Global Technologies

| Layer          | Stack                            |
| :------------- | :------------------------------- |
| **Language**   | TypeScript (Strict Mode)         |
| **Database**   | Prisma ORM with PostgreSQL/MySQL |
| **Validation** | Zod (Shared schema logic)        |
| **Auth**       | JWT (JSON Web Tokens)            |
| **Styling**    | Tailwind CSS                     |

---

## 🔐 Core Workflows

### Authentication Flow

1.  **Frontend:** User submits `LoginForm.tsx` -> Validated by `auth-schema.ts`.
2.  **API Call:** Sent via `auth-api.ts` to the backend.
3.  **Backend:** `auth.router.ts` triggers `auth.controller.ts`.
4.  **Database:** Prisma queries the `User` model.
5.  **Token:** Backend signs a JWT via `token.ts` and returns it.
6.  **Persistence:** Frontend stores the token in `AuthContext.tsx` and redirects via `ProtectedRoute.tsx`.

---

## 📝 Development Standards

### 1. Error Handling

- **Server:** All errors are caught by `middleware` and formatted by `utils/error.ts`.
- **Client:** Axios interceptors in `api-client.ts` catch 401s/500s and pass them to `errorHandler.ts`.

### 2. Type Safety

- Avoid using `any`.
- Leverage Prisma's generated types in `server/src/generated`.
- Use Zod's `infer` to create types from schemas in both client and server.

### 3. Documentation

- Refer to `/docs/API.md` for detailed endpoint descriptions, request bodies, and response formats.

---

## 📄 License

MIT License - 2026
