import React, { useState, useEffect } from 'react';
import { Table, Spinner, Alert, Container, Card, Button } from 'react-bootstrap';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function MyCourse({ token }) {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [message, setMessage] = useState('');
  const [messageVariant, setMessageVariant] = useState('');
  const [loading, setLoading] = useState(true);

  const getEnrolledCourses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/courses/my-courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Enrolled courses response:', res.data);
      if (!res.data || res.data.length === 0) {
        console.log('No enrolled courses data received');
      } else {
        res.data.forEach(course => {
          console.log('Course details:', {
            _id: course._id,
            title: course.title,
            instructor: course.instructor,
          });
        });
      }
      setEnrolledCourses(res.data || []);
      setMessage('');
    } catch (error) {
      console.error('Enrolled courses error:', error.response?.data || error.message);
      setMessage('Failed to fetch enrolled courses. Please try again.');
      setMessageVariant('danger');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableCourses = async () => {
    try {
      const res = await axios.get(`${API_URL}/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Available courses response:', res.data);
      const enrolledIds = enrolledCourses.map(course => course._id);
      setAvailableCourses(res.data.filter(course => !enrolledIds.includes(course._id)) || []);
    } catch (error) {
      console.error('Available courses error:', error.response?.data || error.message);
      setMessage('Failed to fetch available courses.');
      setMessageVariant('danger');
    }
  };

  const enrollCourse = async (courseId) => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/courses/enroll/${courseId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Enrollment response:', res.data);
      setEnrolledCourses([...enrolledCourses, res.data.course]);
      setAvailableCourses(availableCourses.filter(course => course._id !== courseId));
      setMessage('Enrolled successfully!');
      setMessageVariant('success');
      await getAvailableCourses();
    } catch (error) {
      console.error('Enrollment error:', error.response?.data || error.message);
      setMessage('Enrollment failed. Please try again.');
      setMessageVariant('danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await getEnrolledCourses();
      await getAvailableCourses();
    };
    fetchData();
  }, [token]); // Dependency on token to refetch if it changes

  return (
    <div className="student-dashboard">
      <Container>
        <h1 className="text-center mb-4">My Enrolled Courses</h1>
        {message && <Alert variant={messageVariant}>{message}</Alert>}
        {loading ? (
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
            <p>Loading courses...</p>
          </div>
        ) : (
          <>
            <h3 className="mb-3">Enrolled Courses</h3>
            <Table striped bordered hover responsive className="mb-5">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Instructor</th>
                  <th>Description</th>
                  <th>Content</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {enrolledCourses.length > 0 ? (
                  enrolledCourses.map(course => (
                    <tr key={course._id}>
                      <td>{course.title || 'N/A'}</td>
                      <td>{course.instructor?.username || 'Unknown'}</td>
                      <td>{course.description || 'N/A'}</td>
                      <td>{course.content || 'N/A'}</td>
                      <td>Enrolled</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">No enrolled courses yet.</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </>
        )}
      </Container>
    </div>
  );
}

export default MyCourse;