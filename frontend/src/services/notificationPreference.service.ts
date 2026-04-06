import apiRequest from './api';

export interface NotificationPreferences {
  channels: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  triggers: {
    paymentUpdates: boolean;
    certificates: boolean;
    newContent: boolean;
    missedDeadlines: boolean;
    discussionReplies: boolean;
    promotions: boolean;
    systemAlerts: boolean;
  };
}

export const notificationPreferenceService = {
  getPreferences: async (): Promise<NotificationPreferences> => {
    const response = await apiRequest<{ success: boolean; data: NotificationPreferences }>(
      '/notifications/preferences'
    );

    return response.data;
  },

  updatePreferences: async (
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> => {
    const response = await apiRequest<{ success: boolean; data: NotificationPreferences }>(
      '/notifications/preferences',
      {
        method: 'PUT',
        body: JSON.stringify(preferences),
      }
    );

    return response.data;
  },
};

export default notificationPreferenceService;
