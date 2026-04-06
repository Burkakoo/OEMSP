import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import * as quizService from '../services/quiz.service';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';

/**
 * Quiz Controllers
 * Handle HTTP requests for quiz operations
 */

/**
 * Get quiz by ID
 * GET /api/v1/quizzes/:id
 */
export const getQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Quiz ID is required',
      });
      return;
    }

    const userRole = req.user?.role;
    const userId = req.user?.userId;

    // Admins can always view quizzes with answers
    if (userRole === 'admin') {
      const quiz = await quizService.getQuiz(id as string, true);

      if (!quiz) {
        res.status(404).json({
          success: false,
          message: 'Quiz not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: quiz,
      });
      return;
    }

    // Instructors can view answers only for their own courses
    if (userRole === 'instructor' && userId) {
      const quizWithoutAnswers = await quizService.getQuiz(id as string, false);

      if (!quizWithoutAnswers) {
        res.status(404).json({
          success: false,
          message: 'Quiz not found',
        });
        return;
      }

      const quizCourseInstructorId = (quizWithoutAnswers as any)?.courseId?.instructorId;
      const isOwner = quizCourseInstructorId && String(quizCourseInstructorId) === userId;

      if (!isOwner) {
        res.status(200).json({
          success: true,
          data: quizWithoutAnswers,
        });
        return;
      }

      const quizWithAnswers = await quizService.getQuiz(id as string, true);

      res.status(200).json({
        success: true,
        data: quizWithAnswers || quizWithoutAnswers,
      });
      return;
    }

    // Students (and any other role) see quizzes without answers
    const quiz = await quizService.getQuiz(id as string, false);

    if (!quiz) {
      res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: quiz,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get quiz',
    });
  }
};

/**
 * List course quizzes
 * GET /api/v1/courses/:courseId/quizzes
 */
export const listCourseQuizzes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rawCourseId = req.params.courseId;
    const courseId = Array.isArray(rawCourseId) ? rawCourseId[0] : rawCourseId;

    if (!courseId) {
      res.status(400).json({
        success: false,
        message: 'Course ID is required',
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid course ID',
      });
      return;
    }

    const userRole = req.user?.role;
    const userId = req.user?.userId;

    if (!userRole || !userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const includeUnpublishedQuery = String(req.query.includeUnpublished || '').toLowerCase() === 'true';
    let includeUnpublished = false;

    if (userRole === 'student') {
      const enrollment = await Enrollment.findOne({
        studentId: userId,
        courseId,
      }).select('_id');

      if (!enrollment) {
        res.status(403).json({
          success: false,
          message: 'You must be enrolled in this course to view its quizzes',
        });
        return;
      }
    } else if (userRole === 'instructor') {
      const course = await Course.findById(courseId).select('instructorId');
      if (!course) {
        res.status(404).json({
          success: false,
          message: 'Course not found',
        });
        return;
      }

      const isOwner = String(course.instructorId) === userId;
      if (includeUnpublishedQuery && !isOwner) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      includeUnpublished = isOwner && includeUnpublishedQuery;
    } else if (userRole === 'admin') {
      includeUnpublished = includeUnpublishedQuery;
    } else {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    const quizzes = await quizService.listCourseQuizzes(courseId, {
      includeUnpublished,
    });

    res.status(200).json({
      success: true,
      data: quizzes,
    });
  } catch (error: any) {
    const statusCode = error.message?.includes('Invalid course ID') ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to list quizzes',
    });
  }
};

/**
 * Create quiz
 * POST /api/v1/courses/:courseId/quizzes
 */
