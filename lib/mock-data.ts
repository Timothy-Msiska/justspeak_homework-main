import { User, Assignment, Submission, Grade, Classroom } from './types';

// Mock users
export const mockUsers: Record<string, User> = {
  teacher1: {
    id: 'teacher1',
    email: 'teacher@example.com',
    name: 'Mrs. Sarah Johnson',
    role: 'teacher',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    createdAt: new Date('2023-01-15'),
  },
  learner1: {
    id: 'learner1',
    email: 'student1@example.com',
    name: 'Alex Chen',
    role: 'learner',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    createdAt: new Date('2023-02-01'),
  },
  learner2: {
    id: 'learner2',
    email: 'student2@example.com',
    name: 'Jamie Smith',
    role: 'learner',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jamie',
    createdAt: new Date('2023-02-01'),
  },
  learner3: {
    id: 'learner3',
    email: 'student3@example.com',
    name: 'Taylor Brown',
    role: 'learner',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor',
    createdAt: new Date('2023-02-01'),
  },
  learner4: {
    id: 'learner4',
    email: 'student4@example.com',
    name: 'Jordan Davis',
    role: 'learner',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan',
    createdAt: new Date('2023-02-01'),
  },
};

// Mock assignments
export const mockAssignments: Assignment[] = [
  {
    id: 'assign1',
    teacherId: 'teacher1',
    title: 'Research Paper: Climate Change',
    description: 'Write a comprehensive research paper on the impacts of climate change',
    instructions: 'Please research recent climate studies and compile a 3000-word paper with proper citations. Include an introduction, main body with at least 3 major sections, and a conclusion.',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
    status: 'published',
    maxScore: 100,
    rubric: [
      { id: 'r1', criteria: 'Research Quality', points: 30, description: 'Use of credible sources and depth of research' },
      { id: 'r2', criteria: 'Writing Quality', points: 25, description: 'Clarity, grammar, and organization' },
      { id: 'r3', criteria: 'Citations', points: 20, description: 'Proper use of APA format' },
      { id: 'r4', criteria: 'Originality', points: 25, description: 'Unique insights and personal analysis' },
    ],
    submissionCount: 3,
    averageScore: 82,
  },
  {
    id: 'assign2',
    teacherId: 'teacher1',
    title: 'Math Problem Set: Calculus',
    description: 'Complete the calculus problem set covering derivatives and integrals',
    instructions: 'Solve all 20 problems. Show all work. Problems 1-10 cover derivatives, problems 11-20 cover integrals.',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-05'),
    status: 'published',
    maxScore: 100,
    rubric: [
      { id: 'r5', criteria: 'Correct Answers', points: 70, description: 'Accuracy of solutions' },
      { id: 'r6', criteria: 'Work Shown', points: 30, description: 'Clear presentation of steps' },
    ],
    submissionCount: 2,
    averageScore: 78,
  },
  {
    id: 'assign3',
    teacherId: 'teacher1',
    title: 'Essay: American History',
    description: 'Analyze the causes and consequences of the American Civil War',
    instructions: 'Write a 2000-word essay analyzing the causes and consequences of the American Civil War. Include primary source quotes.',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10'),
    status: 'published',
    maxScore: 100,
    submissionCount: 0,
    averageScore: 0,
  },
];

