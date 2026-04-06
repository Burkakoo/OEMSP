import apiRequest from './api';
import {
  CreateDiscussionThreadData,
  DiscussionThread,
} from '@/types/discussion.types';

interface DiscussionListResponse {
  success: boolean;
  data: DiscussionThread[];
}

interface DiscussionThreadResponse {
  success: boolean;
  data: DiscussionThread;
}

export const discussionService = {
  getCourseDiscussions: async (courseId: string): Promise<DiscussionListResponse> => {
    return apiRequest<DiscussionListResponse>(`/discussions/course/${courseId}`);
  },

  createDiscussionThread: async (
    courseId: string,
    data: CreateDiscussionThreadData
  ): Promise<DiscussionThreadResponse> => {
    return apiRequest<DiscussionThreadResponse>(`/discussions/course/${courseId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  replyToThread: async (
    threadId: string,
    content: string
  ): Promise<DiscussionThreadResponse> => {
    return apiRequest<DiscussionThreadResponse>(`/discussions/${threadId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },
};
