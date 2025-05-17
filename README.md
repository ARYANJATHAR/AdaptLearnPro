# Adaptive Difficulty Quiz App

A simple interactive quiz application with adaptive difficulty levels that adjust based on user performance.

## Features

- Questions adapt to user's skill level (Easy, Medium, Hard)
- Real-time feedback on answers
- Visual progress tracking
- Comprehensive results summary
- Solution review with detailed explanations
- Responsive design using Tailwind CSS

## Project Structure

The project is organized into the following components:

```
ai_quiz_app/
├── index.html          # Main HTML entry point
├── styles/
│   └── main.css        # Custom CSS styles
├── js/
│   ├── app.js          # Application initialization
│   ├── quiz.js         # Core quiz functionality
│   ├── questions.js    # Question database
│   └── templates.js    # HTML templates for UI components
└── README.md           # Project documentation
```

## Component Breakdown

### HTML Structure
- `index.html`: The main container with placeholder elements for dynamic content

### JavaScript Components
- `questions.js`: Contains the question database organized by difficulty levels
- `templates.js`: Provides HTML templates for different UI components
- `quiz.js`: Core quiz logic and functionality as a reusable class
- `app.js`: Initializes the application

### Styling
- `main.css`: Custom styles for quiz components and animations

## How to Use

1. Simply open `index.html` in a web browser
2. Answer questions to the best of your ability
3. The difficulty will automatically adjust based on your performance
4. View your final score and review solutions at the end

## Technologies Used

- HTML5
- CSS3 with Tailwind CSS
- Vanilla JavaScript (ES6+)
- Font Awesome icons
- Google Fonts (Poppins) 