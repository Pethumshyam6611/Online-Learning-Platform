const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

router.get('/', courseController.getAllCourses);
router.post('/', courseController.createCourse);
router.put('/:id', courseController.updateCourse);
router.delete('/:id', courseController.deleteCourse);
router.post('/enroll/:id', courseController.enrollCourse);
router.get('/my-courses', courseController.getMyCourses);
router.get('/:id/students', courseController.getCourseStudents);

module.exports = router;