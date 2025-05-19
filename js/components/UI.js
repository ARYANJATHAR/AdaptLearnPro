// UI Component
import { State } from './State.js';
import { QuizLogic } from './QuizLogic.js';

export const UI = {
    // DOM Elements
    questionContainer: null,
    questionText: null,
    optionsContainer: null,
    nextButton: null,
    backButton: null,
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
    restartModal: null,
    restartConfirmBtn: null,
    restartCancelBtn: null,
    
    // Initialize UI elements
    init() {
        this.questionContainer = document.getElementById('question-container');
        this.questionText = document.getElementById('question-text');
        this.optionsContainer = document.getElementById('options-container');
        this.nextButton = document.getElementById('next-btn');
        this.navigationDiv = document.getElementById('navigation');
        
        // Create back button if it doesn't exist
        if (!this.backButton) {
            this.backButton = document.createElement('button');
            this.backButton.id = 'back-btn';
            this.backButton.className = 'px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors mr-2';
            this.backButton.innerHTML = '<i class="fas fa-arrow-left mr-1"></i>Back';
            
            // Insert back button before next button
            if (this.nextButton && this.nextButton.parentNode) {
                this.nextButton.parentNode.insertBefore(this.backButton, this.nextButton);
            }
        }
        
        this.restartButton = document.getElementById('restart-btn');
        this.restartFinalButton = document.getElementById('final-restart-btn');
        this.solutionsButton = document.getElementById('solutions-btn');
        this.solutionsContainer = document.getElementById('solutions-container');
        this.solutionsList = document.getElementById('solutions-list');
        this.resultsDiv = document.getElementById('results');
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
        
        // Initialize modal elements
        this.restartModal = document.getElementById('restart-modal');
        this.restartConfirmBtn = document.getElementById('restart-confirm');
        this.restartCancelBtn = document.getElementById('restart-cancel');
        
        // Set up modal event listeners
        this.setupModalListeners();
        
        // Add event listener for back button
        this.backButton.addEventListener('click', () => QuizLogic.loadPreviousQuestion());
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
        
        // Update progress with correct total question count
        const progressPercentage = (State.totalAttempted / State.totalQuestions) * 100;
        this.progressBar.style.width = `${progressPercentage}%`;
        
        // FIX: The question number display needs to be fixed
        // Since totalAttempted increments after answering, we need to display the current question number
        // For question displays, we need to show the question we're currently on (totalAttempted + 1)
        // unless we've reached the end
        const currentQuestionNumber = Math.min(State.totalAttempted + 1, State.totalQuestions);
        
        this.progressText.textContent = `Question ${currentQuestionNumber} of ${State.totalQuestions}`;
        
        // Log the progress update for debugging
        console.log(`[UI DEBUG] Updated progress: ${currentQuestionNumber}/${State.totalQuestions} (${progressPercentage.toFixed(0)}%)`);
        
        // Removed streak progress feedback - no longer showing this to the user
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
    
    updateNavigationButtons(showBack, showNext) {
        if (this.backButton) {
            this.backButton.style.display = showBack ? 'inline-block' : 'none';
        }
        if (this.nextButton) {
            this.nextButton.style.display = showNext ? 'inline-block' : 'none';
            // Don't override disabled state here as it's handled in renderQuestion
        }
    },
    
    renderQuestion(question, previousAnswer = null) {
        console.log('Rendering question:', question);
        
        // Validate question object
        if (!question) {
            console.error('Invalid question object:', question);
            this.questionText.textContent = 'Error: No question to display';
            return;
        }
        
        if (!question.question || !question.options || !Array.isArray(question.options)) {
            console.error('Invalid question format:', question);
            this.questionText.textContent = 'Error: Invalid question format';
            return;
        }
        
        // Make sure the question container is visible
        this.questionContainer.style.display = 'block';
        this.questionContainer.classList.remove('hidden');
        this.questionContainer.style.opacity = '1';
        this.questionContainer.style.height = 'auto';
        this.questionContainer.style.overflow = 'visible';
        this.questionContainer.style.margin = '';
        this.questionContainer.style.padding = '1.5rem';
        
        // Update question text
        this.questionText.textContent = question.question;
        console.log('Set question text to:', question.question);
        
        // Clear previous options and verify that the container exists
        if (!this.optionsContainer) {
            console.error('Options container not found');
            this.optionsContainer = document.getElementById('options-container');
            
            if (!this.optionsContainer) {
                console.error('Could not find options container');
                return;
            }
        }
        
        this.optionsContainer.innerHTML = '';
        
        // Check if this question is already answered from state
        const isAnswered = State.answerSubmitted;
        
        // Check for valid options
        if (question.options.length === 0) {
            console.error('Question has no options:', question);
            this.optionsContainer.innerHTML = '<div class="p-4 bg-yellow-100 rounded-lg text-yellow-700">This question has no answer options.</div>';
            return;
        }
        
        // Check for valid correctAnswer
        if (question.correctAnswer === undefined || question.correctAnswer === null || 
            question.correctAnswer < 0 || question.correctAnswer >= question.options.length) {
            console.warn('Question has invalid correctAnswer:', question.correctAnswer);
            // Try to fix the correct answer if possible
            question.correctAnswer = 0; // Default to first option
        }
        
        // Create and append new option buttons
        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'option-btn w-full text-left p-4 mb-2 bg-white rounded-lg shadow hover:bg-gray-50 transition-all';
            button.textContent = option;
            
            // Handle previously answered questions
            if (previousAnswer?.isSubmitted || isAnswered) {
                const answerData = previousAnswer || {
                    selectedAnswer: State.selectedAnswerIndex,
                    isCorrect: State.selectedAnswerIndex === question.correctAnswer
                };
                
                // If this option was selected
                if (index === answerData.selectedAnswer) {
                    button.classList.add('selected');
                    button.classList.add(answerData.isCorrect ? 'correct' : 'incorrect');
                }
                
                // Show correct answer
                if (index === question.correctAnswer) {
                    button.classList.add('correct');
                }
                
                // Disable the button
                button.disabled = true;
                button.classList.add('cursor-not-allowed');
            }
            
            // Add click event listener
            button.addEventListener('click', () => {
                // Only allow selection if question hasn't been answered
                if (!previousAnswer?.isSubmitted && !isAnswered) {
                    QuizLogic.selectAnswer(index, button);
                }
            });
            
            this.optionsContainer.appendChild(button);
        });
        
        console.log('Added', question.options.length, 'option buttons');
        
        // Show the question with fade in effect
        this.questionContainer.style.opacity = '1';
        
        // Always enable next button to allow skipping
        this.nextButton.disabled = false;
        
        // Always show back button after first question
        this.updateNavigationButtons(State.questionHistory.length > 0, true);
        
        // Make sure navigation is visible
        if (this.navigationDiv) {
            this.navigationDiv.classList.remove('hidden');
            this.navigationDiv.style.display = 'flex';
        }
    },
    
    showResults() {
        console.log("Showing quiz results");
        
        // Hide the last question properly
        if (this.questionContainer) {
            // Add hidden class instead of just changing opacity
            this.questionContainer.classList.add('hidden');
            this.questionContainer.style.opacity = '0';
            this.questionContainer.style.height = '0';
            this.questionContainer.style.overflow = 'hidden';
            this.questionContainer.style.margin = '0';
            this.questionContainer.style.padding = '0';
        }
        
        if (this.navigationDiv) {
            this.navigationDiv.style.display = 'none';
        }
        
        // Show results immediately without margin
        if (this.resultsDiv) {
            this.resultsDiv.classList.remove('hidden');
            this.resultsDiv.style.marginTop = '0';
            this.resultsDiv.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Calculate final score
        const score = State.totalAttempted > 0 ? Math.round((State.totalCorrect / State.totalAttempted) * 100) : 0;
        
        // Update final stats displays
        if (this.finalScoreDisplay) this.finalScoreDisplay.textContent = `${score}%`;
        if (this.finalCorrectDisplay) this.finalCorrectDisplay.textContent = State.totalCorrect;
        if (this.finalIncorrectDisplay) this.finalIncorrectDisplay.textContent = State.totalIncorrect;
        if (this.highestDifficultyDisplay) {
            this.highestDifficultyDisplay.textContent = State.highestDifficulty;
            
            // Add a badge next to the difficulty level
            const difficultyName = State.highestDifficulty === 1 ? 'Easy' : 
                                 State.highestDifficulty === 2 ? 'Medium' : 'Hard';
                                 
            const difficultyClass = `difficulty-${State.highestDifficulty}`;
            
            if (!document.getElementById('highest-difficulty-badge')) {
                const badge = document.createElement('span');
                badge.id = 'highest-difficulty-badge';
                badge.className = `difficulty-badge ${difficultyClass} text-white text-xs px-2 py-1 rounded ml-2`;
                badge.textContent = difficultyName;
                this.highestDifficultyDisplay.parentNode.appendChild(badge);
            }
        }
        
        // Add longest streak information
        if (State.longestStreak > 0) {
            // Remove any existing streak displays first
            const existingStreakDisplays = document.querySelectorAll('.stats-card');
            existingStreakDisplays.forEach(display => {
                if (display.querySelector('p')?.textContent === 'Longest Streak') {
                    display.remove();
                }
            });
            
            // Create a new stats card for the streak
            const streakCard = document.createElement('div');
            streakCard.className = 'stats-card bg-white p-4 rounded-lg shadow-md text-center';
            streakCard.innerHTML = `
                <div class="text-4xl font-bold text-yellow-600 mb-2" id="longest-streak">${State.longestStreak}</div>
                <p class="text-gray-500">Longest Streak</p>
            `;
            
            // Find the stats container and append the streak card
            const statsContainer = document.querySelector('#results .flex.flex-wrap.justify-center');
            if (statsContainer) {
                statsContainer.appendChild(streakCard);
            }
        }
        
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
    },
    
    showRestartModal(onConfirm) {
        if (!this.restartModal) return;
        
        const confirmHandler = () => {
            this.hideRestartModal();
            onConfirm();
            // Remove the one-time event listener
            this.restartConfirmBtn.removeEventListener('click', confirmHandler);
        };
        
        // Add one-time event listener for confirm button
        this.restartConfirmBtn.addEventListener('click', confirmHandler);
        
        // Show the modal
        this.restartModal.classList.remove('hidden');
    },
    
    hideRestartModal() {
        if (!this.restartModal) return;
        this.restartModal.classList.add('hidden');
    },
    
    setupModalListeners() {
        if (!this.restartModal) return;
        
        // Close modal when clicking cancel button
        this.restartCancelBtn.addEventListener('click', () => this.hideRestartModal());
        
        // Close modal when clicking outside
        this.restartModal.addEventListener('click', (e) => {
            if (e.target === this.restartModal) {
                this.hideRestartModal();
            }
        });
        
        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.restartModal.classList.contains('hidden')) {
                this.hideRestartModal();
            }
        });
    }
}; 