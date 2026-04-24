/**
 * devMocks.ts — Rich stub data for browser development.
 *
 * This file is only used when Vite is running in dev mode and API requests fail.
 * It is not bundled into production builds.
 */

import type { Student } from "../store/authStore";
import type { Course, Department, Resource } from "../store/contentStore";
import type { PaymentInstructions, Performance, Plan, ExamPaper } from "./quiz";
import type { AttemptSummary, Question, QuizAnswer, QuizMode } from "../store/quizStore";

export const MOCK_DEPARTMENTS: Department[] = [
    { id: 1, name: "Computer Science & Engineering", code: "CSE" },
    { id: 2, name: "Electrical & Computer Engineering", code: "ECE" },
    { id: 3, name: "Civil & Environmental Engineering", code: "CEE" },
    { id: 4, name: "Mechanical Engineering", code: "ME" },
    { id: 5, name: "Business Administration", code: "BA" },
    { id: 6, name: "Accounting & Finance", code: "AF" },
];

export const MOCK_COURSES: Course[] = [
    { id: 1, name: "Data Structures & Algorithms", code: "CS301", department: 1, year: 2, semester: 1 },
    { id: 2, name: "Operating Systems", code: "CS402", department: 1, year: 3, semester: 1 },
    { id: 3, name: "Database Systems", code: "CS305", department: 1, year: 2, semester: 2 },
    { id: 4, name: "Computer Networks", code: "CS410", department: 1, year: 3, semester: 2 },
    { id: 5, name: "Software Engineering", code: "CS450", department: 1, year: 4, semester: 1 },
    { id: 6, name: "Artificial Intelligence", code: "CS460", department: 1, year: 4, semester: 2 },
    { id: 7, name: "Digital Signal Processing", code: "ECE320", department: 2, year: 3, semester: 1 },
    { id: 8, name: "Entrepreneurship", code: "BA220", department: 5, year: 2, semester: 1 },
];

