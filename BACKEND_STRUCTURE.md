# 🏗️ ProjectSphere Backend Structure

## Complete File Structure

```
server/
│
├── src/
│   │
│   ├── config/
│   │   ├── db.js                      ✅ Database connection configuration
│   │   ├── passport.js                ✅ Google OAuth strategy configuration
│   │   └── cloudinary.js              ✅ Cloudinary image upload config (optional)
│   │
│   ├── controllers/
│   │   ├── authController.js          ✅ Authentication logic (register, login, OAuth)
│   │   ├── projectController.js       ✅ Project CRUD operations
│   │   ├── adminController.js         ✅ Admin/Lecturer management operations
│   │   ├── notificationController.js  ✅ Notification operations
│   │   └── userController.js          ✅ User profile & follow/unfollow operations
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js          ✅ JWT authentication & protect routes
│   │   ├── roleMiddleware.js          ✅ Role-based access control
│   │   ├── uploadMiddleware.js        ✅ Multer file upload configuration
│   │   └── errorHandler.js            ✅ Global error handling
│   │
│   ├── models/
│   │   ├── userModel.js               ✅ User schema (existing)
│   │   ├── projectModel.js            ✅ Project schema (existing)
│   │   └── notificationModel.js       ✅ Notification schema (existing)
│   │
│   ├── routes/
│   │   ├── authRoutes.js              ✅ /api/auth/* routes
│   │   ├── projectRoutes.js           ✅ /api/projects/* routes (existing)
│   │   ├── adminRoutes.js             ✅ /api/admin/* routes
│   │   ├── notificationRoutes.js      ✅ /api/notifications/* routes
│   │   └── userRoutes.js              ✅ /api/users/* routes
│   │
│   ├── services/
│   │   ├── authService.js             ✅ Authentication business logic
│   │   ├── projectService.js          ✅ Project business logic
│   │   └── notificationService.js     ✅ Notification business logic
│   │
│   ├── events/
│   │   ├── eventEmitter.js            ✅ Event emitter instance
│   │   ├── projectEvents.js           ✅ Project event handlers (for Member 6)
│   │   └── notificationEvents.js      ✅ Notification event handlers (for Member 6)
│   │
│   ├── utils/
│   │   ├── jwt.js                     ✅ JWT token generation & verification
│   │   ├── hashPassword.js            ✅ Password hashing with bcrypt
│   │   └── response.js                ✅ Standardized API responses
│   │
│   ├── validations/
│   │   ├── authValidation.js          ✅ Auth input validation
│   │   └── projectValidation.js       ✅ Project input validation
│   │
│   ├── uploads/                       ✅ File upload directory
│   │   └── .gitkeep
│   │
│   ├── app.js                         ✅ Express app configuration (existing)
│   └── server.js                      ✅ Server entry point (existing)
│
├── .env                               ✅ Environment variables
├── .gitignore                         (existing)
├── package.json                       ✅ Dependencies (existing)
├── package-lock.json                  ✅ (existing)
└── README.md                          ✅ Server documentation

```

## 📁 Folder Purpose

| Folder | Purpose | Owner |
|--------|---------|-------|
| **config/** | Configuration files (DB, Passport, Cloudinary) | Member 4 |
| **controllers/** | Request handlers & business logic | All Members |
| **middleware/** | Auth, roles, uploads, error handling | Member 4 |
| **models/** | Mongoose schemas | All Members |
| **routes/** | API endpoint definitions | All Members |
| **services/** | Reusable business logic layer | All Members |
| **events/** | Event-driven architecture | Member 6 |
| **utils/** | Helper functions (JWT, hashing, responses) | Member 4 |
| **validations/** | Input validation middleware | Member 4 |
| **uploads/** | Static file storage | Member 4 |

## 🔐 Member 4 Responsibilities (Completed)

### Authentication & Security
- ✅ JWT token generation and verification
- ✅ Password hashing with bcrypt
- ✅ Google OAuth with Passport.js
- ✅ Protect middleware for route authentication
- ✅ Role-based access control (Student, Lecturer, Recruiter)

### Middleware
- ✅ authMiddleware.js - JWT verification
- ✅ roleMiddleware.js - Role restrictions
- ✅ uploadMiddleware.js - File upload handling
- ✅ errorHandler.js - Global error handling

### Controllers
- ✅ authController.js - Register, login, logout, profile
- ✅ adminController.js - User & project management
- ✅ userController.js - User profiles & follow system

### Routes
- ✅ authRoutes.js - Authentication endpoints
- ✅ adminRoutes.js - Admin management endpoints
- ✅ userRoutes.js - User interaction endpoints

### Utilities
- ✅ jwt.js - Token operations
- ✅ hashPassword.js - Password security
- ✅ response.js - Standardized responses

### Validations
- ✅ authValidation.js - Auth input validation
- ✅ projectValidation.js - Project input validation

## 🔗 Integration Points

### With Member 1 (Project Management)
- Uses `protect` and `restrictTo` middleware in projectRoutes
- Project ownership verification in projectController

### With Member 6 (Notifications & Events)
- Event emitter setup in `/events`
- Notification controller and routes ready
- Event triggers commented in controllers (ready to integrate)

## 📝 Next Steps

1. Add password field to User model (with select: false)
2. Update package.json with passport dependencies
3. Configure environment variables in .env
4. Integrate auth middleware in existing projectRoutes
5. Connect event emitters with Member 6's implementation

## 🌟 Key Features Implemented

- JWT-based authentication
- Google OAuth 2.0 integration
- Role-based access control (RBAC)
- Password hashing & security
- File upload handling
- Global error handling
- Input validation
- Standardized API responses
- Follow/Unfollow system
- Admin management panel

---

**Structure Created By:** Member 4 (Auth & Security)  
**Date:** June 30, 2026  
**Status:** ✅ Complete
