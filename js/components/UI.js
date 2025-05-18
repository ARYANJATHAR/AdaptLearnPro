// UI Component
import { State } from './State.js';
import { QuizLogic } from './QuizLogic.js';

export const UI = {
    // DOM Elements
    questionContainer: null,
    questionText: null,
    optionsContainer: null,
    nextButton: null,
    restartButton: null,
    restartFinalButton: null,
    solutionsButton: null,
    solutionsContainer: null,
    solutionsList: null,
    resultsDiv: null,
    navigationDiv: null,
    difficultyLevel: null,
    difficultyBadge: null,
    correctDisplay: null,
    incorrectDisplay: null,
    attemptedDisplay: null,
    progressBar: null,
    progressText: null,
    finalScoreDisplay: null,
    finalCorrectDisplay: null,
    finalIncorrectDisplay: null,
    highestDifficultyDisplay: null,
    feedbackMessage: null,
    soundToggle: null,
    
    // Initialize UI elements
    init() {
        this.questionContainer = document.getElementById('question-container');
        this.questionText = document.getElementById('question-text');
        this.optionsContainer = document.getElementById('options-container');
        this.nextButton = document.getElementById('next-btn');
        this.restartButton = document.getElementById('restart-btn');
        this.restartFinalButton = document.getElementById('final-restart-btn');
        this.solutionsButton = document.getElementById('solutions-btn');
        this.solutionsContainer = document.getElementById('solutions-container');
        this.solutionsList = document.getElementById('solutions-list');
        this.resultsDiv = document.getElementById('results');
        this.navigationDiv = document.getElementById('navigation');
        this.difficultyLevel = document.getElementById('difficulty-level');
        this.difficultyBadge = document.getElementById('difficulty-badge');
        this.correctDisplay = document.getElementById('correct');
        this.incorrectDisplay = document.getElementById('incorrect');
        this.attemptedDisplay = document.getElementById('attempted');
        this.progressBar = document.getElementById('progress-bar');
        this.progressText = document.getElementById('progress-text');
        this.finalScoreDisplay = document.getElementById('final-score');
        this.finalCorrectDisplay = document.getElementById('final-correct');
        this.finalIncorrectDisplay = document.getElementById('final-incorrect');
        this.highestDifficultyDisplay = document.getElementById('highest-difficulty');
        this.feedbackMessage = document.getElementById('feedback-message');
        this.soundToggle = document.getElementById('sound-toggle');
    },
    
    updateStats() {
        this.correctDisplay.textContent = State.totalCorrect;
        this.incorrectDisplay.textContent = State.totalIncorrect;
        this.attemptedDisplay.textContent = State.totalAttempted;
        this.difficultyLevel.textContent = State.currentDifficulty;
        
        // Update difficulty badge
        this.difficultyBadge.className = `difficulty-badge difficulty-${State.currentDifficulty} text-white text-xs px-2 py-1 rounded`;
        this.difficultyBadge.textContent = State.currentDifficulty === 1 ? 'Easy' : 
                                     State.currentDifficulty === 2 ? 'Medium' : 'Hard';
        
        // Update question container difficulty styling
        const quizContent = document.getElementById('quiz-content');
        quizContent.className = quizContent.className.replace(/difficulty-level-\d/g, '');
        quizContent.classList.add(`difficulty-level-${State.currentDifficulty}`);
        
        // Update progress
        this.progressBar.style.width = `${(State.totalAttempted / State.totalQuestions) * 100}%`;
        this.progressText.textContent = `Question ${State.totalAttempted} of ${State.totalQuestions}`;
    },
    
    showFeedback(message, bgClass) {
        // Clear any existing messages first
        this.feedbackMessage.classList.remove('show');
        
        // Small delay before showing new message to ensure animation works
        setTimeout(() => {
            this.feedbackMessage.textContent = message;
            this.feedbackMessage.className = `feedback-message ${bgClass} show`;
            
            // Reset any previous timeout
            if (this.feedbackMessage.timeoutId) {
                clearTimeout(this.feedbackMessage.timeoutId);
            }
            
            // Set new timeout to hide the message
            this.feedbackMessage.timeoutId = setTimeout(() => {
                this.feedbackMessage.classList.remove('show');
            }, 2000);
        }, 50);
    },
    
    renderQuestion(question) {
        // Update question display
        this.questionText.textContent = question.question;
        this.optionsContainer.innerHTML = "";
        
        // Create option buttons
        question.options.forEach((option, index) => {
            const optionButton = document.createElement('button');
            optionButton.className = "option-btn w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-all";
            optionButton.innerHTML = `
                <span class="inline-block w-6 h-6 rounded-full mr-3 bg-gray-100 text-gray-700 text-sm flex items-center justify-center">${String.fromCharCode(65 + index)}</span>
                <span>${option}</span>
            `;
            
            optionButton.addEventListener('click', () => QuizLogic.selectAnswer(index, optionButton));
            this.optionsContainer.appendChild(optionButton);
        });
        
        // Apply fade in effect
        this.questionContainer.style.opacity = '1';
        this.questionContainer.classList.add('animate-fadeIn');
    },
    
    showResults() {
        // Calculate final score
        const score = State.totalAttempted > 0 ? Math.round((State.totalCorrect / State.totalAttempted) * 100) : 0;
        
        // Update results
        this.finalScoreDisplay.textContent = `${score}%`;
        this.finalCorrectDisplay.textContent = State.totalCorrect;
        this.finalIncorrectDisplay.textContent = State.totalIncorrect;
        this.highestDifficultyDisplay.textContent = State.highestDifficulty;
        
        // Show results view
        this.resultsDiv.classList.remove('hidden');
        
        return score;
    },
    
    showSolutions() {
        this.solutionsContainer.classList.remove('hidden');
        this.solutionsList.innerHTML = '';
        
        State.questionHistory.forEach((item, index) => {
            const solutionItem = document.createElement('div');
            solutionItem.className = `solution-item ${item.isCorrect ? 'bg-green-50' : 'bg-red-50'}`;
            
            const difficultyLabel = item.difficulty === 1 ? 'Easy' : 
                                   item.difficulty === 2 ? 'Medium' : 'Hard';
            
            const difficultyClass = item.difficulty === 1 ? 'bg-green-100 text-green-800' : 
                                   item.difficulty === 2 ? 'bg-yellow-100 text-yellow-800' : 
                                   'bg-red-100 text-red-800';
            
            solutionItem.innerHTML = `
                <div class="flex justify-between items-start mb-3">
                    <h4 class="font-medium">Question ${index + 1}</h4>
                    <span class="px-2 py-1 rounded-full text-xs ${difficultyClass}">${difficultyLabel}</span>
                </div>
                <p class="mb-3">${item.question.question}</p>
                <div class="space-y-2 mb-3">
                    ${item.question.options.map((opt, i) => `
                        <div class="flex items-center p-2 rounded ${
                            i === item.question.correctAnswer && i === item.userAnswer ? 'bg-green-100' :
                            i === item.question.correctAnswer ? 'bg-green-100' :
                            i === item.userAnswer ? 'bg-red-100' : 'bg-gray-50'
                        }">
                            <span class="inline-block w-6 h-6 rounded-full mr-2 
                                ${i === item.question.correctAnswer ? 'bg-green-200 text-green-800' : 
                                  i === item.userAnswer ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-600'} 
                                text-sm flex items-center justify-center">${String.fromCharCode(65 + i)}</span>
                            <span>${opt}</span>
                            ${i === item.question.correctAnswer ? 
                                '<span class="ml-auto"><i class="fas fa-check text-green-600"></i></span>' : 
                                i === item.userAnswer && i !== item.question.correctAnswer ? 
                                '<span class="ml-auto"><i class="fas fa-times text-red-600"></i></span>' : ''}
                        </div>
                    `).join('')}
                </div>
            `;
            
            this.solutionsList.appendChild(solutionItem);
        });
        
        // Change button text after showing solutions
        this.solutionsButton.innerHTML = '<i class="fas fa-eye-slash mr-2"></i><span>Hide Solutions</span>';
        this.solutionsButton.addEventListener('click', () => {
            if (this.solutionsContainer.classList.contains('hidden')) {
                this.showSolutions();
            } else {
                this.solutionsContainer.classList.add('hidden');
                this.solutionsButton.innerHTML = '<i class="fas fa-eye mr-2"></i><span>View Solutions</span>';
            }
        }, { once: true });
    }
}; 