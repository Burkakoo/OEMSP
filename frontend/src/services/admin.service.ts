/**
 * Admin Service - Handles admin-specific API calls
 */

import api from './api';

export interface PendingInstructor {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  profile?: {
    bio?: string;
  };
}

interface PendingInstructorsApiResponse {
  success: boolean;
  count: number;
  instructors: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    createdAt: string;
  }>;
}

class AdminService {
  async getPendingInstructors(): Promise<PendingInstructor[]> {
    const response = await api<PendingInstructorsApiResponse>('/auth/instructors/pending');

    if (!response?.success || !Array.isArray(response?.instructors)) {
      return [];
    }

    return response.instructors.map((instructor) => ({
      _id: instructor.id,
      email: instructor.email,
      firstName: instructor.firstName,
      lastName: instructor.lastName,
      createdAt: instructor.createdAt,
    }));
  }

  async approveInstructor(instructorId: string): Promise<void> {
    await api(`/auth/instructors/${instructorId}/approve`, {
      method: 'POST',
    });
  }

  async rejectInstructor(instructorId: string, reason?: string): Promise<void> {
    await api(`/auth/instructors/${instructorId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }
}

export default new AdminService();
