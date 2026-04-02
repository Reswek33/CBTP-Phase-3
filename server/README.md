---

# ⚙️ Backend API Server

A scalable, type-safe REST API built with **Node.js**, **Express**, and **Prisma ORM**. This server handles authentication, user management, and system logging with a heavy emphasis on structural clarity and data integrity.

## 🛠️ Tech Stack

* **Runtime:** [Node.js](https://nodejs.org/)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Framework:** [Express.js](https://expressjs.com/)
* **ORM:** [Prisma](https://www.prisma.io/)
* **Database:** PostgreSQL (configurable via `.env`)
* **Authentication:** JSON Web Tokens (JWT)
* **Validation:** Zod (via `src/schemas`)
* **Logging:** Winston / Morgan (via `src/utils/logger.ts`)

---

## 📁 Project Structure

```text
└── 📁server
    └── 📁prisma             # Database schema and migration files
    └── 📁src
        └── 📁config         # Global configurations (Prisma client instance)
        └── 📁controllers    # Request handlers & Business logic
        └── 📁generated      # Auto-generated Prisma types and models
        └── 📁middleware     # Route guards (authMiddleware, error handlers)
        └── 📁router         # Express route definitions
        └── 📁schemas        # Data validation schemas (Zod)
        └── 📁utils          # Utility functions (JWT signing, logging, error formatting)
        ├── app.ts           # Express application setup
    ├── prisma.config.ts     # Prisma environment configuration
    └── nodemon.json         # Development hot-reload settings
```

---

## 🔑 Key Backend Features

### 1. Prisma ORM Integration

The project uses Prisma for type-safe database queries. Models like `User` and `SystemLog` are defined in `schema.prisma`, and types are automatically generated into `src/generated` for seamless IDE support.

### 2. Robust Middleware

- **`authMiddleware.ts`**: Validates JWT tokens and attaches the user payload to the request object.
- **Global Error Handling**: Standardized error responses via `src/utils/error.ts` ensuring the frontend always receives a consistent error format.

### 3. Controller-Router Pattern

Logic is decoupled from route definitions. Routers (`src/router`) define the endpoints, while Controllers (`src/controllers`) manage the data flow, keeping the codebase maintainable and testable.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- A running instance of a compatible SQL database.

### Installation

1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Database Setup

1. Configure your database URL in the `.env` file:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/cbtp"
   ACCESS_TOKEN_SECRETE=1234567890
   REFRESH_TOKEN_SECRETE=0987654321
   ACCESS_EXPIRES_IN=15m
   REFRESH_EXPIRES_IN=7d
   ```
2. Run migrations to sync your database:
   ```bash
   npm run db:migratre
   ```
3. Generate the Prisma Client:
   ```bash
   npm run db:generate
   ```

### Execution

- **Development:** Run with `nodemon` for hot-reloading:
  ```bash
  npm run dev
  ```
- **Production:** Compile and start:
  ```bash
  npm run build
  npm start
  ```

---

## 📝 Development Notes

- **Adding Models:** Update `prisma/schema.prisma`, run `npm run db:migrate`, and the types in `src/generated` will update automatically.
- **Validation:** Always validate `req.body` using the Zod schemas located in `src/schemas` before processing data in the controller.
- **Logging:** Use the centralized logger in `src/utils/logger.ts` instead of `console.log` for production-grade traceability.

---

## 📄 License

Distributed under the MIT License.
