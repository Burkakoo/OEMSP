import mongoose from 'mongoose';
import Quiz, { IQuiz, IQuestion, QuestionType } from '../models/Quiz';
import QuizResult, { IQuizResult, IQuizAnswer } from '../models/QuizResult';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';
import { getCache, setCache, deleteCache } from '../utils/cache.utils';
import { getQuestionBankItemsByIds } from './questionBank.service';
import { normalizeQuestionInput, validateQuestion } from '../utils/question.utils';

const CACHE_TTL = 300; // 5 minutes
const getQuizCacheKeys = (quizId: string): string[] => [
  `quiz:${quizId}:public`,
  `quiz:${quizId}:full`,
];

const invalidateQuizCache = async (quizId: string): Promise<void> => {
  await deleteCache(...getQuizCacheKeys(quizId));
};

/**
 * Quiz Service
 * Handles all quiz-related business logic
 */

const shuffleArray = <T>(items: T[]): T[] => {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const currentItem = shuffled[index] as T;
    const swapItem = shuffled[swapIndex] as T;
    shuffled[index] = swapItem;
    shuffled[swapIndex] = currentItem;
  }
  return shuffled;
};

const normalizeQuizQuestion = (question: Partial<IQuestion>): Partial<IQuestion> => {
  const normalizedQuestion = normalizeQuestionInput(question);

  const questionBankItemId = (question as any)?.questionBankItemId;
  if (questionBankItemId && mongoose.Types.ObjectId.isValid(String(questionBankItemId))) {
    (normalizedQuestion as any).questionBankItemId = new mongoose.Types.ObjectId(
      String(questionBankItemId)
    );
  }

  return normalizedQuestion;
};

const ensureLinkedQuestionBankItemsExist = async (
  courseId: string,
  questions: Partial<IQuestion>[]
): Promise<void> => {
  const linkedIds = questions
    .map((question) => (question as any)?.questionBankItemId)
    .filter((value): value is mongoose.Types.ObjectId | string => Boolean(value))
    .map((value) => String(value));

  if (linkedIds.length === 0) {
    return;
  }

  const linkedItems = await getQuestionBankItemsByIds({
    courseId,
    itemIds: linkedIds,
  });

  if (linkedItems.length !== Array.from(new Set(linkedIds)).length) {
    throw new Error('One or more linked question bank items could not be found for this course');
  }
};

const buildStudentQuizView = (quiz: IQuiz | any): IQuiz => {
  const quizObject = JSON.parse(JSON.stringify(quiz));

  if (quizObject.shuffleQuestions) {
    quizObject.questions = shuffleArray(quizObject.questions);
  }

  if (quizObject.shuffleOptions) {
    quizObject.questions = quizObject.questions.map((question: any) => {
      if (!Array.isArray(question.options) || question.options.length <= 1) {
        return question;
      }

      return {
        ...question,
        options: shuffleArray(question.options),
      };
    });
  }

  return quizObject as IQuiz;
};

/**
 * Verify instructor owns the course
 */
const verifyCourseOwnership = async (courseId: string, instructorId: string): Promise<boolean> => {
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new Error('Invalid course ID');
  }

  const course = await Course.findById(courseId);
  if (!course) {
    throw new Error('Course not found');
  }

  return course.instructorId.toString() === instructorId;
};

/**
 * Create a new quiz
 */
