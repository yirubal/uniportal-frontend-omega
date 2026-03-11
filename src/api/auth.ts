import client from "./client";
import { Student } from "../store/authStore";

interface LoginResponse {
    token: string;
    student: Student;
}

export const loginWithTelegram = async (
    initData: string
): Promise<LoginResponse> => {
    const response = await client.post<LoginResponse>("/api/auth/telegram/", {
        init_data: initData,
    });
    return response.data;
};

export const getMyProfile = async (): Promise<Student> => {
    const response = await client.get<Student>("/api/students/me/");
    return response.data;
};

export const updateMyProfile = async (data: {
    preferred_department?: number;
    preferred_year?: number;
    preferred_semester?: number;
    onboarding_complete?: boolean;
}): Promise<Student> => {
    const response = await client.patch<Student>("/api/students/me/", data);
    return response.data;
};

export const getWatermarkText = async (): Promise<string> => {
    const response = await client.get<{ watermark: string }>(
        "/api/students/me/watermark/"
    );
    return response.data.watermark;
};