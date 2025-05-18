// Main App Entry Point
import { UI } from '../components/UI.js';
import { QuizLogic } from '../components/QuizLogic.js';
import { AudioManager } from '../components/AudioManager.js';
import { ConfettiManager } from '../components/ConfettiManager.js';
import { State } from '../components/State.js';

// Quiz App Main Module
const QuizApp = {
    async init() {
        // Initialize State first
        State.reset();
        
        // Initialize UI
        UI.init();
        
        // Initialize AudioManager
        AudioManager.init();
        
        // Check if this is an AI quiz
        const isAIQuiz = window.location.pathname.includes('ai-quiz.html');
        
        if (isAIQuiz) {
            // Get the topic from localStorage
            const topic = localStorage.getItem('quizTopic') || 'General Knowledge';
            const totalQuestions = parseInt(localStorage.getItem('questionCount')) || 10;
            
            // Update State's total questions
            State.totalQuestions = totalQuestions;
            
            // Update the UI with the topic
            document.getElementById('quiz-topic').textContent = topic;
            document.getElementById('progress-text').textContent = `Question 1 of ${totalQuestions}`;
            
            try {
                // Show loading indicator
                document.getElementById('loading-container').classList.remove('hidden');
                document.getElementById('quiz-content').classList.add('hidden');
                
                // Fetch AI-generated questions
                const questions = await this.fetchQuestionsForAllDifficulties(topic, totalQuestions);
                
                // Initialize the quiz with AI-generated questions
                QuizLogic.customQuestions = questions;
                QuizLogic.useCustomQuestions = true;
                
                // Hide loading, show quiz
                document.getElementById('loading-container').classList.add('hidden');
                document.getElementById('quiz-content').classList.remove('hidden');
            } catch (error) {
                console.error('Error initializing AI quiz:', error);
                alert('Failed to generate quiz questions. Please try again.');
                window.location.href = './home.html';
                return;
            }
        }
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize the quiz
        QuizLogic.initQuiz();
    },
    
    async fetchQuestionsForAllDifficulties(topic, totalQuestions) {
        try {
            // Create a questions object with three difficulty levels
            const questions = {
                1: [], // Easy
                2: [], // Medium
                3: []  // Hard
            };
            
            // Show progressive loading feedback
            const loadingText = document.querySelector('#loading-container p.text-lg');
            const loadingSubtext = document.querySelector('#loading-container p.text-sm');
            const progressBar = document.querySelector('.progress-loading-bar');
            
            // Calculate questions per level
            const questionsPerLevel = {
                1: Math.ceil(totalQuestions * 0.4), // 40% easy
                2: Math.ceil(totalQuestions * 0.3), // 30% medium
                3: Math.ceil(totalQuestions * 0.3)  // 30% hard
            };
            
            // Fetch questions for each difficulty level
            for (let difficulty = 1; difficulty <= 3; difficulty++) {
                loadingText.textContent = `Generating ${this.getDifficultyName(difficulty)} questions...`;
                loadingSubtext.textContent = `Creating level ${difficulty} of 3`;
                progressBar.style.width = `${(difficulty - 1) * 30 + 10}%`;
                
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const response = await fetch('/api/quiz/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        topic,
                        difficulty,
                        count: questionsPerLevel[difficulty]
                    }),
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                if (!data.success || !data.data.questions) {
                    throw new Error('Failed to get valid questions from the server');
                }
                
                questions[difficulty] = data.data.questions.map(q => ({
                    question: q.question,
                    options: q.options || [],
                    correctAnswer: q.correctAnswer
                }));
                
                progressBar.style.width = `${difficulty * 30}%`;
            }
            
            loadingText.textContent = 'Quiz ready!';
            loadingSubtext.textContent = 'Loading your quiz...';
            progressBar.style.width = '100%';
            
            await new Promise(resolve => setTimeout(resolve, 800));
            
            return questions;
        } catch (error) {
            console.error('Error fetching questions:', error);
            throw error;
        }
    },
    
    getDifficultyName(level) {
        return level === 1 ? 'easy' : 
               level === 2 ? 'medium' : 'hard';
    },
    
    setupEventListeners() {
        // Quiz navigation
        UI.nextButton.addEventListener('click', () => QuizLogic.loadNextQuestion());
        
        UI.restartButton.addEventListener('click', () => {
            UI.showRestartModal(() => QuizLogic.initQuiz());
        });
        
        UI.restartFinalButton.addEventListener('click', () => QuizLogic.initQuiz());
        
        UI.solutionsButton.addEventListener('click', () => UI.showSolutions());
        
        // Sound toggle
        if (UI.soundToggle) {
            UI.soundToggle.addEventListener('click', () => 
                AudioManager.toggleSound(UI.soundToggle, UI.showFeedback.bind(UI))
            );
        }
        
        // Handle window resize for confetti
        window.addEventListener('resize', () => {
            if (ConfettiManager.confettiCanvas) {
                ConfettiManager.confettiCanvas.width = window.innerWidth;
                ConfettiManager.confettiCanvas.height = window.innerHeight;
            }
        });
    }
};

// Initialize the app when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    QuizApp.init();
}); 