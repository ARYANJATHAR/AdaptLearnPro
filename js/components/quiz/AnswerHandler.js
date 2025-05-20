import { State } from '../State.js';
import { UI } from '../UI.js';
import { AudioManager } from '../AudioManager.js';

export const AnswerHandler = {
    selectAnswer(index, button) {
        // If answer was already submitted for this question, don't allow changes
        const currentHistoryQuestion = State.questionHistory[State.currentQuestionIndex];
        if (currentHistoryQuestion && currentHistoryQuestion.isSubmitted) return;
        
        // Remove selection from all options
        const allOptions = UI.optionsContainer.querySelectorAll('.option-btn');
        allOptions.forEach(opt => opt.classList.remove('selected'));
        
        // Mark the selected option
        button.classList.add('selected');
        State.selectedAnswerIndex = index;
        
        // Auto-submit after a short delay
        setTimeout(() => {
            this.submitAnswer();
        }, 300);
    },
    
    submitAnswer() {
        if (State.selectedAnswerIndex === null) return;
        
        State.answerSubmitted = true;
        const isCorrect = State.selectedAnswerIndex === State.currentQuestion.correctAnswer;
        
        // Calculate answer time
        const answerTime = Math.round((Date.now() - State.currentQuestionStartTime) / 1000);
        State.fastestAnswerTime = Math.min(State.fastestAnswerTime, answerTime);
        
        // Increment attempted count when answer is submitted
        State.totalAttempted++;
        
        // Create history item
        const historyItem = {
            question: State.currentQuestion,
            selectedAnswer: State.selectedAnswerIndex,
            isSubmitted: true,
            isCorrect: isCorrect,
            difficulty: State.currentDifficulty,
            answerTime: answerTime
        };

        // Update history
        if (State.currentQuestionIndex < State.questionHistory.length) {
            State.questionHistory[State.currentQuestionIndex] = historyItem;
        } else {
            State.questionHistory.push(historyItem);
        }

        // Get selected option element
        const selectedOption = UI.optionsContainer.querySelectorAll('.option-btn')[State.selectedAnswerIndex];
        
        if (isCorrect) {
            this.handleCorrectAnswer(selectedOption);
        } else {
            this.handleIncorrectAnswer(selectedOption);
        }
        
        // Update stats display
        UI.updateStats();
    },

    handleCorrectAnswer(selectedOption) {
        State.totalCorrect++;
        State.correctStreak++;
        State.incorrectStreak = 0;
        
        console.log(`[QUIZ DEBUG] Correct Answer! Current streak: ${State.correctStreak}, Difficulty: ${State.currentDifficulty}`);
        
        State.longestStreak = Math.max(State.longestStreak, State.correctStreak);
        
        AudioManager.playCorrect();
        
        selectedOption.classList.add('correct', 'animate-pulse');
        
        setTimeout(() => {
            UI.showFeedback("Correct!", "bg-green-500");
            
            if (State.correctStreak === 3 && 
                State.currentQuestionIndex === State.questionHistory.length - 1) {
                this.handleDifficultyIncrease();
            }
            
            setTimeout(() => {
                this.loadNextQuestion();
            }, 1800);
        }, 100);
    },

    handleIncorrectAnswer(selectedOption) {
        State.totalIncorrect++;
        State.incorrectStreak++;
        
        const oldStreak = State.correctStreak;
        State.correctStreak = 0;
        
        console.log(`[QUIZ DEBUG] Wrong Answer! Correct streak reset from ${oldStreak} to ${State.correctStreak}, Incorrect streak: ${State.incorrectStreak}`);
        
        AudioManager.playIncorrect();
        
        selectedOption.classList.add('incorrect');
        
        const correctOption = UI.optionsContainer.querySelectorAll('.option-btn')[State.currentQuestion.correctAnswer];
        correctOption.classList.add('correct');
        
        setTimeout(() => {
            UI.showFeedback("Incorrect!", "bg-red-500");
            
            if (State.incorrectStreak === 3) {
                this.handleDifficultyDecrease();
            }
            
            setTimeout(() => {
                this.loadNextQuestion();
            }, 1800);
        }, 100);
    },

    handleDifficultyIncrease() {
        if (State.currentDifficulty === 1) {
            State.currentDifficulty = 2;
            State.correctStreak = 0;
            State.incorrectStreak = 0;
            State.highestDifficulty = Math.max(State.highestDifficulty, 2);
            
            console.log(`[QUIZ DEBUG] Level up! Moving to Medium (2). Streak reset to ${State.correctStreak}`);
            
            setTimeout(() => {
                UI.showFeedback("Level Up! Moving to Medium difficulty", "bg-blue-500");
            }, 1200);
        } else if (State.currentDifficulty === 2) {
            State.currentDifficulty = 3;
            State.correctStreak = 0;
            State.incorrectStreak = 0;
            State.highestDifficulty = Math.max(State.highestDifficulty, 3);
            
            console.log(`[QUIZ DEBUG] Level up! Moving to Hard (3). Streak reset to ${State.correctStreak}`);
            
            setTimeout(() => {
                UI.showFeedback("Level Up! Moving to Hard difficulty", "bg-blue-500");
            }, 1200);
        }
    },

    handleDifficultyDecrease() {
        if (State.currentDifficulty === 2) {
            State.currentDifficulty = 1;
            State.correctStreak = 0;
            State.incorrectStreak = 0;
            
            console.log(`[QUIZ DEBUG] 3 wrong in a row! Moving back to Easy (1)`);
            
            setTimeout(() => {
                UI.showFeedback("Moving back to Easy difficulty", "bg-blue-500");
            }, 1200);
        } else if (State.currentDifficulty === 3) {
            State.currentDifficulty = 2;
            State.correctStreak = 0;
            State.incorrectStreak = 0;
            
            console.log(`[QUIZ DEBUG] 3 wrong in a row! Moving back to Medium (2)`);
            
            setTimeout(() => {
                UI.showFeedback("Moving back to Medium difficulty", "bg-blue-500");
            }, 1200);
        }
    }
}; 