export const createQuiz = async (
  quizData: {
    courseId: string;
    moduleId: string;
    title: string;
    description: string;
    questions: Partial<IQuestion>[];
    duration: number;
    passingScore: number;
    maxAttempts: number;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    isPublished?: boolean;
  },
  instructorId: string
): Promise<IQuiz> => {
  // Validate course ownership
  const ownsC = await verifyCourseOwnership(quizData.courseId, instructorId);
  if (!ownsC) {
    throw new Error('You can only create quizzes for your own courses');
  }

  // Validate course and module exist
  const course = await Course.findById(quizData.courseId);
  if (!course) {
    throw new Error('Course not found');
  }

  // Verify module exists in course
  const moduleExists = course.modules.some(
    (m) => m._id.toString() === quizData.moduleId
  );
  if (!moduleExists) {
    throw new Error('Module not found in course');
  }

  // Validate all questions
  if (!quizData.questions || quizData.questions.length === 0) {
    throw new Error('Quiz must have at least 1 question');
  }

  const normalizedQuestions = quizData.questions.map(normalizeQuizQuestion);

  for (let i = 0; i < normalizedQuestions.length; i++) {
    const question = normalizedQuestions[i];
    if (!question) continue;
    const validation = validateQuestion(question);
    if (!validation.valid) {
      throw new Error(`Question ${i + 1}: ${validation.errors.join(', ')}`);
    }
  }

  await ensureLinkedQuestionBankItemsExist(quizData.courseId, normalizedQuestions);

  // Create quiz
  const quiz = await Quiz.create({
    courseId: quizData.courseId,
    moduleId: quizData.moduleId,
    title: quizData.title,
    description: quizData.description,
    questions: normalizedQuestions,
    duration: quizData.duration,
    passingScore: quizData.passingScore,
    maxAttempts: quizData.maxAttempts,
    shuffleQuestions: quizData.shuffleQuestions ?? false,
    shuffleOptions: quizData.shuffleOptions ?? false,
    isPublished: quizData.isPublished ?? false,
  });

  // Invalidate caches
  await invalidateQuizCache(quiz._id.toString());
  await deleteCache(`quizzes:course:${quizData.courseId}`);

  return quiz;
};

/**
 * List quizzes by course
 */
export const listCourseQuizzes = async (
  courseId: string,
  options: { includeUnpublished?: boolean } = {}
): Promise<IQuiz[]> => {
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new Error('Invalid course ID');
  }

  const query: any = { courseId };
  if (!options.includeUnpublished) {
    query.isPublished = true;
  }

  return Quiz.find(query).sort({ createdAt: -1 }).exec();
};

/**
 * Update quiz
 */
export const updateQuiz = async (
  quizId: string,
  updates: Partial<{
    title: string;
    description: string;
    questions: Partial<IQuestion>[];
    duration: number;
    passingScore: number;
    maxAttempts: number;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    isPublished: boolean;
  }>,
  instructorId: string
): Promise<IQuiz> => {
  if (!mongoose.Types.ObjectId.isValid(quizId)) {
    throw new Error('Invalid quiz ID');
  }

  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    throw new Error('Quiz not found');
  }

  // Verify instructor owns the course
  const ownsCourse = await verifyCourseOwnership(quiz.courseId.toString(), instructorId);
  if (!ownsCourse) {
    throw new Error('You can only update quizzes for your own courses');
  }

  // Validate questions if provided
  if (updates.questions) {
    if (updates.questions.length === 0) {
      throw new Error('Quiz must have at least 1 question');
    }

    const normalizedQuestions = updates.questions.map(normalizeQuizQuestion);

    for (let i = 0; i < normalizedQuestions.length; i++) {
      const question = normalizedQuestions[i];
      if (!question) continue;
      const validation = validateQuestion(question);
      if (!validation.valid) {
        throw new Error(`Question ${i + 1}: ${validation.errors.join(', ')}`);
      }
    }

    await ensureLinkedQuestionBankItemsExist(quiz.courseId.toString(), normalizedQuestions);
    updates.questions = normalizedQuestions;
  }

  // Update quiz
  Object.assign(quiz, updates);
  await quiz.save();

  // Invalidate caches
  await invalidateQuizCache(quizId);
  await deleteCache(`quizzes:course:${quiz.courseId}`);

  return quiz;
};

/**
 * Delete quiz
 */
export const deleteQuiz = async (quizId: string, instructorId: string): Promise<void> => {
  if (!mongoose.Types.ObjectId.isValid(quizId)) {
    throw new Error('Invalid quiz ID');
  }

  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    throw new Error('Quiz not found');
  }

  // Verify instructor owns the course
  const ownsCourse = await verifyCourseOwnership(quiz.courseId.toString(), instructorId);
  if (!ownsCourse) {
    throw new Error('You can only delete quizzes for your own courses');
  }

  // Check if quiz has results
  const hasResults = await QuizResult.exists({ quizId });
  if (hasResults) {
    throw new Error('Cannot delete quiz with existing results');
  }

  await Quiz.findByIdAndDelete(quizId);

  // Invalidate caches
  await invalidateQuizCache(quizId);
  await deleteCache(`quizzes:course:${quiz.courseId}`);
};

