// Main App Entry Point
import { UI } from '../components/UI.js';
import { QuizLogic } from '../components/QuizLogic.js';
import { AudioManager } from '../components/AudioManager.js';
import { ConfettiManager } from '../components/ConfettiManager.js';

// Quiz App Main Module
const QuizApp = {
    init() {
        // Initialize UI first
        UI.init();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize the quiz
        QuizLogic.initQuiz();
    },
    
    setupEventListeners() {
        // Quiz navigation
        UI.nextButton.addEventListener('click', () => QuizLogic.loadNextQuestion());
        
        UI.restartButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to restart the quiz? Your progress will be lost.')) {
                QuizLogic.initQuiz();
            }
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