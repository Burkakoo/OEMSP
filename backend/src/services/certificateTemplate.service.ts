import mongoose from 'mongoose';
import CertificateTemplate, { ICertificateTemplate } from '../models/CertificateTemplate';

const DEFAULT_TEMPLATE = {
  name: 'Classic Gold',
  slug: 'classic-gold',
  organizationName: 'OEMSP Academy',
  accentColor: '#A66A00',
  backgroundColor: '#FFF8EA',
  signatureName: 'Training Director',
  signatureTitle: 'Certification Office',
  footerText: 'Verify this certificate using the public verification link.',
  isDefault: true,
  isActive: true,
};

const ensureDefaultTemplate = async (): Promise<void> => {
  const existingCount = await CertificateTemplate.countDocuments();
  if (existingCount > 0) {
    return;
  }

  await CertificateTemplate.create(DEFAULT_TEMPLATE);
};

export const listCertificateTemplates = async (): Promise<ICertificateTemplate[]> => {
  await ensureDefaultTemplate();
  return CertificateTemplate.find().sort({ isDefault: -1, createdAt: -1 });
};

export const getDefaultCertificateTemplate = async (): Promise<ICertificateTemplate | null> => {
  await ensureDefaultTemplate();

  return (
    (await CertificateTemplate.findOne({ isDefault: true, isActive: true })) ||
    CertificateTemplate.findOne({ isActive: true }).sort({ createdAt: 1 })
  );
};

export const createCertificateTemplate = async (
  input: {
    name: string;
    slug: string;
    organizationName: string;
    accentColor: string;
    backgroundColor: string;
    signatureName?: string;
    signatureTitle?: string;
    footerText?: string;
    isDefault?: boolean;
    isActive?: boolean;
  },
  adminId: string
): Promise<ICertificateTemplate> => {
  if (!mongoose.Types.ObjectId.isValid(adminId)) {
    throw new Error('Invalid admin ID');
  }

  if (input.isDefault) {
    await CertificateTemplate.updateMany({}, { $set: { isDefault: false } });
  }

  return CertificateTemplate.create({
    ...input,
    createdBy: new mongoose.Types.ObjectId(adminId),
    isActive: input.isActive ?? true,
    isDefault: input.isDefault ?? false,
  });
};

export const updateCertificateTemplate = async (
  templateId: string,
  updates: Partial<{
    name: string;
    slug: string;
    organizationName: string;
    accentColor: string;
    backgroundColor: string;
    signatureName?: string;
    signatureTitle?: string;
    footerText?: string;
    isDefault: boolean;
    isActive: boolean;
  }>
): Promise<ICertificateTemplate> => {
  if (!mongoose.Types.ObjectId.isValid(templateId)) {
    throw new Error('Invalid template ID');
  }

  if (updates.isDefault) {
    await CertificateTemplate.updateMany(
      { _id: { $ne: templateId } },
      { $set: { isDefault: false } }
    );
  }

  const template = await CertificateTemplate.findByIdAndUpdate(
    templateId,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!template) {
    throw new Error('Certificate template not found');
  }

  return template;
};
