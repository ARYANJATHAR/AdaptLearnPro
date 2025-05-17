// Initialize the app when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Quiz state variables
    let currentDifficulty = 1;
    let correctStreak = 0;
    let incorrectStreak = 0;
    let answeredQuestions = [];
    let currentQuestion = null;
    let totalQuestions = 10; // Set number of questions in the quiz
    let totalCorrect = 0;
    let totalIncorrect = 0;
    let totalAttempted = 0;
    let highestDifficulty = 1;
    let userSelections = []; // track user selections for review
    let questionHistory = []; // Store questions shown
    let selectedAnswerIndex = null;
    let answerSubmitted = false;
    
    // DOM Elements
    const questionContainer = document.getElementById('question-container');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const nextButton = document.getElementById('next-btn');
    const restartButton = document.getElementById('restart-btn');
    const restartFinalButton = document.getElementById('final-restart-btn');
    const solutionsButton = document.getElementById('solutions-btn');
    const solutionsContainer = document.getElementById('solutions-container');
    const solutionsList = document.getElementById('solutions-list');
    const resultsDiv = document.getElementById('results');
    const navigationDiv = document.getElementById('navigation');
    const difficultyLevel = document.getElementById('difficulty-level');
    const difficultyBadge = document.getElementById('difficulty-badge');
    const correctDisplay = document.getElementById('correct');
    const incorrectDisplay = document.getElementById('incorrect');
    const attemptedDisplay = document.getElementById('attempted');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const finalScoreDisplay = document.getElementById('final-score');
    const finalCorrectDisplay = document.getElementById('final-correct');
    const finalIncorrectDisplay = document.getElementById('final-incorrect');
    const highestDifficultyDisplay = document.getElementById('highest-difficulty');
    const feedbackMessage = document.getElementById('feedback-message');
    
    // Initialize the quiz
    function initQuiz() {
        currentDifficulty = 1;
        correctStreak = 0;
        incorrectStreak = 0;
        answeredQuestions = [];
        totalCorrect = 0;
        totalIncorrect = 0;
        totalAttempted = 0;
        highestDifficulty = 1;
        userSelections = [];
        questionHistory = [];
        
        updateStats();
        loadNextQuestion();
        resultsDiv.classList.add('hidden');
        navigationDiv.classList.remove('hidden');
    }
    
    // Load the next question
    function loadNextQuestion() {
        answerSubmitted = false;
        selectedAnswerIndex = null;
        
        // Apply fade out effect
        questionContainer.style.opacity = '0';
        
        setTimeout(() => {
            // Get available questions at current difficulty
            let availableQuestions = questions[currentDifficulty].filter(
                q => !answeredQuestions.includes(q.question)
            );
            
            // If no more questions at current difficulty, try other difficulties
            if (availableQuestions.length === 0) {
                const allDifficulties = Object.keys(questions).map(Number);
                for (const diff of allDifficulties) {
                    if (diff !== currentDifficulty) {
                        availableQuestions = questions[diff].filter(
                            q => !answeredQuestions.includes(q.question)
                        );
                        if (availableQuestions.length > 0) break;
                    }
                }
            }
            
            // If still no questions or reached total questions, end the quiz
            if (availableQuestions.length === 0 || totalAttempted >= totalQuestions) {
                endQuiz();
                return;
            }
            
            // Select a random question from available questions
            const randomIndex = Math.floor(Math.random() * availableQuestions.length);
            currentQuestion = availableQuestions[randomIndex];
            
            // Mark question as answered
            answeredQuestions.push(currentQuestion.question);
            
            // Update question display
            questionText.textContent = currentQuestion.question;
            optionsContainer.innerHTML = "";
            
            // Create option buttons
            currentQuestion.options.forEach((option, index) => {
                const optionButton = document.createElement('button');
                optionButton.className = "option-btn w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-all";
                optionButton.innerHTML = `
                    <span class="inline-block w-6 h-6 rounded-full mr-3 bg-gray-100 text-gray-700 text-sm flex items-center justify-center">${String.fromCharCode(65 + index)}</span>
                    <span>${option}</span>
                `;
                
                optionButton.addEventListener('click', () => selectAnswer(index, optionButton));
                optionsContainer.appendChild(optionButton);
            });
            
            // Apply fade in effect
            questionContainer.style.opacity = '1';
            questionContainer.classList.add('animate-fadeIn');
            
            // Update progress
            totalAttempted++;
            updateStats();
            
        }, 300); // Delay to match the fade out effect
    }
    
    // Handle answer selection
    function selectAnswer(index, button) {
        if (answerSubmitted) return;
        
        // Remove selection from all options
        const allOptions = optionsContainer.querySelectorAll('.option-btn');
        allOptions.forEach(opt => opt.classList.remove('selected'));
        
        // Mark the selected option
        button.classList.add('selected');
        selectedAnswerIndex = index;
        
        // Enable submit button if disabled
        nextButton.disabled = false;
        
        // Auto-submit after a short delay
        setTimeout(() => {
            submitAnswer();
        }, 500);
    }
    
    // Submit the selected answer
    function submitAnswer() {
        if (selectedAnswerIndex === null || answerSubmitted) return;
        
        answerSubmitted = true;
        const isCorrect = selectedAnswerIndex === currentQuestion.correctAnswer;
        
        // Track user's answer for review
        userSelections.push({
            question: currentQuestion.question,
            options: currentQuestion.options,
            correctAnswer: currentQuestion.correctAnswer,
            userAnswer: selectedAnswerIndex,
            isCorrect: isCorrect
        });
        
        // Store question in history
        questionHistory.push({
            question: currentQuestion,
            userAnswer: selectedAnswerIndex,
            isCorrect: isCorrect,
            difficulty: currentDifficulty
        });
        
        // Update streaks and difficulty
        if (isCorrect) {
            totalCorrect++;
            correctStreak++;
            incorrectStreak = 0;
            showFeedback("Correct!", "bg-green-500");
            
            // Apply correct styling
            const selectedOption = optionsContainer.querySelectorAll('.option-btn')[selectedAnswerIndex];
            selectedOption.classList.add('correct');
            selectedOption.classList.add('animate-pulse');
            
            // Increase difficulty after 3 correct answers in a row
            if (correctStreak >= 3 && currentDifficulty < 3) {
                currentDifficulty++;
                highestDifficulty = Math.max(highestDifficulty, currentDifficulty);
                correctStreak = 0;
                showFeedback("Level Up! Questions will get harder", "bg-blue-500");
            }
            // Auto-move to next question after a short delay
            setTimeout(() => {
                loadNextQuestion();
            }, 1000);
        } else {
            totalIncorrect++;
            incorrectStreak++;
            correctStreak = 0;
            showFeedback("Incorrect!", "bg-red-500");
            
            // Apply incorrect styling
            const selectedOption = optionsContainer.querySelectorAll('.option-btn')[selectedAnswerIndex];
            selectedOption.classList.add('incorrect');
            
            // Show correct answer
            const correctOption = optionsContainer.querySelectorAll('.option-btn')[currentQuestion.correctAnswer];
            correctOption.classList.add('correct');
            
            // Decrease difficulty after 2 incorrect answers in a row
            if (incorrectStreak >= 2 && currentDifficulty > 1) {
                currentDifficulty--;
                incorrectStreak = 0;
                showFeedback("Adjusting difficulty for better learning", "bg-blue-500");
            }
            // Auto-move to next question after a short delay
            setTimeout(() => {
                loadNextQuestion();
            }, 1000);
        }
        
        // Update stats display
        updateStats();
        
        // Enable next button
        nextButton.disabled = false;
        nextButton.focus();
    }
    
    // Show feedback message
    function showFeedback(message, bgClass) {
        feedbackMessage.textContent = message;
        feedbackMessage.className = `feedback-message px-6 py-3 rounded-lg shadow-lg text-white ${bgClass} show`;
        
        setTimeout(() => {
            feedbackMessage.classList.remove('show');
        }, 2000);
    }
    
    // Update stats display
    function updateStats() {
        correctDisplay.textContent = totalCorrect;
        incorrectDisplay.textContent = totalIncorrect;
        attemptedDisplay.textContent = totalAttempted;
        difficultyLevel.textContent = currentDifficulty;
        
        // Update difficulty badge
        difficultyBadge.className = `difficulty-badge difficulty-${currentDifficulty} text-white text-xs px-2 py-1 rounded`;
        difficultyBadge.textContent = currentDifficulty === 1 ? 'Easy' : 
                                     currentDifficulty === 2 ? 'Medium' : 'Hard';
        
        // Update progress
        progressBar.style.width = `${(totalAttempted / totalQuestions) * 100}%`;
        progressText.textContent = `Question ${totalAttempted} of ${totalQuestions}`;
    }
    
    // End the quiz
    function endQuiz() {
        // Hide question container and navigation
        navigationDiv.classList.add('hidden');
        
        // Calculate final score
        const score = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
        
        // Update results
        finalScoreDisplay.textContent = `${score}%`;
        finalCorrectDisplay.textContent = totalCorrect;
        finalIncorrectDisplay.textContent = totalIncorrect;
        highestDifficultyDisplay.textContent = highestDifficulty;
        
        // Show results view
        resultsDiv.classList.remove('hidden');
    }
    
    // Show solutions
    function showSolutions() {
        solutionsContainer.classList.remove('hidden');
        solutionsList.innerHTML = '';
        
        questionHistory.forEach((item, index) => {
            const solutionItem = document.createElement('div');
            solutionItem.className = `p-4 border border-gray-200 rounded-lg ${item.isCorrect ? 'bg-green-50' : 'bg-red-50'}`;
            
            const difficultyLabel = item.difficulty === 1 ? 'Easy' : 
                                   item.difficulty === 2 ? 'Medium' : 'Hard';
            
            const difficultyClass = item.difficulty === 1 ? 'bg-green-100 text-green-800' : 
                                   item.difficulty === 2 ? 'bg-yellow-100 text-yellow-800' : 
                                   'bg-red-100 text-red-800';
            
            solutionItem.innerHTML = `
                <div class="flex justify-between items-start mb-3">
                    <h4 class="font-medium">Question ${index + 1}</h4>
                    <span class="px-2 py-1 rounded-full text-xs ${difficultyClass}">${difficultyLabel}</span>
                </div>
                <p class="mb-3">${item.question.question}</p>
                <div class="space-y-2 mb-3">
                    ${item.question.options.map((opt, i) => `
                        <div class="flex items-center p-2 rounded ${
                            i === item.question.correctAnswer && i === item.userAnswer ? 'bg-green-100' :
                            i === item.question.correctAnswer ? 'bg-green-100' :
                            i === item.userAnswer ? 'bg-red-100' : 'bg-gray-50'
                        }">
                            <span class="inline-block w-6 h-6 rounded-full mr-2 
                                ${i === item.question.correctAnswer ? 'bg-green-200 text-green-800' : 
                                  i === item.userAnswer ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-600'} 
                                text-sm flex items-center justify-center">${String.fromCharCode(65 + i)}</span>
                            <span>${opt}</span>
                            ${i === item.question.correctAnswer ? 
                                '<span class="ml-auto"><i class="fas fa-check text-green-600"></i></span>' : 
                                i === item.userAnswer && i !== item.question.correctAnswer ? 
                                '<span class="ml-auto"><i class="fas fa-times text-red-600"></i></span>' : ''}
                        </div>
                    `).join('')}
                </div>
            `;
            
            solutionsList.appendChild(solutionItem);
        });
        
        // Change button text after showing solutions
        solutionsButton.innerHTML = '<i class="fas fa-eye-slash mr-2"></i><span>Hide Solutions</span>';
        solutionsButton.addEventListener('click', () => {
            if (solutionsContainer.classList.contains('hidden')) {
                showSolutions();
            } else {
                solutionsContainer.classList.add('hidden');
                solutionsButton.innerHTML = '<i class="fas fa-eye mr-2"></i><span>View Solutions</span>';
            }
        }, { once: true });
    }
    
    // Event Listeners
    nextButton.addEventListener('click', loadNextQuestion);
    
    restartButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to restart the quiz? Your progress will be lost.')) {
            initQuiz();
        }
    });
    
    restartFinalButton.addEventListener('click', initQuiz);
    
    solutionsButton.addEventListener('click', showSolutions);
    
    // Initialize the quiz when the page loads
    initQuiz();
}); 