import { State } from '../State.js';
import { UI } from '../UI.js';
import { questions } from '../../main/questions.js';

export const QuestionManager = {
    loadPreviousQuestion() {
        if (State.currentQuestionIndex <= 0) return;
        
        // Store current question state if it's a new question
        if (State.currentQuestionIndex === State.questionHistory.length) {
            State.questionHistory.push({
                question: State.currentQuestion,
                selectedAnswer: State.selectedAnswerIndex,
                isSubmitted: State.answerSubmitted,
                difficulty: State.currentDifficulty
            });
        }
        
        State.currentQuestionIndex--;
        const previousQuestion = State.questionHistory[State.currentQuestionIndex];
        
        if (previousQuestion) {
            State.currentQuestion = previousQuestion.question;
            State.answerSubmitted = previousQuestion.isSubmitted;
            State.selectedAnswerIndex = previousQuestion.selectedAnswer;
            State.currentDifficulty = previousQuestion.difficulty;
            
            UI.questionContainer.style.opacity = '0';
            
            setTimeout(() => {
                UI.renderQuestion(State.currentQuestion, {
                    selectedAnswer: previousQuestion.selectedAnswer,
                    isSubmitted: previousQuestion.isSubmitted,
                    isCorrect: previousQuestion.selectedAnswer === previousQuestion.question.correctAnswer
                });
                UI.questionContainer.style.opacity = '1';
                
                UI.updateNavigationButtons(
                    State.currentQuestionIndex > 0,
                    true
                );
                
                UI.updateStats();
            }, 300);
        }
    },

    loadNextQuestion() {
        console.log('[NAV DEBUG] loadNextQuestion called. Current index:', State.currentQuestionIndex, 'History length:', State.questionHistory.length);
        
        // If we're not at the end of the history, just move to the next question
        if (State.currentQuestionIndex < State.questionHistory.length - 1) {
            State.currentQuestionIndex++;
            const nextQuestion = State.questionHistory[State.currentQuestionIndex];
            
            // Update state from history
            State.currentQuestion = nextQuestion.question;
            State.answerSubmitted = nextQuestion.isSubmitted;
            State.selectedAnswerIndex = nextQuestion.selectedAnswer;
            State.currentDifficulty = nextQuestion.difficulty || State.currentDifficulty;
            
            // Update UI
            UI.renderQuestion(State.currentQuestion, {
                selectedAnswer: nextQuestion.selectedAnswer,
                isSubmitted: nextQuestion.isSubmitted,
                isCorrect: nextQuestion.selectedAnswer === nextQuestion.question.correctAnswer
            });
            
            // Update navigation buttons
            UI.updateNavigationButtons(
                State.currentQuestionIndex > 0,
                State.currentQuestionIndex < State.questionHistory.length - 1
            );
            
            UI.updateStats();
            return;
        }
        
        // If we're at the end of history, save current question state if it exists
        if (State.currentQuestion) {
            const currentState = {
                question: State.currentQuestion,
                selectedAnswer: State.selectedAnswerIndex,
                isSubmitted: State.answerSubmitted,
                difficulty: State.currentDifficulty,
                skipped: !State.answerSubmitted,
                correctStreak: State.correctStreak,
                incorrectStreak: State.incorrectStreak
            };

            if (State.currentQuestionIndex < State.questionHistory.length) {
                State.questionHistory[State.currentQuestionIndex] = currentState;
            } else {
                State.questionHistory.push(currentState);
            }
            
            // Only increment totalAttempted for skipped questions
            if (!State.answerSubmitted) {
                State.totalAttempted++;
            }
            
            if (State.totalAttempted >= State.totalQuestions) {
                console.log(`[QUIZ DEBUG] Reached question limit (${State.totalAttempted}/${State.totalQuestions}). Ending quiz.`);
                this.endQuiz();
                return;
            }
            
            if (!State.answerSubmitted) {
                console.log("[QUIZ DEBUG] Question skipped. Resetting streaks.");
                State.correctStreak = 0;
                State.incorrectStreak = 0;
            }
        }

        this.prepareNextQuestion();
    },

    prepareNextQuestion() {
        State.answerSubmitted = false;
        State.selectedAnswerIndex = null;
        State.currentQuestionStartTime = Date.now();
        
        UI.questionContainer.style.opacity = '0';
        
        setTimeout(() => {
            if (State.currentQuestionIndex < State.questionHistory.length - 1) {
                this.loadQuestionFromHistory();
                return;
            }

            this.loadNewQuestion();
        }, 300);
    },

    loadQuestionFromHistory() {
        State.currentQuestionIndex++;
        const nextQuestion = State.questionHistory[State.currentQuestionIndex];
        State.currentQuestion = nextQuestion.question;
        State.answerSubmitted = nextQuestion.isSubmitted;
        State.selectedAnswerIndex = nextQuestion.selectedAnswer;
        
        if (nextQuestion.correctStreak !== undefined) {
            State.correctStreak = nextQuestion.correctStreak;
        }
        if (nextQuestion.incorrectStreak !== undefined) {
            State.incorrectStreak = nextQuestion.incorrectStreak;
        }

        UI.renderQuestion(State.currentQuestion, {
            selectedAnswer: nextQuestion.selectedAnswer,
            isSubmitted: nextQuestion.isSubmitted,
            isCorrect: nextQuestion.selectedAnswer === nextQuestion.question.correctAnswer,
            skipped: nextQuestion.skipped
        });
        UI.questionContainer.style.opacity = '1';
        UI.updateNavigationButtons(true, true);
    },

    loadNewQuestion() {
        try {
            if (State.totalAttempted >= State.totalQuestions) {
                this.endQuiz();
                return;
            }
            
            const questionSet = this.useCustomQuestions ? this.customQuestions : questions;
            
            if (!this.validateQuestionSet(questionSet)) {
                return;
            }
            
            let availableQuestions = this.getAvailableQuestions(questionSet);
            
            if (availableQuestions.length === 0) {
                if (!this.handleNoQuestionsAvailable(questionSet)) {
                    return;
                }
                availableQuestions = this.getAvailableQuestions(questionSet);
            }
            
            this.selectAndRenderQuestion(availableQuestions);
            
        } catch (error) {
            console.error("Error loading next question:", error);
            this.handleQuestionLoadError();
        }
    },

    validateQuestionSet(questionSet) {
        if (!questionSet || !questionSet[State.currentDifficulty] || questionSet[State.currentDifficulty].length === 0) {
            console.error("No questions available at difficulty level:", State.currentDifficulty);
            return this.findAlternativeDifficulty(questionSet);
        }
        return true;
    },

    getAvailableQuestions(questionSet) {
        return questionSet[State.currentDifficulty].filter(
            q => !State.answeredQuestions.includes(q.question)
        );
    },

    handleNoQuestionsAvailable(questionSet) {
        console.log("[QUIZ DEBUG] No questions available. Checking alternatives...");
        return this.findAlternativeDifficulty(questionSet);
    },

    findAlternativeDifficulty(questionSet) {
        for (let diff = 1; diff <= 3; diff++) {
            if (questionSet[diff] && questionSet[diff].length > 0) {
                State.currentDifficulty = diff;
                console.log(`[QUIZ DEBUG] Using questions from difficulty ${diff}`);
                return true;
            }
        }
        console.error("No questions available at any difficulty level");
        return false;
    },

    selectAndRenderQuestion(availableQuestions) {
        // Shuffle questions
        for (let i = availableQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableQuestions[i], availableQuestions[j]] = [availableQuestions[j], availableQuestions[i]];
        }
        
        State.currentQuestion = availableQuestions[0];
        State.answeredQuestions.push(State.currentQuestion.question);
        State.currentQuestionIndex++;
        
        UI.renderQuestion(State.currentQuestion);
        UI.questionContainer.style.opacity = '1';
        UI.updateStats();
        UI.updateNavigationButtons(State.currentQuestionIndex > 0, true);
    },

    handleQuestionLoadError() {
        UI.questionText.textContent = "Error loading question. Please try again.";
        UI.optionsContainer.innerHTML = `
            <div class="p-4 bg-red-100 rounded-lg text-red-700">
                <p>There was a problem loading the next question. Please try clicking Next to continue.</p>
            </div>
        `;
        UI.questionContainer.style.opacity = '1';
        UI.nextButton.disabled = false;
        UI.updateNavigationButtons(State.currentQuestionIndex > 0, true);
    }
}; 