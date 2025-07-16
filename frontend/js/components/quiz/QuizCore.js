import { State } from '../State.js';
import { UI } from '../UI.js';

export const QuizCore = {
    customQuestions: null,
    useCustomQuestions: false,
    
    initQuiz() {
        console.log("Initializing quiz with useCustomQuestions:", this.useCustomQuestions);
        
        // Reset all state completely
        State.reset();
        
        if (!this.useCustomQuestions) {
            State.totalQuestions = 10; // Only for default quiz
            console.log("[QUIZ DEBUG] Using default 10 questions for standard quiz");
        } else {
            console.log(`[QUIZ DEBUG] Using user-selected question count: ${State.totalQuestions}`);
        }
        
        // Reset question tracking
        State.questionHistory = [];
        State.currentQuestionIndex = -1;
        State.answeredQuestions = [];
        State.totalAttempted = 0;
        State.currentQuestion = null;
        
        // Reset streak counters
        State.correctStreak = 0;
        State.incorrectStreak = 0;
        
        console.log("[QUIZ DEBUG] Quiz initialized. Streaks reset. Current difficulty:", State.currentDifficulty);
        
        // Initialize UI elements
        this.initializeUI();
        
        console.log("Quiz initialization complete, loading first question...");
        
        // Load first question with delay
        setTimeout(() => {
            this.loadNextQuestion();
        }, 200);
    },

    initializeUI() {
        // Make quiz content visible
        const quizContent = document.getElementById('quiz-content');
        if (quizContent) {
            quizContent.classList.remove('hidden');
            quizContent.className = quizContent.className.replace(/difficulty-level-\d/g, '');
            quizContent.classList.add(`difficulty-level-${State.currentDifficulty}`);
        }
        
        // Initialize question container
        if (UI.questionContainer) {
            UI.questionContainer.style.display = 'block';
            UI.questionContainer.classList.remove('hidden');
            UI.questionContainer.style.opacity = '1';
            UI.questionContainer.style.height = 'auto';
            UI.questionContainer.style.overflow = 'visible';
            UI.questionContainer.style.margin = '';
            UI.questionContainer.style.padding = '1.5rem';
        }
        
        // Set loading text
        if (UI.questionText) {
            UI.questionText.textContent = 'Loading question...';
        }
        
        // Clear options
        if (UI.optionsContainer) {
            UI.optionsContainer.innerHTML = '';
        }
        
        // Hide results and show navigation
        const resultsDiv = document.getElementById('results');
        if (resultsDiv) resultsDiv.classList.add('hidden');
        
        if (UI.navigationDiv) {
            UI.navigationDiv.classList.remove('hidden');
            UI.navigationDiv.style.display = 'flex';
        }
        
        // Update stats display
        UI.updateStats();
        
        // Remove existing results button
        const existingButton = document.getElementById('view-detailed-results-container');
        if (existingButton) {
            existingButton.remove();
        }
    }
}; 