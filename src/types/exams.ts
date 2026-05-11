export interface ExamEntry {
    course_name: string;
    course_code: string;
    room_code: string;
    department: string;
    date: string;
    start_time: string;
    end_time: string;
    session: string;
}

export interface ExamScheduleResponse {
    student_name: string;
    student_id: string;
    term: string;
    exams: ExamEntry[];
}

export interface ActiveTermResponse {
    active: boolean;
    year?: number;
    term?: number;
    center?: string;
}
