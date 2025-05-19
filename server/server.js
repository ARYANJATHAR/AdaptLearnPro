const express = require('express');
const cors = require('cors');
const path = require('path');
const { generateQuizQuestions } = require('./gemini-service');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the root directory with proper MIME types
app.use(express.static(path.join(__dirname, '..'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (path.endsWith('.mp3')) {
            res.setHeader('Content-Type', 'audio/mpeg');
        }
    }
}));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// AI Quiz Generation Route
app.post('/api/quiz/generate', async (req, res) => {
  try {
    const { topic, difficulty = 1, count = 10 } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    
    // Validate difficulty level
    const diffLevel = parseInt(difficulty);
    if (isNaN(diffLevel) || diffLevel < 1 || diffLevel > 3) {
      return res.status(400).json({ error: 'Difficulty must be between 1 and 3' });
    }
    
    // Validate count - increased maximum to support larger quiz sizes
    const questionCount = parseInt(count);
    if (isNaN(questionCount) || questionCount < 1 || questionCount > 20) {
      return res.status(400).json({ error: 'Count must be between 1 and 20' });
    }
    
    console.log(`Generating ${questionCount} ${diffLevel}-level questions about "${topic}"...`);
    
    const questions = await generateQuizQuestions(topic, diffLevel, questionCount);
    
    console.log(`Successfully generated ${questions.length} questions.`);
    
    res.json({ 
      success: true, 
      data: {
        topic,
        difficulty: diffLevel,
        questions
      }
    });
    
  } catch (error) {
    console.error('Error generating quiz:', error);
    
    // Create a user-friendly error message
    let errorMessage = 'Failed to generate quiz questions';
    let statusCode = 500;
    
    if (error.message.includes('API key')) {
      errorMessage = 'Invalid API key or authentication issue';
      statusCode = 401;
    } else if (error.message.includes('429')) {
      errorMessage = 'Rate limit exceeded. Please try again later.';
      statusCode = 429;
    } else if (error.message.includes('parse')) {
      errorMessage = 'Could not create valid quiz questions. Try a different topic.';
      statusCode = 422;
    }
    
    res.status(statusCode).json({ 
      success: false, 
      error: errorMessage,
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Catch-all route to serve the main HTML file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}); 