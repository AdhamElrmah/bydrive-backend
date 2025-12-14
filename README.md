# ByDrive - Car Rental Platform Backend

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

A robust RESTful API backend for the ByDrive car rental platform. Built with Node.js, Express, and MongoDB.

[Features](#features) • [Installation](#installation) • [API Reference](#api-reference) • [Configuration](#configuration) • [Deployment](#deployment)

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [API Reference](#-api-reference)
  - [Authentication](#authentication)
  - [Cars (Items)](#cars-items)
  - [Rentals](#rentals)
  - [Reviews](#reviews)
  - [Users](#users)
- [Database Models](#-database-models)
- [Authentication & Authorization](#-authentication--authorization)
- [Error Handling](#-error-handling)
- [Deployment](#-deployment)
- [Scripts](#-scripts)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

- **User Authentication** - Secure JWT-based registration and login
- **Car Management** - Full CRUD operations for car inventory
- **Rental System** - Book cars, check availability, manage reservations
- **Review & Rating System** - Users can review cars after completing rentals
- **Role-Based Access Control** - Admin and User roles with different permissions
- **Dual Storage Support** - MongoDB or JSON file-based storage
- **RESTful API Design** - Clean and intuitive API endpoints
- **CORS Enabled** - Pre-configured for frontend integration
- **Vercel Ready** - Configured for seamless Vercel deployment

---

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | Web application framework |
| **MongoDB/Mongoose** | Database & ODM |
| **JWT** | Authentication tokens |
| **bcryptjs** | Password hashing |
| **dotenv** | Environment variables |
| **cors** | Cross-Origin Resource Sharing |
| **nodemon** | Development auto-reload |

---

## 📁 Project Structure

```
api/
├── controllers/           # Request handlers / Business logic
│   ├── authController.js      # Authentication (signup/signin)
│   ├── itemController.js      # Car CRUD operations
│   ├── rentalsController.js   # Rental management
│   ├── reviewController.js    # Review & rating system
│   └── usersController.js     # User management
├── docs/                  # Documentation
│   ├── ARCHITECTURE_DIAGRAM.md
│   └── SERVER_STRUCTURE.md
├── lib/                   # Utility libraries
│   └── database.js            # Database connection
├── middleware/            # Express middleware
│   └── authMiddleware.js      # JWT verification & role checks
├── models/                # Mongoose schemas
│   ├── Car.js                 # Car model
│   ├── Rental.js              # Rental model
│   ├── Review.js              # Review model
│   └── User.js                # User model
├── routes/                # API route definitions
│   ├── auth.js                # /auth routes
│   ├── items.js               # /items routes
│   ├── rentals.js             # /rentals routes
│   ├── reviews.js             # /reviews routes
│   └── users.js               # /users routes
├── scripts/               # Database utilities
│   ├── migrate.js             # Data migration script
│   └── seed.js                # Database seeding
├── utils/                 # Helper functions
│   └── fileHelpers.js         # JSON file operations
├── .env                   # Environment variables (not in repo)
├── .gitignore             # Git ignore rules
├── cars.json              # Car data (JSON fallback)
├── package.json           # Dependencies & scripts
├── server.js              # Application entry point
└── vercel.json            # Vercel deployment config
```

---

## 🚀 Installation

### Prerequisites

- Node.js 18+ installed
- MongoDB instance (local or Atlas) - *optional if using JSON storage*
- npm or yarn package manager

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/bydrive-backend.git
   cd bydrive-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database
   USE_MONGODB=true
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bydrive?retryWrites=true&w=majority

   # JWT Authentication
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRES_IN=7d

   # Optional: Seed database on startup
   SEED_ON_STARTUP=false
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:5000`

---

## ⚙ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `USE_MONGODB` | Use MongoDB (`true`) or JSON files (`false`) | `false` |
| `MONGODB_URI` | MongoDB connection string | - |
| `JWT_SECRET` | Secret key for JWT signing | `fallback_secret_key` |
| `JWT_EXPIRES_IN` | JWT token expiration | `7d` |
| `SEED_ON_STARTUP` | Auto-seed database on start | `false` |

### CORS Configuration

The API is pre-configured to accept requests from:
- `http://localhost:3000` (React default)
- `http://localhost:5173` (Vite default)
- `http://localhost:3001` (Alternative)
- Production Netlify URLs

Modify `corsOptions` in `server.js` to add additional origins.

---

## 📚 API Reference

Base URL: `http://localhost:5000`

### Health Check

```http
GET /health
```

Returns server status, environment, database type, and timestamp.

---

### Authentication

#### Register a new user

```http
POST /auth/signup
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123",
  "phoneNumber": "+1234567890"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "64abc123...",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Login

```http
POST /auth/signin
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

> **Note:** You can use either email or username in the `email` field.

---

### Cars (Items)

#### Get all cars

```http
GET /items/allItems
```

**Response:** Array of all cars

#### Get car by ID

```http
GET /items/:id
```

#### Add a new car (Admin only)

```http
POST /items
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "id": "car-001",
  "make": "Toyota",
  "model": "Camry",
  "year": 2024,
  "body_type": "Sedan",
  "seats": 5,
  "transmission": "automatic",
  "fuel_type": "Gasoline",
  "price_per_day": 75,
  "images": {
    "main": "https://example.com/car.jpg"
  }
}
```

#### Update a car (Admin only)

```http
PUT /items/:id
Authorization: Bearer <token>
```

#### Delete a car (Admin only)

```http
DELETE /items/:id
Authorization: Bearer <token>
```

---

### Rentals

#### Check car availability

```http
POST /rentals/:carId/availability
```

**Request Body:**
```json
{
  "startDate": "2024-01-15",
  "endDate": "2024-01-20"
}
```

#### Get bookings for a car

```http
GET /rentals/:carId/bookings
```

Returns active bookings for availability calendar display.

#### Create a rental

```http
POST /rentals/:carId
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "startDate": "2024-01-15",
  "endDate": "2024-01-20",
  "pickupLocation": "Airport Terminal",
  "dropoffLocation": "Downtown Office",
  "specialRequests": "Child seat needed",
  "paymentInfo": {
    "method": "credit_card",
    "cardNumber": "****4242"
  }
}
```

#### Get user's rentals

```http
GET /rentals/user
Authorization: Bearer <token>
```

#### Cancel a rental

```http
DELETE /rentals/:rentalId
Authorization: Bearer <token>
```

#### Get all rentals (Admin only)

```http
GET /rentals/all
Authorization: Bearer <token>
```

#### Update rental status (Admin only)

```http
PUT /rentals/:rentalId
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "completed"
}
```

---

### Reviews

#### Get reviews for a car

```http
GET /reviews/car/:carId
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Response:**
```json
{
  "reviews": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  },
  "stats": {
    "average": 4.5,
    "count": 25
  }
}
```

#### Check review eligibility

```http
GET /reviews/eligibility/:carId
Authorization: Bearer <token>
```

Returns whether user can review (must have completed rental).

#### Create a review

```http
POST /reviews
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "carId": "car-001",
  "rating": 5,
  "comment": "Excellent car, very smooth ride!"
}
```

> **Note:** User must have a completed rental for the car to leave a review.

#### Get user's reviews

```http
GET /reviews/user
Authorization: Bearer <token>
```

#### Update a review

```http
PUT /reviews/:reviewId
Authorization: Bearer <token>
```

#### Delete a review

```http
DELETE /reviews/:reviewId
Authorization: Bearer <token>
```

#### Get all reviews (Admin only)

```http
GET /reviews/all
Authorization: Bearer <token>
```

---

### Users

#### Get all users (Admin only)

```http
GET /users
Authorization: Bearer <token>
```

#### Get user by ID

```http
GET /users/:userId
Authorization: Bearer <token>
```

#### Create a user

```http
POST /users
```

#### Update user profile

```http
PUT /users/:userId
Authorization: Bearer <token>
```

#### Delete user (Admin only)

```http
DELETE /users/:userId
Authorization: Bearer <token>
```

---

## 📊 Database Models

### Car Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Unique car identifier |
| `make` | String | Car manufacturer (e.g., Toyota) |
| `model` | String | Car model (e.g., Camry) |
| `year` | Number | Manufacturing year |
| `body_type` | String | Body type (Sedan, SUV, etc.) |
| `seats` | Number | Number of seats |
| `transmission` | String | Transmission type |
| `fuel_type` | String | Fuel type |
| `engine` | Object | Engine specifications |
| `colors` | Object | Exterior/interior colors |
| `primary_features` | Array | Key features |
| `additional_features` | Array | Extra features |
| `images` | Object | Car images (main, sub1-4) |
| `price_per_day` | Number | Daily rental price |
| `available` | Boolean | Availability status |

### User Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | Number | User ID |
| `firstName` | String | First name |
| `lastName` | String | Last name |
| `username` | String | Unique username |
| `email` | String | Unique email address |
| `phoneNumber` | String | Contact number |
| `passwordHash` | String | Hashed password (hidden) |
| `role` | String | `user` or `admin` |
| `createdAt` | Date | Registration date |

### Rental Model

| Field | Type | Description |
|-------|------|-------------|
| `carId` | Mixed | Reference to car |
| `userId` | Mixed | Reference to user |
| `startDate` | String | Rental start date |
| `endDate` | String | Rental end date |
| `pickupLocation` | String | Pickup location |
| `dropoffLocation` | String | Drop-off location |
| `totalDays` | Number | Number of rental days |
| `pricePerDay` | Number | Daily price |
| `totalPrice` | Number | Total rental cost |
| `status` | String | `active`, `completed`, `cancelled` |
| `paymentInfo` | Object | Payment details |

### Review Model

| Field | Type | Description |
|-------|------|-------------|
| `carId` | Mixed | Reference to car |
| `userId` | Mixed | Reference to user |
| `rentalId` | Mixed | Reference to rental |
| `rating` | Number | 1-5 star rating |
| `comment` | String | Review comment (max 500 chars) |
| `username` | String | Reviewer's username |
| `createdAt` | Date | Review date |

---

## 🔐 Authentication & Authorization

### JWT Authentication

All protected routes require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **User** | View cars, make/cancel own rentals, write reviews for rented cars, manage own profile |
| **Admin** | All user permissions + manage cars, view all users/rentals/reviews, update rental status, delete users/reviews |

### Protected Routes

| Route | Access Level |
|-------|--------------|
| `POST /items` | Admin |
| `PUT /items/:id` | Admin |
| `DELETE /items/:id` | Admin |
| `GET /users` | Admin |
| `DELETE /users/:id` | Admin |
| `GET /rentals/all` | Admin |
| `PUT /rentals/:id` | Admin |
| `POST /rentals/:id` | User (authenticated) |
| `POST /reviews` | User (authenticated + completed rental) |

---

## ⚠ Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message description"
}
```

### Common Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request - Invalid input |
| `401` | Unauthorized - Invalid/missing token |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found |
| `409` | Conflict - Duplicate resource |
| `500` | Server Error |

---

## 🌐 Deployment

### Vercel Deployment

The project includes `vercel.json` for seamless Vercel deployment:

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Set environment variables in Vercel dashboard:
   - `USE_MONGODB=true`
   - `MONGODB_URI=your-mongodb-uri`
   - `JWT_SECRET=your-secret`
   - `JWT_EXPIRES_IN=7d`
   - `NODE_ENV=production`

### Production Checklist

- [ ] Use strong, unique `JWT_SECRET`
- [ ] Configure MongoDB Atlas IP whitelist
- [ ] Set `NODE_ENV=production`
- [ ] Update CORS origins for production domains
- [ ] Enable MongoDB connection pooling
- [ ] Set up monitoring and logging

---

## 📜 Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Start** | `npm start` | Start production server |
| **Dev** | `npm run dev` | Start with auto-reload (nodemon) |
| **Migrate** | `npm run migrate` | Run database migrations |
| **Seed** | `npm run seed` | Seed database with sample data |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

<div align="center">

[⬆ Back to Top](#bydrive---car-rental-platform-backend)

</div>
