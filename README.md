# 📚 AdaptLearnPro: Adaptive AI-Powered Quiz Platform

AdaptLearnPro is an intelligent quiz application designed to enhance the learning experience by adapting to each user's performance. It dynamically adjusts question difficulty, ensuring that learners are consistently challenged at an appropriate level. The project is ideal for students, educators, and developers interested in adaptive learning and edtech.


## 🎯 Features

- 🧠 **Adaptive Questioning** – Questions change difficulty based on user performance
- ⚡ **Instant Feedback** – Get correct/incorrect answers and explanations in real time
- 📊 **Progress Tracking** – Visual progress bar throughout the quiz
- 📝 **Result Summary** – See your final score with performance insights
- 📱 **Responsive Design** – Works on desktop, tablet, and mobile devices
- 🔒 **Security Features** – API rate limiting, XSS protection, and CORS security

## 🛠️ Technologies Used

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Deployment:** Vercel


## ⚙️ Installation

Follow the steps below to run this project locally:

```bash
git clone https://github.com/ARYANJATHAR/AdaptLearnPro.git
cd AdaptLearnPro
npm install

# Configure Environment Variables:
cp backend/.env.example backend/.env

# Edit the .env file with your API keys and settings
nano backend/.env
```

### Environment Variables

The following environment variables need to be set in your `.env` file:

- `PORT`: The port number for the server (default: 3000)
- `NODE_ENV`: Set to 'development' for local development or 'production' for production
- `GEMINI_API_KEY`: Your Google Gemini API key for AI question generation
- `API_KEY`: A secret key to secure your API endpoints (required in production)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins for CORS (production only)

### Running the App

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

📄 License
This project is licensed under the MIT License.


## 🔒 Security

This application implements several security measures to protect against common web vulnerabilities:

- API rate limiting to prevent abuse
- Content Security Policy (CSP) headers
- XSS protection through input sanitization
- CORS protection for API endpoints
- API key authentication for secure access

For more details, see [SECURITY.md](SECURITY.md).
