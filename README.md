# AI Quiz Website

This website is an interactive quiz platform that challenges users with a series of questions and adapts the difficulty based on their performance. As you answer questions, the quiz intelligently adjusts to present easier or harder questions, aiming to match your skill level and provide an engaging experience.

The site provides immediate feedback after each answer, visually tracks your progress, and summarizes your results at the end. After completing the quiz, you can review each question with detailed explanations for the correct answers. The design is responsive and visually appealing, ensuring a smooth experience on both desktop and mobile devices.

Key features include:
- Adaptive difficulty: Questions become easier or harder depending on your answers.
- Real-time feedback: Instantly know if your answer is correct or not.
- Progress tracking: See how far you've come in the quiz.
- Results summary: Get a comprehensive overview of your performance at the end.
- Solution review: Learn from detailed explanations for each question after finishing the quiz.

This website is designed for anyone who wants to test and improve their knowledge in a fun, dynamic way.

## Deployment on Vercel

This application is configured for easy deployment on Vercel. Follow these steps:

1. Fork or clone this repository to your GitHub account
2. Sign up or log in to [Vercel](https://vercel.com/)
3. Click "New Project" and import your GitHub repository
4. Add the following environment variables:
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `NODE_ENV`: Set to `production` for deployment
5. Click "Deploy"

### Important Notes for Deployment

- The API key is stored in environment variables and not committed to the repository
- A `.env.example` file is provided as a template
- The `vercel.json` file configures the build and routing for proper deployment
- The server is set up to handle API requests through Vercel serverless functions

## Getting Updates

Star and watch the GitHub repository to get notified about updates! 