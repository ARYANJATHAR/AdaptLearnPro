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
        
        // DO NOT override totalQuestions here for AI quiz - use the value set by AIQuizApp
        // Only set totalQuestions for the default quiz (non-AI)
        if (!this.useCustomQuestions) {
            State.totalQuestions = 10; // Only for default quiz
            console.log("[QUIZ DEBUG] Using default 10 questions for standard quiz");
        } else {
            console.log(`[QUIZ DEBUG] Using user-selected question count: ${State.totalQuestions}`);
        }
        
        // Reset question tracking
        State.questionHistory = [];
        State.currentQuestionIndex = -1;
        State.answeredQuestions = [];
        State.totalAttempted = 0;
        State.currentQuestion = null;
        
        // IMPORTANT: Explicitly reset streak counters when starting quiz
        State.correctStreak = 0;
        State.incorrectStreak = 0;
        
        console.log("[QUIZ DEBUG] Quiz initialized. Streaks reset. Current difficulty:", State.currentDifficulty);
        
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
                skipped: !State.answerSubmitted, // Track if question was skipped
                correctStreak: State.correctStreak, // Track streak with each question for debugging
                incorrectStreak: State.incorrectStreak
            };

            // Update or add to history
            if (State.currentQuestionIndex < State.questionHistory.length) {
                State.questionHistory[State.currentQuestionIndex] = currentState;
            } else {
                State.questionHistory.push(currentState);
            }
            
            // Only increment total attempted when moving to next question
            State.totalAttempted++;
            
            // CRITICAL FIX: Check if we've reached the total questions after incrementing totalAttempted
            // The critical bug is here - we need to check if we've *completed* all questions
            // We should only end after the user has answered ALL questions (not one less)
            if (State.totalAttempted > State.totalQuestions) {
                console.log(`[QUIZ DEBUG] Reached question limit (${State.totalAttempted}/${State.totalQuestions}). Ending quiz.`);
                this.endQuiz();
                return;
            }
            
            // If question was skipped without answering, reset streaks
            if (!State.answerSubmitted) {
                console.log("[QUIZ DEBUG] Question skipped. Resetting streaks.");
                State.correctStreak = 0;
                State.incorrectStreak = 0;
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
                
                // Make sure we restore streak state when reviewing old questions
                // to maintain proper progression logic
                if (nextQuestion.correctStreak !== undefined) {
                    State.correctStreak = nextQuestion.correctStreak;
                    console.log(`[QUIZ DEBUG] Restored correctStreak to ${State.correctStreak} from history`);
                }
                if (nextQuestion.incorrectStreak !== undefined) {
                    State.incorrectStreak = nextQuestion.incorrectStreak;
                    console.log(`[QUIZ DEBUG] Restored incorrectStreak to ${State.incorrectStreak} from history`);
                }

                // Don't override difficulty when reviewing questions
                // State.currentDifficulty = nextQuestion.difficulty;

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
                // DOUBLE-CHECK: Verify again we haven't reached the question limit
                // This should never happen here since we check above, but just in case
                // We need to fix this check too - we should only end after *completing* totalQuestions
                if (State.totalAttempted > State.totalQuestions) {
                    console.log(`[QUIZ DEBUG] Double-check: Reached question limit (${State.totalAttempted}/${State.totalQuestions}). Ending quiz.`);
                    this.endQuiz();
                    return;
                }
                
                // If we've answered exactly our total questions and are looking for the next one, end the quiz
                if (State.totalAttempted === State.totalQuestions) {
                    console.log(`[QUIZ DEBUG] Completed exact number of questions (${State.totalAttempted}/${State.totalQuestions}). Ending quiz.`);
                    this.endQuiz();
                    return;
                }
                
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
                
                // Log current state for debugging
                console.log(`[QUIZ DEBUG] Looking for questions at difficulty ${State.currentDifficulty}. Found ${availableQuestions.length} available.`);
                console.log(`[QUIZ DEBUG] Total attempted: ${State.totalAttempted}/${State.totalQuestions}`);
                
                // Check if we need to fetch more questions for current difficulty level
                if (availableQuestions.length < 3) {
                    // Log the issue for debugging
                    console.log(`[QUIZ DEBUG] Low on questions at difficulty ${State.currentDifficulty}. Only ${availableQuestions.length} left.`);
                    
                    // CRITICAL FIX: Don't change difficulty if we run out of questions
                    // Instead, continue with what we have even if it's just 1 question
                    if (availableQuestions.length === 0) {
                        // If we haven't reached the total count yet, don't end the quiz - find more questions
                        console.log(`[QUIZ DEBUG] No questions left at difficulty ${State.currentDifficulty}, but only ${State.totalAttempted}/${State.totalQuestions} attempted. Looking for alternatives...`);
                        
                        const currentDiff = State.currentDifficulty;
                        const availableDifficulties = [];
                        
                        // First try the current difficulty again (might have missed some)
                        if (questionSet[currentDiff] && questionSet[currentDiff].length > 0) {
                            availableDifficulties.push(currentDiff);
                        }
                        
                        // Then try lower difficulties (never higher)
                        for (let diff = currentDiff - 1; diff >= 1; diff--) {
                            if (questionSet[diff] && questionSet[diff].length > 0) {
                                availableDifficulties.push(diff);
                            }
                        }
                        
                        // If lower difficulties don't have questions, try higher ones as a last resort
                        if (availableDifficulties.length === 0) {
                            for (let diff = currentDiff + 1; diff <= 3; diff++) {
                                if (questionSet[diff] && questionSet[diff].length > 0) {
                                    availableDifficulties.push(diff);
                                }
                            }
                        }
                        
                        let foundQuestionsAtAnyLevel = false;
                        
                        for (const diff of availableDifficulties) {
                            availableQuestions = questionSet[diff].filter(
                                q => !State.answeredQuestions.includes(q.question)
                            );
                            
                            if (availableQuestions.length > 0) {
                                foundQuestionsAtAnyLevel = true;
                                if (diff !== currentDiff) {
                                    console.log(`[QUIZ DEBUG] Using questions from difficulty ${diff} to continue quiz`);
                                }
                                break;
                            }
                        }
                        
                        // Even after checking all difficulty levels, still no questions available
                        if (!foundQuestionsAtAnyLevel) {
                            // As absolute last resort, reuse answered questions
                            console.log(`[QUIZ DEBUG] No unused questions at any difficulty level. Allowing question reuse.`);
                            
                            // Try the current difficulty first
                            if (questionSet[currentDiff] && questionSet[currentDiff].length > 0) {
                                availableQuestions = questionSet[currentDiff];
                            }
                            // If still nothing, just use any difficulty level that has questions
                            else {
                                for (let diff = 1; diff <= 3; diff++) {
                                    if (questionSet[diff] && questionSet[diff].length > 0) {
                                        availableQuestions = questionSet[diff];
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
                
                // If still no questions or reached total questions, check for skipped before ending
                if (availableQuestions.length === 0) {
                    console.log(`[QUIZ DEBUG] Still no questions available after all checks. This is unusual.`);
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
                    
                    console.error(`[QUIZ DEBUG] Unable to find any questions, but only attempted ${State.totalAttempted}/${State.totalQuestions}. Quiz may be in an inconsistent state.`);
                    // If we can't find any questions, end the quiz
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
                
                // Log question selection for debugging
                console.log(`[QUIZ DEBUG] Selected question from difficulty ${State.currentDifficulty}. Q${State.totalAttempted+1}/${State.totalQuestions}`);
                
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
        
        // Create history item with current difficulty level
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
        
        if (isCorrect) {
            State.totalCorrect++;
            State.correctStreak++;
            State.incorrectStreak = 0; // Reset incorrect streak on correct answer
            
            // Debug logging
            console.log(`[QUIZ DEBUG] Correct Answer! Current streak: ${State.correctStreak}, Difficulty: ${State.currentDifficulty}`);
            
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
                
                // Check for difficulty increase - must be EXACTLY 3 correct in a row
                // Only increase difficulty if we're not reviewing previous questions
                if (State.correctStreak === 3 && 
                    State.currentQuestionIndex === State.questionHistory.length - 1) {
                    console.log(`[QUIZ DEBUG] Got exactly 3 in a row! Current difficulty: ${State.currentDifficulty}`);
                    
                    if (State.currentDifficulty === 1) {
                        State.currentDifficulty = 2; // Easy to Medium
                        // Reset streak when changing difficulty
                        State.correctStreak = 0;
                        State.incorrectStreak = 0;
                        State.highestDifficulty = Math.max(State.highestDifficulty, 2);
                        
                        console.log(`[QUIZ DEBUG] Level up! Moving to Medium (2). Streak reset to ${State.correctStreak}`);
                        
                        setTimeout(() => {
                            UI.showFeedback("Level Up! Moving to Medium difficulty", "bg-blue-500");
                        }, 1200);
                    } else if (State.currentDifficulty === 2) {
                        State.currentDifficulty = 3; // Medium to Hard
                        // Reset streak when changing difficulty
                        State.correctStreak = 0;
                        State.incorrectStreak = 0;
                        State.highestDifficulty = Math.max(State.highestDifficulty, 3);
                        
                        console.log(`[QUIZ DEBUG] Level up! Moving to Hard (3). Streak reset to ${State.correctStreak}`);
                        
                        setTimeout(() => {
                            UI.showFeedback("Level Up! Moving to Hard difficulty", "bg-blue-500");
                        }, 1200);
                    }
                }
                
                setTimeout(() => {
                    this.loadNextQuestion();
                }, 1800);
            }, 100);
        } else {
            State.totalIncorrect++;
            State.incorrectStreak++;
            
            // IMPORTANT: Reset correct streak on ANY wrong answer
            const oldStreak = State.correctStreak;
            State.correctStreak = 0;
            
            console.log(`[QUIZ DEBUG] Wrong Answer! Correct streak reset from ${oldStreak} to ${State.correctStreak}, Incorrect streak: ${State.incorrectStreak}`);
            
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
                
                // For Medium difficulty, go back to Easy after 3 wrong answers in a row
                if (State.incorrectStreak === 3) {
                    if (State.currentDifficulty === 2) {
                        State.currentDifficulty = 1; // Medium to Easy
                        State.correctStreak = 0;
                        State.incorrectStreak = 0; // Reset incorrect streak after level change
                        
                        console.log(`[QUIZ DEBUG] 3 wrong in a row! Moving back to Easy (1)`);
                        
                        setTimeout(() => {
                            UI.showFeedback("Moving back to Easy difficulty", "bg-blue-500");
                        }, 1200);
                    }
                    // For Hard difficulty, go back to Medium after 3 wrong answers in a row
                    else if (State.currentDifficulty === 3) {
                        State.currentDifficulty = 2; // Hard to Medium
                        State.correctStreak = 0;
                        State.incorrectStreak = 0; // Reset incorrect streak after level change
                        
                        console.log(`[QUIZ DEBUG] 3 wrong in a row! Moving back to Medium (2)`);
                        
                        setTimeout(() => {
                            UI.showFeedback("Moving back to Medium difficulty", "bg-blue-500");
                        }, 1200);
                    }
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