export const MOCK_RESOURCES: Resource[] = [
    {
        id: 1,
        title: "DSA Sprint Notes",
        description: "A condensed revision pack for arrays, stacks, queues, trees, heaps, and graph traversal patterns.",
        file_type: "lecture_note",
        access_level: "free",
        status: "published",
        course: 1,
        downloads_count: 432,
        created_at: "2026-03-09T10:00:00Z",
        is_locked: false,
        author: "UniPortal Academic Team",
        pages: 54,
        file_size_mb: 3.1,
        estimated_minutes: 42,
        tags: ["revision", "algorithms", "midterm"],
    },
    {
        id: 2,
        title: "DSA Practice Worksheet Set A",
        description: "Progressive exercises on recursion, time complexity, linked lists, and binary search trees.",
        file_type: "worksheet",
        access_level: "free",
        status: "published",
        course: 1,
        downloads_count: 278,
        created_at: "2026-03-04T08:30:00Z",
        is_locked: false,
        author: "UniPortal Tutors",
        pages: 18,
        file_size_mb: 1.2,
        estimated_minutes: 30,
        tags: ["practice", "worksheet", "data structures"],
    },
    {
        id: 3,
        title: "2025 DSA Final Review Paper",
        description: "Curated past-style exam with worked solutions and examiner-style marking notes.",
        file_type: "past_exam",
        access_level: "premium",
        status: "published",
        course: 1,
        downloads_count: 189,
        created_at: "2026-02-27T06:15:00Z",
        is_locked: false,
        author: "Assessment Lab",
        pages: 26,
        file_size_mb: 2.4,
        estimated_minutes: 55,
        tags: ["past exam", "final", "solutions"],
    },
    {
        id: 4,
        title: "Operating Systems Memory Management Cheatsheet",
        description: "Fast reference for paging, segmentation, virtual memory, and replacement algorithms.",
        file_type: "lecture_note",
        access_level: "free",
        status: "published",
        course: 2,
        downloads_count: 341,
        created_at: "2026-03-08T09:00:00Z",
        is_locked: false,
        author: "Systems Faculty",
        pages: 22,
        file_size_mb: 1.8,
        estimated_minutes: 20,
        tags: ["memory", "cheatsheet", "exam-prep"],
    },
    {
        id: 5,
        title: "Operating Systems Process Scheduling Worksheet",
        description: "Hands-on scheduling drills covering FCFS, SJF, RR, starvation, and throughput analysis.",
        file_type: "worksheet",
        access_level: "premium",
        status: "published",
        course: 2,
        downloads_count: 146,
        created_at: "2026-02-22T12:00:00Z",
        is_locked: false,
        author: "Systems Faculty",
        pages: 16,
        file_size_mb: 1.1,
        estimated_minutes: 25,
        tags: ["scheduling", "practice", "cpu"],
    },
    {
        id: 6,
        title: "Database Systems SQL Drill Pack",
        description: "Query practice covering joins, aggregation, normalization, transactions, and indexing.",
        file_type: "worksheet",
        access_level: "free",
        status: "published",
        course: 3,
        downloads_count: 221,
        created_at: "2026-03-01T07:45:00Z",
        is_locked: false,
        author: "Database Unit",
        pages: 20,
        file_size_mb: 1.6,
        estimated_minutes: 35,
        tags: ["sql", "worksheet", "practice"],
    },
    {
        id: 7,
        title: "Computer Networks Layer-by-Layer Summary",
        description: "High-yield overview of OSI and TCP/IP layers with diagrams and protocol examples.",
        file_type: "lecture_note",
        access_level: "free",
        status: "published",
        course: 4,
        downloads_count: 254,
        created_at: "2026-03-10T11:20:00Z",
        is_locked: false,
        author: "Networks Desk",
        pages: 31,
        file_size_mb: 2.2,
        estimated_minutes: 26,
        tags: ["networking", "protocols", "summary"],
    },
    {
        id: 8,
        title: "Software Engineering Requirements Template",
        description: "Sample SRS template with use cases, traceability matrix, and review checklist.",
        file_type: "lecture_note",
        access_level: "premium",
        status: "published",
        course: 5,
        downloads_count: 91,
        created_at: "2026-02-19T10:00:00Z",
        is_locked: false,
        author: "Project Studio",
        pages: 37,
        file_size_mb: 2.8,
        estimated_minutes: 28,
        tags: ["requirements", "template", "project"],
    },
    {
        id: 9,
        title: "AI Search Algorithms Quick Drill",
        description: "Mini-question bank on BFS, DFS, A*, admissibility, and heuristic design.",
        file_type: "worksheet",
        access_level: "premium",
        status: "published",
        course: 6,
        downloads_count: 118,
        created_at: "2026-03-05T14:20:00Z",
        is_locked: false,
        author: "AI Lab",
        pages: 14,
        file_size_mb: 1.0,
        estimated_minutes: 18,
        tags: ["search", "heuristics", "ai"],
    },
    {
        id: 10,
        title: "2024 Computer Science Exit Exam Pack",
        description: "Timed exit exam paper with answer review cues and competency map by topic.",
        file_type: "exit_exam",
        access_level: "premium",
        status: "published",
        course: 6,
        downloads_count: 204,
        created_at: "2026-02-25T16:10:00Z",
        is_locked: false,
        author: "National Exam Prep Desk",
        pages: 44,
        file_size_mb: 3.8,
        estimated_minutes: 120,
        tags: ["exit exam", "competency", "timed"],
    },
];

