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
        this.currentDifficulty = 1;
        this.correctStreak = 0;
        this.incorrectStreak = 0;
        this.longestStreak = 0;
        this.answeredQuestions = [];
        this.currentQuestion = null;
        this.totalQuestions = 10;
        this.totalCorrect = 0;
        this.totalIncorrect = 0;
        this.totalAttempted = 0;
        this.highestDifficulty = 1;
        this.userSelections = [];
        this.questionHistory = [];
        this.currentQuestionIndex = -1;
        this.selectedAnswerIndex = null;
        this.answerSubmitted = false;
        
        // Reset timing data
        this.quizStartTime = Date.now();
        this.currentQuestionStartTime = Date.now();
        this.fastestAnswerTime = Infinity;
        this.totalQuizTime = 0;
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