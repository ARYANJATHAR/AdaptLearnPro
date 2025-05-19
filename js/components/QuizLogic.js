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
        console.log("Initializing quiz with useCustomQuestions:", this.useCustomQuestions);
        
        // Reset all state completely
        State.reset();
        
        // Explicitly set the total questions to 10 for the default quiz
        State.totalQuestions = 10;
        
        // Reset question tracking
        State.questionHistory = [];
        State.currentQuestionIndex = -1;
        State.answeredQuestions = [];
        State.totalAttempted = 0;
        State.currentQuestion = null;
        
        // Make sure quiz content is visible in the DOM
        const quizContent = document.getElementById('quiz-content');
        if (quizContent) {
            quizContent.classList.remove('hidden');
            // Make sure the quiz container has the correct difficulty class
            quizContent.className = quizContent.className.replace(/difficulty-level-\d/g, '');
            quizContent.classList.add(`difficulty-level-${State.currentDifficulty}`);
        }
        
        // Make sure question container is visible
        if (UI.questionContainer) {
            UI.questionContainer.style.display = 'block';
            UI.questionContainer.classList.remove('hidden');
            UI.questionContainer.style.opacity = '1';
            UI.questionContainer.style.height = 'auto';
            UI.questionContainer.style.overflow = 'visible';
            UI.questionContainer.style.margin = '';
            UI.questionContainer.style.padding = '1.5rem';
        }
        
        // Make sure question text is set to loading until we have a real question
        if (UI.questionText) {
            UI.questionText.textContent = 'Loading question...';
        }
        
        // Make sure options container is empty
        if (UI.optionsContainer) {
            UI.optionsContainer.innerHTML = '';
        }
        
        // Handle potential issues with custom questions
        if (this.useCustomQuestions && (!this.customQuestions || 
            !this.customQuestions[State.currentDifficulty] || 
            this.customQuestions[State.currentDifficulty].length === 0)) {
            console.warn("Custom questions were requested but not available, falling back to default questions");
            this.useCustomQuestions = false;
        }
        
        // Validate that we have questions to use
        if (this.useCustomQuestions) {
            const questionSet = this.customQuestions;
            let hasQuestions = false;
            
            for (let difficulty = 1; difficulty <= 3; difficulty++) {
                if (questionSet[difficulty] && questionSet[difficulty].length > 0) {
                    hasQuestions = true;
                    break;
                }
            }
            
            if (!hasQuestions) {
                console.error("No valid questions found in custom questions set");
                this.useCustomQuestions = false;
            }
        }
        
        // Ensure results are hidden and navigation is shown
        const resultsDiv = document.getElementById('results');
        if (resultsDiv) resultsDiv.classList.add('hidden');
        
        if (UI.navigationDiv) {
            UI.navigationDiv.classList.remove('hidden');
            UI.navigationDiv.style.display = 'flex';
        }
        
        // Update stats display to show zeros
        UI.updateStats();
        
        // Remove any existing "View Detailed Results" button
        const existingButton = document.getElementById('view-detailed-results-container');
        if (existingButton) {
            existingButton.remove();
        }
        
        console.log("Quiz initialization complete, loading first question...");
        
        // This loads the first question with a short delay to ensure UI updates first
        setTimeout(() => {
            this.loadNextQuestion();
        }, 200);
    },
    
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
            
            // Apply fade out effect
            UI.questionContainer.style.opacity = '0';
            
            setTimeout(() => {
                // Pass the previous answer data to renderQuestion
                UI.renderQuestion(State.currentQuestion, {
                    selectedAnswer: previousQuestion.selectedAnswer,
                    isSubmitted: previousQuestion.isSubmitted,
                    isCorrect: previousQuestion.selectedAnswer === previousQuestion.question.correctAnswer
                });
                UI.questionContainer.style.opacity = '1';
                
                // Update navigation buttons
                UI.updateNavigationButtons(
                    State.currentQuestionIndex > 0,
                    true
                );
                
                // Update progress
                UI.updateStats();
            }, 300);
        }
    },
    
    loadNextQuestion() {
        // Store current question state if it exists
        if (State.currentQuestion) {
            const currentState = {
                question: State.currentQuestion,
                selectedAnswer: State.selectedAnswerIndex,
                isSubmitted: State.answerSubmitted,
                difficulty: State.currentDifficulty,
                skipped: !State.answerSubmitted // Track if question was skipped
            };

            // Update or add to history
            if (State.currentQuestionIndex < State.questionHistory.length) {
                State.questionHistory[State.currentQuestionIndex] = currentState;
            } else {
                State.questionHistory.push(currentState);
            }
        }

        State.answerSubmitted = false;
        State.selectedAnswerIndex = null;
        
        // Start timing for the new question
        State.currentQuestionStartTime = Date.now();
        
        // Apply fade out effect
        UI.questionContainer.style.opacity = '0';
        
        setTimeout(() => {
            // If we're reviewing previous questions
            if (State.currentQuestionIndex < State.questionHistory.length - 1) {
                State.currentQuestionIndex++;
                const nextQuestion = State.questionHistory[State.currentQuestionIndex];
                State.currentQuestion = nextQuestion.question;
                State.answerSubmitted = nextQuestion.isSubmitted;
                State.selectedAnswerIndex = nextQuestion.selectedAnswer;
                State.currentDifficulty = nextQuestion.difficulty;

                UI.renderQuestion(State.currentQuestion, {
                    selectedAnswer: nextQuestion.selectedAnswer,
                    isSubmitted: nextQuestion.isSubmitted,
                    isCorrect: nextQuestion.selectedAnswer === nextQuestion.question.correctAnswer,
                    skipped: nextQuestion.skipped
                });
                UI.questionContainer.style.opacity = '1';
                UI.updateNavigationButtons(true, true);
                return;
            }

            try {
                // Get a new question
                const questionSet = this.useCustomQuestions ? this.customQuestions : questions;
                
                // Ensure we have a valid question set
                if (!questionSet || !questionSet[State.currentDifficulty] || questionSet[State.currentDifficulty].length === 0) {
                    console.error("No questions available at difficulty level:", State.currentDifficulty);
                    
                    // Try to find questions at any difficulty level
                    let foundQuestions = false;
                    for (let diff = 1; diff <= 3; diff++) {
                        if (questionSet[diff] && questionSet[diff].length > 0) {
                            console.log(`Found questions at difficulty level ${diff} instead`);
                            State.currentDifficulty = diff;
                            foundQuestions = true;
                            break;
                        }
                    }
                    
                    // If we still couldn't find questions, fallback to default
                    if (!foundQuestions) {
                        console.warn("No custom questions available at any difficulty level, falling back to default questions");
                        this.useCustomQuestions = false;
                        this.loadNextQuestion(); // Try again with default questions
                        return;
                    }
                }
                
                // Get available questions at current difficulty that haven't been answered yet
                let availableQuestions = questionSet[State.currentDifficulty].filter(
                    q => !State.answeredQuestions.includes(q.question)
                );
                
                // Check if we need to fetch more questions for current difficulty level
                if (availableQuestions.length < 3) {
                    // Instead of moving to a different difficulty, try to generate more questions
                    // This will be handled by the AIQuizApp's fetchAdditionalQuestions method
                    // For now, use the remaining questions or proceed with quiz
                    console.log(`Low on questions for difficulty ${State.currentDifficulty}. Remaining: ${availableQuestions.length}`);
                    
                    // If we have at least one question, continue with what we have
                    if (availableQuestions.length === 0) {
                        // If no more questions at current difficulty, check if we've reached total questions
                        if (State.totalAttempted >= State.totalQuestions) {
                            this.endQuiz();
                            return;
                        }
                        
                        // Try to use questions from other difficulties as a last resort
                        const allDifficulties = Object.keys(questionSet).map(Number);
                        for (const diff of allDifficulties) {
                            if (diff !== State.currentDifficulty && questionSet[diff]) {
                                availableQuestions = questionSet[diff].filter(
                                    q => !State.answeredQuestions.includes(q.question)
                                );
                                if (availableQuestions.length > 0) {
                                    console.log(`Using questions from difficulty ${diff} since no more available at level ${State.currentDifficulty}`);
                                    State.currentDifficulty = diff;
                                    break;
                                }
                            }
                        }
                    }
                }
                
                // If still no questions or reached total questions, check for skipped before ending
                if (availableQuestions.length === 0 || State.totalAttempted >= State.totalQuestions) {
                    // Check for skipped questions before ending
                    const skippedQuestions = State.questionHistory.filter(q => q.skipped);
                    if (skippedQuestions.length > 0) {
                        // Go back to the first skipped question
                        State.currentQuestionIndex = State.questionHistory.findIndex(q => q.skipped);
                        const skippedQuestion = State.questionHistory[State.currentQuestionIndex];
                        State.currentQuestion = skippedQuestion.question;
                        State.answerSubmitted = false;
                        State.selectedAnswerIndex = null;
                        State.currentDifficulty = skippedQuestion.difficulty;

                        UI.renderQuestion(State.currentQuestion);
                        UI.questionContainer.style.opacity = '1';
                        UI.updateNavigationButtons(true, true);
                        
                        // Show feedback about skipped questions
                        UI.showFeedback("You have some unanswered questions!", "bg-blue-500");
                        return;
                    }
                    
                    this.endQuiz();
                    return;
                }
                
                // Properly randomize question selection - Fisher-Yates shuffle algorithm
                for (let i = availableQuestions.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [availableQuestions[i], availableQuestions[j]] = [availableQuestions[j], availableQuestions[i]];
                }
                
                // Select the first question after randomization
                State.currentQuestion = availableQuestions[0];
                
                // Sanity check the question object
                if (!State.currentQuestion || typeof State.currentQuestion !== 'object') {
                    console.error("Invalid question object:", State.currentQuestion);
                    throw new Error("Invalid question format");
                }
                
                State.answeredQuestions.push(State.currentQuestion.question);
                
                // Validate the question object has all required properties
                if (!State.currentQuestion.question || !State.currentQuestion.options) {
                    console.error("Invalid question format:", State.currentQuestion);
                    throw new Error("Question missing required properties");
                }
                
                // Move to next question index
                State.currentQuestionIndex++;
                
                console.log("Loading question:", State.currentQuestion.question);
                
                // Render the question
                UI.renderQuestion(State.currentQuestion);
                UI.questionContainer.style.opacity = '1';
                
                // Update progress
                State.totalAttempted++;
                UI.updateStats();
                
                // Show back button after first question
                UI.updateNavigationButtons(State.currentQuestionIndex > 0, true);
            } catch (error) {
                console.error("Error loading next question:", error);
                
                // Show error to user
                UI.questionText.textContent = "Error loading question. Please try again.";
                UI.optionsContainer.innerHTML = `
                    <div class="p-4 bg-red-100 rounded-lg text-red-700">
                        <p>There was a problem loading the next question. Please try clicking Next to continue.</p>
                    </div>
                `;
                UI.questionContainer.style.opacity = '1';
                
                // Make sure navigation is enabled
                UI.nextButton.disabled = false;
                UI.updateNavigationButtons(State.currentQuestionIndex > 0, true);
            }
        }, 300);
    },
    
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
        
        // Create history item
        const historyItem = {
            question: State.currentQuestion,
            selectedAnswer: State.selectedAnswerIndex,
            isSubmitted: true,
            isCorrect: isCorrect,
            difficulty: State.currentDifficulty,
            answerTime: answerTime
        };

        // Update or add to history
        if (State.currentQuestionIndex < State.questionHistory.length) {
            State.questionHistory[State.currentQuestionIndex] = historyItem;
        } else {
            State.questionHistory.push(historyItem);
        }

        // First apply styling to options
        const selectedOption = UI.optionsContainer.querySelectorAll('.option-btn')[State.selectedAnswerIndex];
        
        // Update streaks and difficulty
        if (isCorrect) {
            State.totalCorrect++;
            State.correctStreak++;
            State.incorrectStreak = 0;
            
            // Track the longest correct streak
            State.longestStreak = Math.max(State.longestStreak, State.correctStreak);
            
            // Play correct sound
            AudioManager.playCorrect();
            
            // Apply correct styling
            selectedOption.classList.add('correct');
            selectedOption.classList.add('animate-pulse');
            
            // Show feedback and move to next question
            setTimeout(() => {
                UI.showFeedback("Correct!", "bg-green-500");
                
                // Level up after 3 correct answers
                if (State.correctStreak >= 3 && State.currentDifficulty < 3) {
                    State.currentDifficulty++;
                    State.highestDifficulty = Math.max(State.highestDifficulty, State.currentDifficulty);
                    State.correctStreak = 0;
                    
                    setTimeout(() => {
                        UI.showFeedback("Level Up! Questions will get harder", "bg-blue-500");
                    }, 1200);
                }
                
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
            
            // Show feedback and move to next question
            setTimeout(() => {
                UI.showFeedback("Incorrect!", "bg-red-500");
                
                // Instead of going down a level, just stay at current level
                // Level only decreases after multiple incorrect answers in a row
                if (State.incorrectStreak >= 3 && State.currentDifficulty > 1) {
                    State.currentDifficulty--;
                    State.incorrectStreak = 0;
                    
                    setTimeout(() => {
                        UI.showFeedback("Adjusting difficulty to help your learning", "bg-blue-500");
                    }, 1200);
                }
                
                setTimeout(() => {
                    this.loadNextQuestion();
                }, 1800);
            }, 100);
        }
        
        // Update stats display
        UI.updateStats();
    },
    
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
        // Calculate stats and add debug logging
        console.log('Saving quiz results. Question history:', State.questionHistory);
        
        const questionResults = State.questionHistory.map(item => {
            // Debug log for each history item
            console.log('Processing history item:', item);
            
            // Check if the answer was correct
            const wasCorrect = item.selectedAnswer === item.question.correctAnswer;
            console.log(`Question "${item.question.question}" - Selected: ${item.selectedAnswer}, Correct: ${item.question.correctAnswer}, Was Correct: ${wasCorrect}`);
            
            return {
                question: item.question.question,
                correct: wasCorrect,  // Calculate correctness here instead of using isCorrect
                difficulty: item.difficulty,
                answerTime: item.answerTime
            };
        });

        // Store quiz type
        const isAIQuiz = this.useCustomQuestions;
        
        // Find topics to work on based on incorrect answers
        const incorrectQuestions = State.questionHistory.filter(item => !item.isCorrect);
        const topicsToWorkOn = [];

        // Helper function to add a topic if questions match certain keywords
        const addTopicIfRelevant = (questions, keywords, topicName, description) => {
            const hasRelevantQuestions = questions.some(q => 
                keywords.some(keyword => q.question.question.toLowerCase().includes(keyword))
            );
            if (hasRelevantQuestions) {
                topicsToWorkOn.push({ name: topicName, description });
            }
        };

        // Basic Knowledge
        addTopicIfRelevant(
            incorrectQuestions,
            ['capital', '2 + 2', 'largest ocean'],
            "Basic Facts & Geography",
            "Review basic geography, simple mathematics, and general knowledge questions."
        );

        // Literature & Arts
        addTopicIfRelevant(
            incorrectQuestions,
            ['wrote', 'romeo', 'shakespeare'],
            "Literature & Arts",
            "Focus on famous authors, classic literature, and artistic works."
        );

        // Science & Space
        addTopicIfRelevant(
            incorrectQuestions,
            ['planet', 'sun', 'mercury', 'venus'],
            "Astronomy & Space",
            "Study the solar system, planets, and their characteristics."
        );

        // Physics & Scientific Theory
        addTopicIfRelevant(
            incorrectQuestions,
            ['scientist', 'einstein', 'theory', 'quantum', 'uncertainty'],
            "Physics & Scientific Theory",
            "Review important scientific theories, quantum mechanics, and famous scientists."
        );

        // Chemistry
        addTopicIfRelevant(
            incorrectQuestions,
            ['element', 'chemical', 'symbol', 'potassium'],
            "Chemistry",
            "Study chemical elements, their symbols, and basic chemistry concepts."
        );

        // Mathematics & Algorithms
        addTopicIfRelevant(
            incorrectQuestions,
            ['square root', 'sorting', 'algorithm'],
            "Mathematics & Computer Science",
            "Practice mathematical calculations and algorithmic concepts."
        );

        // History
        addTopicIfRelevant(
            incorrectQuestions,
            ['war', 'world war', '1945', '1957', 'sputnik'],
            "Historical Events",
            "Review important historical dates, events, and their significance."
        );

        // Physics Forces
        addTopicIfRelevant(
            incorrectQuestions,
            ['force', 'gravity', 'electromagnetic'],
            "Physics Forces",
            "Study fundamental forces in physics and their applications."
        );

        // If no specific topics identified but there are incorrect answers
        if (topicsToWorkOn.length === 0 && incorrectQuestions.length > 0) {
            const question = incorrectQuestions[0].question.question;
            topicsToWorkOn.push({
                name: "Question Review",
                description: `Review this question: "${question}"`
            });
        }
        
        // Calculate hotstreak - now track it directly from State
        const maxStreak = State.longestStreak || 0;
        
        // Create results data object
        const resultsData = {
            total: State.totalAttempted,
            correct: State.totalCorrect,
            incorrect: State.totalIncorrect,
            score: Math.round((State.totalCorrect / State.totalAttempted) * 100),
            highestDifficulty: State.highestDifficulty,
            timeTaken: State.totalQuizTime,
            fastestAnswer: State.fastestAnswerTime === Infinity ? 0 : State.fastestAnswerTime,
            hotstreak: maxStreak,
            questionResults: questionResults,
            topicsToWorkOn: topicsToWorkOn,
            isAIQuiz: isAIQuiz
        };
        
        // Store in session storage
        sessionStorage.setItem('quizResults', JSON.stringify(resultsData));
    }
}; 