/**
 * Get quiz by ID
 */
export const getQuiz = async (quizId: string, includeAnswers: boolean = false): Promise<IQuiz | null> => {
  if (!mongoose.Types.ObjectId.isValid(quizId)) {
    throw new Error('Invalid quiz ID');
  }

  const cacheKey = includeAnswers ? `quiz:${quizId}:full` : `quiz:${quizId}:public`;
  const cached = await getCache<IQuiz>(cacheKey);
  if (cached) {
    return includeAnswers ? cached : buildStudentQuizView(cached);
  }

  const quiz = await Quiz.findById(quizId).populate('courseId', 'title instructorId');
  if (!quiz) {
    return null;
  }

  const quizObj: any = quiz.toObject();

  // If not including answers, remove correct answers from questions
  if (!includeAnswers) {
    quizObj.questions = quizObj.questions.map((q: any) => {
      const { correctAnswer, ...questionWithoutAnswer } = q;
      return questionWithoutAnswer;
    });
  }

  await setCache(cacheKey, quizObj, CACHE_TTL);
  return includeAnswers ? (quizObj as IQuiz) : buildStudentQuizView(quizObj);
};

/**
 * Add question to quiz
 */
export const addQuestion = async (
  quizId: string,
  question: Partial<IQuestion>,
  instructorId: string
): Promise<IQuiz> => {
  if (!mongoose.Types.ObjectId.isValid(quizId)) {
    throw new Error('Invalid quiz ID');
  }

  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    throw new Error('Quiz not found');
  }

  // Verify instructor owns the course
  const ownsCourse = await verifyCourseOwnership(quiz.courseId.toString(), instructorId);
  if (!ownsCourse) {
    throw new Error('You can only add questions to quizzes for your own courses');
  }

  // Validate question
  const normalizedQuestion = normalizeQuizQuestion(question);
  const validation = validateQuestion(normalizedQuestion);
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }

  await ensureLinkedQuestionBankItemsExist(quiz.courseId.toString(), [normalizedQuestion]);

  // Add question
  quiz.questions.push(normalizedQuestion as IQuestion);
  await quiz.save();

  // Invalidate caches
  await invalidateQuizCache(quizId);
  await deleteCache(`quizzes:course:${quiz.courseId}`);

  return quiz;
};

type QuestionUpdate = Partial<
  Pick<IQuestion, 'type' | 'text' | 'options' | 'correctAnswer' | 'points' | 'explanation' | 'questionBankItemId'>
>;

/**
 * Update a question by question ID
 */
export const updateQuestion = async (
  questionId: string,
  updates: QuestionUpdate,
  instructorId: string
): Promise<IQuestion> => {
  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    throw new Error('Invalid question ID');
  }

  const quiz = await Quiz.findOne({ 'questions._id': questionId });
  if (!quiz) {
    throw new Error('Question not found');
  }

  // Verify instructor owns the course
  const ownsCourse = await verifyCourseOwnership(quiz.courseId.toString(), instructorId);
  if (!ownsCourse) {
    throw new Error('You can only update questions for your own courses');
  }

  const existingQuestion = quiz.questions.find((q) => q._id.toString() === questionId);
  if (!existingQuestion) {
    throw new Error('Question not found');
  }

  const allowedUpdates: QuestionUpdate = {};
  if (updates.type !== undefined) allowedUpdates.type = updates.type;
  if (updates.text !== undefined) allowedUpdates.text = updates.text;
  if (updates.options !== undefined) allowedUpdates.options = updates.options;
  if (updates.correctAnswer !== undefined) allowedUpdates.correctAnswer = updates.correctAnswer;
  if (updates.points !== undefined) allowedUpdates.points = updates.points;
  if (updates.explanation !== undefined) allowedUpdates.explanation = updates.explanation;
  if ((updates as any).questionBankItemId !== undefined) {
    allowedUpdates.questionBankItemId = (updates as any).questionBankItemId;
  }

  const merged: Partial<IQuestion> = normalizeQuizQuestion({
    type: allowedUpdates.type ?? existingQuestion.type,
    text: allowedUpdates.text ?? existingQuestion.text,
    options: allowedUpdates.options ?? existingQuestion.options,
    correctAnswer: allowedUpdates.correctAnswer ?? existingQuestion.correctAnswer,
    points: allowedUpdates.points ?? existingQuestion.points,
    explanation: allowedUpdates.explanation ?? existingQuestion.explanation,
    questionBankItemId: (updates as any).questionBankItemId ?? (existingQuestion as any).questionBankItemId,
  });

  const validation = validateQuestion(merged);
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }

  await ensureLinkedQuestionBankItemsExist(quiz.courseId.toString(), [merged]);

  Object.assign(existingQuestion as any, allowedUpdates);
  if ((merged as any).questionBankItemId) {
    (existingQuestion as any).questionBankItemId = (merged as any).questionBankItemId;
  } else {
    (existingQuestion as any).questionBankItemId = undefined;
  }
  await quiz.save();

  // Invalidate caches
  await invalidateQuizCache(quiz._id.toString());
  await deleteCache(`quizzes:course:${quiz.courseId}`);

  return (existingQuestion as any).toObject ? (existingQuestion as any).toObject() : (existingQuestion as any);
};

