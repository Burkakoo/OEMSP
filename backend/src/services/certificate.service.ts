import mongoose from 'mongoose';
import Certificate, { ICertificate } from '../models/Certificate';
import Enrollment from '../models/Enrollment';
import User from '../models/User';
import { getCache, setCache, deleteCache } from '../utils/cache.utils';

const CACHE_TTL = 300; // 5 minutes

/**
 * Certificate Service
 * Handles certificate generation, verification, and management
 */

/**
 * Certificate data required for PDF rendering
 */
interface CertificatePdfData {
  studentName: string;
  courseTitle: string;
  instructorName: string;
  completionDate: Date;
  verificationCode: string;
}

const escapePdfText = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const formatCertificateDate = (value: Date): string =>
  value.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const toIdString = (value: unknown): string => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object') {
    const withId = value as { _id?: unknown };
    if (withId._id) {
      return String(withId._id);
    }
  }

  return String(value);
};

const buildPdfBuffer = (contentStream: string): Buffer => {
  const objects: string[] = [];
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = '<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
  objects[3] =
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>';
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';
  objects[5] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  objects[6] = `<< /Length ${Buffer.byteLength(contentStream, 'utf8')} >>\nstream\n${contentStream}\nendstream`;

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];

  for (let i = 1; i < objects.length; i++) {
    const objectBody = objects[i];
    if (!objectBody) {
      continue;
    }

    offsets[i] = Buffer.byteLength(pdf, 'utf8');
    pdf += `${i} 0 obj\n${objectBody}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length}\n`;
  pdf += '0000000000 65535 f \n';

  for (let i = 1; i < objects.length; i++) {
    const offset = offsets[i] ?? 0;
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'utf8');
};

/**
 * Generate a lightweight certificate PDF without external dependencies.
 */
export const generateCertificatePdf = async (
  certificateData: CertificatePdfData
): Promise<Buffer> => {
  const renderedDate = formatCertificateDate(certificateData.completionDate);
  const lines = [
    '/F1 36 Tf 180 500 Td (Certificate of Completion) Tj',
    '/F2 20 Tf 260 450 Td (This certifies that) Tj',
    `/F1 30 Tf 160 400 Td (${escapePdfText(certificateData.studentName)}) Tj`,
    '/F2 20 Tf 215 360 Td (has successfully completed) Tj',
    `/F1 24 Tf 120 320 Td (${escapePdfText(certificateData.courseTitle)}) Tj`,
    `/F2 16 Tf 80 250 Td (Instructor: ${escapePdfText(certificateData.instructorName)}) Tj`,
    `/F2 16 Tf 80 225 Td (Completion Date: ${escapePdfText(renderedDate)}) Tj`,
    `/F2 14 Tf 80 200 Td (Verification Code: ${escapePdfText(certificateData.verificationCode)}) Tj`,
  ];

  const contentStream = `BT\n${lines.join('\n')}\nET`;
  return buildPdfBuffer(contentStream);
};

/**
 * Upload PDF to cloud storage (placeholder)
 * TODO: Implement actual cloud storage upload
 */
const uploadToCloudStorage = async (
  _pdfBuffer: Buffer,
  fileName: string
): Promise<string> => {
  // Placeholder implementation
  // In production, upload to S3 or other cloud storage:
  /*
  const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
  
  const s3Client = new S3Client({ region: process.env.AWS_REGION });
  
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `certificates/${fileName}`,
    Body: pdfBuffer,
    ContentType: 'application/pdf',
    ACL: 'public-read',
  });
  
  await s3Client.send(command);
  
  return `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/certificates/${fileName}`;
  */

  console.log('Uploading certificate to cloud storage:', fileName);

  // Return placeholder URL
  return `https://storage.example.com/certificates/${fileName}`;
};

/**
 * Get certificate by enrollment ID
 */
export const getCertificateByEnrollment = async (
  enrollmentId: string
): Promise<ICertificate | null> => {
  if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
    throw new Error('Invalid enrollment ID');
  }

  return Certificate.findOne({ enrollmentId });
};

/**
 * Ensure a certificate exists for the enrollment and return it.
 */
export const ensureCertificateForEnrollment = async (
  enrollmentId: string
): Promise<ICertificate> => {
  const existingCertificate = await getCertificateByEnrollment(enrollmentId);
  if (existingCertificate) {
    return existingCertificate;
  }

  try {
    return await generateCertificate(enrollmentId);
  } catch (error: unknown) {
    const mongoError = error as { code?: number; message?: string };
    const duplicateError =
      mongoError.code === 11000 ||
      (typeof mongoError.message === 'string' &&
        mongoError.message.includes('already exists'));

    if (!duplicateError) {
      throw error;
    }

    const certificate = await getCertificateByEnrollment(enrollmentId);
    if (!certificate) {
      throw error;
    }

    return certificate;
  }
};

/**
 * Generate certificate for completed enrollment
 */
