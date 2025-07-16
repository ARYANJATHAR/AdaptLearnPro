export const quizUtils = {
    calculateScore(correct, total) {
        return Math.round((correct / total) * 100);
    },
    
    shuffleQuestions(questions) {
        // Fisher-Yates shuffle
        for (let i = questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [questions[i], questions[j]] = [questions[j], questions[i]];
        }
        return questions;
    },
    
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    },
    
    validateQuestion(question) {
        return question && 
               typeof question === 'object' &&
               question.question &&
               Array.isArray(question.options) &&
               typeof question.correctAnswer === 'number' &&
               question.correctAnswer >= 0 &&
               question.correctAnswer < question.options.length;
    },
    
    getQuestionDifficulty(question) {
        // Analyze question complexity to suggest a difficulty level
        const text = question.question.toLowerCase();
        const options = question.options;
        
        // Check for complex terms
        const complexTerms = ['quantum', 'theory', 'algorithm', 'electromagnetic'];
        const hasComplexTerms = complexTerms.some(term => text.includes(term));
        
        // Check for mathematical expressions
        const hasMath = /[+\-*/^√∛∜]|square root|cube root/.test(text);
        
        // Check for dates/historical references
        const hasHistory = /\d{4}|century|period|era/.test(text);
        
        // Check option complexity
        const longOptions = options.filter(opt => opt.length > 50).length;
        const technicalOptions = options.filter(opt => 
            /[+\-*/^√∛∜]|\d{4}|theory|quantum|algorithm/.test(opt)
        ).length;
        
        // Calculate difficulty score
        let difficultyScore = 1;
        if (hasComplexTerms) difficultyScore++;
        if (hasMath) difficultyScore++;
        if (hasHistory) difficultyScore++;
        if (longOptions >= 2) difficultyScore++;
        if (technicalOptions >= 2) difficultyScore++;
        
        // Normalize to 1-3 range
        return Math.min(Math.max(Math.ceil(difficultyScore / 2), 1), 3);
    },
    
    analyzeQuestionTopic(question) {
        const text = question.question.toLowerCase();
        
        const topicPatterns = [
            { pattern: /(math|equation|calculate|solve)/i, topic: 'Mathematics' },
            { pattern: /(physics|force|energy|motion)/i, topic: 'Physics' },
            { pattern: /(chemistry|element|compound|reaction)/i, topic: 'Chemistry' },
            { pattern: /(history|war|century|period|civilization)/i, topic: 'History' },
            { pattern: /(literature|author|wrote|book|novel)/i, topic: 'Literature' },
            { pattern: /(geography|country|capital|continent)/i, topic: 'Geography' },
            { pattern: /(computer|algorithm|programming|code)/i, topic: 'Computer Science' },
            { pattern: /(biology|cell|organism|species)/i, topic: 'Biology' }
        ];
        
        for (const { pattern, topic } of topicPatterns) {
            if (pattern.test(text)) {
                return topic;
            }
        }
        
        return 'General Knowledge';
    }
}; 