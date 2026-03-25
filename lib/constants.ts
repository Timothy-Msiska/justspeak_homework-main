export const ROLES = {
  TEACHER: 'teacher',
  LEARNER: 'learner',
} as const;

export const ASSIGNMENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

export const SUBMISSION_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  GRADED: 'graded',
} as const;

export const GRADE_SCALE = {
  A: { min: 90, max: 100, label: 'A' },
  B: { min: 80, max: 89, label: 'B' },
  C: { min: 70, max: 79, label: 'C' },
  D: { min: 60, max: 69, label: 'D' },
  F: { min: 0, max: 59, label: 'F' },
} as const;

export const getGradeLabel = (percentage: number): string => {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
};

export const APP_ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  FORGOT_PASSWORD: '/auth/forgot-password',
  DASHBOARD: '/dashboard',
  TEACHER_DASHBOARD: '/dashboard/teacher',
  LEARNER_DASHBOARD: '/dashboard/learner',
  ASSIGNMENTS: '/dashboard/teacher/assignments',
  CREATE_ASSIGNMENT: '/dashboard/teacher/assignments/create',
  SUBMISSIONS: '/dashboard/teacher/submissions',
  STUDENTS: '/dashboard/teacher/students',
  ANALYTICS: '/dashboard/teacher/analytics',
  LEARNER_ASSIGNMENTS: '/dashboard/learner/assignments',
  LEARNER_SUBMISSIONS: '/dashboard/learner/submissions',
  LEARNER_GRADES: '/dashboard/learner/grades',
} as const;
