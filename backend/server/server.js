const express = require('express');
const cors = require('cors');
const path = require('path');
const { generateQuizQuestions } = require('./gemini-service');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Import security packages
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Express to trust proxy headers in production
if (process.env.NODE_ENV === 'production') {
  // Trust Vercel's proxy configuration
  app.set('trust proxy', true);
}

// Security middleware
// Apply helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "https://kit.fontawesome.com", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "fonts.googleapis.com", "https://use.fontawesome.com", "https://kit.fontawesome.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "fonts.gstatic.com", "https://use.fontawesome.com", "https://kit.fontawesome.com", "https://cdnjs.cloudflare.com", "data:"],
      imgSrc: ["'self'", "data:", "https://ka-f.fontawesome.com", "https://cdnjs.cloudflare.com"],
      connectSrc: ["'self'", "https://ka-f.fontawesome.com", "https://cdnjs.cloudflare.com"],
      scriptSrcAttr: ["'unsafe-inline'"]
    }
  },
  // Allow iframe embedding for development
  frameguard: process.env.NODE_ENV === 'production' ? true : false
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  }
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// CORS configuration with specific origins in production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['https://adaptlearnpro.vercel.app']) 
    : true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true
};

app.use(cors(corsOptions));
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

// API Key validation middleware
const validateApiKey = (req, res, next) => {
  // Temporarily disable API key validation for debugging
  // TODO: Re-enable this after fixing the main issue
  console.log('API Key validation temporarily disabled for debugging');
  return next();
  
  // Skip API key validation in development mode
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }
  
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({ 
      success: false,
      error: 'Unauthorized: Invalid or missing API key'
    });
  }
  
  next();
};

// AI Quiz Generation Route
app.post('/api/quiz/generate', validateApiKey, async (req, res) => {
  try {
    console.log('=== Quiz Generation Request ===');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Request body:', req.body);
    console.log('Headers:', req.headers);
    
    const { topic, difficulty = 1, count = 10 } = req.body;
    
    if (!topic) {
      console.log('Error: No topic provided');
      return res.status(400).json({ error: 'Topic is required' });
    }
    
    // Validate difficulty level
    const diffLevel = parseInt(difficulty);
    if (isNaN(diffLevel) || diffLevel < 1 || diffLevel > 3) {
      console.log('Error: Invalid difficulty level:', difficulty);
      return res.status(400).json({ error: 'Difficulty must be between 1 and 3' });
    }
    
    // Validate count - increased maximum to support larger quiz sizes
    const questionCount = parseInt(count);
    if (isNaN(questionCount) || questionCount < 1 || questionCount > 20) {
      console.log('Error: Invalid question count:', count);
      return res.status(400).json({ error: 'Count must be between 1 and 20' });
    }
    
    console.log(`Generating ${questionCount} ${diffLevel}-level questions about "${topic}"...`);
    console.log('Gemini API Key available:', !!process.env.GEMINI_API_KEY);
    
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