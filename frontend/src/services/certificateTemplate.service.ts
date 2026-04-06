import apiRequest from './api';

export interface CertificateTemplate {
  _id: string;
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
}

export const certificateTemplateService = {
  getTemplates: async (): Promise<CertificateTemplate[]> => {
    const response = await apiRequest<{ success: boolean; data: CertificateTemplate[] }>(
      '/certificate-templates'
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  createTemplate: async (
    payload: Omit<CertificateTemplate, '_id'>
  ): Promise<CertificateTemplate> => {
    const response = await apiRequest<{ success: boolean; data: CertificateTemplate }>(
      '/certificate-templates',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );

    return response.data;
  },

  updateTemplate: async (
    templateId: string,
    payload: Partial<Omit<CertificateTemplate, '_id'>>
  ): Promise<CertificateTemplate> => {
    const response = await apiRequest<{ success: boolean; data: CertificateTemplate }>(
      `/certificate-templates/${templateId}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );

    return response.data;
  },
};

export default certificateTemplateService;