export const MOCK_QUESTIONS: Record<number, Question[]> = {
    1: [
        {
            id: 1001,
            text: "Which data structure guarantees O(1) access by index and amortized O(1) append?",
            option_a: "Linked list",
            option_b: "Dynamic array",
            option_c: "Binary search tree",
            option_d: "Stack",
            correct_option: "b",
            explanation: "Dynamic arrays support direct indexed access and typically grow by resizing, giving amortized O(1) append.",
            topic_tags: ["arrays", "complexity"],
            topic: "Arrays",
            difficulty: "easy",
            hint: "Think about contiguous memory.",
        },
        {
            id: 1002,
            text: "In a balanced binary search tree, average search time is closest to:",
            option_a: "O(1)",
            option_b: "O(log n)",
            option_c: "O(n)",
            option_d: "O(n log n)",
            correct_option: "b",
            explanation: "Balanced BSTs keep height near log n, so searches traverse about log n levels.",
            topic_tags: ["trees", "complexity"],
            topic: "Trees",
            difficulty: "easy",
        },
        {
            id: 1003,
            text: "Which traversal visits nodes in sorted order for a BST?",
            option_a: "Preorder",
            option_b: "Postorder",
            option_c: "Level order",
            option_d: "Inorder",
            correct_option: "d",
            explanation: "Inorder traversal of a BST yields keys in ascending order.",
            topic_tags: ["trees", "traversal"],
            topic: "Trees",
            difficulty: "easy",
        },
        {
            id: 1004,
            text: "What is the worst-case time complexity of quicksort when the pivot choice is poor?",
            option_a: "O(log n)",
            option_b: "O(n)",
            option_c: "O(n log n)",
            option_d: "O(n^2)",
            correct_option: "d",
            explanation: "Repeatedly partitioning into extremely unbalanced subarrays leads to O(n^2).",
            topic_tags: ["sorting"],
            topic: "Sorting",
            difficulty: "medium",
        },
        {
            id: 1005,
            text: "Which graph traversal is best suited for finding the shortest path in an unweighted graph?",
            option_a: "Depth-first search",
            option_b: "Breadth-first search",
            option_c: "Topological sort",
            option_d: "Prim's algorithm",
            correct_option: "b",
            explanation: "BFS explores by layers, so the first time a node is reached is via the shortest unweighted path.",
            topic_tags: ["graphs", "bfs"],
            topic: "Graphs",
            difficulty: "medium",
        },
        {
            id: 1006,
            text: "A stack follows which access rule?",
            option_a: "FIFO",
            option_b: "LILO",
            option_c: "LIFO",
            option_d: "Random access",
            correct_option: "c",
            explanation: "Stacks are last-in, first-out structures.",
            topic_tags: ["stacks", "basics"],
            topic: "Stacks",
            difficulty: "easy",
        },
        {
            id: 1007,
            text: "Which heap property defines a max-heap?",
            option_a: "Each parent is smaller than its children",
            option_b: "Each parent is larger than or equal to its children",
            option_c: "The root is always the median",
            option_d: "The tree is always perfectly balanced",
            correct_option: "b",
            explanation: "In a max-heap every parent node is at least as large as its children.",
            topic_tags: ["heaps"],
            topic: "Heaps",
            difficulty: "medium",
        },
        {
            id: 1008,
            text: "Which notation describes an upper bound on running time?",
            option_a: "Big O",
            option_b: "Big Omega",
            option_c: "Theta",
            option_d: "Sigma",
            correct_option: "a",
            explanation: "Big O describes an asymptotic upper bound.",
            topic_tags: ["complexity"],
            topic: "Complexity",
            difficulty: "easy",
        },
        {
            id: 1009,
            text: "What is the main advantage of a hash table over a binary search tree for exact key lookup?",
            option_a: "It preserves sorted order",
            option_b: "It always uses less memory",
            option_c: "It offers average-case O(1) lookup",
            option_d: "It avoids collisions entirely",
            correct_option: "c",
            explanation: "Hash tables can provide O(1) average-case lookup, unlike BSTs which are typically O(log n).",
            topic_tags: ["hashing"],
            topic: "Hashing",
            difficulty: "medium",
        },
        {
            id: 1010,
            text: "Which algorithmic strategy breaks a problem into overlapping subproblems and stores results?",
            option_a: "Greedy method",
            option_b: "Dynamic programming",
            option_c: "Backtracking",
            option_d: "Brute force",
            correct_option: "b",
            explanation: "Dynamic programming avoids recomputation by storing solutions to overlapping subproblems.",
            topic_tags: ["dynamic programming"],
            topic: "Dynamic Programming",
            difficulty: "hard",
        },
        {
            id: 1011,
            text: "Which linked list operation can be O(1) when you already have a pointer to the target node and its predecessor?",
            option_a: "Search",
            option_b: "Delete",
            option_c: "Sort",
            option_d: "Reverse traversal",
            correct_option: "b",
            explanation: "Given the node location and predecessor, unlinking can be done in constant time.",
            topic_tags: ["linked lists"],
            topic: "Linked Lists",
            difficulty: "medium",
        },
        {
            id: 1012,
            text: "Which sorting algorithm is stable in its standard textbook implementation?",
            option_a: "Merge sort",
            option_b: "Heap sort",
            option_c: "Quick sort",
            option_d: "Selection sort",
            correct_option: "a",
            explanation: "Merge sort preserves equal-element order in the standard merge process.",
            topic_tags: ["sorting"],
            topic: "Sorting",
            difficulty: "medium",
        },
    ],
    2: [
        {
            id: 2001,
            text: "Which CPU scheduling algorithm can cause starvation for long jobs if short jobs keep arriving?",
            option_a: "Round Robin",
            option_b: "FCFS",
            option_c: "Shortest Job First",
            option_d: "Multilevel queue",
            correct_option: "c",
            explanation: "SJF favors short jobs and can indefinitely delay longer jobs.",
            topic_tags: ["scheduling"],
            topic: "Scheduling",
            difficulty: "medium",
        },
        {
            id: 2002,
            text: "Thrashing in an OS is most closely related to:",
            option_a: "Excessive CPU context switching",
            option_b: "High page fault rate",
            option_c: "Disk fragmentation",
            option_d: "Deadlock detection overhead",
            correct_option: "b",
            explanation: "Thrashing occurs when the system spends too much time paging rather than executing processes.",
            topic_tags: ["memory"],
            topic: "Memory Management",
            difficulty: "medium",
        },
        {
            id: 2003,
            text: "The Banker's algorithm is used for:",
            option_a: "Disk scheduling",
            option_b: "Memory compaction",
            option_c: "Deadlock avoidance",
            option_d: "Authentication",
            correct_option: "c",
            explanation: "Banker's algorithm checks safe states to avoid deadlocks before allocation.",
            topic_tags: ["deadlocks"],
            topic: "Deadlocks",
            difficulty: "hard",
        },
        {
            id: 2004,
            text: "Which memory allocation technique suffers from external fragmentation?",
            option_a: "Paging",
            option_b: "Fixed-size blocks",
            option_c: "Segmentation",
            option_d: "Register allocation",
            correct_option: "c",
            explanation: "Segmentation uses variable-sized regions, which can lead to external fragmentation.",
            topic_tags: ["memory"],
            topic: "Memory Management",
            difficulty: "medium",
        },
        {
            id: 2005,
            text: "A context switch primarily saves and restores:",
            option_a: "File permissions",
            option_b: "Process state",
            option_c: "Page replacement history",
            option_d: "User passwords",
            correct_option: "b",
            explanation: "The OS saves CPU registers and related process execution state so another process can run.",
            topic_tags: ["processes"],
            topic: "Processes",
            difficulty: "easy",
        },
        {
            id: 2006,
            text: "Which page replacement algorithm removes the page that will not be used for the longest time in the future?",
            option_a: "FIFO",
            option_b: "LRU",
            option_c: "Optimal",
            option_d: "Clock",
            correct_option: "c",
            explanation: "The optimal algorithm is theoretical and replaces the page used farthest in the future.",
            topic_tags: ["memory", "paging"],
            topic: "Paging",
            difficulty: "hard",
        },
    ],
    6: [
        {
            id: 6001,
            text: "In A* search, the evaluation function is:",
            option_a: "f(n) = h(n)",
            option_b: "f(n) = g(n) + h(n)",
            option_c: "f(n) = g(n) - h(n)",
            option_d: "f(n) = g(n) / h(n)",
            correct_option: "b",
            explanation: "A* combines path cost so far and heuristic estimate to goal.",
            topic_tags: ["search", "heuristics"],
            topic: "Search",
            difficulty: "medium",
        },
        {
            id: 6002,
            text: "A heuristic is admissible if it:",
            option_a: "Never overestimates the true cost",
            option_b: "Always returns zero",
            option_c: "Depends only on depth",
            option_d: "Is greater than the path cost",
            correct_option: "a",
            explanation: "Admissible heuristics do not overestimate, which preserves optimality in A*.",
            topic_tags: ["heuristics"],
            topic: "Search",
            difficulty: "medium",
        },
        {
            id: 6003,
            text: "Which learning paradigm uses labeled examples?",
            option_a: "Unsupervised learning",
            option_b: "Reinforcement learning",
            option_c: "Supervised learning",
            option_d: "Evolutionary search",
            correct_option: "c",
            explanation: "Supervised learning trains on inputs paired with labels.",
            topic_tags: ["ml"],
            topic: "Machine Learning",
            difficulty: "easy",
        },
        {
            id: 6004,
            text: "Which search strategy expands the deepest node first?",
            option_a: "BFS",
            option_b: "Uniform-cost search",
            option_c: "DFS",
            option_d: "Greedy best-first",
            correct_option: "c",
            explanation: "Depth-first search continues along the deepest branch before backtracking.",
            topic_tags: ["search"],
            topic: "Search",
            difficulty: "easy",
        },
        {
            id: 6005,
            text: "Overfitting usually means the model:",
            option_a: "Performs poorly on training data",
            option_b: "Memorizes training data but generalizes poorly",
            option_c: "Has too little capacity to learn",
            option_d: "Uses no validation set",
            correct_option: "b",
            explanation: "Overfitting captures noise in the training data and weakens generalization.",
            topic_tags: ["ml"],
            topic: "Machine Learning",
            difficulty: "medium",
        },
        {
            id: 6006,
            text: "Minimax is commonly used in:",
            option_a: "Sorting arrays",
            option_b: "Process scheduling",
            option_c: "Adversarial game search",
            option_d: "File systems",
            correct_option: "c",
            explanation: "Minimax evaluates moves in two-player zero-sum games.",
            topic_tags: ["games"],
            topic: "Game Playing",
            difficulty: "medium",
        },
    ],
};

