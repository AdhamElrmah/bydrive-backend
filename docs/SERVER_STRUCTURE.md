# 📁 Server Structure Documentation

## Overview

The server has been restructured into a modular architecture following industry best practices for better maintainability, scalability, and code organization.

## 🏗️ Project Structure

```
api/
├── lib/
│   └── database.js          # MongoDB connection configuration
├── controllers/
│   ├── authController.js    # Authentication logic (Sign up, Sign in)
│   ├── itemController.js    # Car management (CRUD)
│   ├── rentalsController.js # Rental operations & availability
│   ├── reviewController.js  # Review & Rating management
│   └── usersController.js   # User management
├── middleware/
│   └── authMiddleware.js    # Authentication & Role verification
├── models/
│   ├── Car.js               # Car Mongoose Schema
│   ├── Rental.js            # Rental Mongoose Schema
│   ├── Review.js            # Review Mongoose Schema
│   └── User.js              # User Mongoose Schema
├── routes/
│   ├── auth.js              # Auth endpoints
│   ├── items.js             # Car endpoints
│   ├── rentals.js           # Rental endpoints
│   ├── reviews.js           # Review endpoints
│   └── users.js             # User endpoints
├── scripts/
│   └── seed.js              # Database seeding script
├── server.js                # Main application entry point
├── package.json
└── .env
```

---

## 📂 Module Details

### 1. **lib/** - Configuration & Helpers

#### `lib/database.js`

Handles MongoDB connection management.

**Exports:**

-   `connectDB()` - Establishes MongoDB connection

**Usage:**

```javascript
const connectDB = require("./lib/database");
connectDB();
```

---

### 2. **middleware/** - Middleware Functions

#### `middleware/authMiddleware.js`

Authentication and authorization middleware using JWT.

**Exports:**

-   `protect` - Validates JWT token and attaches user to request
-   `admin` - Verifies that the authenticated user has admin role

**Usage:**

```javascript
const { protect, admin } = require("../middleware/authMiddleware");
router.post("/", protect, admin, addItem);
```

---

### 3. **controllers/** - Business Logic

#### `controllers/itemController.js`

Handles all car-related operations.

**Functions:**

-   `listAllItems(req, res)` - Fetch all cars
-   `getItemById(req, res)` - Get single car details
-   `addItem(req, res)` - Add new car (Admin)
-   `updateItem(req, res)` - Update car details (Admin)
-   `deleteItem(req, res)` - Remove car (Admin)

#### `controllers/rentalsController.js`

Handles all rental-related operations.

**Functions:**

-   `rentItem(req, res)` - Create a new rental
-   `getUserRentals(req, res)` - Get rentals for logged-in user
-   `cancelRental(req, res)` - Cancel a rental
-   `getAllRentals(req, res)` - Get all rentals (Admin)
-   `updateRental(req, res)` - Update rental status (Admin)
-   `checkCarAvailability(req, res)` - Check if car is available for dates

#### `controllers/reviewController.js`

Handles reviews and ratings.

**Functions:**

-   `createReview(req, res)` - Submit a review for a completed rental
-   `getCarReviews(req, res)` - Get reviews for a specific car
-   `getUserReviews(req, res)` - Get reviews by a specific user
-   `deleteReview(req, res)` - Delete a review
-   `getAllReviews(req, res)` - Get all reviews (Admin)

#### `controllers/authController.js`

Handles user authentication.

**Functions:**

-   `signup(req, res)` - Register new user
-   `signin(req, res)` - Login user and return JWT

---

### 4. **utils/** - Utility Functions

#### `utils/fileHelpers.js`

Shared helper functions for file operations (JSON fallback).

**Functions:**

-   `readJsonFile(filename)` - Read and parse a JSON file safely
-   `writeJsonFile(filename, data)` - Write data to a JSON file

---

### 5. **routes/** - Route Definitions

#### `routes/items.js`

Defines car-related API endpoints.

**Routes:**

```javascript
GET    /items/allItems            # Get all cars
GET    /items/:id                 # Get car by ID
POST   /items/                    # Create car (Admin)
PUT    /items/:id                 # Update car (Admin)
DELETE /items/:id                 # Delete car (Admin)
```

#### `routes/rentals.js`

Defines rental-related API endpoints.

**Routes:**

```javascript
POST   /rentals/:id               # Rent a car
GET    /rentals/user              # Get user's rentals
DELETE /rentals/:id               # Cancel rental
POST   /rentals/:id/availability  # Check availability
GET    /rentals/all               # Get all rentals (Admin)
PUT    /rentals/:id               # Update rental (Admin)
```

#### `routes/reviews.js`

Defines review-related API endpoints.

**Routes:**

```javascript
GET    /reviews/car/:carId        # Get car reviews
GET    /reviews/user              # Get user reviews
POST   /reviews                   # Create review
DELETE /reviews/:id               # Delete review
GET    /reviews/all               # Get all reviews (Admin)
```

---

### 6. **server.js** - Main Entry Point

The main application file that:

-   Initializes Express app
-   Loads environment variables
-   Sets up middleware (CORS, JSON parsing)
-   Connects to database
-   Initializes routes
-   Handles errors
-   Starts the server

**Key Features:**

-   ✅ Health check endpoint (`/health`)
-   ✅ Database connection setup
-   ✅ Route registration
-   ✅ Global error handling

---

## ✅ Benefits of Restructuring

### 1. **Separation of Concerns**

Each module has a single, well-defined responsibility.

### 2. **Maintainability**

Easier to find and modify specific functionality.

### 3. **Scalability**

Easy to add new features without cluttering existing code.

### 4. **Security**

Centralized authentication middleware ensures consistent security.

---

## 🚀 How to Use

### Starting the Server

```bash
# Development
npm run dev

# Production
npm start
```

### Environment Variables

Required in `.env`:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
USE_MONGODB=true
```

---

## 🤝 Contributing

When adding new features:

1. Create appropriate controller in `controllers/`
2. Define routes in `routes/`
3. Add middleware if needed in `middleware/`
4. Register routes in `server.js`

---

## ✨ Summary

The restructured server provides:

-   ✅ Clean, modular architecture
-   ✅ Easy to maintain and extend
-   ✅ Industry-standard organization
-   ✅ Comprehensive error handling
-   ✅ Ready for production deployment
