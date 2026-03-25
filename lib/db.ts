import { supabase } from './firebase';

// ------------------------------------------------------------
// Types — column names match the actual Supabase table definitions exactly
// ------------------------------------------------------------

export interface DBUser {
  id: string;
  email: string;
  name: string;
  role: 'teacher' | 'learner';
  avatar_url?: string;
  current_class_id?: string;
  created_at: string;
  updated_at: string;
}

export interface DBClassroom {
  classId: string;
  teacherId: string;
  className: string;
  description?: string;
  accessCode: string;
  createdAt: string;
  updated_at: string;
}

// Column names match the quoted camelCase in your homework table exactly:
// "homeworkId", "createdAt", "accessCode", "homeworkTitle",
// "homeworkContent", "submittedBy", email, "fileUrl", "fileName"
export interface DBHomework {
  homeworkId: number;
  createdAt: string;
  accessCode: string;
  homeworkTitle: string;
  homeworkContent: string;
  submittedBy?: string | null;  // null = teacher post, string = learner name
  email?: string | null;        // null = teacher post, string = learner email
  fileUrl?: string | null;
  fileName?: string | null;
}

// feedback table: "feedbackId", "createdAt", grade, "feedbackContent", teacher, "homeworkId"
export interface DBFeedback {
  feedbackId: number;
  createdAt: string;
  grade?: string;
  feedbackContent?: string;
  teacher?: string;
  homeworkId: number;
}


// ------------------------------------------------------------
// USERS
// ------------------------------------------------------------

export async function getUserById(id: string): Promise<DBUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) return null;
  return data as DBUser | null;
}

export async function updateUserClass(userId: string, classId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ current_class_id: classId, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw new Error(error.message);
}


// ------------------------------------------------------------
// CLASSROOMS
// classrooms table uses: classId, teacherId, className, description, accessCode, createdAt
// ------------------------------------------------------------

