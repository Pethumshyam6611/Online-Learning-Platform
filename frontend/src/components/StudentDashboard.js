import React, { useState, useEffect } from 'react';
import { Container, Button, Alert, Spinner, Modal, Row, Col, Card, InputGroup, FormControl } from 'react-bootstrap';
import { FaSearch, FaSignOutAlt } from 'react-icons/fa';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

function StudentDashboard({ token }) {
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [message, setMessage] = useState('');
  const [messageVariant, setMessageVariant] = useState('');
  const [loading, setLoading] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [username, setUsername] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recommendInput, setRecommendInput] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [role, setRole] = useState('');
  const navigate = useNavigate();

  const getCourses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(res.data);
    } catch (error) {
      setMessage('Failed to fetch courses.');
      setMessageVariant('danger');
    } finally {
      setLoading(false);
    }
  };

  const getEnrolledCourses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/courses/my-courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEnrolledCourses(res.data);
    } catch (error) {
      setMessage('Failed to fetch enrolled courses.');
      setMessageVariant('danger');
    } finally {
      setLoading(false);
    }
  };

  const enrollCourse = async (courseId) => {
    try {
      setLoading(true);
      await axios.post(`${API_URL}/courses/enroll/${courseId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('Enrolled in course successfully!');
      setMessageVariant('success');
      getEnrolledCourses();
      setTimeout(() => {
        setMessage('');
        setMessageVariant('');
      }, 2000);
    } catch (error) {
      setMessage('Failed to enroll in course.');
      setMessageVariant('danger');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendation = async () => {
    if (!recommendInput) return;
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/recommend`, { prompt: recommendInput }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecommendation(res.data.recommendation || 'No recommendation found.');
      setRecommendedCourses(res.data.courses || []);
    } catch (error) {
      setRecommendation('No recommendation found.');
      setRecommendedCourses([]);
    } finally {
      setLoading(false);
    }
  };

  // Search handler
  // Live search handler: update searchTerm as user types
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  useEffect(() => {
    // Fetch user info for role check
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsername(res.data.username);
        setRole(res.data.role);
        if (res.data.role !== 'student') {
          navigate(res.data.role === 'instructor' ? '/instructor' : '/login', { replace: true });
        }
      } catch (error) {
        setUsername('');
        setRole('');
        navigate('/login', { replace: true });
      }
    };
    fetchUser();
    getCourses();
    getEnrolledCourses();
    // eslint-disable-next-line
  }, [token]);

  const isEnrolled = (courseId) => enrolledCourses.some(c => c._id === courseId);

  // Filter courses live as user types
  const filteredCourses = courses.filter(course => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return true;
    return (
      course.title?.toLowerCase().includes(keyword) ||
      course.description?.toLowerCase().includes(keyword) ||
      course.content?.toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="student-dashboard">
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
            <FaSignOutAlt /> Logout
          </Button>
        </div>
        <div className="dashboard-header">
          <h1 className="dashboard-title">
            Welcome{username ? `, ${username}` : ''} to Online Learning Platform
          </h1>
          <h2 className="dashboard-subtitle">Student Dashboard</h2>
        </div>
        <div className="dashboard-actions">
          <Button
            variant="primary"
            size="sm"
            className="dashboard-action-btn"
            onClick={() => window.location.href = '/mycourses'}
          >
            View My Enrolled Courses
          </Button>
          <InputGroup size="sm" className="dashboard-search-group-small">
            <FormControl
              placeholder="Search courses..."
              value={searchTerm}
              onChange={handleSearch}
              className="form-control"
            />
            <Button variant="primary" size="sm" className="dashboard-search-btn" disabled>
              <FaSearch />
            </Button>
          </InputGroup>
        </div>
        <div className="dashboard-recommendation">
          <h3 className="dashboard-section-title">Course Recommendation</h3>
          <div className="dashboard-recommend-group-large">
            <FormControl
              placeholder="Enter your goal (e.g., I want to be a software engineer)"
              value={recommendInput}
              onChange={(e) => setRecommendInput(e.target.value)}
              className="form-control"
            />
            <Button
              className="dashboard-recommend-btn-large"
              onClick={getRecommendation}
              size="lg"
            >
              Get Recommended Courses
            </Button>
          </div>
          {/* Display recommendation as a list if present */}
          {recommendation && (
            <Alert variant="info">
              <ul style={{marginBottom:0, paddingLeft:'1.2em'}}>
                {recommendation.split('\n').map((line, idx) => (
                  <li key={idx}>{line.trim()}</li>
                ))}
              </ul>
            </Alert>
          )}
          {recommendedCourses.length > 0 ? (
            <div className="mt-3">
              <h5>Relevant Courses:</h5>
              <Row xs={1} sm={2} md={3} lg={4} className="g-3">
                {recommendedCourses.map((course) => (
                  <Col key={course._id}>
                    <Card className="dashboard-course-card">
                      <Card.Body className="d-flex flex-column justify-content-between h-100">
                        <div>
                          <Card.Title className="dashboard-course-title">{course.title}</Card.Title>
                          <Card.Text>
                            <strong>Instructor:</strong> {course.instructor || 'N/A'}<br />
                            <strong>Description:</strong> {course.description || 'N/A'}<br />
                            <strong>Content:</strong> {course.content || 'N/A'}<br />
                          </Card.Text>
                        </div>
                        <div className="d-flex gap-2">
                          {isEnrolled(course._id) ? (
                            <Button variant="secondary" className="dashboard-enrolled-btn" disabled>
                              Enrolled
                            </Button>
                          ) : (
                            <Button
                              variant="success"
                              className="dashboard-enroll-btn"
                              onClick={() => enrollCourse(course._id)}
                            >
                              Enroll
                            </Button>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          ) : (
            recommendation && (
              <Alert variant="warning" className="mt-3">
                No recommended courses found for your goal.
              </Alert>
            )
          )}
        </div>
        <h3 className="dashboard-section-title">Available Courses</h3>
        {message && <Alert variant={messageVariant}>{message}</Alert>}
        {loading ? (
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
            <p>Loading courses...</p>
          </div>
        ) : (
          <Row xs={1} sm={2} md={3} lg={4} className="g-4 mb-5">
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <Col key={course._id}>
                  <Card className="dashboard-course-card">
                    <Card.Body className="d-flex flex-column justify-content-between h-100">
                      <div>
                        <Card.Title className="dashboard-course-title">{course.title}</Card.Title>
                        <Card.Text>
                          <strong>Instructor:</strong> {course.instructor?.username || 'N/A'}<br />
                          <strong>Description:</strong> {course.description || 'N/A'}<br />
                          <strong>Content:</strong> {course.content || 'N/A'}<br />
                        </Card.Text>
                      </div>
                      <div className="d-flex gap-2">
                        {isEnrolled(course._id) ? (
                          <Button variant="secondary" className="dashboard-enrolled-btn" disabled style={{background:'#bdbdbd', border:'none', color:'#fff'}}>
                            Enrolled
                          </Button>
                        ) : (
                          <Button
                            variant="success"
                            className="dashboard-enroll-btn"
                            onClick={() => enrollCourse(course._id)}
                          >
                            Enroll
                          </Button>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            ) : (
              <Col>
                <Alert variant="info">No courses available.</Alert>
              </Col>
            )}
          </Row>
        )}
        <Modal show={showContentModal} onHide={() => setShowContentModal(false)} centered>
          <Modal.Header closeButton className="bg-purple">
            <Modal.Title className="text-white">Course Content</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h5 className="text-purple">{selectedCourse?.title}</h5>
            <p>{selectedCourse?.content || 'No content available.'}</p>
          </Modal.Body>
          <Modal.Footer className="bg-light">
            <Button variant="secondary" className="dashboard-modal-btn" onClick={() => setShowContentModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
}

export default StudentDashboard;