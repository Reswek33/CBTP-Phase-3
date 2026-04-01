This API documentation provides a technical reference for your Mayeos school management systems API. It is designed for frontend developers or external integrators to understand how to interact with your Express/Prisma backend.

---

## 🔐 Authentication API Documentation

**Base URL:** `/api/v1/auth`

**Content-Type:** `application/json`

**Authentication:** JWT tokens stored in HTTP-only Cookies (`accessToken`, `refreshToken`).

---

### 1. User Login

Authenticates a user and establishes a session.

- **URL:** `/login`
- **Method:** `POST`
- **Auth Required:** No
- **Request Body:**

```json
{
  "identifier": "username_or_email",
  "password": "yourpassword"
}
```

- **Success Response (200 OK):**
- **Cookies Set:** `accessToken`, `refreshToken` (HTTP-only)
- **Body:**

```json
{
  "success": true,
  "message": "Login successful",
  "role": "ADMIN",
  "isActive": true
}
```

- **Error Responses:**
- `401 Unauthorized`: Incorrect password.
- `403 Forbidden`: Account is deactivated.
- `404 Not Found`: User does not exist.

---

### 2. Get Current User Profile (`me`)

Retrieves the full profile details of the currently authenticated user, including branch, employee, and teacher data.

- **URL:** `/me`
- **Method:** `GET`
- **Auth Required:** Yes (Valid Access Token)
- **Success Response (200 OK):**

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "role": "TEACHER",
    "isActive": true
  }
}
```

---

### 3. Token Refresh

Issues a new access token using the refresh token stored in cookies. This prevents session expiration during active use.

- **URL:** `/refresh`
- **Method:** `POST`
- **Auth Required:** Yes (Valid Refresh Token in Cookie)
- **Success Response (200 OK):**
- **Cookies Set:** New `accessToken`, `refreshToken` (Rotation)
- **Body:** `{ "message": "Token refreshed successfully" }`

- **Error Responses:**
- `401 Unauthorized`: No refresh token provided or token expired.
- `403 Forbidden`: Token has been revoked or user is inactive.

---

### 4. Update Credentials

Allows a user to change their username or password.

- **URL:** `/update`
- **Method:** `PATCH`
- **Auth Required:** Yes
- **Request Body:**

```json
{
  "tempPassword": "current_password",
  "username": "new_username", // Optional
  "newPassword": "new_secure_password" // Optional
}
```

- **Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Credentials updated successfully"
}
```

---

### 5. Logout

Ends the session and clears all authentication cookies.

- **URL:** `/logout`
- **Method:** `POST`
- **Auth Required:** No (Clears cookies regardless)
- **Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Logged Out"
}
```

---

### 🛠 Technical Specifications

| Feature              | Implementation                      |
| -------------------- | ----------------------------------- |
| **Password Hashing** | Bcrypt (Default: 10 rounds)         |
| **Validation**       | Zod (Strict schema enforcement)     |
| **Database**         | PostgreSQL via Prisma ORM           |
| **Token Security**   | HTTP-Only, Secure, SameSite Cookies |
