// Quiz Logic Component
import { State } from './State.js';
import { UI } from './UI.js';
import { AudioManager } from './AudioManager.js';
import { ConfettiManager } from './ConfettiManager.js';
import { questions } from '../main/questions.js';

export const QuizLogic = {
    // For AI-generated questions
    customQuestions: null,
    useCustomQuestions: false,
    
    initQuiz() {
        State.reset();
        UI.updateStats();
        this.loadNextQuestion();
        UI.resultsDiv.classList.add('hidden');
        UI.navigationDiv.classList.remove('hidden');
        
        // Remove any existing "View Detailed Results" button when initializing a new quiz
        const existingButton = document.getElementById('view-detailed-results-container');
        if (existingButton) {
            existingButton.remove();
        }
    },
    
    loadNextQuestion() {
        State.answerSubmitted = false;
        State.selectedAnswerIndex = null;
        
        // Apply fade out effect
        UI.questionContainer.style.opacity = '0';
        
        setTimeout(() => {
            // Determine which question set to use
            const questionSet = this.useCustomQuestions ? this.customQuestions : questions;
            
            // Get available questions at current difficulty
            let availableQuestions = questionSet[State.currentDifficulty]?.filter(
                q => !State.answeredQuestions.includes(q.question)
            ) || [];
            
            // If no more questions at current difficulty, try other difficulties
            if (availableQuestions.length === 0) {
                const allDifficulties = Object.keys(questionSet).map(Number);
                for (const diff of allDifficulties) {
                    if (diff !== State.currentDifficulty && questionSet[diff]) {
                        availableQuestions = questionSet[diff].filter(
                            q => !State.answeredQuestions.includes(q.question)
                        );
                        if (availableQuestions.length > 0) break;
                    }
                }
            }
            
            // If still no questions or reached total questions, end the quiz
            if (availableQuestions.length === 0 || State.totalAttempted >= State.totalQuestions) {
                this.endQuiz();
                return;
            }
            
            // Select a random question from available questions
            const randomIndex = Math.floor(Math.random() * availableQuestions.length);
            State.currentQuestion = availableQuestions[randomIndex];
            
            // Mark question as answered
            State.answeredQuestions.push(State.currentQuestion.question);
            
            // Render the question
            UI.renderQuestion(State.currentQuestion);
            
            // Update progress
            State.totalAttempted++;
            UI.updateStats();
            
        }, 300); // Delay to match the fade out effect
    },
    
    selectAnswer(index, button) {
        if (State.answerSubmitted) return;
        
        // Remove selection from all options
        const allOptions = UI.optionsContainer.querySelectorAll('.option-btn');
        allOptions.forEach(opt => opt.classList.remove('selected'));
        
        // Mark the selected option
        button.classList.add('selected');
        State.selectedAnswerIndex = index;
        
        // Enable submit button if disabled
        UI.nextButton.disabled = false;
        
        // Auto-submit after a short delay - increased for better user experience
        setTimeout(() => {
            this.submitAnswer();
        }, 300);
    },
    
    submitAnswer() {
        if (State.selectedAnswerIndex === null || State.answerSubmitted) return;
        
        State.answerSubmitted = true;
        const isCorrect = State.selectedAnswerIndex === State.currentQuestion.correctAnswer;
        
        // Track user's answer for review
        State.userSelections.push({
            question: State.currentQuestion.question,
            options: State.currentQuestion.options,
            correctAnswer: State.currentQuestion.correctAnswer,
            userAnswer: State.selectedAnswerIndex,
            isCorrect: isCorrect
        });
        
        // Store question in history
        State.questionHistory.push({
            question: State.currentQuestion,
            userAnswer: State.selectedAnswerIndex,
            isCorrect: isCorrect,
            difficulty: State.currentDifficulty
        });
        
        // First apply styling to options
        const selectedOption = UI.optionsContainer.querySelectorAll('.option-btn')[State.selectedAnswerIndex];
        
        // Update streaks and difficulty
        if (isCorrect) {
            State.totalCorrect++;
            State.correctStreak++;
            State.incorrectStreak = 0;
            
            // Play correct sound
            AudioManager.playCorrect();
            
            // Apply correct styling
            selectedOption.classList.add('correct');
            selectedOption.classList.add('animate-pulse');
            
            // Show feedback after a tiny delay to ensure visual changes are noticed first
            setTimeout(() => {
                UI.showFeedback("Correct!", "bg-green-500");
                
                // Increase difficulty after 3 correct answers in a row
                if (State.correctStreak >= 3 && State.currentDifficulty < 3) {
                    State.currentDifficulty++;
                    State.highestDifficulty = Math.max(State.highestDifficulty, State.currentDifficulty);
                    State.correctStreak = 0;
                    
                    // Show level up feedback after a short delay
                    setTimeout(() => {
                        UI.showFeedback("Level Up! Questions will get harder", "bg-blue-500");
                    }, 1200);
                }
                
                // Auto-move to next question after a delay
                setTimeout(() => {
                    this.loadNextQuestion();
                }, 1800);
            }, 100);
        } else {
            State.totalIncorrect++;
            State.incorrectStreak++;
            State.correctStreak = 0;
            
            // Play incorrect sound
            AudioManager.playIncorrect();
            
            // Apply incorrect styling
            selectedOption.classList.add('incorrect');
            
            // Show correct answer
            const correctOption = UI.optionsContainer.querySelectorAll('.option-btn')[State.currentQuestion.correctAnswer];
            correctOption.classList.add('correct');
            
            // Show feedback after a tiny delay
            setTimeout(() => {
                UI.showFeedback("Incorrect!", "bg-red-500");
                
                // Decrease difficulty after 2 incorrect answers in a row
                if (State.incorrectStreak >= 2 && State.currentDifficulty > 1) {
                    State.currentDifficulty--;
                    State.incorrectStreak = 0;
                    
                    // Show difficulty adjustment feedback after a short delay
                    setTimeout(() => {
                        UI.showFeedback("Adjusting difficulty for better learning", "bg-blue-500");
                    }, 1200);
                }
                
                // Auto-move to next question after a delay
                setTimeout(() => {
                    this.loadNextQuestion();
                }, 1800);
            }, 100);
        }
        
        // Update stats display
        UI.updateStats();
        
        // Enable next button
        UI.nextButton.disabled = false;
        UI.nextButton.focus();
    },
    
    endQuiz() {
        // Hide question container and navigation
        UI.navigationDiv.classList.add('hidden');
        
        // Show results
        const score = UI.showResults();
        
        // Play completion sound
        AudioManager.playCompletion();
        
        // Trigger confetti celebration if score is good
        if (score >= 60) {
            ConfettiManager.startConfetti();
            setTimeout(() => {
                ConfettiManager.stopConfetti();
            }, 3000);
        }
        
        // Store quiz results data for the detailed results page
        this.saveQuizResultsData();
        
        // Check if View Detailed Results button already exists
        const resultsDiv = document.getElementById('results');
        const existingButton = document.getElementById('view-detailed-results-container');
        
        // Only add the button if it doesn't already exist
        if (resultsDiv && !existingButton) {
            const viewDetailedResultsBtn = document.createElement('div');
            viewDetailedResultsBtn.id = 'view-detailed-results-container';
            viewDetailedResultsBtn.className = 'mt-6 text-center';
            viewDetailedResultsBtn.innerHTML = `
                <button id="view-detailed-results" class="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg shadow-md">
                    <i class="fas fa-chart-bar mr-2"></i>
                    <span>View Detailed Results</span>
                </button>
            `;
            resultsDiv.appendChild(viewDetailedResultsBtn);
            
            // Add event listener
            document.getElementById('view-detailed-results').addEventListener('click', () => {
                window.location.href = './results.html';
            });
        }
    },
    
    saveQuizResultsData() {
        // Calculate stats
        const questionResults = State.questionHistory.map(item => ({
            question: item.question.question,
            correct: item.isCorrect,
            difficulty: item.difficulty
        }));
        
        // Find topics to work on (incorrect answers grouped by topic)
        const incorrectQuestions = State.questionHistory.filter(item => !item.isCorrect);
        const topicsToWorkOn = [
            { 
                name: "Sample Topic 1", 
                description: "This is a placeholder. In a real implementation, this would be derived from the question data."
            },
            { 
                name: "Sample Topic 2", 
                description: "Another placeholder topic derived from question analysis."
            }
        ];
        
        // Calculate hotstreak
        let maxStreak = 0;
        let currentStreak = 0;
        State.questionHistory.forEach(item => {
            if (item.isCorrect) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        });
        
        // Create results data object
        const resultsData = {
            total: State.totalAttempted,
            correct: State.totalCorrect,
            incorrect: State.totalIncorrect,
            score: Math.round((State.totalCorrect / State.totalAttempted) * 100),
            highestDifficulty: State.highestDifficulty,
            timeTaken: 780, // Placeholder - would need a timer implementation
            fastestAnswer: 7, // Placeholder - would need timing data for questions
            hotstreak: maxStreak,
            questionResults: questionResults,
            topicsToWorkOn: topicsToWorkOn
        };
        
        // Store in session storage
        sessionStorage.setItem('quizResults', JSON.stringify(resultsData));
    }
}; 