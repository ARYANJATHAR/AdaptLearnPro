const express = require('express');
const cors = require('cors');
const path = require('path');
const { generateQuizQuestions } = require('./gemini-service');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the frontend directory with proper MIME types
app.use(express.static(path.join(__dirname, '../../frontend'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (filePath.endsWith('.mp3')) {
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
    
    // Set a timeout for the question generation
    const timeoutMs = 30000; // 30 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Question generation timed out')), timeoutMs);
    });
    
    // Race between question generation and timeout
    const questions = await Promise.race([
      generateQuizQuestions(topic, diffLevel, questionCount),
      timeoutPromise
    ]);
    
    // Validate the generated questions
    if (!Array.isArray(questions) || questions.length === 0) {
      console.error('No valid questions generated');
      return res.status(422).json({ 
        success: false,
        error: 'Failed to generate valid questions',
        data: {
          topic,
          difficulty: diffLevel,
          questions: []
        }
      });
    }
    
    // Check if we got enough questions
    if (questions.length < questionCount) {
      console.warn(`Only generated ${questions.length}/${questionCount} questions`);
    }
    
    console.log(`Successfully generated ${questions.length} questions.`);
    
    res.json({ 
      success: true, 
      data: {
        topic,
        difficulty: diffLevel,
        questions,
        generated: questions.length
      }
    });
    
  } catch (error) {
    console.error('Error generating quiz:', error);
    
    // Create a user-friendly error message
    let errorMessage = 'Failed to generate quiz questions';
    let statusCode = 500;
    
    if (error.message.includes('timed out')) {
      errorMessage = 'Question generation took too long. Try a smaller batch size.';
      statusCode = 408;
    } else if (error.message.includes('API key')) {
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
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
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