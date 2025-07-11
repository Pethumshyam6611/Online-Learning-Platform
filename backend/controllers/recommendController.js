const axios = require('axios');
const Course = require('../models/Course');

// In-memory API request counter
let apiRequestCount = 0;
const API_REQUEST_LIMIT = 250;

// Export function to handle course recommendation
exports.getRecommendation = async (req, res) => {
  try {
    // Enforce API request limit
    if (apiRequestCount >= API_REQUEST_LIMIT) {
      return res.status(429).json({ error: 'API request limit reached. Please try again later.' });
    }
    apiRequestCount++;
   
    if (!req.body.prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
   
    req.logRequest();
    // Send request to OpenAI API using gpt-3.5-turbo
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant recommending courses. Provide a concise list of course topics relevant to the user’s goal, separated by newlines.' },
          { role: 'user', content: `Recommend courses for someone who wants to ${req.body.prompt}` },
        ],
        max_tokens: 100, // Limit response length
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 
          'Content-Type': 'application/json',
        },
      }
    );
    // Extract course topics from OpenAI response
    const recommendationText = response.data.choices[0].message.content.trim();
   
    const keywords = recommendationText
      .split('\n')
      .map(topic => topic.replace(/^\d+\.\s*/, '').trim().toLowerCase())
      .filter(topic => topic.length > 0);

    // Query MongoDB for courses matching keywords in title or description
    let courses = await Course.find({
      $or: [
        { title: { $regex: keywords.join('|'), $options: 'i' } },
        { description: { $regex: keywords.join('|'), $options: 'i' } },
      ],
    }).populate('instructor', 'username');

   
    const allCourses = await Course.find({}).populate('instructor', 'username');
  
    const stopwords = new Set(['the','and','of','to','in','for','with','on','at','by','an','a','is','as','be','or','from','about','basics','introduction','intro','fundamentals']);
    function getSignificantWords(text) {
      return text.split(/\s+/)
        .map(w => w.replace(/[^a-z]/gi, '').toLowerCase())
        .filter(w => w && !stopwords.has(w));
    }
    function significantOverlap(keyword, text) {
      const keywordWords = getSignificantWords(keyword);
      const textWords = getSignificantWords(text);
      return keywordWords.some(word => textWords.includes(word));
    }
    // Only match courses where at least one keyword has significant overlap in BOTH title and description
    const matchedCourses = allCourses.filter(course => {
      const title = course.title;
      const description = course.description;
      return keywords.some(keyword =>
        significantOverlap(keyword, title) && significantOverlap(keyword, description)
      );
    });

    res.json({
      recommendation: recommendationText,
      courses: matchedCourses.map(course => ({
        _id: course._id,
        title: course.title,
        description: course.description,
        instructor: course.instructor ? course.instructor.username : 'Unknown',
        content: course.content,
      })),
    });
  } catch (error) {
    // Handle API or network errors
    console.error('Recommendation error:', error); // Temporary log for debugging
    if (error.response) {
      res.status(error.response.status).json({ error: error.response.data.error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
};