/**
 * Delete a question by question ID
 */
export const deleteQuestion = async (questionId: string, instructorId: string): Promise<void> => {
  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    throw new Error('Invalid question ID');
  }

  const quiz = await Quiz.findOne({ 'questions._id': questionId });
  if (!quiz) {
    throw new Error('Question not found');
  }

  // Verify instructor owns the course
  const ownsCourse = await verifyCourseOwnership(quiz.courseId.toString(), instructorId);
  if (!ownsCourse) {
    throw new Error('You can only delete questions for your own courses');
  }

  if (quiz.questions.length <= 1) {
    throw new Error('Quiz must have at least 1 question');
  }

  const questionExists = quiz.questions.some((q) => q._id.toString() === questionId);
  if (!questionExists) {
    throw new Error('Question not found');
  }

  (quiz.questions as any).pull({ _id: questionId });
  await quiz.save();

  // Invalidate caches
  await invalidateQuizCache(quiz._id.toString());
  await deleteCache(`quizzes:course:${quiz.courseId}`);
};

/**
 * Grade a quiz submission
 */
const gradeQuiz = (
  quiz: IQuiz,
  answers: { questionId: string; answer: string | string[] }[]
): { gradedAnswers: IQuizAnswer[]; score: number; totalPoints: number } => {
  const gradedAnswers: IQuizAnswer[] = [];
  let score = 0;
  let totalPoints = 0;

  for (const question of quiz.questions) {
    totalPoints += question.points;

    const studentAnswer = answers.find(
      (a) => a.questionId === question._id.toString()
    );

    if (!studentAnswer) {
      // Question not answered
      gradedAnswers.push({
        questionId: question._id,
        studentAnswer: '',
        isCorrect: false,
        pointsEarned: 0,
      });
      continue;
    }

    let isCorrect = false;

    // Grade based on question type
    if (question.type === QuestionType.MULTI_SELECT) {
      // Multi-select: compare arrays
      const correctAnswers = Array.isArray(question.correctAnswer)
        ? question.correctAnswer
        : [question.correctAnswer];
      const studentAnswers = Array.isArray(studentAnswer.answer)
        ? studentAnswer.answer
        : [studentAnswer.answer];

      isCorrect =
        correctAnswers.length === studentAnswers.length &&
        correctAnswers.every((a) => studentAnswers.includes(a));
    } else if (question.type === QuestionType.SHORT_ANSWER) {
      // Short answer: case-insensitive comparison
      const correctAnswer = String(question.correctAnswer).toLowerCase().trim();
      const studentAns = String(studentAnswer.answer).toLowerCase().trim();
      isCorrect = correctAnswer === studentAns;
    } else {
      // Multiple choice and true/false: exact match
      isCorrect = String(question.correctAnswer) === String(studentAnswer.answer);
    }

    const pointsEarned = isCorrect ? question.points : 0;
    score += pointsEarned;

    gradedAnswers.push({
      questionId: question._id,
      studentAnswer: studentAnswer.answer,
      isCorrect,
      pointsEarned,
    });
  }

  return { gradedAnswers, score, totalPoints };
};

/**
 * Submit quiz and get results
 */
