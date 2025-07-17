// Results page functionality

document.addEventListener('DOMContentLoaded', () => {
    // Setup UI interactions
    setupTopicToggles();
    setupButtonHandlers();
    
    // Load results data if available
    loadResultsData();
});

/**
 * Set up topic toggle functionality
 */
function setupTopicToggles() {
    const topicToggles = document.querySelectorAll('.topic-toggle');
    
    topicToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            // Find parent topic item
            const topicItem = toggle.closest('.bg-gray-50');
            const detailsSection = topicItem.querySelector('.topic-details');
            const icon = toggle.querySelector('i');
            
            // Toggle details visibility
            if (detailsSection) {
                if (detailsSection.classList.contains('hidden')) {
                    detailsSection.classList.remove('hidden');
                    icon.classList.remove('fa-chevron-right');
                    icon.classList.add('fa-chevron-down');
                } else {
                    detailsSection.classList.add('hidden');
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-right');
                }
            }
        });
    });
}

/**
 * Set up button click handlers
 */
function setupButtonHandlers() {
    // Get the action buttons
    const retryButton = document.querySelector('button.bg-indigo-600');
    const newQuizButton = document.querySelector('button.border-indigo-600');
    
    // Setup retry button
    if (retryButton) {
        retryButton.addEventListener('click', () => {
            // Get quiz type from results data
            const resultsData = sessionStorage.getItem('quizResults');
            let isAIQuiz = false;
            
            if (resultsData) {
                try {
                    const data = JSON.parse(resultsData);
                    isAIQuiz = data.isAIQuiz;
                } catch (error) {
                    console.error('Error parsing quiz results:', error);
                }
            }
            
            // Route based on quiz type
            if (isAIQuiz) {
                // For AI quiz, keep the topic and go back to ai-quiz.html
                window.location.href = './ai-quiz.html';
            } else {
                // For sample quiz, go back to index.html
                window.location.href = './index.html';
            }
        });
    }
    
    // Setup new quiz button
    if (newQuizButton) {
        newQuizButton.addEventListener('click', () => {
            // Clear any existing quiz topic and results when starting fresh
            localStorage.removeItem('quizTopic');
            sessionStorage.removeItem('quizResults');
            // Always go to home page for new quiz
            window.location.href = './home.html';
        });
    }
}

/**
 * Load and display results data from session storage
 */
function loadResultsData() {
    // Try to get results data from session storage
    const resultsData = sessionStorage.getItem('quizResults');
    
    if (resultsData) {
        try {
            const data = JSON.parse(resultsData);
            updateResultsUI(data);
        } catch (error) {
            console.error('Error parsing quiz results:', error);
        }
    } else {
        // If no data, we're using demo data already in the HTML
        console.log('No quiz results found in session storage, using demo data');
    }
}

/**
 * Update the UI with results data
 */
function updateResultsUI(data) {
    if (!data) return;
    
    console.log('Updating results UI with data:', data);
    
    // Update score
    const scoreElements = document.querySelector('.flex.justify-center.text-5xl.font-bold').children;
    if (scoreElements && scoreElements.length >= 2) {
        scoreElements[0].textContent = data.correct;
        scoreElements[1].textContent = `/${data.total}`;
    }
    
    // Update accuracy text
    const resultParagraph = document.querySelector('.text-gray-700.mb-3');
    if (resultParagraph) {
        const spans = resultParagraph.querySelectorAll('span');
        if (spans.length >= 3) {
            spans[0].textContent = data.correct;
            spans[1].textContent = data.total;
            spans[2].textContent = `${data.score}%`;
        }
        
        // Update the message based on score
        let message = '';
        if (data.score === 100) {
            message = 'Perfect score! You answered all questions correctly!';
        } else if (data.score >= 80) {
            message = 'Great job! You performed excellently!';
        } else if (data.score >= 60) {
            message = 'Good work! You\'re making progress!';
        } else {
            message = 'Keep practicing! You\'ll improve with time.';
        }
        
        resultParagraph.innerHTML = resultParagraph.innerHTML.replace(
            /Great job!.*?accuracy!/,
            message
        );
    }
    
    // Update indicators
    const indicatorContainer = document.getElementById('question-indicators');
    if (indicatorContainer && data.questionResults) {
        updateQuestionIndicators(data.questionResults, indicatorContainer);
    }
    
    // Update stats
    const statValues = document.querySelectorAll('.text-3xl.font-bold');
    if (statValues && statValues.length >= 2) {
        // Format time taken
        if (data.timeTaken) {
            const minutes = Math.floor(data.timeTaken / 60);
            const seconds = data.timeTaken % 60;
            statValues[0].textContent = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
        }
        
        // Format fastest answer
        if (data.fastestAnswer) {
            statValues[1].textContent = `${data.fastestAnswer}s`;
        }
    }

    // Update topics
    const topicsContainer = document.getElementById('topics-container');
    if (topicsContainer && data.topicsToWorkOn && data.topicsToWorkOn.length > 0) {
        // Clear existing topics
        topicsContainer.innerHTML = '';
        
        // Add each topic
        data.topicsToWorkOn.forEach((topic, index) => {
            const topicElement = document.createElement('div');
            topicElement.className = 'bg-gray-50 rounded-lg p-3';
            
            const topicHTML = `
                <div class="flex items-center">
                    <button class="topic-toggle mr-2 text-gray-400" data-topic-index="${index}">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                    <h3 class="text-sm font-medium">${topic.name}</h3>
                </div>
                <div class="topic-details ml-6 mt-2 hidden">
                    <p class="text-gray-600 text-sm">
                        ${topic.description}
                    </p>
                </div>
            `;
            
            topicElement.innerHTML = topicHTML;
            topicsContainer.appendChild(topicElement);
        });
        
        // Re-attach toggle listeners
        setupTopicToggles();
    } else if (topicsContainer) {
        // If no topics to work on, show a positive message
        topicsContainer.innerHTML = `
            <div class="bg-green-50 rounded-lg p-3">
                <p class="text-green-700 text-sm">
                    Great work! You've mastered all the topics in this quiz.
                </p>
            </div>
        `;
    }
}

/**
 * Update question indicators based on results
 */
function updateQuestionIndicators(results, container) {
    if (!container || !Array.isArray(results)) return;
    
    // Debug: Log the results array to check values
    console.log('Question Results for Indicators:', results);
    
    // Clear existing indicators
    container.innerHTML = '';
    
    // Filter out any undefined or null results
    const validResults = results.filter(result => result && typeof result.correct !== 'undefined');
    
    // Create new indicators only for valid results
    validResults.forEach((result, index) => {
        const indicator = document.createElement('div');
        
        // Check if the answer was correct
        const isCorrect = result.correct;
        
        // Debug: Log each result's correct status
        console.log(`Question ${index + 1} correct:`, isCorrect, result);
        
        indicator.className = `w-7 h-7 ${isCorrect ? 'bg-green-600' : 'bg-red-600'} rounded-md flex items-center justify-center text-white`;
        
        const icon = document.createElement('i');
        icon.className = `fas ${isCorrect ? 'fa-check' : 'fa-times'}`;
        
        indicator.appendChild(icon);
        container.appendChild(indicator);
    });
}

/**
 * Format time in seconds to minutes and seconds
 */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
        return `${remainingSeconds}s`;
    } else if (remainingSeconds === 0) {
        return `${minutes}m`;
    } else {
        return `${minutes}m ${remainingSeconds}s`;
    }
} 