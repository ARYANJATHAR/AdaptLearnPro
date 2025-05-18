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
            if (detailsSection.classList.contains('hidden')) {
                detailsSection.classList.remove('hidden');
                icon.classList.remove('fa-chevron-right');
                icon.classList.add('fa-chevron-down');
            } else {
                detailsSection.classList.add('hidden');
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-right');
            }
        });
    });
}

/**
 * Set up button click handlers
 */
function setupButtonHandlers() {
    // Retry quiz button
    const buttons = document.querySelectorAll('button');
    if (buttons.length >= 3) {
        // Retry Quiz (first button)
        buttons[buttons.length - 3].addEventListener('click', () => {
            window.location.href = './index.html';
        });
        
        // Similar Quiz (second button)
        buttons[buttons.length - 2].addEventListener('click', () => {
            alert('Similar quiz feature is coming soon!');
        });
        
        // New Quiz (third button)
        buttons[buttons.length - 1].addEventListener('click', () => {
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
    
    // Update score
    const scoreElements = document.querySelector('.text-6xl').children;
    if (scoreElements && scoreElements.length >= 2) {
        scoreElements[0].textContent = data.correct;
        scoreElements[1].textContent = `/${data.total}`;
    }
    
    // Update accuracy text
    const paragraphs = document.querySelectorAll('p');
    if (paragraphs.length > 0) {
        const resultParagraph = paragraphs[0]; 
        
        // Parse the HTML to retain structure but update values
        if (resultParagraph) {
            const correctSpan = resultParagraph.querySelector('span:nth-child(1)');
            const totalSpan = resultParagraph.querySelector('span:nth-child(2)');
            const percentSpan = resultParagraph.querySelector('span:nth-child(3)');
            
            if (correctSpan) correctSpan.textContent = data.correct;
            if (totalSpan) totalSpan.textContent = data.total;
            if (percentSpan) percentSpan.textContent = `${Math.round((data.correct / data.total) * 100)}%`;
        }
    }
    
    // Update indicators
    const indicatorContainer = document.querySelector('.flex.flex-wrap.justify-center.gap-2.mb-4');
    if (indicatorContainer && data.questionResults) {
        updateQuestionIndicators(data.questionResults, indicatorContainer);
    }
    
    // Update stats
    const statValues = document.querySelectorAll('.text-4xl.font-bold');
    if (statValues && statValues.length >= 3) {
        if (data.timeTaken) statValues[0].textContent = formatTime(data.timeTaken);
        if (data.fastestAnswer) statValues[1].textContent = `${data.fastestAnswer}s`;
        if (data.hotstreak) statValues[2].textContent = data.hotstreak;
    }
}

/**
 * Update question indicators based on results
 */
function updateQuestionIndicators(results, container) {
    if (!container) return;
    
    // Clear existing indicators
    container.innerHTML = '';
    
    // Create new indicators
    results.forEach(result => {
        const indicator = document.createElement('div');
        indicator.className = `w-8 h-8 ${result.correct ? 'bg-green-600' : 'bg-red-600'} rounded-md flex items-center justify-center text-white`;
        
        const icon = document.createElement('i');
        icon.className = result.correct ? 'fas fa-check' : 'fas fa-times';
        
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