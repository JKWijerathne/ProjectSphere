/**
 * Role-based access control middleware
 * Restricts routes to specific user roles
 * 
 * IMPORTANT: Use this middleware AFTER the protect middleware
 * because it requires req.user to be set
 */

/**
 * Restrict access to specific roles
 * @param {...string} roles - Allowed roles (e.g., 'Student', 'Lecturer', 'Recruiter')
 * @returns {Function} Express middleware function
 * 
 * @example
 * router.get('/admin', protect, restrictTo('Lecturer'), getAdminData);
 * router.post('/project', protect, restrictTo('Student'), createProject);
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // Check if user exists (should be attached by protect middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated. Please login first.',
      });
    }

    // Check if user's role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. This route is restricted to ${roles.join(' or ')} only. Your role: ${req.user.role}`,
      });
    }

    // User has the required role, proceed
    next();
  };
};

/**
 * Pre-configured role restrictions for common use cases
 */

// Only students can access
export const isStudent = restrictTo('Student');

// Only lecturers can access
export const isLecturer = restrictTo('Lecturer');

// Only recruiters can access
export const isRecruiter = restrictTo('Recruiter');

// Lecturers are admins in this system
export const isAdmin = restrictTo('Lecturer');

// Students or lecturers can access
export const isStudentOrLecturer = restrictTo('Student', 'Lecturer');

// Lecturers or recruiters can access
export const isLecturerOrRecruiter = restrictTo('Lecturer', 'Recruiter');

// Any authenticated user can access (all roles)
export const isAuthenticated = restrictTo('Student', 'Lecturer', 'Recruiter');

/**
 * Custom ownership check middleware
 * Ensures user can only access/modify their own resources
 * 
 * @param {string} resourceField - The field name that contains the user ID (default: 'owner')
 * @returns {Function} Express middleware function
 * 
 * @example
 * router.put('/project/:id', protect, checkOwnership('owner'), updateProject);
 */
export const checkOwnership = (resourceField = 'owner') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    // The controller should attach the resource to req.resource
    // Or this can be used after fetching the resource
    if (req.resource) {
      const ownerId = req.resource[resourceField];
      
      if (ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to access this resource',
        });
      }
    }

    next();
  };
};
