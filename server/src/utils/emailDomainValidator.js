// Email domain validation for role-based registration

// Allowed domains for each role type
const ALLOWED_RECRUITER_DOMAINS = [
  'wso2.com',
  'syscolabs.com',
  '99x.io',
  'virtusa.com',
  'ifs.com',
  'mitrai.com',
  'codegen.co.uk',
  'hsenidmobile.com',
  'orel.com',
  'creativesoftware.com',
  'surge.global',
  'lseg.com',
  'pearson.com',
  'dialog.lk',
  'mobitel.lk',
  'millenniumit.com',
  'xgengroup.com',
  'zone24x7.com',
  'circles.life',
  'microsoft.com',
  'google.com',
  'amazon.com'
];

const STUDENT_DOMAIN = '@stu.kln.ac.lk';
const LECTURER_DOMAIN = '@kln.ac.lk';

const extractDomain = (email) => {
  if (!email || typeof email !== 'string') return null;
  return email.toLowerCase().trim();
};

export const validateEmailForRole = (email, role) => {
  const normalizedEmail = extractDomain(email);
  if (!normalizedEmail) return { valid: false, message: 'Please use a verified email address to continue' };

  switch (role) {
    case 'Student':
      if (normalizedEmail.endsWith(STUDENT_DOMAIN)) return { valid: true };
      return { valid: false, message: 'Please use a verified email address to continue' };
    case 'Lecturer':
      if (normalizedEmail.endsWith(LECTURER_DOMAIN) && !normalizedEmail.endsWith(STUDENT_DOMAIN)) return { valid: true };
      return { valid: false, message: 'Please use a verified email address to continue' };
    case 'Recruiter':
      const domainPart = normalizedEmail.split('@')[1];
      if (ALLOWED_RECRUITER_DOMAINS.includes(domainPart)) return { valid: true };
      return { valid: false, message: 'Please use a verified email address to continue' };
    default:
      return { valid: false, message: 'Please use a verified email address to continue' };
  }
};

export const getRoleFromEmail = (email) => {
  const normalizedEmail = extractDomain(email);
  if (!normalizedEmail) return null;
  if (normalizedEmail.endsWith(STUDENT_DOMAIN)) return 'Student';
  if (normalizedEmail.endsWith(LECTURER_DOMAIN) && !normalizedEmail.endsWith(STUDENT_DOMAIN)) return 'Lecturer';
  const domainPart = normalizedEmail.split('@')[1];
  if (ALLOWED_RECRUITER_DOMAINS.includes(domainPart)) return 'Recruiter';
  return null;
};

export { ALLOWED_RECRUITER_DOMAINS, STUDENT_DOMAIN, LECTURER_DOMAIN };
