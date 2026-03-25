export type UserRole = 'teacher' | 'learner';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
}

export interface Assignment {
  id: string;
  teacherId: string;
  title: string;
  description: string;
  instructions?: string;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'published' | 'archived';
  maxScore?: number;
  rubric?: RubricItem[];
  attachments?: Attachment[];
  submissionCount?: number;
  averageScore?: number;
}

export interface RubricItem {
  id: string;
  criteria: string;
  points: number;
  description: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface Submission {
  id: string;
  assignmentId: string;
  learnerId: string;
  content?: string;
  files?: Attachment[];
  submittedAt: Date;
  status: 'draft' | 'submitted' | 'graded';
  grade?: number;
  feedback?: string;
  rubricScores?: { [key: string]: number };
  gradedAt?: Date;
  gradedBy?: string;
}

export interface Grade {
  id: string;
  submissionId: string;
  assignmentId: string;
  learnerId: string;
  score: number;
  maxScore: number;
  percentage: number;
  feedback: string;
  gradedAt: Date;
  teacherName: string;
}

export interface Classroom {
  id: string;
  teacherId: string;
  name: string;
  description?: string;
  code?: string;
  students: string[]; // learner IDs
  createdAt: Date;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => void;
}