export async function createClassroom(fields: {
  teacherId: string;
  className: string;
  description?: string;
  accessCode: string;
}): Promise<DBClassroom> {
  const { data, error } = await supabase
    .from('classrooms')
    .insert({
      teacherId: fields.teacherId,
      className: fields.className,
      description: fields.description ?? null,
      accessCode: fields.accessCode,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as DBClassroom;
}

export async function getClassroomsByTeacher(teacherId: string): Promise<DBClassroom[]> {
  const { data, error } = await supabase
    .from('classrooms')
    .select('*')
    .eq('teacherId', teacherId)
    .order('createdAt', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as DBClassroom[];
}

export async function getClassroomByAccessCode(accessCode: string): Promise<DBClassroom | null> {
  const { data, error } = await supabase
    .from('classrooms')
    .select('*')
    .eq('accessCode', accessCode)
    .maybeSingle();

  if (error) return null;
  return data as DBClassroom | null;
}

export async function getClassroomById(classId: string): Promise<DBClassroom | null> {
  // Try by classId (UUID) first, then fall back to accessCode
  // This handles cases where current_class_id was stored as an accessCode instead of UUID
  const { data } = await supabase
    .from('classrooms')
    .select('*')
    .eq('classId', classId)
    .maybeSingle();

  if (data) return data as DBClassroom;

  // Fall back: try treating the value as an accessCode
  const { data: data2 } = await supabase
    .from('classrooms')
    .select('*')
    .eq('accessCode', classId)
    .maybeSingle();

  return (data2 as DBClassroom | null) ?? null;
}


// ------------------------------------------------------------
// HOMEWORK
// Table columns (all quoted camelCase in Postgres):
//   "homeworkId", "createdAt", "accessCode", "homeworkTitle",
//   "homeworkContent", "submittedBy", email, "fileUrl", "fileName"
//
// Two row types:
//   Teacher post  → submittedBy IS NULL, email IS NULL
//   Learner submit → submittedBy = name,  email = email
// ------------------------------------------------------------

/** Teacher: post a new homework assignment */
export async function createHomework(fields: {
  accessCode: string;
  homeworkTitle: string;
  homeworkContent: string;
}): Promise<DBHomework> {
  const { data, error } = await supabase
    .from('homework')
    .insert({
      accessCode: fields.accessCode,
      homeworkTitle: fields.homeworkTitle,
      homeworkContent: fields.homeworkContent,
      submittedBy: null,
      email: null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as DBHomework;
}

/** Fetch teacher-posted homework for a class.
 *  Accepts either a classId UUID (resolves to accessCode first) or a raw accessCode. */
export async function getHomeworkByClass(classIdOrAccessCode: string): Promise<DBHomework[]> {
  let accessCode = classIdOrAccessCode;

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(classIdOrAccessCode);
  if (isUUID) {
    const classroom = await getClassroomById(classIdOrAccessCode);
    if (!classroom) return [];
    accessCode = classroom.accessCode;
  }

  const { data, error } = await supabase
    .from('homework')
    .select('*')
    .eq('accessCode', accessCode)
    .is('submittedBy', null)
    .order('createdAt', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as DBHomework[];
}

/** Fetch a single homework row by id */
export async function getHomeworkById(homeworkId: number): Promise<DBHomework | null> {
  const { data, error } = await supabase
    .from('homework')
    .select('*')
    .eq('homeworkId', homeworkId)
    .maybeSingle();

  if (error) return null;
  return data as DBHomework | null;
}

/** Learner: submit their work */
export async function submitHomework(fields: {
  accessCode: string;
  homeworkTitle: string;
  homeworkContent: string;
  submittedBy: string;
  email: string;
  fileUrl?: string | null;
  fileName?: string | null;
}): Promise<DBHomework> {
  const { data, error } = await supabase
    .from('homework')
    .insert({
      accessCode: fields.accessCode,
      homeworkTitle: fields.homeworkTitle,
      homeworkContent: fields.homeworkContent,
      submittedBy: fields.submittedBy,
      email: fields.email,
      fileUrl: fields.fileUrl ?? null,
      fileName: fields.fileName ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as DBHomework;
}

/** Teacher: fetch all submissions for a specific homework title in a class */
export async function getSubmissionsForHomework(
  accessCode: string,
  homeworkTitle: string
): Promise<DBHomework[]> {
  const { data, error } = await supabase
    .from('homework')
    .select('*')
    .eq('accessCode', accessCode)
    .eq('homeworkTitle', homeworkTitle)
    .not('submittedBy', 'is', null)
    .order('createdAt', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as DBHomework[];
}

/** Teacher: fetch ALL learner submissions for a class regardless of homework title */
export async function getAllSubmissionsForClass(accessCode: string): Promise<DBHomework[]> {
  const { data, error } = await supabase
    .from('homework')
    .select('*')
    .eq('accessCode', accessCode)
    .not('submittedBy', 'is', null)
    .order('createdAt', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as DBHomework[];
}

/** Learner: fetch all of their own submissions */
export async function getSubmissionsByLearner(email: string): Promise<DBHomework[]> {
  const { data, error } = await supabase
    .from('homework')
    .select('*')
    .eq('email', email)
    .not('submittedBy', 'is', null)
    .order('createdAt', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as DBHomework[];
}


// ------------------------------------------------------------
// FEEDBACK
// Table columns: "feedbackId", "createdAt", grade, "feedbackContent", teacher, "homeworkId"
// ------------------------------------------------------------

/** Teacher: create feedback and grade for a submission */
export async function createFeedback(fields: {
  homeworkId: number;
  grade: string;
  feedbackContent: string;
  teacher: string;
}): Promise<DBFeedback> {
  const { data, error } = await supabase
    .from('feedback')
    .insert({
      homeworkId: fields.homeworkId,
      grade: fields.grade,
      feedbackContent: fields.feedbackContent,
      teacher: fields.teacher,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as DBFeedback;
}

/** Teacher: update existing feedback */
export async function updateFeedback(
  feedbackId: number,
  fields: Partial<{ grade: string; feedbackContent: string }>
): Promise<DBFeedback> {
  const { data, error } = await supabase
    .from('feedback')
    .update(fields)
    .eq('feedbackId', feedbackId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as DBFeedback;
}

/** Fetch feedback for a specific submission */
export async function getFeedbackForHomework(homeworkId: number): Promise<DBFeedback | null> {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('homeworkId', homeworkId)
    .maybeSingle();

  if (error) return null;
  return data as DBFeedback | null;
}

/** Learner: fetch all feedback on their submissions.
 *  Avoids a JOIN — fetches submissions first, then feedback for each. */
export async function getFeedbackByLearnerEmail(
  email: string
): Promise<(DBFeedback & { homework: DBHomework })[]> {
  // 1. Get all learner submissions
  const { data: subs, error: subError } = await supabase
    .from('homework')
    .select('*')
    .eq('email', email)
    .not('submittedBy', 'is', null);

  if (subError) throw new Error(subError.message);
  if (!subs || subs.length === 0) return [];

  // 2. Fetch feedback for each submission in parallel
  const results = await Promise.all(
    (subs as DBHomework[]).map(async (sub) => {
      const { data: fb } = await supabase
        .from('feedback')
        .select('*')
        .eq('homeworkId', sub.homeworkId)
        .maybeSingle();

      if (!fb) return null;
      return { ...(fb as DBFeedback), homework: sub };
    })
  );

  // 3. Filter out submissions with no feedback and sort newest first
  return (results.filter(Boolean) as (DBFeedback & { homework: DBHomework })[])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/** Teacher: fetch all feedback they have given */
export async function getFeedbackByTeacher(teacherName: string): Promise<DBFeedback[]> {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('teacher', teacherName)
    .order('createdAt', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as DBFeedback[];
}

// ------------------------------------------------------------
// STUDENTS
// ------------------------------------------------------------

/** Fetch all students enrolled in a specific class (by classId) */
export async function getStudentsByClass(classId: string): Promise<DBUser[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('current_class_id', classId)
    .eq('role', 'learner')
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as DBUser[];
}

/** Fetch all students across all of a teacher's classes */
export async function getAllStudentsForTeacher(teacherId: string): Promise<
  (DBUser & { className: string; classId: string; accessCode: string })[]
> {
  const classrooms = await getClassroomsByTeacher(teacherId);
  const all: (DBUser & { className: string; classId: string; accessCode: string })[] = [];

  await Promise.all(
    classrooms.map(async (cls) => {
      const students = await getStudentsByClass(cls.classId);
      students.forEach((s) => {
        all.push({ ...s, className: cls.className, classId: cls.classId, accessCode: cls.accessCode });
      });
    })
  );

  // Sort by name
  all.sort((a, b) => a.name.localeCompare(b.name));
  return all;
}