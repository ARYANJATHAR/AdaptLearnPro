// Quiz Logic Component
import { QuizCore } from './quiz/QuizCore.js';
import { QuestionManager } from './quiz/QuestionManager.js';
import { AnswerHandler } from './quiz/AnswerHandler.js';
import { ResultsManager } from './quiz/ResultsManager.js';
import { QUIZ_CONSTANTS } from '../constants/quizConstants.js';
import { quizUtils } from '../utils/quizUtils.js';

// Combine all modules into the main QuizLogic object
export const QuizLogic = {
    ...QuizCore,
    ...QuestionManager,
    ...AnswerHandler,
    ...ResultsManager,
    
    // Add constants and utilities
    constants: QUIZ_CONSTANTS,
    utils: quizUtils,
    
    // Initialize the quiz logic
    init() {
        // Make sure all modules are properly linked
        Object.keys(this).forEach(key => {
            if (typeof this[key] === 'object' && this[key] !== null) {
                // Bind all methods to the QuizLogic context
                Object.keys(this[key]).forEach(methodKey => {
                    if (typeof this[key][methodKey] === 'function') {
                        this[key][methodKey] = this[key][methodKey].bind(this);
                    }
                });
            }
        });
        
        // Initialize the quiz
        this.initQuiz();
    }
}; 