// Mock submissions
export const mockSubmissions: Submission[] = [
  {
    id: 'sub1',
    assignmentId: 'assign1',
    learnerId: 'learner1',
    content: 'Climate change is a pressing global issue... [full essay content]',
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: 'graded',
    grade: 85,
    feedback: 'Excellent research and well-organized essay. Great use of sources. Could expand more on future predictions.',
    gradedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    gradedBy: 'teacher1',
    rubricScores: {
      'r1': 28,
      'r2': 24,
      'r3': 20,
      'r4': 13,
    },
  },
  {
    id: 'sub2',
    assignmentId: 'assign1',
    learnerId: 'learner2',
    content: 'This paper examines climate change from multiple perspectives...',
    submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    status: 'graded',
    grade: 92,
    feedback: 'Outstanding work! Comprehensive research with excellent analysis. Well-deserved A grade.',
    gradedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    gradedBy: 'teacher1',
    rubricScores: {
      'r1': 30,
      'r2': 24,
      'r3': 20,
      'r4': 18,
    },
  },
  {
    id: 'sub3',
    assignmentId: 'assign1',
    learnerId: 'learner3',
    content: 'Climate change affects our planet...',
    submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    status: 'graded',
    grade: 71,
    feedback: 'Good effort but needs more depth in research. Consider using more recent studies.',
    gradedAt: new Date(),
    gradedBy: 'teacher1',
    rubricScores: {
      'r1': 20,
      'r2': 22,
      'r3': 18,
      'r4': 11,
    },
  },
  {
    id: 'sub4',
    assignmentId: 'assign2',
    learnerId: 'learner1',
    content: 'Problem 1: f(x) = 3x^2 + 2x, f\'(x) = 6x + 2...',
    submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    status: 'submitted',
  },
  {
    id: 'sub5',
    assignmentId: 'assign2',
    learnerId: 'learner2',
    content: 'Solution set for calculus problem set...',
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: 'submitted',
  },
  {
    id: 'sub6',
    assignmentId: 'assign2',
    learnerId: 'learner4',
    content: 'In progress...',
    submittedAt: new Date(),
    status: 'draft',
  },
];

// Mock grades
export const mockGrades: Grade[] = [
  {
    id: 'grade1',
    submissionId: 'sub1',
    assignmentId: 'assign1',
    learnerId: 'learner1',
    score: 85,
    maxScore: 100,
    percentage: 85,
    feedback: 'Excellent research and well-organized essay.',
    gradedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    teacherName: 'Mrs. Sarah Johnson',
  },
  {
    id: 'grade2',
    submissionId: 'sub2',
    assignmentId: 'assign1',
    learnerId: 'learner2',
    score: 92,
    maxScore: 100,
    percentage: 92,
    feedback: 'Outstanding work! Comprehensive research with excellent analysis.',
    gradedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    teacherName: 'Mrs. Sarah Johnson',
  },
  {
    id: 'grade3',
    submissionId: 'sub3',
    assignmentId: 'assign1',
    learnerId: 'learner3',
    score: 71,
    maxScore: 100,
    percentage: 71,
    feedback: 'Good effort but needs more depth in research.',
    gradedAt: new Date(),
    teacherName: 'Mrs. Sarah Johnson',
  },
];

// Mock classrooms
export const mockClassrooms: Classroom[] = [
  {
    id: 'class1',
    teacherId: 'teacher1',
    name: 'English 101',
    description: 'Introduction to English Literature',
    code: 'ENG101',
    students: ['learner1', 'learner2', 'learner3'],
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'class2',
    teacherId: 'teacher1',
    name: 'History 201',
    description: 'American History',
    code: 'HIST201',
    students: ['learner1', 'learner2', 'learner3', 'learner4'],
    createdAt: new Date('2024-01-15'),
  },
];

// Helper function to get current user from localStorage (mock)
export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const userId = localStorage.getItem('currentUserId');
  return userId && mockUsers[userId as keyof typeof mockUsers] ? mockUsers[userId as keyof typeof mockUsers] : null;
};

// Helper function to set current user (mock)
export const setCurrentUser = (userId: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('currentUserId', userId);
};

// Helper function to get submissions by assignment
export const getSubmissionsByAssignment = (assignmentId: string): Submission[] => {
  return mockSubmissions.filter((s) => s.assignmentId === assignmentId);
};

// Helper function to get grades by learner
export const getGradesByLearner = (learnerId: string): Grade[] => {
  return mockGrades.filter((g) => g.learnerId === learnerId);
};

// Helper function to get assignments by teacher
export const getAssignmentsByTeacher = (teacherId: string): Assignment[] => {
  return mockAssignments.filter((a) => a.teacherId === teacherId);
};
