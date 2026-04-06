/**
 * Course Service
 * Handles course management operations including creation, updates, modules, and lessons
 */

import Course, {
  IModule,
  ILesson,
  IAttachment,
  CourseCurrency,
  CourseLevel,
  CourseReviewStatus,
  DiscountType,
  LessonType,
  ALLOWED_FILE_TYPES,
} from '../models/Course';
import mongoose from 'mongoose';
import * as redis from '../config/redis.config';
import * as platformSettingsService from './platformSettings.service';
import { getCourseSalePriceQuote } from '../utils/pricing.utils';

// DTOs and Interfaces
export interface CreateCourseDTO {
  title: string;
  description: string;
  category: string;
  level: CourseLevel;
  price: number;
  currency?: CourseCurrency;
  isFree?: boolean;
  saleEnabled?: boolean;
  saleType?: DiscountType;
  saleValue?: number;
  saleStartsAt?: Date;
  saleEndsAt?: Date;
  thumbnail?: string;
  prerequisites?: string[];
  learningObjectives?: string[];
}

export interface UpdateCourseDTO {
  title?: string;
  description?: string;
  category?: string;
  level?: CourseLevel;
  price?: number;
  currency?: CourseCurrency;
  isFree?: boolean;
  saleEnabled?: boolean;
  saleType?: DiscountType;
  saleValue?: number;
  saleStartsAt?: Date;
  saleEndsAt?: Date;
  thumbnail?: string;
  prerequisites?: string[];
  learningObjectives?: string[];
}

export interface ModuleDTO {
  title: string;
  description: string;
  order: number;
}

export interface LessonDTO {
  title: string;
  description: string;
  type: LessonType;
  content: string;
  videoUrl?: string;
  duration: number;
  order: number;
  isDripEnabled?: boolean;
  dripDelayDays?: number;
  resources?: Array<{
    title: string;
    url: string;
    type: string;
  }>;
}

export interface AttachmentDTO {
  _id?: mongoose.Types.ObjectId;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
}

