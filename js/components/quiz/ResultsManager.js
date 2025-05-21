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
        
        // Filter out any invalid history items
        const validHistory = State.questionHistory.filter(item => 
            item && item.question && typeof item.selectedAnswer !== 'undefined'
        );
        
        const questionResults = validHistory.map(item => {
            console.log('Processing history item:', item);
            
            const wasCorrect = item.selectedAnswer === item.question.correctAnswer;
            console.log(`Question "${item.question.question}" - Selected: ${item.selectedAnswer}, Correct: ${item.question.correctAnswer}, Was Correct: ${wasCorrect}`);
            
            return {
                question: item.question.question,
                correct: wasCorrect,
                difficulty: item.difficulty,
                answerTime: item.answerTime || 0,
                selectedAnswer: item.selectedAnswer,
                correctAnswer: item.question.correctAnswer
            };
        });

        const topicsToWorkOn = this.analyzeTopicsToWorkOn();
        
        // Use the actual number of valid questions
        const totalQuestions = validHistory.length;
        
        const resultsData = {
            total: totalQuestions,
            correct: State.totalCorrect,
            incorrect: totalQuestions - State.totalCorrect, // Ensure incorrect count matches
            score: Math.round((State.totalCorrect / totalQuestions) * 100),
            highestDifficulty: State.highestDifficulty,
            timeTaken: State.totalQuizTime,
            fastestAnswer: State.fastestAnswerTime === Infinity ? 0 : State.fastestAnswerTime,
            hotstreak: State.longestStreak,
            questionResults: questionResults,
            topicsToWorkOn: topicsToWorkOn,
            isAIQuiz: this.useCustomQuestions
        };
        
        console.log('Saving quiz results data:', resultsData);
        sessionStorage.setItem('quizResults', JSON.stringify(resultsData));
    },
    
    analyzeTopicsToWorkOn() {
        const incorrectQuestions = State.questionHistory.filter(item => 
            item.selectedAnswer !== item.question.correctAnswer
        );
        
        // Get the quiz topic from localStorage
        const quizTopic = localStorage.getItem('quizTopic');
        const topicsToWorkOn = [];

        if (incorrectQuestions.length > 0) {
            // Group incorrect questions by subtopics or concepts
            const concepts = incorrectQuestions.reduce((acc, q) => {
                // Extract key concepts from the question
                const questionText = q.question.question.toLowerCase();
                const words = questionText.split(' ')
                    .filter(word => word.length > 3) // Filter out small words
                    .filter(word => !['what', 'when', 'where', 'which', 'how', 'why', 'does', 'that'].includes(word));
                
                words.forEach(word => {
                    if (!acc[word]) acc[word] = 0;
                    acc[word]++;
                });
                return acc;
            }, {});

            // Find most common concepts
            const commonConcepts = Object.entries(concepts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([concept]) => concept);

            // Add main topic review
            topicsToWorkOn.push({
                name: `${quizTopic} Fundamentals`,
                description: `Review basic concepts of ${quizTopic} focusing on areas where you made mistakes.`
            });

            // Add specific concept reviews
            if (commonConcepts.length > 0) {
                topicsToWorkOn.push({
                    name: `${quizTopic} Concepts`,
                    description: `Focus on these specific concepts: ${commonConcepts.join(', ')}.`
                });
            }

            // Add practice suggestion
            topicsToWorkOn.push({
                name: `${quizTopic} Practice`,
                description: `Practice more ${quizTopic} questions, especially on topics you found challenging.`
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