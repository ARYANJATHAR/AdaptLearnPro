// State Management Component
export const State = {
    currentDifficulty: 1,
    correctStreak: 0,
    incorrectStreak: 0,
    answeredQuestions: [],
    currentQuestion: null,
    totalQuestions: 10,
    totalCorrect: 0,
    totalIncorrect: 0,
    totalAttempted: 0,
    highestDifficulty: 1,
    userSelections: [],
    questionHistory: [],
    selectedAnswerIndex: null,
    answerSubmitted: false,
    soundEnabled: true,
    
    reset() {
        this.currentDifficulty = 1;
        this.correctStreak = 0;
        this.incorrectStreak = 0;
        this.answeredQuestions = [];
        this.totalCorrect = 0;
        this.totalIncorrect = 0;
        this.totalAttempted = 0;
        this.highestDifficulty = 1;
        this.userSelections = [];
        this.questionHistory = [];
    }
}; 