export const MOCK_EXAM_PAPERS: ExamPaper[] = [
    {
        id: 9001,
        title: "Computer Science Exit Exam 2024",
        course: 6,
        exam_type: "exit",
        year: 2024,
        duration_minutes: 120,
        total_questions: 6,
        access_level: "premium",
    },
    {
        id: 9002,
        title: "Computer Science Exit Exam 2023",
        course: 5,
        exam_type: "exit",
        year: 2023,
        duration_minutes: 110,
        total_questions: 6,
        access_level: "premium",
    },
    {
        id: 9101,
        title: "DSA Quiz Set A",
        course: 1,
        exam_type: "quiz",
        year: 2026,
        duration_minutes: 20,
        total_questions: 6,
        access_level: "free",
    },
    {
        id: 9102,
        title: "DSA Quiz Set B",
        course: 1,
        exam_type: "quiz",
        year: 2026,
        duration_minutes: 15,
        total_questions: 6,
        access_level: "free",
    },
    {
        id: 9103,
        title: "Operating Systems Quiz Set A",
        course: 2,
        exam_type: "quiz",
        year: 2026,
        duration_minutes: 18,
        total_questions: 6,
        access_level: "free",
    },
];

export const MOCK_PLANS: Plan[] = [
    {
        id: "weekly",
        name: "Weekly Boost",
        price: 49,
        days: 7,
        description: "Great for revision week, mock exams, and unlimited downloads.",
    },
    {
        id: "monthly",
        name: "Monthly Pro",
        price: 99,
        days: 30,
        description: "Best for continuous coursework, quizzes, and performance tracking.",
    },
    {
        id: "semester",
        name: "Semester Max",
        price: 249,
        days: 120,
        description: "Full semester access with all premium archives and exit exams.",
    },
];