export const submitQuiz = async (
  quizId: string,
  studentId: string,
  answers: { questionId: string; answer: string | string[] }[],
  startTime?: Date
): Promise<IQuizResult> => {
  if (!mongoose.Types.ObjectId.isValid(quizId)) {
    throw new Error('Invalid quiz ID');
  }
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new Error('Invalid student ID');
  }

  // Get quiz with answers
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    throw new Error('Quiz not found');
  }

  if (!quiz.isPublished) {
    throw new Error('Quiz is not published');
  }

  // Verify student is enrolled in the course
  const enrollment = await Enrollment.findOne({
    studentId,
    courseId: quiz.courseId,
  });
  if (!enrollment) {
    throw new Error('You must be enrolled in the course to take this quiz');
  }

  // Check attempt limit
  const previousAttempts = await QuizResult.countDocuments({
    studentId,
    quizId,
  });

  if (previousAttempts >= quiz.maxAttempts) {
    throw new Error(`Maximum attempts (${quiz.maxAttempts}) reached for this quiz`);
  }

  // Validate time limit if startTime provided
  if (startTime) {
    const now = new Date();
    const elapsedMinutes = (now.getTime() - startTime.getTime()) / (1000 * 60);
    if (elapsedMinutes > quiz.duration) {
      throw new Error('Quiz time limit exceeded');
    }
  }

  // Grade the quiz
  const { gradedAnswers, score, totalPoints } = gradeQuiz(quiz, answers);

  // Calculate percentage
  const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
  const passed = percentage >= quiz.passingScore;

  // Create quiz result
  const result = await QuizResult.create({
    studentId,
    quizId,
    answers: gradedAnswers,
    score,
    percentage: Math.round(percentage * 100) / 100,
    passed,
    attemptNumber: previousAttempts + 1,
    submittedAt: new Date(),
    gradedAt: new Date(),
  });

  return result;
};

/**
 * Get quiz results for a student
 */
export const getQuizResults = async (
  quizId: string,
  studentId: string
): Promise<IQuizResult[]> => {
  if (!mongoose.Types.ObjectId.isValid(quizId)) {
    throw new Error('Invalid quiz ID');
  }
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new Error('Invalid student ID');
  }

  const results = await QuizResult.find({ quizId, studentId })
    .sort({ attemptNumber: -1 })
    .populate('quizId', 'title passingScore maxAttempts');

  return results;
};

/**
 * Get all quiz results (for instructors/admins)
 */
export const getAllQuizResults = async (quizId: string): Promise<IQuizResult[]> => {
  if (!mongoose.Types.ObjectId.isValid(quizId)) {
    throw new Error('Invalid quiz ID');
  }

  const results = await QuizResult.find({ quizId })
    .sort({ submittedAt: -1, attemptNumber: -1 })
    .populate('quizId', 'title passingScore maxAttempts')
    .populate('studentId', 'firstName lastName email');

  return results;
};

/**
 * Get quiz statistics (for instructors)
 */
export const getQuizStatistics = async (quizId: string): Promise<{
  totalAttempts: number;
  uniqueStudents: number;
  averageScore: number;
  averagePercentage: number;
  passRate: number;
  highestScore: number;
  lowestScore: number;
}> => {
  if (!mongoose.Types.ObjectId.isValid(quizId)) {
    throw new Error('Invalid quiz ID');
  }

  const results = await QuizResult.find({ quizId });

  if (results.length === 0) {
    return {
      totalAttempts: 0,
      uniqueStudents: 0,
      averageScore: 0,
      averagePercentage: 0,
      passRate: 0,
      highestScore: 0,
      lowestScore: 0,
    };
  }

  const uniqueStudents = new Set(results.map((r) => r.studentId.toString())).size;
  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const totalPercentage = results.reduce((sum, r) => sum + r.percentage, 0);
  const passedCount = results.filter((r) => r.passed).length;
  const scores = results.map((r) => r.score);

  return {
    totalAttempts: results.length,
    uniqueStudents,
    averageScore: Math.round((totalScore / results.length) * 100) / 100,
    averagePercentage: Math.round((totalPercentage / results.length) * 100) / 100,
    passRate: Math.round((passedCount / results.length) * 100 * 100) / 100,
    highestScore: Math.max(...scores),
    lowestScore: Math.min(...scores),
  };
};
