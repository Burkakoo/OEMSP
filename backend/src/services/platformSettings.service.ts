import mongoose from 'mongoose';
import PlatformSettings, { IPlatformSettings } from '../models/PlatformSettings';

const SETTINGS_KEY = 'default';

export const getPlatformSettings = async (): Promise<IPlatformSettings> => {
  const settings = await PlatformSettings.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { $setOnInsert: { key: SETTINGS_KEY } },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  return settings;
};

export const updatePlatformSettings = async (
  updates: Partial<IPlatformSettings>,
  adminId: string
): Promise<IPlatformSettings> => {
  if (!mongoose.Types.ObjectId.isValid(adminId)) {
    throw new Error('Invalid admin ID');
  }

  const settings = await getPlatformSettings();

  if (updates.payment) {
    settings.payment = {
      ...settings.payment,
      ...updates.payment,
    };
  }

  if (updates.notifications) {
    settings.notifications = {
      ...settings.notifications,
      ...updates.notifications,
      defaultChannels: {
        ...settings.notifications.defaultChannels,
        ...(updates.notifications.defaultChannels || {}),
      },
    };
  }

  if (updates.moderation) {
    settings.moderation = {
      ...settings.moderation,
      ...updates.moderation,
    };
  }

  if (updates.certificates) {
    settings.certificates = {
      ...settings.certificates,
      ...updates.certificates,
    };
  }

  if (updates.revenue) {
    settings.revenue = {
      ...settings.revenue,
      ...updates.revenue,
    };
  }

  settings.updatedBy = new mongoose.Types.ObjectId(adminId);
  await settings.save();

  return settings;
};
