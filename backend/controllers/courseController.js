const Course = require('../models/Course');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId);
    if (!req.user) return res.status(404).json({ error: 'User not found' });
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate('instructor', 'username');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createCourse = [authMiddleware, async (req, res) => {
  if (req.user.role !== 'instructor') return res.status(403).json({ error: 'Only instructors can create courses' });
  try {
    const course = new Course({ ...req.body, instructor: req.user._id });
    await course.save();
    res.status(201).json({ message: 'Course created successfully', course });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}];

exports.updateCourse = [authMiddleware, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    Object.assign(course, req.body);
    await course.save();
    res.json({ message: 'Course updated successfully', course });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}];

exports.deleteCourse = [authMiddleware, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await course.deleteOne();
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}];

exports.enrollCourse = [authMiddleware, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    req.user.enrolledCourses.push(course._id);
    await req.user.save();
    res.json({ message: 'Enrolled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}];

exports.getMyCourses = [authMiddleware, async (req, res) => {
  try {
    const courses = await Course.find({ _id: { $in: req.user.enrolledCourses } }).populate('instructor', 'username');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}];

exports.getCourseStudents = [authMiddleware, async (req, res) => {
  if (req.user.role !== 'instructor') return res.status(403).json({ error: 'Only instructors can view students' });
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    const students = await User.find({ enrolledCourses: req.params.id }).select('username');
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}];