export const generateCertificate = async (enrollmentId: string): Promise<ICertificate> => {
  if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
    throw new Error('Invalid enrollment ID');
  }

  // Check if certificate already exists
  const existingCertificate = await Certificate.findOne({ enrollmentId });
  if (existingCertificate) {
    throw new Error('Certificate already exists for this enrollment');
  }

  // Get enrollment with populated data
  const enrollment = await Enrollment.findById(enrollmentId)
    .populate('studentId')
    .populate('courseId');

  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  // Verify enrollment is completed
  if (!enrollment.isCompleted) {
    throw new Error('Enrollment is not completed');
  }

  // Get student, course, and instructor details
  const student = enrollment.studentId as any;
  const course = enrollment.courseId as any;

  if (!student || !course) {
    throw new Error('Student or course data not found');
  }

  // Get instructor details
  const instructor = await User.findById(course.instructorId);
  if (!instructor) {
    throw new Error('Instructor not found');
  }

  const studentName = `${student.firstName} ${student.lastName}`;
  const courseTitle = course.title;
  const instructorName = `${instructor.firstName} ${instructor.lastName}`;
  const completionDate = enrollment.completedAt || new Date();

  // Generate verification code
  const verificationCode = Certificate.generateVerificationCode();

  // Generate PDF
  const pdfBuffer = await generateCertificatePdf({
    studentName,
    courseTitle,
    instructorName,
    completionDate,
    verificationCode,
  });

  // Upload to cloud storage
  const fileName = `certificate-${enrollmentId}-${Date.now()}.pdf`;
  const certificateUrl = await uploadToCloudStorage(pdfBuffer, fileName);

  // Create certificate record
  const certificate = await Certificate.create({
    enrollmentId,
    studentId: student._id,
    courseId: course._id,
    studentName,
    courseTitle,
    instructorName,
    completionDate,
    verificationCode,
    certificateUrl,
  });

  // Update enrollment with certificate ID
  await Enrollment.findByIdAndUpdate(enrollmentId, {
    certificateId: certificate._id,
  });

  // Invalidate caches
  await deleteCache(`certificate:${certificate._id}`);
  await deleteCache(`certificates:student:${student._id}`);

  return certificate;
};

/**
 * Get certificate by ID
 */
export const getCertificate = async (certificateId: string): Promise<ICertificate | null> => {
  if (!mongoose.Types.ObjectId.isValid(certificateId)) {
    throw new Error('Invalid certificate ID');
  }

  // Try cache first
  const cacheKey = `certificate:${certificateId}`;
  const cached = await getCache<ICertificate>(cacheKey);
  if (cached) {
    return cached;
  }

  const certificate = await Certificate.findById(certificateId)
    .populate('studentId', 'firstName lastName email')
    .populate('courseId', 'title')
    .populate('enrollmentId');

  if (certificate) {
    await setCache(cacheKey, certificate, CACHE_TTL);
  }

  return certificate;
};

/**
 * Verify certificate by verification code
 */
export const verifyCertificate = async (verificationCode: string): Promise<ICertificate | null> => {
  if (!verificationCode || verificationCode.length !== 16) {
    throw new Error('Invalid verification code format');
  }

  const certificate = await Certificate.findOne({ verificationCode: verificationCode.toUpperCase() })
    .populate('studentId', 'firstName lastName email')
    .populate('courseId', 'title instructorId')
    .populate('enrollmentId');

  return certificate;
};

/**
 * List certificates with filters
 */
export const listCertificates = async (filters: {
  studentId?: string;
  courseId?: string;
  page?: number;
  limit?: number;
}): Promise<{ certificates: ICertificate[]; total: number; page: number; pages: number }> => {
  const { studentId, courseId, page = 1, limit = 10 } = filters;

  // Build query
  const query: any = {};
  if (studentId) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new Error('Invalid student ID');
    }
    query.studentId = studentId;
  }
  if (courseId) {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new Error('Invalid course ID');
    }
    query.courseId = courseId;
  }

  // Try cache for student-specific queries
  if (studentId && !courseId) {
    const cacheKey = `certificates:student:${studentId}:${page}:${limit}`;
    const cached = await getCache<{ certificates: ICertificate[]; total: number; page: number; pages: number }>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // Execute query
  const skip = (page - 1) * limit;
  const [certificates, total] = await Promise.all([
    Certificate.find(query)
      .populate('studentId', 'firstName lastName email')
      .populate('courseId', 'title')
      .skip(skip)
      .limit(limit)
      .sort({ issuedAt: -1 }),
    Certificate.countDocuments(query),
  ]);

  const result = {
    certificates,
    total,
    page,
    pages: Math.ceil(total / limit),
  };

  // Cache student-specific queries
  if (studentId && !courseId) {
    const cacheKey = `certificates:student:${studentId}:${page}:${limit}`;
    await setCache(cacheKey, result, CACHE_TTL);
  }

  return result;
};

/**
 * Regenerate certificate (e.g., if template changes)
 */
export const regenerateCertificate = async (certificateId: string): Promise<ICertificate> => {
  if (!mongoose.Types.ObjectId.isValid(certificateId)) {
    throw new Error('Invalid certificate ID');
  }

  const certificate = await Certificate.findById(certificateId)
    .populate('studentId')
    .populate('courseId')
    .populate('enrollmentId');

  if (!certificate) {
    throw new Error('Certificate not found');
  }

  // Generate new PDF with existing data
  const pdfBuffer = await generateCertificatePdf({
    studentName: certificate.studentName,
    courseTitle: certificate.courseTitle,
    instructorName: certificate.instructorName,
    completionDate: certificate.completionDate,
    verificationCode: certificate.verificationCode,
  });

  // Upload to cloud storage with new filename
  const fileName = `certificate-${certificate.enrollmentId}-${Date.now()}.pdf`;
  const certificateUrl = await uploadToCloudStorage(pdfBuffer, fileName);

  // Update certificate URL
  certificate.certificateUrl = certificateUrl;
  await certificate.save();

  // Invalidate caches
  await deleteCache(`certificate:${certificateId}`);
  await deleteCache(`certificates:student:${toIdString(certificate.studentId)}`);

  return certificate;
};
