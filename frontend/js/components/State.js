// State Management Component
export const State = {
    currentDifficulty: 1,
    correctStreak: 0,
    incorrectStreak: 0,
    longestStreak: 0,
    answeredQuestions: [],
    currentQuestion: null,
    totalQuestions: 10,
    totalCorrect: 0,
    totalIncorrect: 0,
    totalAttempted: 0,
    highestDifficulty: 1,
    userSelections: [],
    questionHistory: [],
    currentQuestionIndex: -1,
    selectedAnswerIndex: null,
    answerSubmitted: false,
    soundEnabled: true,
    
    // Timing related state
    quizStartTime: null,
    currentQuestionStartTime: null,
    fastestAnswerTime: Infinity,
    totalQuizTime: 0,
    
    reset() {
        // Save the totalQuestions value so we don't lose it on reset
        const savedTotalQuestions = this.totalQuestions;
        
        this.totalAttempted = 0;
        this.totalCorrect = 0;
        this.totalIncorrect = 0;
        
        this.currentQuestion = null;
        this.currentQuestionIndex = -1;
        this.questionHistory = [];
        this.answeredQuestions = [];
        
        this.selectedAnswerIndex = null;
        this.answerSubmitted = false;
        
        this.currentDifficulty = 1;
        this.highestDifficulty = 1;
        
        // IMPORTANT: Explicitly reset streak counters
        this.correctStreak = 0;
        this.incorrectStreak = 0;
        this.longestStreak = 0;
        
        this.quizStartTime = Date.now();
        this.currentQuestionStartTime = Date.now();
        this.totalQuizTime = 0;
        this.fastestAnswerTime = Infinity;
        
        // Restore the original totalQuestions value
        this.totalQuestions = savedTotalQuestions;
        
        console.log(`[STATE DEBUG] State reset complete. All streaks and counters reset to 0. Preserving totalQuestions: ${this.totalQuestions}`);
    },
    
    // Check if a question has been answered
    isQuestionAnswered(questionText) {
        return this.userSelections.some(selection => selection.question === questionText);
    },
    
    // Get user's answer for a specific question
    getQuestionAnswer(questionText) {
        return this.userSelections.find(selection => selection.question === questionText);
    },
    
    // Get current question from history
    getCurrentQuestionFromHistory() {
        if (this.currentQuestionIndex >= 0 && this.currentQuestionIndex < this.questionHistory.length) {
            return this.questionHistory[this.currentQuestionIndex];
        }
        return null;
    }
}; 