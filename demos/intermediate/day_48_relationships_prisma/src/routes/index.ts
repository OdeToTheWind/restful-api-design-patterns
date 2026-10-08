import { Router } from 'express';
import { asyncHandler, validateBody, validateParams } from '@restful/shared';
import { CourseController, StudentController } from '../controllers/course.controller';
import { createCourseSchema, createStudentSchema, enrollSchema, idParamsSchema } from '../validators/course.schema';

const router = Router();
const validId = validateParams(idParamsSchema);

router.get('/courses', asyncHandler(CourseController.list));
router.get('/courses/naive', asyncHandler(CourseController.listNaive));
router.post('/courses', validateBody(createCourseSchema), asyncHandler(CourseController.create));
router.get('/courses/:id', validId, asyncHandler(CourseController.get));
router.delete('/courses/:id', validId, asyncHandler(CourseController.remove));
router.post('/courses/:id/enrollments', validId, validateBody(enrollSchema), asyncHandler(CourseController.enroll));

router.post('/students', validateBody(createStudentSchema), asyncHandler(StudentController.create));
router.get('/students/:id/courses', validId, asyncHandler(StudentController.courses));

export default router;
