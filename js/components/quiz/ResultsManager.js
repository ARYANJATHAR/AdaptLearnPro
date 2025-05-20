import { State } from '../State.js';
import { UI } from '../UI.js';
import { AudioManager } from '../AudioManager.js';
import { ConfettiManager } from '../ConfettiManager.js';

export const ResultsManager = {
    endQuiz() {
        // Calculate total quiz time
        State.totalQuizTime = Math.round((Date.now() - State.quizStartTime) / 1000);
        
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
        
        // Store quiz results data
        this.saveQuizResultsData();
        
        // Add View Detailed Results button
        this.addDetailedResultsButton();
    },
    
    saveQuizResultsData() {
        console.log('Saving quiz results. Question history:', State.questionHistory);
        
        const questionResults = State.questionHistory.map(item => {
            console.log('Processing history item:', item);
            
            const wasCorrect = item.selectedAnswer === item.question.correctAnswer;
            console.log(`Question "${item.question.question}" - Selected: ${item.selectedAnswer}, Correct: ${item.question.correctAnswer}, Was Correct: ${wasCorrect}`);
            
            return {
                question: item.question.question,
                correct: wasCorrect,
                difficulty: item.difficulty,
                answerTime: item.answerTime
            };
        });

        const topicsToWorkOn = this.analyzeTopicsToWorkOn();
        
        const resultsData = {
            total: State.totalAttempted,
            correct: State.totalCorrect,
            incorrect: State.totalIncorrect,
            score: Math.round((State.totalCorrect / State.totalAttempted) * 100),
            highestDifficulty: State.highestDifficulty,
            timeTaken: State.totalQuizTime,
            fastestAnswer: State.fastestAnswerTime === Infinity ? 0 : State.fastestAnswerTime,
            hotstreak: State.longestStreak,
            questionResults: questionResults,
            topicsToWorkOn: topicsToWorkOn,
            isAIQuiz: this.useCustomQuestions
        };
        
        sessionStorage.setItem('quizResults', JSON.stringify(resultsData));
    },
    
    analyzeTopicsToWorkOn() {
        const incorrectQuestions = State.questionHistory.filter(item => !item.isCorrect);
        const topicsToWorkOn = [];

        this.checkTopicCategory(incorrectQuestions, 
            ['capital', '2 + 2', 'largest ocean'],
            "Basic Facts & Geography",
            "Review basic geography, simple mathematics, and general knowledge questions.",
            topicsToWorkOn
        );

        this.checkTopicCategory(incorrectQuestions,
            ['wrote', 'romeo', 'shakespeare'],
            "Literature & Arts",
            "Focus on famous authors, classic literature, and artistic works.",
            topicsToWorkOn
        );

        this.checkTopicCategory(incorrectQuestions,
            ['planet', 'sun', 'mercury', 'venus'],
            "Astronomy & Space",
            "Study the solar system, planets, and their characteristics.",
            topicsToWorkOn
        );

        this.checkTopicCategory(incorrectQuestions,
            ['scientist', 'einstein', 'theory', 'quantum', 'uncertainty'],
            "Physics & Scientific Theory",
            "Review important scientific theories, quantum mechanics, and famous scientists.",
            topicsToWorkOn
        );

        this.checkTopicCategory(incorrectQuestions,
            ['element', 'chemical', 'symbol', 'potassium'],
            "Chemistry",
            "Study chemical elements, their symbols, and basic chemistry concepts.",
            topicsToWorkOn
        );

        this.checkTopicCategory(incorrectQuestions,
            ['square root', 'sorting', 'algorithm'],
            "Mathematics & Computer Science",
            "Practice mathematical calculations and algorithmic concepts.",
            topicsToWorkOn
        );

        this.checkTopicCategory(incorrectQuestions,
            ['war', 'world war', '1945', '1957', 'sputnik'],
            "Historical Events",
            "Review important historical dates, events, and their significance.",
            topicsToWorkOn
        );

        this.checkTopicCategory(incorrectQuestions,
            ['force', 'gravity', 'electromagnetic'],
            "Physics Forces",
            "Study fundamental forces in physics and their applications.",
            topicsToWorkOn
        );

        // If no specific topics identified but there are incorrect answers
        if (topicsToWorkOn.length === 0 && incorrectQuestions.length > 0) {
            const question = incorrectQuestions[0].question.question;
            topicsToWorkOn.push({
                name: "Question Review",
                description: `Review this question: "${question}"`
            });
        }

        return topicsToWorkOn;
    },
    
    checkTopicCategory(questions, keywords, topicName, description, topicsArray) {
        const hasRelevantQuestions = questions.some(q => 
            keywords.some(keyword => q.question.question.toLowerCase().includes(keyword))
        );
        if (hasRelevantQuestions) {
            topicsArray.push({ name: topicName, description });
        }
    },
    
    addDetailedResultsButton() {
        const resultsDiv = document.getElementById('results');
        const existingButton = document.getElementById('view-detailed-results-container');
        
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
            
            document.getElementById('view-detailed-results').addEventListener('click', () => {
                window.location.href = './results.html';
            });
        }
    }
}; 