export const MOCK_PAYMENT_INSTRUCTIONS: PaymentInstructions = {
    instructions: "Send payment to Telebirr 0912-000-000 and use your username as the reference.",
    reference: "UP-DEV-2026",
    note: "This is demo content. Replace with backend-generated payment instructions later.",
};

export const MOCK_STUDENT: Student = {
    id: 1,
    telegram_id: 123456789,
    name: "Cheri Student",
    first_name: "Cheri",
    last_name: "Student",
    username: "cheri_dev",
    preferred_department: 1,
    preferred_year: 2,
    preferred_semester: 1,
    onboarding_complete: true,
    is_premium: true,
    subscription_expiry: "2026-12-31T23:59:59Z",
    preferences: {
        department: 1,
        year: 2,
        semester: 1,
    },
};

export const MOCK_PERFORMANCE: Performance = {
    total_attempts: 28,
    average_score: 74,
    best_score: 92,
    weak_topics: ["Dynamic Programming", "Deadlocks", "Machine Learning"],
    score_over_time: [
        { date: "2026-02-10", score: 58 },
        { date: "2026-02-14", score: 62 },
        { date: "2026-02-18", score: 71 },
        { date: "2026-02-22", score: 76 },
        { date: "2026-02-27", score: 69 },
        { date: "2026-03-03", score: 81 },
        { date: "2026-03-07", score: 84 },
        { date: "2026-03-11", score: 88 },
    ],
    attempts_by_course: [
        { course_name: "Data Structures & Algorithms", attempts: 12, average: 78 },
        { course_name: "Operating Systems", attempts: 8, average: 67 },
        { course_name: "Artificial Intelligence", attempts: 5, average: 73 },
        { course_name: "Database Systems", attempts: 3, average: 80 },
    ],
};

