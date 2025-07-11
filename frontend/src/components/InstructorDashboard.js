import React, { useState, useEffect } from 'react';
import { Container, Button, Alert, Spinner, Modal, Table, Form } from 'react-bootstrap';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function InstructorDashboard({ token }) {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', description: '', content: '' });
  const [editCourse, setEditCourse] = useState(null);
  const [message, setMessage] = useState('');
  const [messageVariant, setMessageVariant] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    // Fetch user info for welcome message and userId
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsername(res.data.username);
        setUserId(res.data._id);
      } catch (error) {
        setUsername('');
        setUserId('');
      }
    };
    fetchUser();
  }, [token]);

  useEffect(() => {
    if (userId) getCourses();
    // eslint-disable-next-line
  }, [userId]);

  const getCourses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const instructorCourses = res.data.filter(course => course.instructor?._id === userId);
      setCourses(instructorCourses || []);
      setMessage('');
    } catch (error) {
      setMessage('Failed to fetch courses.');
      setMessageVariant('danger');
    } finally {
      setLoading(false);
    }
  };

  const addCourse = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/courses`, newCourse, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses([...courses, res.data.course]);
      setNewCourse({ title: '', description: '', content: '' });
      setShowAddModal(false);
      setMessage('Course added successfully!');
      setMessageVariant('success');
    } catch (error) {
      setMessage('Failed to add course.');
      setMessageVariant('danger');
    } finally {
      setLoading(false);
    }
  };

  const updateCourse = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.put(`${API_URL}/courses/${editCourse._id}`, editCourse, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(courses.map(c => (c._id === editCourse._id ? res.data.course : c)));
      setShowEditModal(false);
      setEditCourse(null);
      setMessage('Course updated successfully!');
      setMessageVariant('success');
    } catch (error) {
      setMessage('Failed to update course.');
      setMessageVariant('danger');
    } finally {
      setLoading(false);
    }
  };

  const deleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(courses.filter(c => c._id !== courseId));
      setMessage('Course deleted successfully!');
      setMessageVariant('success');
    } catch (error) {
      setMessage('Failed to delete course.');
      setMessageVariant('danger');
    } finally {
      setLoading(false);
    }
  };

  const getEnrolledStudents = async (courseId) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/courses/${courseId}/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(res.data);
      setShowStudentsModal(true);
    } catch (error) {
      setMessage('Failed to fetch enrolled students.');
      setMessageVariant('danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="instructor-dashboard">
      <Container className="dashboard-container">
        <div className="dashboard-logout-container">
          <Button
            variant="danger"
            size="sm"
            className="dashboard-logout-btn"
            onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }}
          >
            Logout
          </Button>
          <div className="dashboard-header">
            <h1 className="dashboard-title">
              Welcome{username ? `, ${username}` : ''} to Online Learning Platform 
            </h1>
            <h2 className="dashboard-subtitle">Instructor Dashboard</h2>
          </div>
        </div>
        {message && <Alert variant={messageVariant}>{message}</Alert>}
        <div className="dashboard-actions">
          <Button
            variant="primary"
            size="sm"
            className="dashboard-action-btn"
            onClick={() => setShowAddModal(true)}
            disabled={loading}
          >
            Add New Course
          </Button>
        </div>
        <h3 className="dashboard-section-title">My Courses</h3>
        {loading ? (
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
            <p>Loading courses...</p>
          </div>
        ) : (
          <Table striped bordered hover responsive className="my-course-table dashboard-instructor-table">
            <thead>
              <tr>
                <th style={{width: '18%'}}>Title</th>
                <th style={{width: '32%'}}>Description</th>
                <th style={{width: '32%'}}>Content</th>
                <th style={{width: '18%'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.length > 0 ? (
                courses.map(course => (
                  <tr key={course._id}>
                    <td>{course.title || 'N/A'}</td>
                    <td>{course.description || 'N/A'}</td>
                    <td>{course.content || 'N/A'}</td>
                    <td>
                      <Button
                        variant="primary"
                        size="sm"
                        className="dashboard-action-btn dashboard-action-btn-sm me-1"
                        style={{minWidth: 0, padding: '3px 10px', fontSize: '0.85rem'}}
                        onClick={() => {
                          setEditCourse(course);
                          setShowEditModal(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="info"
                        size="sm"
                        className="dashboard-view-btn dashboard-action-btn-sm me-1"
                        style={{minWidth: 0, padding: '3px 10px', fontSize: '0.85rem'}}
                        onClick={() => getEnrolledStudents(course._id)}
                      >
                        View
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        className="dashboard-delete-btn dashboard-action-btn-sm"
                        style={{minWidth: 0, padding: '3px 10px', fontSize: '0.85rem'}}
                        onClick={() => deleteCourse(course._id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">No courses created yet.</td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
        {/* Add Course Modal */}
        <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Add New Course</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={addCourse}>
              <Form.Group className="mb-3">
                <Form.Label>Title</Form.Label>
                <Form.Control
                  type="text"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Content</Form.Label>
                <Form.Control
                  as="textarea"
                  value={newCourse.content}
                  onChange={(e) => setNewCourse({ ...newCourse, content: e.target.value })}
                  required
                />
              </Form.Group>
              <Button variant="success" type="submit" className="dashboard-modal-btn" disabled={loading}>
                Add Course
              </Button>
            </Form>
          </Modal.Body>
        </Modal>
        {/* Edit Course Modal */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Edit Course</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {editCourse && (
              <Form onSubmit={updateCourse}>
                <Form.Group className="mb-3">
                  <Form.Label>Title</Form.Label>
                  <Form.Control
                    type="text"
                    value={editCourse.title}
                    onChange={(e) => setEditCourse({ ...editCourse, title: e.target.value })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    value={editCourse.description}
                    onChange={(e) => setEditCourse({ ...editCourse, description: e.target.value })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Content</Form.Label>
                  <Form.Control
                    as="textarea"
                    value={editCourse.content}
                    onChange={(e) => setEditCourse({ ...editCourse, content: e.target.value })}
                    required
                  />
                </Form.Group>
                <Button variant="success" type="submit" className="dashboard-modal-btn" disabled={loading}>
                  Update Course
                </Button>
              </Form>
            )}
          </Modal.Body>
        </Modal>
        {/* Enrolled Students Modal */}
        <Modal show={showStudentsModal} onHide={() => setShowStudentsModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Enrolled Students</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Username</th>
                </tr>
              </thead>
              <tbody>
                {students.length > 0 ? (
                  students.map(student => (
                    <tr key={student._id}>
                      <td>{student.username || 'N/A'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2">No students enrolled.</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Modal.Body>
        </Modal>
      </Container>
    </div>
  );
}

export default InstructorDashboard;
