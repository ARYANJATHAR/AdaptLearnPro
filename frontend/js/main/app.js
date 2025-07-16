// Main App Entry Point
import { UI } from '../components/UI.js';
import { QuizLogic } from '../components/QuizLogic.js';
import { AudioManager } from '../components/AudioManager.js';
import { ConfettiManager } from '../components/ConfettiManager.js';
import { State } from '../components/State.js';

// Import the AIQuizApp for AI quiz functionality
import { AIQuizApp } from './ai-quiz.js';

// Quiz App Main Module
const QuizApp = {
    async init() {
        // Initialize State first
        State.reset();
        
        // Initialize UI
        UI.init();
        
        // Initialize AudioManager
        AudioManager.init();
        
        // Check if this is an AI quiz page
        const isAIQuiz = window.location.pathname.includes('ai-quiz.html');
        console.log("Is AI Quiz:", isAIQuiz);
        
        // Set up event listeners for UI interactions
        this.setupEventListeners();
        
        if (isAIQuiz) {
            console.log("Initializing AI Quiz using dedicated module");
            // Initialize AI Quiz using the dedicated module
            await AIQuizApp.init();
        } else {
            console.log("Initializing standard quiz");
            // Initialize the quiz with default questions
            QuizLogic.initQuiz();
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
            // Check if this is an AI quiz
            const isAIQuiz = window.location.pathname.includes('ai-quiz.html');
            
            if (isAIQuiz) {
                // Use the AIQuizApp restart method for AI quizzes
                UI.showRestartModal(() => AIQuizApp.restartWithNewQuestions());
            } else {
                // Use the standard quiz restart for regular quizzes
                UI.showRestartModal(() => QuizLogic.initQuiz());
            }
        });
        
        UI.restartFinalButton.addEventListener('click', async () => {
            console.log("Try Again button clicked");
            
            // Check if this is an AI quiz
            const isAIQuiz = window.location.pathname.includes('ai-quiz.html');
            
            if (isAIQuiz) {
                console.log("Restarting AI quiz with new questions");
                
                // Fix issue with the question container not being visible
                const questionContainer = document.querySelector('#question-container');
                if (questionContainer) {
                    questionContainer.style.display = 'block';
                    questionContainer.classList.remove('hidden');
                    questionContainer.style.opacity = '1';
                    questionContainer.style.height = 'auto';
                    questionContainer.style.overflow = 'visible';
                    questionContainer.style.margin = '';
                    questionContainer.style.padding = '1.5rem';
                }
                
                // Make sure options container is empty to start fresh
                const optionsContainer = document.querySelector('#options-container');
                if (optionsContainer) {
                    optionsContainer.innerHTML = '';
                }
                
                // First, hide the results view
                const resultsDiv = document.getElementById('results');
                if (resultsDiv) {
                    resultsDiv.classList.add('hidden');
                }
                
                try {
                    // Use AIQuizApp's dedicated method for restarting with new questions
                    // This will respect the user's original question count
                    await AIQuizApp.restartWithNewQuestions();
                } catch (error) {
                    console.error('Error restarting AI quiz:', error);
                    alert('Failed to generate new questions. Please try again.');
                    
                    // Ensure quiz content is visible even if there's an error
                    document.getElementById('loading-container').classList.add('hidden');
                    document.getElementById('quiz-content').classList.remove('hidden');
                }
                
                return;
            }
            
            // Regular quiz restart logic for non-AI quizzes
            
            // Fix issue with the question container not being visible
            const questionContainer = document.querySelector('#question-container');
            questionContainer.style.display = 'block';
            questionContainer.classList.remove('hidden');
            questionContainer.style.opacity = '1';
            questionContainer.style.height = 'auto';
            questionContainer.style.overflow = 'visible';
            questionContainer.style.margin = '';
            questionContainer.style.padding = '1.5rem';
            
            // Make sure options container is empty to start fresh
            document.querySelector('#options-container').innerHTML = '';
            
            // First, hide the results view
            document.getElementById('results').classList.add('hidden');
            
            // Start loading a fresh question
            document.getElementById('question-text').textContent = 'Loading question...';
            
            // Show the quiz content
            document.getElementById('quiz-content').classList.remove('hidden');
            
            // Use default questions for regular quiz
            QuizLogic.useCustomQuestions = false;
            QuizLogic.customQuestions = null;
            
            // Completely reset all quiz state
            State.reset();
            State.questionHistory = [];
            State.currentQuestionIndex = -1;
            State.answeredQuestions = [];
            State.totalAttempted = 0;
            State.currentQuestion = null;
            
            // Reset progress display
            document.getElementById('progress-text').textContent = `Question 1 of 10`;
            document.getElementById('progress-bar').style.width = '10%';
            
            // Reset statistics display
            document.getElementById('correct').textContent = '0';
            document.getElementById('incorrect').textContent = '0';
            document.getElementById('attempted').textContent = '0';
            
            console.log("Restarting quiz with default questions");
            
            // Initialize quiz with fresh state after a short delay
            setTimeout(() => {
                QuizLogic.initQuiz();
            }, 100);
        });
        
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