export const createQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const {
      moduleId,
      title,
      description,
      questions,
      duration,
      passingScore,
      maxAttempts,
      shuffleQuestions,
      shuffleOptions,
      isPublished,
    } = req.body;

    // Validation
    if (!moduleId) {
      res.status(400).json({
        success: false,
        message: 'Module ID is required',
      });
      return;
    }

    if (!title || !description) {
      res.status(400).json({
        success: false,
        message: 'Title and description are required',
      });
      return;
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      res.status(400).json({
        success: false,
        message: 'At least one question is required',
      });
      return;
    }

    if (!duration || duration < 1) {
      res.status(400).json({
        success: false,
        message: 'Valid duration is required',
      });
      return;
    }

    if (passingScore === undefined || passingScore < 0 || passingScore > 100) {
      res.status(400).json({
        success: false,
        message: 'Passing score must be between 0 and 100',
      });
      return;
    }

    if (!maxAttempts || maxAttempts < 1) {
      res.status(400).json({
        success: false,
        message: 'Valid max attempts is required',
      });
      return;
    }

    // Only instructors can create quizzes
    if (req.user?.role !== 'instructor') {
      res.status(403).json({
        success: false,
        message: 'Only instructors can create quizzes',
      });
      return;
    }

    const quiz = await quizService.createQuiz(
      {
        courseId: courseId as string,
        moduleId,
        title,
        description,
        questions,
        duration,
        passingScore,
        maxAttempts,
        shuffleQuestions,
        shuffleOptions,
        isPublished,
      },
      req.user.userId
    );

    res.status(201).json({
      success: true,
      data: quiz,
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 :
                       error.message.includes('only create quizzes') ? 403 : 400;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to create quiz',
    });
  }
};

/**
 * Update quiz
 * PUT /api/v1/quizzes/:id
 */
export const updateQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Only instructors can update quizzes
    if (req.user?.role !== 'instructor') {
      res.status(403).json({
        success: false,
        message: 'Only instructors can update quizzes',
      });
      return;
    }

    const quiz = await quizService.updateQuiz(id as string, updates, req.user.userId);

    res.status(200).json({
      success: true,
      data: quiz,
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 :
                       error.message.includes('only update quizzes') ? 403 : 400;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update quiz',
    });
  }
};

/**
 * Delete quiz
 * DELETE /api/v1/quizzes/:id
 */
export const deleteQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Only instructors can delete quizzes
    if (req.user?.role !== 'instructor') {
      res.status(403).json({
        success: false,
        message: 'Only instructors can delete quizzes',
      });
      return;
    }

    await quizService.deleteQuiz(id as string, req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully',
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 :
                       error.message.includes('only delete quizzes') ? 403 :
                       error.message.includes('existing results') ? 409 : 400;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to delete quiz',
    });
  }
};

/**
 * Submit quiz
 * POST /api/v1/quizzes/:id/submit
 */
export const submitQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { answers, startTime } = req.body;

    // Validation
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Answers are required',
      });
      return;
    }

    // Only students can submit quizzes
    if (req.user?.role !== 'student') {
      res.status(403).json({
        success: false,
        message: 'Only students can submit quizzes',
      });
      return;
    }

    const result = await quizService.submitQuiz(
      id as string,
      req.user.userId,
      answers,
      startTime ? new Date(startTime) : undefined
    );

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 :
                       error.message.includes('not enrolled') ? 403 :
                       error.message.includes('Maximum attempts') ? 429 :
                       error.message.includes('time limit') ? 400 : 400;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to submit quiz',
    });
  }
};

/**
 * Get quiz results
 * GET /api/v1/quizzes/:id/results
 */
export const getQuizResults = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { studentId } = req.query;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Quiz ID is required',
      });
      return;
    }

    const userRole = req.user?.role;
    const userId = req.user?.userId;

    // Students can only see their own results
    if (userRole === 'student') {
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const results = await quizService.getQuizResults(id as string, userId);

      res.status(200).json({
        success: true,
        data: {
          results,
        },
      });
      return;
    }

    // Only instructors/admins can see other students' results and statistics
    if (userRole !== 'instructor' && userRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    // Instructors must own the course to see results/statistics
    if (userRole === 'instructor') {
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const quizMeta = await quizService.getQuiz(id as string, false);
      if (!quizMeta) {
        res.status(404).json({
          success: false,
          message: 'Quiz not found',
        });
        return;
      }

      const quizCourseInstructorId = (quizMeta as any)?.courseId?.instructorId;
      const isOwner = quizCourseInstructorId && String(quizCourseInstructorId) === userId;
      if (!isOwner) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }
    } else {
      // Admin: still return 404 for non-existent quizzes
      const quizMeta = await quizService.getQuiz(id as string, false);
      if (!quizMeta) {
        res.status(404).json({
          success: false,
          message: 'Quiz not found',
        });
        return;
      }
    }

    const results = studentId
      ? await quizService.getQuizResults(id as string, studentId as string)
      : await quizService.getAllQuizResults(id as string);

    const statistics = await quizService.getQuizStatistics(id as string);

    res.status(200).json({
      success: true,
      data: {
        results,
        statistics,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get quiz results',
    });
  }
};

