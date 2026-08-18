/**
 * Mock user profile — replace with Supabase Auth/profile data later.
 */
export const mockUserProfile = {
  displayName: 'Alex Chen',
  email: 'alex.chen@university.edu',
}

export const dashboardStats = {
  totalTasks: 24,
  completed: 14,
  upcoming: 7,
  overallProgress: 58,
}

export const todaysFocusTasks = [
  {
    id: 'tf-1',
    title: 'Complete problem set on eigenvalues',
    subject: 'Linear Algebra',
    priority: 'high',
    dueDate: '2026-08-18',
    completed: false,
  },
  {
    id: 'tf-2',
    title: 'Read Chapter 7 — Memory & Cognition',
    subject: 'Psychology',
    priority: 'medium',
    dueDate: '2026-08-18',
    completed: true,
  },
  {
    id: 'tf-3',
    title: 'Draft introduction for research paper',
    subject: 'English Composition',
    priority: 'high',
    dueDate: '2026-08-19',
    completed: false,
  },
  {
    id: 'tf-4',
    title: 'Review lab safety protocols',
    subject: 'Chemistry',
    priority: 'low',
    dueDate: '2026-08-20',
    completed: false,
  },
]

export const upcomingDeadlines = [
  {
    id: 'dl-1',
    subject: 'Linear Algebra',
    name: 'Midterm Exam',
    date: '2026-08-22',
  },
  {
    id: 'dl-2',
    subject: 'Computer Science',
    name: 'Sorting Algorithms Project',
    date: '2026-08-25',
  },
  {
    id: 'dl-3',
    subject: 'Psychology',
    name: 'Research Methods Essay',
    date: '2026-08-28',
  },
  {
    id: 'dl-4',
    subject: 'Chemistry',
    name: 'Lab Report #3',
    date: '2026-09-02',
  },
]

export const weeklyActivity = [
  { day: 'Mon', hours: 3.5 },
  { day: 'Tue', hours: 5.0 },
  { day: 'Wed', hours: 2.0 },
  { day: 'Thu', hours: 4.5 },
  { day: 'Fri', hours: 6.0 },
  { day: 'Sat', hours: 1.5 },
  { day: 'Sun', hours: 2.5 },
]

export const subjects = [
  {
    id: 'sub-1',
    name: 'Linear Algebra',
    description: 'Vector spaces, matrices, and linear transformations.',
    progress: 72,
    taskCount: 8,
    color: '#4f7cff',
  },
  {
    id: 'sub-2',
    name: 'Computer Science',
    description: 'Data structures, algorithms, and systems design.',
    progress: 55,
    taskCount: 6,
    color: '#22c55e',
  },
  {
    id: 'sub-3',
    name: 'Psychology',
    description: 'Cognitive processes, research methods, and behavior.',
    progress: 40,
    taskCount: 5,
    color: '#f59e0b',
  },
  {
    id: 'sub-4',
    name: 'Chemistry',
    description: 'Organic chemistry fundamentals and lab work.',
    progress: 85,
    taskCount: 3,
    color: '#a855f7',
  },
  {
    id: 'sub-5',
    name: 'English Composition',
    description: 'Academic writing, rhetoric, and research papers.',
    progress: 30,
    taskCount: 4,
    color: '#ec4899',
  },
]

export const initialTasks = [
  {
    id: 'task-1',
    title: 'Complete problem set on eigenvalues',
    subject: 'Linear Algebra',
    priority: 'high',
    status: 'in-progress',
    dueDate: '2026-08-18',
    completed: false,
  },
  {
    id: 'task-2',
    title: 'Implement merge sort visualization',
    subject: 'Computer Science',
    priority: 'high',
    status: 'pending',
    dueDate: '2026-08-25',
    completed: false,
  },
  {
    id: 'task-3',
    title: 'Read Chapter 7 — Memory & Cognition',
    subject: 'Psychology',
    priority: 'medium',
    status: 'completed',
    dueDate: '2026-08-18',
    completed: true,
  },
  {
    id: 'task-4',
    title: 'Draft introduction for research paper',
    subject: 'English Composition',
    priority: 'high',
    status: 'in-progress',
    dueDate: '2026-08-19',
    completed: false,
  },
  {
    id: 'task-5',
    title: 'Review lab safety protocols',
    subject: 'Chemistry',
    priority: 'low',
    status: 'pending',
    dueDate: '2026-08-20',
    completed: false,
  },
  {
    id: 'task-6',
    title: 'Study group notes — vector spaces',
    subject: 'Linear Algebra',
    priority: 'medium',
    status: 'pending',
    dueDate: '2026-08-21',
    completed: false,
  },
  {
    id: 'task-7',
    title: 'Binary search tree practice problems',
    subject: 'Computer Science',
    priority: 'medium',
    status: 'pending',
    dueDate: '2026-08-23',
    completed: false,
  },
  {
    id: 'task-8',
    title: 'Submit IRB consent form draft',
    subject: 'Psychology',
    priority: 'low',
    status: 'completed',
    dueDate: '2026-08-15',
    completed: true,
  },
]

export const allDeadlines = [
  {
    id: 'deadline-1',
    subject: 'Linear Algebra',
    name: 'Midterm Exam',
    type: 'exam',
    date: '2026-08-22',
  },
  {
    id: 'deadline-2',
    subject: 'Computer Science',
    name: 'Sorting Algorithms Project',
    type: 'assignment',
    date: '2026-08-25',
  },
  {
    id: 'deadline-3',
    subject: 'Psychology',
    name: 'Research Methods Essay',
    type: 'assignment',
    date: '2026-08-28',
  },
  {
    id: 'deadline-4',
    subject: 'Chemistry',
    name: 'Lab Report #3',
    type: 'assignment',
    date: '2026-09-02',
  },
  {
    id: 'deadline-5',
    subject: 'English Composition',
    name: 'Final Research Paper',
    type: 'assignment',
    date: '2026-09-10',
  },
  {
    id: 'deadline-6',
    subject: 'Computer Science',
    name: 'Final Exam',
    type: 'exam',
    date: '2026-09-15',
  },
]

export const subjectNames = subjects.map((s) => s.name)

/** Weekly study hour goal for productivity visualization */
export const weeklyStudyGoal = 25