export function getMockQuestions(
    courseId: number,
    params?: { limit?: number; topic?: string }
): Question[] {
    let questions = [...(MOCK_QUESTIONS[courseId] ?? [])];

    if (params?.topic) {
        const query = params.topic.toLowerCase();
        questions = questions.filter((question) =>
            [question.topic, ...(question.topic_tags ?? [])]
                .filter(Boolean)
                .some((tag) => String(tag).toLowerCase().includes(query))
        );
    }

    if (params?.limit) {
        questions = questions.slice(0, params.limit);
    }

    return questions;
}

export function getMockExamQuestions(examPaperId: number): Question[] {
    const exam = MOCK_EXAM_PAPERS.find((item) => item.id === examPaperId);
    if (!exam) return [];
    return getMockQuestions(exam.course, { limit: exam.total_questions });
}

export function getMockExitExamTopics(departmentId: number): { topic: string; count: number }[] {
    const courseIds = MOCK_COURSES
        .filter((course) => course.department === departmentId)
        .map((course) => course.id);

    const counts = new Map<string, number>();

    courseIds.forEach((courseId) => {
        const questions = MOCK_QUESTIONS[courseId] ?? [];
        questions.forEach((question) => {
            const key = question.topic ?? question.topic_tags?.[0];
            if (!key) return;
            counts.set(key, (counts.get(key) ?? 0) + 1);
        });
    });

    return [...counts.entries()]
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count);
}

export function evaluateMockAttempt(
    questions: Question[],
    answers: QuizAnswer[],
    _mode: QuizMode
): AttemptSummary {
    const answerMap = new Map(answers.map((item) => [item.question_id, item.selected_option]));
    const gradedQuestions = questions.filter((question) =>
        !["essay", "matching"].includes(question.question_type ?? "mcq")
    );
    const topicBreakdown = new Map<string, { correct: number; total: number }>();

    const correctCount = gradedQuestions.filter((question) => {
        const selected = answerMap.get(question.id) ?? "a";
        const isCorrect = selected === question.correct_option;
        const topics = question.topic_tags?.length ? question.topic_tags : [question.topic ?? "General"];

        topics.forEach((topic) => {
            const current = topicBreakdown.get(topic) ?? { correct: 0, total: 0 };
            current.total += 1;
            current.correct += isCorrect ? 1 : 0;
            topicBreakdown.set(topic, current);
        });

        return isCorrect;
    }).length;

    return {
        score:
            gradedQuestions.length === 0
                ? 0
                : Number(((correctCount / gradedQuestions.length) * 100).toFixed(1)),
        gradable_total: gradedQuestions.length,
        pending_count: questions.length - gradedQuestions.length,
        topic_breakdown: Object.fromEntries(
            [...topicBreakdown.entries()].map(([topic, stats]) => [
                topic,
                stats.total === 0 ? 0 : Math.round((stats.correct / stats.total) * 100),
            ])
        ),
        weak_topics: [...topicBreakdown.entries()]
            .filter(([, stats]) => stats.total > 0 && (stats.correct / stats.total) * 100 < 60)
            .map(([topic]) => topic),
    };
}

export function mockResponse<T>(data: T, delayMs = 250): Promise<{ data: T }> {
    return new Promise((resolve) => {
        setTimeout(() => resolve({ data }), delayMs);
    });
}
