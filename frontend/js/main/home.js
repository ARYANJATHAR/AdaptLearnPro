document.addEventListener('DOMContentLoaded', () => {
    const topicInput = document.getElementById('topic-input');
    const generateBtn = document.getElementById('generate-quiz-btn');
    const questionCountBtns = document.querySelectorAll('.question-count-btn');
    
    // Default question count
    let selectedQuestionCount = 10;

    // Handle topic input
    topicInput.addEventListener('input', () => {
        // Update button state
        updateGenerateButtonState();
    });
    
    // Handle question count selection
    questionCountBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove selected class from all buttons
            questionCountBtns.forEach(b => b.classList.remove('selected'));
            
            // Add selected class to clicked button
            btn.classList.add('selected');
            
            // Update selected count
            selectedQuestionCount = parseInt(btn.dataset.count);
            
            // Show selection animation
            animateSelection(btn);
        });
    });
    
    // Animate selection of count button
    function animateSelection(btn) {
        // Add and remove animation class
        btn.classList.add('pulse-animation');
        setTimeout(() => {
            btn.classList.remove('pulse-animation');
        }, 300);
    }

    // Update generate button state based on input
    function updateGenerateButtonState() {
        const hasTopic = topicInput.value.trim() !== '';
        generateBtn.disabled = !hasTopic;

        // Update button opacity based on state
        if (hasTopic) {
            generateBtn.classList.remove('opacity-50');
        } else {
            generateBtn.classList.add('opacity-50');
        }
    }

    // Handle generate button click
    generateBtn.addEventListener('click', () => {
        // If button is disabled, don't process
        if (generateBtn.disabled) return;
        
        const topic = topicInput.value.trim();
        
        if (!topic) {
            // Show error if somehow the button is clicked without a topic
            console.error('No topic provided');
            return;
        }
        
        // Add loading spinner
        generateBtn.innerHTML = '<span>Generating Quiz</span><i class="fas fa-spinner loading-spinner" style="display: inline-block;"></i>';
        generateBtn.disabled = true;
        
        // Store the topic and question count in localStorage to be used in the quiz
        localStorage.setItem('quizTopic', topic);
        localStorage.setItem('questionCount', selectedQuestionCount);
        
        // Redirect to AI quiz page after a short delay
        setTimeout(() => {
            window.location.href = './ai-quiz.html';
        }, 2000);
    });

    // Initialize button state
    updateGenerateButtonState();
}); 