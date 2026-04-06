import apiRequest from './api';

export interface PlatformSettings {
  payment: {
    enabledMethods: string[];
    supportedBillingIntervals: Array<'monthly' | 'yearly'>;
    allowSubscriptions: boolean;
    allowBundles: boolean;
    allowRefunds: boolean;
    allowAffiliates: boolean;
    defaultCurrency: string;
  };
  notifications: {
    defaultChannels: {
      inApp: boolean;
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    availableTriggers: string[];
    missedDeadlineReminderHours: number;
  };
  moderation: {
    allowUserDeactivation: boolean;
    requireInstructorApproval: boolean;
    requireCourseReviewBeforePublish: boolean;
    auditRetentionDays: number;
  };
  certificates: {
    includeSkills: boolean;
    publicVerificationBaseUrl?: string;
  };
  revenue: {
    platformFeePercentage: number;
    payoutSchedule: 'weekly' | 'monthly';
    enableReporting: boolean;
  };
}

export const platformSettingsService = {
  getSettings: async (): Promise<PlatformSettings> => {
    const response = await apiRequest<{ success: boolean; data: PlatformSettings }>(
      '/platform-settings'
    );
    return response.data;
  },

  updateSettings: async (settings: Partial<PlatformSettings>): Promise<PlatformSettings> => {
    const response = await apiRequest<{ success: boolean; data: PlatformSettings }>(
      '/platform-settings',
      {
        method: 'PUT',
        body: JSON.stringify(settings),
      }
    );

    return response.data;
  },
};

export default platformSettingsService;