/**
 * Add question to quiz
 * POST /api/v1/quizzes/:id/questions
 */
export const addQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Quiz ID is required',
      });
      return;
    }

    // Only instructors can add questions
    if (req.user?.role !== 'instructor') {
      res.status(403).json({
        success: false,
        message: 'Only instructors can add questions',
      });
      return;
    }

    const instructorId = req.user?.userId;
    if (!instructorId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({
        success: false,
        message: 'Question data is required',
      });
      return;
    }

    const updatedQuiz = await quizService.addQuestion(id as string, req.body, instructorId);
    const addedQuestion = updatedQuiz.questions[updatedQuiz.questions.length - 1];

    res.status(201).json({
      success: true,
      data: addedQuestion || updatedQuiz,
    });
  } catch (error: any) {
    const statusCode = error.message?.includes('not found') ? 404 :
                       error.message?.includes('only add questions') ? 403 : 400;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to add question',
    });
  }
};

/**
 * Get quiz statistics
 * GET /api/v1/quizzes/:id/statistics
 */
export const getQuizStatistics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Quiz ID is required',
      });
      return;
    }

    const userRole = req.user?.role;
    const userId = req.user?.userId;

    // Only instructors/admins can access statistics
    if (userRole !== 'instructor' && userRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    const quizMeta = await quizService.getQuiz(id as string, false);
    if (!quizMeta) {
      res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
      return;
    }

    // Instructors must own the course
    if (userRole === 'instructor') {
      const quizCourseInstructorId = (quizMeta as any)?.courseId?.instructorId;
      const isOwner = quizCourseInstructorId && userId && String(quizCourseInstructorId) === userId;

      if (!isOwner) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }
    }

    const statistics = await quizService.getQuizStatistics(id as string);

    res.status(200).json({
      success: true,
      data: statistics,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get quiz statistics',
    });
  }
};

/**
 * Update quiz question
 * PUT /api/v1/questions/:id
 */
export const updateQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Question ID is required',
      });
      return;
    }

    // Only instructors can update questions
    if (req.user?.role !== 'instructor') {
      res.status(403).json({
        success: false,
        message: 'Only instructors can update questions',
      });
      return;
    }

    const instructorId = req.user?.userId;
    if (!instructorId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({
        success: false,
        message: 'Update data is required',
      });
      return;
    }

    const question = await quizService.updateQuestion(id as string, req.body, instructorId);

    res.status(200).json({
      success: true,
      data: question,
    });
  } catch (error: any) {
    const statusCode = error.message?.includes('not found') ? 404 :
                       error.message?.includes('only update questions') ? 403 : 400;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update question',
    });
  }
};

/**
 * Delete quiz question
 * DELETE /api/v1/questions/:id
 */
export const deleteQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Question ID is required',
      });
      return;
    }

    // Only instructors can delete questions
    if (req.user?.role !== 'instructor') {
      res.status(403).json({
        success: false,
        message: 'Only instructors can delete questions',
      });
      return;
    }

    const instructorId = req.user?.userId;
    if (!instructorId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    await quizService.deleteQuestion(id as string, instructorId);

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error: any) {
    const statusCode = error.message?.includes('not found') ? 404 :
                       error.message?.includes('only delete questions') ? 403 :
                       error.message?.includes('at least 1 question') ? 400 : 400;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to delete question',
    });
  }
};