export interface CourseFilters {
  category?: string;
  level?: CourseLevel;
  isPublished?: boolean;
  reviewStatus?: CourseReviewStatus;
  instructorId?: string;
  searchTerm?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CourseDTO {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructor?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  category: string;
  level: CourseLevel;
  price: number;
  currency: CourseCurrency;
  isFree: boolean;
  saleEnabled: boolean;
  saleType?: DiscountType;
  saleValue: number;
  saleStartsAt?: Date;
  saleEndsAt?: Date;
  currentPrice: number;
  hasActiveSale: boolean;
  saleDiscountAmount: number;
  thumbnail?: string;
  modules: IModule[];
  prerequisites: string[];
  learningObjectives: string[];
  isPublished: boolean;
  reviewStatus?: CourseReviewStatus;
  reviewNotes?: string;
  submittedForReviewAt?: Date;
  reviewedAt?: Date;
  enrollmentCount: number;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Course Service Interface
 */
export interface ICourseService {
  createCourse(courseData: CreateCourseDTO, instructorId: string): Promise<CourseDTO>;
  updateCourse(courseId: string, updates: UpdateCourseDTO, instructorId: string): Promise<CourseDTO>;
  deleteCourse(courseId: string, instructorId: string): Promise<void>;
  getCourse(courseId: string): Promise<CourseDTO>;
  listCourses(filters: CourseFilters, pagination: PaginationParams): Promise<PaginatedResult<CourseDTO>>;
  addModule(courseId: string, moduleData: ModuleDTO, instructorId: string): Promise<IModule>;
  updateModule(courseId: string, moduleId: string, updates: ModuleDTO, instructorId: string): Promise<IModule>;
  deleteModule(courseId: string, moduleId: string, instructorId: string): Promise<void>;
  addLesson(courseId: string, moduleId: string, lessonData: LessonDTO, instructorId: string): Promise<ILesson>;
  updateLesson(courseId: string, moduleId: string, lessonId: string, updates: LessonDTO, instructorId: string): Promise<ILesson>;
  deleteLesson(courseId: string, moduleId: string, lessonId: string, instructorId: string): Promise<void>;
  addAttachment(
    courseId: string,
    moduleId: string,
    lessonId: string,
    attachmentData: AttachmentDTO,
    instructorId: string
  ): Promise<IAttachment>;
  getAttachment(attachmentId: string): Promise<{
    attachment: IAttachment;
    courseId: string;
    instructorId: string;
  }>;
  deleteAttachment(attachmentId: string, instructorId: string): Promise<void>;
  submitCourseForReview(courseId: string, instructorId: string): Promise<CourseDTO>;
  reviewCourse(
    courseId: string,
    adminId: string,
    decision: CourseReviewStatus.APPROVED | CourseReviewStatus.CHANGES_REQUESTED,
    notes?: string
  ): Promise<CourseDTO>;
  publishCourse(courseId: string, instructorId: string): Promise<CourseDTO>;
  unpublishCourse(courseId: string, instructorId: string): Promise<CourseDTO>;
}

/**
 * Course Service Implementation
 */
class CourseService implements ICourseService {
  private readonly COURSE_CACHE_PREFIX = 'course:';
  private readonly COURSE_LIST_CACHE_PREFIX = 'courses:list:';
  private readonly CACHE_TTL = 300; // 5 minutes

  private normalizeCoursePricing(
    courseData: CreateCourseDTO | UpdateCourseDTO,
    existingCourse?: {
      price: number;
      currency: CourseCurrency;
      isFree: boolean;
      saleEnabled: boolean;
      saleType?: DiscountType;
      saleValue: number;
      saleStartsAt?: Date;
      saleEndsAt?: Date;
    }
  ): CreateCourseDTO | UpdateCourseDTO {
    const normalizedData: CreateCourseDTO | UpdateCourseDTO = { ...courseData };
    const nextIsFree = normalizedData.isFree ?? existingCourse?.isFree ?? false;
    const nextSaleEnabled = normalizedData.saleEnabled ?? existingCourse?.saleEnabled ?? false;

    normalizedData.currency =
      normalizedData.currency ?? existingCourse?.currency ?? CourseCurrency.ETB;
    normalizedData.isFree = nextIsFree;
    normalizedData.saleEnabled = nextSaleEnabled;

    if (nextIsFree) {
      normalizedData.price = 0;
      normalizedData.saleEnabled = false;
      normalizedData.saleType = undefined;
      normalizedData.saleValue = 0;
      normalizedData.saleStartsAt = undefined;
      normalizedData.saleEndsAt = undefined;
      return normalizedData;
    }

    if (normalizedData.price === undefined && existingCourse) {
      normalizedData.price = existingCourse.price;
    }

    if (!nextSaleEnabled) {
      normalizedData.saleType = undefined;
      normalizedData.saleValue = 0;
      normalizedData.saleStartsAt = undefined;
      normalizedData.saleEndsAt = undefined;
      return normalizedData;
    }

    normalizedData.saleType = normalizedData.saleType ?? existingCourse?.saleType;
    normalizedData.saleValue = normalizedData.saleValue ?? existingCourse?.saleValue ?? 0;
    normalizedData.saleStartsAt = normalizedData.saleStartsAt ?? existingCourse?.saleStartsAt;
    normalizedData.saleEndsAt = normalizedData.saleEndsAt ?? existingCourse?.saleEndsAt;

    if (!normalizedData.saleType) {
      throw new Error('Sale type is required when sale pricing is enabled');
    }

    if (normalizedData.saleValue === undefined || normalizedData.saleValue <= 0) {
      throw new Error('Sale value must be greater than 0 when sale pricing is enabled');
    }

    if (normalizedData.saleType === DiscountType.PERCENTAGE && normalizedData.saleValue > 100) {
      throw new Error('Percentage sale value cannot exceed 100');
    }

    if (
      normalizedData.saleStartsAt &&
      normalizedData.saleEndsAt &&
      new Date(normalizedData.saleStartsAt) > new Date(normalizedData.saleEndsAt)
    ) {
      throw new Error('Sale start date must be before sale end date');
    }

    return normalizedData;
  }

  private normalizeLessonData(lessonData: LessonDTO): LessonDTO {
    const normalizedLesson: LessonDTO = { ...lessonData };
    const isDripEnabled = Boolean(normalizedLesson.isDripEnabled);
    const dripDelayDays = Number(normalizedLesson.dripDelayDays ?? 0);

    if (dripDelayDays < 0 || Number.isNaN(dripDelayDays)) {
      throw new Error('Drip delay days cannot be negative');
    }

    normalizedLesson.isDripEnabled = isDripEnabled;
    normalizedLesson.dripDelayDays = isDripEnabled ? dripDelayDays : 0;

    return normalizedLesson;
  }

  /**
   * Create a new course
   * 
   * Requirements:
   * - 1.2.1: Allow instructors to create courses
   * - Title must be unique per instructor
   * - All required fields must be validated
   */
  async createCourse(courseData: CreateCourseDTO, instructorId: string): Promise<CourseDTO> {
    try {
      // Validate instructor ID
      if (!mongoose.Types.ObjectId.isValid(instructorId)) {
        throw new Error('Invalid instructor ID');
      }

      // Check for duplicate title for this instructor
      const existingCourse = await Course.findOne({
        instructorId: new mongoose.Types.ObjectId(instructorId),
        title: courseData.title,
      }).lean().exec();

      if (existingCourse) {
        throw new Error('A course with this title already exists for this instructor');
      }

      // Create course
      const normalizedCourseData = this.normalizeCoursePricing(courseData) as CreateCourseDTO;

      const platformSettings = await platformSettingsService.getPlatformSettings();
      const requireReview = platformSettings.moderation?.requireCourseReviewBeforePublish ?? true;
      const initialReviewStatus = requireReview ? CourseReviewStatus.DRAFT : CourseReviewStatus.APPROVED;

      const course = new Course({
        ...normalizedCourseData,
        instructorId: new mongoose.Types.ObjectId(instructorId),
        modules: [],
        isPublished: false,
        reviewStatus: initialReviewStatus,
        enrollmentCount: 0,
        rating: 0,
        reviewCount: 0,
      });

      await course.save();

      // Invalidate course list cache
      await this.invalidateCourseListCache();

      return this.mapCourseToDTO(course);
    } catch (error) {
      console.error('Create course error:', error);
      throw error;
    }
  }

  /**
   * Update an existing course
   * 
   * Requirements:
   * - 1.2.5: Allow instructors to update their own courses
   * - Verify instructor ownership
   */
  async updateCourse(courseId: string, updates: UpdateCourseDTO, instructorId: string): Promise<CourseDTO> {
    try {
      // Validate IDs
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new Error('Invalid course ID');
      }
      if (!mongoose.Types.ObjectId.isValid(instructorId)) {
        throw new Error('Invalid instructor ID');
      }

      // Find course and verify ownership
      const course = await Course.findById(courseId).exec();

      if (!course) {
        throw new Error('Course not found');
      }

      if (course.instructorId.toString() !== instructorId) {
        throw new Error('You can only update your own courses');
      }

      // If title is being updated, check for duplicates
      if (updates.title && updates.title !== course.title) {
        const existingCourse = await Course.findOne({
          instructorId: new mongoose.Types.ObjectId(instructorId),
          title: updates.title,
          _id: { $ne: courseId },
        }).lean().exec();

        if (existingCourse) {
          throw new Error('A course with this title already exists for this instructor');
        }
      }

      // Update course
      const normalizedUpdates = this.normalizeCoursePricing(updates, {
        price: course.price,
        currency: course.currency,
        isFree: course.isFree,
        saleEnabled: course.saleEnabled,
        saleType: course.saleType,
        saleValue: course.saleValue,
        saleStartsAt: course.saleStartsAt,
        saleEndsAt: course.saleEndsAt,
      });

      Object.assign(course, normalizedUpdates);
      await course.save();

      // Invalidate caches
      await this.invalidateCourseCache(courseId);
      await this.invalidateCourseListCache();

      return this.mapCourseToDTO(course);
    } catch (error) {
      console.error('Update course error:', error);
      throw error;
    }
  }

  /**
   * Delete a course
   * 
   * Requirements:
   * - 1.2.5: Allow instructors to delete their own courses
   * - Prevent deletion if course has active enrollments
   */
  async deleteCourse(courseId: string, instructorId: string): Promise<void> {
    try {
      // Validate IDs
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new Error('Invalid course ID');
      }
      if (!mongoose.Types.ObjectId.isValid(instructorId)) {
        throw new Error('Invalid instructor ID');
      }

      // Find course and verify ownership
      const course = await Course.findById(courseId).exec();

      if (!course) {
        throw new Error('Course not found');
      }

      if (course.instructorId.toString() !== instructorId) {
        throw new Error('You can only delete your own courses');
      }

      // Check for active enrollments
      if (course.enrollmentCount > 0) {
        throw new Error('Cannot delete course with active enrollments');
      }

      // Delete course
      await Course.findByIdAndDelete(courseId).exec();

      // Invalidate caches
      await this.invalidateCourseCache(courseId);
      await this.invalidateCourseListCache();
    } catch (error) {
      console.error('Delete course error:', error);
      throw error;
    }
  }

