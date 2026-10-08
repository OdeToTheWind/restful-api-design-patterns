import { Request, Response } from 'express';
import { ApiResponse } from '@restful/shared';
import prisma from '../lib/prisma';
import { CreateCourseInput } from '../validators/course.schema';

/** What a course list item looks like — the same for both list strategies below */
const listShape = {
  id: true,
  title: true,
  tags: { select: { name: true } },
  _count: { select: { lessons: true, enrollments: true } },
} as const;

export class CourseController {
  /** Nested write: course + lessons + tags in one call (and one transaction) */
  static async create(req: Request, res: Response) {
    const { title, lessons, tags } = req.body as CreateCourseInput;
    const course = await prisma.course.create({
      data: {
        title,
        lessons: { create: lessons.map((lesson, index) => ({ ...lesson, position: index + 1 })) },
        // Reuse existing tags, create missing ones
        tags: { connectOrCreate: tags.map((name) => ({ where: { name }, create: { name } })) },
      },
      include: { lessons: { orderBy: { position: 'asc' } }, tags: { select: { name: true } } },
    });
    ApiResponse.success(res, course, 'Course created', 201);
  }

  /** ✅ One operation: relations and counts are loaded together (X-Prisma-Operations: 1) */
  static async list(_req: Request, res: Response) {
    const courses = await prisma.course.findMany({ select: listShape, orderBy: { createdAt: 'asc' } });
    ApiResponse.success(res, courses, 'Courses fetched');
  }

  /**
   * ❌ N+1, on purpose: one query for the courses, then more queries PER course.
   * Same response as `list`, but X-Prisma-Operations grows as 1 + 3N.
   */
  static async listNaive(_req: Request, res: Response) {
    const courses = await prisma.course.findMany({ select: { id: true, title: true }, orderBy: { createdAt: 'asc' } });
    const result = [];
    for (const course of courses) {
      const tags = await prisma.tag.findMany({
        where: { courses: { some: { id: course.id } } },
        select: { name: true },
      });
      const [lessons, enrollments] = await Promise.all([
        prisma.lesson.count({ where: { courseId: course.id } }),
        prisma.enrollment.count({ where: { courseId: course.id } }),
      ]);
      result.push({ ...course, tags, _count: { lessons, enrollments } });
    }
    ApiResponse.success(res, result, 'Courses fetched (N+1)');
  }

  static async get(req: Request, res: Response) {
    const course = await prisma.course.findUniqueOrThrow({
      where: { id: req.params.id },
      include: {
        lessons: { orderBy: { position: 'asc' } },
        tags: { select: { name: true } },
        _count: { select: { enrollments: true } },
      },
    });
    ApiResponse.success(res, course, 'Course fetched');
  }

  /** Cascades: lessons and enrollments go with the course (onDelete: Cascade) */
  static async remove(req: Request, res: Response) {
    await prisma.course.delete({ where: { id: req.params.id } });
    ApiResponse.success(res, null, 'Course deleted');
  }

  static async enroll(req: Request, res: Response) {
    const enrollment = await prisma.enrollment.create({
      data: { courseId: req.params.id, studentId: req.body.studentId },
    });
    ApiResponse.success(res, enrollment, 'Enrolled', 201);
  }
}

export class StudentController {
  static async create(req: Request, res: Response) {
    ApiResponse.success(res, await prisma.student.create({ data: req.body }), 'Student created', 201);
  }

  /** Through the join model: the student's courses plus when they enrolled */
  static async courses(req: Request, res: Response) {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: req.params.id },
      orderBy: { enrolledAt: 'desc' },
      select: { enrolledAt: true, course: { select: { id: true, title: true } } },
    });
    ApiResponse.success(res, enrollments, 'Enrollments fetched');
  }
}
