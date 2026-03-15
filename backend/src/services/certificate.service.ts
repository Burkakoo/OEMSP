import mongoose from 'mongoose';
import Certificate, { ICertificate } from '../models/Certificate';
import Enrollment from '../models/Enrollment';
import User from '../models/User';
import { getCache, setCache, deleteCache } from '../utils/cache.utils';

const CACHE_TTL = 300; // 5 minutes

/**
 * Certificate Service
 * Handles certificate generation, verification, and management
 * 
 * NOTE: This implementation includes placeholder functions for PDF generation and cloud storage.
 * In production, you would need to:
 * 1. Install PDFKit: npm install pdfkit @types/pdfkit
 * 2. Install AWS SDK or cloud storage SDK: npm install @aws-sdk/client-s3
 * 3. Configure cloud storage credentials
 * 4. Implement actual PDF generation with custom templates
 * 5. Upload PDFs to cloud storage (S3, Google Cloud Storage, etc.)
 */

/**
 * Generate PDF certificate (placeholder)
 * TODO: Implement actual PDF generation with PDFKit
 */
const generatePDF = async (certificateData: {
  studentName: string;
  courseTitle: string;
  instructorName: string;
  completionDate: Date;
  verificationCode: string;
}): Promise<Buffer> => {
  // Placeholder implementation
  // In production, use PDFKit to generate a professional certificate:
  /*
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
  
  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  
  // Add certificate content
  doc.fontSize(40).text('Certificate of Completion', { align: 'center' });
  doc.moveDown();
  doc.fontSize(20).text(`This certifies that`, { align: 'center' });
  doc.fontSize(30).text(certificateData.studentName, { align: 'center' });
  doc.fontSize(20).text(`has successfully completed`, { align: 'center' });
  doc.fontSize(25).text(certificateData.courseTitle, { align: 'center' });
  doc.moveDown();
  doc.fontSize(15).text(`Instructor: ${certificateData.instructorName}`, { align: 'center' });
  doc.text(`Date: ${certificateData.completionDate.toLocaleDateString()}`, { align: 'center' });
  doc.text(`Verification Code: ${certificateData.verificationCode}`, { align: 'center' });
  
  doc.end();
  
  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });
  */

  console.log('Generating PDF certificate for:', certificateData.studentName);

  // Return placeholder buffer
  return Buffer.from(`Certificate for ${certificateData.studentName} - ${certificateData.courseTitle}`);
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
  const pdfBuffer = await generatePDF({
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
  const pdfBuffer = await generatePDF({
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
  await deleteCache(`certificates:student:${certificate.studentId}`);

  return certificate;
};