  /**
   * Get course by ID
   * 
   * Requirements:
   * - 1.2.4: Display course information
   * - Implement caching for performance
   */
  async getCourse(courseId: string): Promise<CourseDTO> {
    try {
      // Validate ID
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new Error('Invalid course ID');
      }

      // Check cache first
      const cacheKey = `${this.COURSE_CACHE_PREFIX}${courseId}`;
      const cachedCourse = await redis.get(cacheKey);

      if (cachedCourse) {
        return JSON.parse(cachedCourse);
      }

      // Fetch from database
      const course = await Course.findById(courseId)
        .populate('instructorId', 'firstName lastName email')
        .lean()
        .exec();

      if (!course) {
        throw new Error('Course not found');
      }

      const courseDTO = this.mapCourseToDTO(course);

      // Cache the result
      await redis.set(cacheKey, JSON.stringify(courseDTO), this.CACHE_TTL);

      return courseDTO;
    } catch (error) {
      console.error('Get course error:', error);
      throw error;
    }
  }

  /**
   * List courses with filters and pagination
   * 
   * Requirements:
   * - 1.2.4: Provide course listing with pagination
   * - Support filtering and search
   */
  async listCourses(
    filters: CourseFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<CourseDTO>> {
    try {
      // Build query
      const query: any = {};

      if (filters.category) {
        // Support partial, case-insensitive matching for category so users can type "computer" and still find "Computer Science" etc.
        query.category = { $regex: filters.category, $options: 'i' };
      }

      if (filters.level) {
        query.level = filters.level;
      }

      if (filters.isPublished !== undefined) {
        query.isPublished = filters.isPublished;
      }

      if (filters.instructorId) {
        if (!mongoose.Types.ObjectId.isValid(filters.instructorId)) {
          throw new Error('Invalid instructor ID');
        }
        query.instructorId = new mongoose.Types.ObjectId(filters.instructorId);
      }

      if (filters.searchTerm) {
        query.$or = [
          { title: { $regex: filters.searchTerm, $options: 'i' } },
          { description: { $regex: filters.searchTerm, $options: 'i' } },
        ];
      }

      if (filters.reviewStatus) {
        query.reviewStatus = filters.reviewStatus;
      }

      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        query.price = {};
        if (filters.minPrice !== undefined) {
          query.price.$gte = filters.minPrice;
        }
        if (filters.maxPrice !== undefined) {
          query.price.$lte = filters.maxPrice;
        }
      }

      // Calculate pagination
      const page = Math.max(1, pagination.page);
      const limit = Math.min(100, Math.max(1, pagination.limit));
      const skip = (page - 1) * limit;

      // Build sort
      const sortBy = pagination.sortBy || 'createdAt';
      const sortOrder = pagination.sortOrder === 'asc' ? 1 : -1;
      const sort: any = { [sortBy]: sortOrder };

      // Execute query
      const [courses, total] = await Promise.all([
        Course.find(query)
          .populate('instructorId', 'firstName lastName email')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        Course.countDocuments(query).exec(),
      ]);

      // Map to DTOs
      const data = courses.map(course => this.mapCourseToDTO(course));

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      return {
        data,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      console.error('List courses error:', error);
      throw error;
    }
  }

  /**
   * Add a module to a course
   * 
   * Requirements:
   * - 1.2.2: Allow instructors to add modules to courses
   */
  async addModule(courseId: string, moduleData: ModuleDTO, instructorId: string): Promise<IModule> {
    try {
      // Validate IDs
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new Error('Invalid course ID');
      }
      if (!mongoose.Types.ObjectId.isValid(instructorId)) {
        throw new Error('Invalid instructor ID');
      }

      // Find course and verify ownership
      const course = await Course.findById(courseId).exec();

      if (!course) {
        throw new Error('Course not found');
      }

      if (course.instructorId.toString() !== instructorId) {
        throw new Error('You can only modify your own courses');
      }

      // Create module
      const newModule: any = {
        _id: new mongoose.Types.ObjectId(),
        ...moduleData,
        lessons: [],
      };

      course.modules.push(newModule);
      await course.save();

      // Invalidate caches
      await this.invalidateCourseCache(courseId);
      await this.invalidateCourseListCache();

      return newModule;
    } catch (error) {
      console.error('Add module error:', error);
      throw error;
    }
  }

  /**
   * Update a module
   * 
   * Requirements:
   * - 1.2.2: Allow instructors to update modules
   */
  async updateModule(
    courseId: string,
    moduleId: string,
    updates: ModuleDTO,
    instructorId: string
  ): Promise<IModule> {
    try {
      // Validate IDs
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new Error('Invalid course ID');
      }
      if (!mongoose.Types.ObjectId.isValid(moduleId)) {
        throw new Error('Invalid module ID');
      }
      if (!mongoose.Types.ObjectId.isValid(instructorId)) {
        throw new Error('Invalid instructor ID');
      }

      // Find course and verify ownership
      const course = await Course.findById(courseId).exec();

      if (!course) {
        throw new Error('Course not found');
      }

      if (course.instructorId.toString() !== instructorId) {
        throw new Error('You can only modify your own courses');
      }

      // Find and update module
      const module = (course.modules as any).id(moduleId);

      if (!module) {
        throw new Error('Module not found');
      }

      Object.assign(module, updates);
      await course.save();

      // Invalidate caches
      await this.invalidateCourseCache(courseId);
      await this.invalidateCourseListCache();

      return module;
    } catch (error) {
      console.error('Update module error:', error);
      throw error;
    }
  }

  /**
   * Delete a module
   * 
   * Requirements:
   * - 1.2.2: Allow instructors to delete modules
   */
  async deleteModule(courseId: string, moduleId: string, instructorId: string): Promise<void> {
    try {
      // Validate IDs
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new Error('Invalid course ID');
      }
      if (!mongoose.Types.ObjectId.isValid(moduleId)) {
        throw new Error('Invalid module ID');
      }
      if (!mongoose.Types.ObjectId.isValid(instructorId)) {
        throw new Error('Invalid instructor ID');
      }

      // Find course and verify ownership
      const course = await Course.findById(courseId).exec();

      if (!course) {
        throw new Error('Course not found');
      }

      if (course.instructorId.toString() !== instructorId) {
        throw new Error('You can only modify your own courses');
      }

      // Remove module
      const moduleIndex = course.modules.findIndex(m => m._id.toString() === moduleId);

      if (moduleIndex === -1) {
        throw new Error('Module not found');
      }

      course.modules.splice(moduleIndex, 1);
      await course.save();

      // Invalidate caches
      await this.invalidateCourseCache(courseId);
      await this.invalidateCourseListCache();
    } catch (error) {
      console.error('Delete module error:', error);
      throw error;
    }
  }

  /**
   * Add a lesson to a module
   * 
   * Requirements:
   * - 1.2.2: Allow instructors to add lessons to modules
   */
  async addLesson(
    courseId: string,
    moduleId: string,
    lessonData: LessonDTO,
    instructorId: string
  ): Promise<ILesson> {
    try {
      // Validate IDs
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new Error('Invalid course ID');
      }
      if (!mongoose.Types.ObjectId.isValid(moduleId)) {
        throw new Error('Invalid module ID');
      }
      if (!mongoose.Types.ObjectId.isValid(instructorId)) {
        throw new Error('Invalid instructor ID');
      }

      // Find course and verify ownership
      const course = await Course.findById(courseId).exec();

      if (!course) {
        throw new Error('Course not found');
      }

      if (course.instructorId.toString() !== instructorId) {
        throw new Error('You can only modify your own courses');
      }

      // Find module
      const module = (course.modules as any).id(moduleId);

      if (!module) {
        throw new Error('Module not found');
      }

      // Create lesson
      const normalizedLesson = this.normalizeLessonData(lessonData);

      const newLesson: any = {
        _id: new mongoose.Types.ObjectId(),
        ...normalizedLesson,
        resources: normalizedLesson.resources || [],
        attachments: [],
      };

      module.lessons.push(newLesson);
      await course.save();

      // Invalidate caches
      await this.invalidateCourseCache(courseId);
      await this.invalidateCourseListCache();

      return newLesson;
    } catch (error) {
      console.error('Add lesson error:', error);
      throw error;
    }
  }

  /**
   * Update a lesson
   * 
   * Requirements:
   * - 1.2.2: Allow instructors to update lessons
   */
  async updateLesson(
    courseId: string,
    moduleId: string,
    lessonId: string,
    updates: LessonDTO,
    instructorId: string
  ): Promise<ILesson> {
    try {
      // Validate IDs
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new Error('Invalid course ID');
      }
      if (!mongoose.Types.ObjectId.isValid(moduleId)) {
        throw new Error('Invalid module ID');
      }
      if (!mongoose.Types.ObjectId.isValid(lessonId)) {
        throw new Error('Invalid lesson ID');
      }
      if (!mongoose.Types.ObjectId.isValid(instructorId)) {
        throw new Error('Invalid instructor ID');
      }

      // Find course and verify ownership
      const course = await Course.findById(courseId).exec();

      if (!course) {
        throw new Error('Course not found');
      }

      if (course.instructorId.toString() !== instructorId) {
        throw new Error('You can only modify your own courses');
      }

      // Find module
      const module = (course.modules as any).id(moduleId);

      if (!module) {
        throw new Error('Module not found');
      }

      // Find and update lesson
      const lesson = module.lessons.id(lessonId);

      if (!lesson) {
        throw new Error('Lesson not found');
      }

      const normalizedLessonUpdates = this.normalizeLessonData(updates);

      Object.assign(lesson, normalizedLessonUpdates);
      await course.save();

      // Invalidate caches
      await this.invalidateCourseCache(courseId);
      await this.invalidateCourseListCache();

      return lesson;
    } catch (error) {
      console.error('Update lesson error:', error);
      throw error;
    }
  }

  /**
   * Delete a lesson
   * 
   * Requirements:
   * - 1.2.2: Allow instructors to delete lessons
   */
  async deleteLesson(
    courseId: string,
    moduleId: string,
    lessonId: string,
    instructorId: string
  ): Promise<void> {
    try {
      // Validate IDs
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new Error('Invalid course ID');
      }
      if (!mongoose.Types.ObjectId.isValid(moduleId)) {
        throw new Error('Invalid module ID');
      }
      if (!mongoose.Types.ObjectId.isValid(lessonId)) {
        throw new Error('Invalid lesson ID');
      }
      if (!mongoose.Types.ObjectId.isValid(instructorId)) {
        throw new Error('Invalid instructor ID');
      }

      // Find course and verify ownership
      const course = await Course.findById(courseId).exec();

      if (!course) {
        throw new Error('Course not found');
      }

      if (course.instructorId.toString() !== instructorId) {
        throw new Error('You can only modify your own courses');
      }

      // Find module
      const module = (course.modules as any).id(moduleId);

      if (!module) {
        throw new Error('Module not found');
      }

      // Remove lesson
      const lessonIndex = module.lessons.findIndex((l: any) => l._id.toString() === lessonId);

      if (lessonIndex === -1) {
        throw new Error('Lesson not found');
      }

      module.lessons.splice(lessonIndex, 1);
      await course.save();

      // Invalidate caches
      await this.invalidateCourseCache(courseId);
      await this.invalidateCourseListCache();
    } catch (error) {
      console.error('Delete lesson error:', error);
      throw error;
    }
  }

  /**
   * Add attachment to a lesson
   */
  async addAttachment(
    courseId: string,
    moduleId: string,
    lessonId: string,
    attachmentData: AttachmentDTO,
    instructorId: string
  ): Promise<IAttachment> {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new Error('Invalid course ID');
    }
    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
      throw new Error('Invalid module ID');
    }
    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
      throw new Error('Invalid lesson ID');
    }
    if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      throw new Error('Invalid instructor ID');
    }

    const normalizedFileType = attachmentData.fileType.toLowerCase();
    if (!ALLOWED_FILE_TYPES.includes(normalizedFileType)) {
      throw new Error(`Unsupported file type: ${normalizedFileType}`);
    }

    const course = await Course.findById(courseId).exec();
    if (!course) {
      throw new Error('Course not found');
    }
    if (course.instructorId.toString() !== instructorId) {
      throw new Error('You can only modify your own courses');
    }

    const module = (course.modules as any).id(moduleId);
    if (!module) {
      throw new Error('Module not found');
    }

    const lesson = module.lessons.id(lessonId);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    const attachment: any = {
      _id: attachmentData._id || new mongoose.Types.ObjectId(),
      fileName: attachmentData.fileName,
      fileType: normalizedFileType,
      fileSize: attachmentData.fileSize,
      fileUrl: attachmentData.fileUrl,
      uploadedAt: new Date(),
      isDownloadable: true,
    };

    lesson.attachments.push(attachment);
    await course.save();

    await this.invalidateCourseCache(courseId);
    await this.invalidateCourseListCache();

    return attachment;
  }

  /**
   * Get attachment by ID and include owning course metadata
   */
  async getAttachment(attachmentId: string): Promise<{
    attachment: IAttachment;
    courseId: string;
    instructorId: string;
  }> {
    if (!mongoose.Types.ObjectId.isValid(attachmentId)) {
      throw new Error('Invalid attachment ID');
    }

    const course = await Course.findOne({
      'modules.lessons.attachments._id': new mongoose.Types.ObjectId(attachmentId),
    }).exec();

    if (!course) {
      throw new Error('Attachment not found');
    }

    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        const attachment = lesson.attachments.find(
          (a) => a._id.toString() === attachmentId
        );
        if (attachment) {
          return {
            attachment,
            courseId: course._id.toString(),
            instructorId: course.instructorId.toString(),
          };
        }
      }
    }

    throw new Error('Attachment not found');
  }

  /**
   * Delete attachment by ID
   */
  async deleteAttachment(attachmentId: string, instructorId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(attachmentId)) {
      throw new Error('Invalid attachment ID');
    }
    if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      throw new Error('Invalid instructor ID');
    }

    const course = await Course.findOne({
      'modules.lessons.attachments._id': new mongoose.Types.ObjectId(attachmentId),
    }).exec();

    if (!course) {
      throw new Error('Attachment not found');
    }

    if (course.instructorId.toString() !== instructorId) {
      throw new Error('You can only modify your own courses');
    }

    let removed = false;
    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        const index = lesson.attachments.findIndex(
          (a) => a._id.toString() === attachmentId
        );
        if (index !== -1) {
          lesson.attachments.splice(index, 1);
          removed = true;
          break;
        }
      }
      if (removed) break;
    }

    if (!removed) {
      throw new Error('Attachment not found');
    }

    await course.save();

    await this.invalidateCourseCache(course._id.toString());
    await this.invalidateCourseListCache();
  }

  /**
   * Submit a course for admin review
   */
  async submitCourseForReview(courseId: string, instructorId: string): Promise<CourseDTO> {
    try {
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new Error('Invalid course ID');
      }
      if (!mongoose.Types.ObjectId.isValid(instructorId)) {
        throw new Error('Invalid instructor ID');
      }

      const course = await Course.findById(courseId).exec();
      if (!course) {
        throw new Error('Course not found');
      }

      if (course.instructorId.toString() !== instructorId) {
        throw new Error('You can only submit your own courses for review');
      }

      if (course.modules.length === 0) {
        throw new Error('Course must have at least one module before review');
      }

      const hasLessons = course.modules.some((module) => module.lessons.length > 0);
      if (!hasLessons) {
        throw new Error('Course must have at least one lesson before review');
      }

      course.reviewStatus = CourseReviewStatus.PENDING_REVIEW;
      course.submittedForReviewAt = new Date();
      course.isPublished = false;
      await course.save();

      await this.invalidateCourseCache(courseId);
      await this.invalidateCourseListCache();

      return this.mapCourseToDTO(course);
    } catch (error) {
      console.error('Submit course for review error:', error);
      throw error;
    }
  }

  /**
   * Review a submitted course (admin only)
   */
  async reviewCourse(
    courseId: string,
    adminId: string,
    decision: CourseReviewStatus.APPROVED | CourseReviewStatus.CHANGES_REQUESTED,
    notes?: string
  ): Promise<CourseDTO> {
    try {
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new Error('Invalid course ID');
      }
      if (!mongoose.Types.ObjectId.isValid(adminId)) {
        throw new Error('Invalid admin ID');
      }
      if (
        decision !== CourseReviewStatus.APPROVED &&
        decision !== CourseReviewStatus.CHANGES_REQUESTED
      ) {
        throw new Error('Invalid review decision');
      }

      const course = await Course.findById(courseId).exec();
      if (!course) {
        throw new Error('Course not found');
      }

      course.reviewStatus = decision;
      course.reviewNotes = notes?.trim() || undefined;
      course.reviewedAt = new Date();
      course.reviewedBy = new mongoose.Types.ObjectId(adminId);

      if (decision === CourseReviewStatus.CHANGES_REQUESTED) {
        course.isPublished = false;
      }

      await course.save();

      await this.invalidateCourseCache(courseId);
      await this.invalidateCourseListCache();

      return this.mapCourseToDTO(course);
    } catch (error) {
      console.error('Review course error:', error);
      throw error;
    }
  }

  /**
   * Publish a course
   * 
   * Requirements:
   * - 1.2.3: Allow instructors to publish courses
   * - Require at least 1 module with lessons
   */
  async publishCourse(courseId: string, instructorId: string): Promise<CourseDTO> {
    try {
      // Validate IDs
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new Error('Invalid course ID');
      }
      if (!mongoose.Types.ObjectId.isValid(instructorId)) {
        throw new Error('Invalid instructor ID');
      }

      // Find course and verify ownership
      const course = await Course.findById(courseId).exec();

      if (!course) {
        throw new Error('Course not found');
      }

      if (course.instructorId.toString() !== instructorId) {
        throw new Error('You can only publish your own courses');
      }

      // Validate course has content
      if (course.modules.length === 0) {
        throw new Error('Course must have at least one module before publishing');
      }

      const hasLessons = course.modules.some(module => module.lessons.length > 0);
      if (!hasLessons) {
        throw new Error('Course must have at least one lesson before publishing');
      }

      const platformSettings = await platformSettingsService.getPlatformSettings();
      const requireReview = platformSettings.moderation?.requireCourseReviewBeforePublish ?? true;

      if (requireReview && course.reviewStatus && course.reviewStatus !== CourseReviewStatus.APPROVED) {
        throw new Error('Course must be approved before publishing');
      }

      // Publish course
      course.isPublished = true;
      await course.save();

      // Invalidate caches
      await this.invalidateCourseCache(courseId);
      await this.invalidateCourseListCache();

      return this.mapCourseToDTO(course);
    } catch (error) {
      console.error('Publish course error:', error);
      throw error;
    }
  }

  /**
   * Unpublish a course
   * 
   * Requirements:
   * - 1.2.3: Allow instructors to unpublish courses
   */
  async unpublishCourse(courseId: string, instructorId: string): Promise<CourseDTO> {
    try {
      // Validate IDs
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new Error('Invalid course ID');
      }
      if (!mongoose.Types.ObjectId.isValid(instructorId)) {
        throw new Error('Invalid instructor ID');
      }

      // Find course and verify ownership
      const course = await Course.findById(courseId).exec();

      if (!course) {
        throw new Error('Course not found');
      }

      if (course.instructorId.toString() !== instructorId) {
        throw new Error('You can only unpublish your own courses');
      }

      // Unpublish course
      course.isPublished = false;
      await course.save();

      // Invalidate caches
      await this.invalidateCourseCache(courseId);
      await this.invalidateCourseListCache();

      return this.mapCourseToDTO(course);
    } catch (error) {
      console.error('Unpublish course error:', error);
      throw error;
    }
  }

  /**
   * Map Course document to DTO
   * @private
   */
  private mapCourseToDTO(course: any): CourseDTO {
    const pricingQuote = getCourseSalePriceQuote(course);
    const rawInstructor = course?.instructorId;
    const instructorObject =
      rawInstructor && typeof rawInstructor === 'object' && (rawInstructor._id || rawInstructor.id);

    const instructorId = instructorObject
      ? String(rawInstructor._id?.toString?.() ?? rawInstructor.id ?? '')
      : String(rawInstructor?.toString?.() ?? rawInstructor ?? '');

    const instructor =
      instructorObject && (rawInstructor.firstName || rawInstructor.lastName || rawInstructor.email)
        ? {
            id: instructorId,
            firstName: rawInstructor.firstName ?? '',
            lastName: rawInstructor.lastName ?? '',
            email: rawInstructor.email,
          }
        : undefined;

    return {
      id: course._id.toString(),
      title: course.title,
      description: course.description,
      instructorId,
      instructor,
      category: course.category,
      level: course.level,
      price: course.price,
      currency: course.currency,
      isFree: course.isFree,
      saleEnabled: Boolean(course.saleEnabled),
      saleType: course.saleType,
      saleValue: Number(course.saleValue ?? 0),
      saleStartsAt: course.saleStartsAt,
      saleEndsAt: course.saleEndsAt,
      currentPrice: pricingQuote.finalPrice,
      hasActiveSale: pricingQuote.hasActiveSale,
      saleDiscountAmount: pricingQuote.saleDiscountAmount,
      thumbnail: course.thumbnail,
      modules: course.modules,
      prerequisites: course.prerequisites,
      learningObjectives: course.learningObjectives,
      isPublished: course.isPublished,
      reviewStatus: course.reviewStatus,
      reviewNotes: course.reviewNotes,
      submittedForReviewAt: course.submittedForReviewAt,
      reviewedAt: course.reviewedAt,
      enrollmentCount: course.enrollmentCount,
      rating: course.rating,
      reviewCount: course.reviewCount,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };
  }

  /**
   * Invalidate course cache
   * @private
   */
  private async invalidateCourseCache(courseId: string): Promise<void> {
    const cacheKey = `${this.COURSE_CACHE_PREFIX}${courseId}`;
    await redis.del(cacheKey);
  }

  /**
   * Invalidate course list cache
   * @private
   */
  private async invalidateCourseListCache(): Promise<void> {
    // In a real implementation, you might want to use a more sophisticated cache invalidation strategy
    // For now, we'll just delete all keys matching the pattern
    const pattern = `${this.COURSE_LIST_CACHE_PREFIX}*`;
    const keys = await redis.getRedisClient().keys(pattern);
    if (keys.length > 0) {
      await Promise.all(keys.map((key: string) => redis.del(key)));
    }
  }
}

// Export singleton instance
export const courseService = new CourseService();
export default courseService;
