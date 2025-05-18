const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize the model
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",  // Fast, good for most tasks
    generationConfig: {
        temperature: 0.7,       // Controls randomness (0.0-1.0)
        topK: 3,                // Increased for more diversity
        topP: 0.9,              // Slightly reduced for better balance
        maxOutputTokens: 2048,  // Maximum length of response
    },
});

/**
 * Generate quiz questions based on a topic
 * @param {string} topic - The quiz topic
 * @param {number} difficulty - Difficulty level (1-3)
 * @param {number} count - Number of questions to generate
 * @returns {Promise<Array>} - Array of question objects
 */
async function generateQuizQuestions(topic, difficulty = 1, count = 5) {
    try {
        const difficultyLabels = {
            1: 'easy',
            2: 'medium',
            3: 'hard'
        };

        const difficultyLevel = difficultyLabels[difficulty] || 'medium';
        
        // Define specific guidelines for different difficulty levels
        const difficultyGuidelines = {
            easy: 'basic facts, simple concepts, and straightforward questions that test fundamental knowledge. Use simple language and obvious answer choices.',
            medium: 'intermediate concepts that bridge between basic and advanced knowledge. Questions should be moderately challenging but still approachable for someone with some familiarity with the topic. Avoid overly complex terminology.',
            hard: 'advanced concepts, complex relationships, and questions requiring deep understanding or analysis. These should challenge even knowledgeable users.'
        };
        
        // Define specific examples for each difficulty level
        const difficultyExamples = {
            easy: [
                {
                    question: "What is the capital of France?",
                    options: ["London", "Berlin", "Paris", "Madrid"],
                    correctAnswer: 2
                },
                {
                    question: "Which planet is closest to the Sun?",
                    options: ["Earth", "Mars", "Venus", "Mercury"],
                    correctAnswer: 3
                }
            ],
            medium: [
                {
                    question: "Which scientist is known for both the theory of relativity and the photoelectric effect?",
                    options: ["Isaac Newton", "Albert Einstein", "Niels Bohr", "Marie Curie"],
                    correctAnswer: 1
                },
                {
                    question: "Which element has the chemical symbol 'K'?",
                    options: ["Krypton", "Potassium", "Calcium", "Copper"],
                    correctAnswer: 1
                }
            ],
            hard: [
                {
                    question: "In quantum mechanics, what principle states that you cannot simultaneously know both the position and momentum of a particle with perfect precision?",
                    options: ["Pauli Exclusion Principle", "Heisenberg Uncertainty Principle", "Conservation of Energy", "Einstein's Equivalence Principle"],
                    correctAnswer: 1
                },
                {
                    question: "Which of these sorting algorithms has the best average-case time complexity?",
                    options: ["Bubble Sort - O(n²)", "Quick Sort - O(n log n)", "Selection Sort - O(n²)", "Insertion Sort - O(n²)"],
                    correctAnswer: 1
                }
            ]
        };

        // Add random seed to ensure variety in question generation
        const randomSeed = Math.floor(Math.random() * 10000);

        // Create the prompt for the AI with more explicit difficulty guidance
        const prompt = `Generate ${count} unique multiple-choice ${difficultyLevel} quiz questions about "${topic}".

        RANDOM_SEED: ${randomSeed} (Use this to generate diverse questions)
        
        DIFFICULTY LEVEL: ${difficultyLevel.toUpperCase()}
        
        At this level, focus on ${difficultyGuidelines[difficultyLevel]}
        
        For each question:
        1. Create a clear, concise question appropriate for ${difficultyLevel} difficulty
        2. Make sure all questions are DIFFERENT from each other
        3. Cover different aspects of the topic to ensure diversity
        4. Provide exactly 4 options (labeled A, B, C, D)
        5. Make sure exactly one option is correct
        6. Indicate which option is correct (0 for A, 1 for B, 2 for C, 3 for D)
        
        Here are examples of ${difficultyLevel} difficulty questions to follow as a guide:
        ${JSON.stringify(difficultyExamples[difficultyLevel], null, 2)}
        
        Format the response as a valid JSON array where each question is an object with:
        - "question": the question text
        - "options": array of 4 answer choices as strings
        - "correctAnswer": index of correct answer (0-3)
        
        IMPORTANT: 
        - Questions must be at ${difficultyLevel} difficulty - not easier, not harder
        - Ensure all questions are unique and cover different aspects of the topic
        - For medium questions, they should be more challenging than easy questions but still approachable`;

        // Generate content
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Extract JSON from the response
        const jsonMatch = text.match(/\[\s*\{.*\}\s*\]/s);
        if (!jsonMatch) {
            console.error('AI response did not contain valid JSON. Raw response:', text);
            throw new Error('Unable to parse quiz questions from AI response');
        }
        
        try {
            // Parse and return the questions
            const questions = JSON.parse(jsonMatch[0]);
            
            // Validate the questions format
            const validQuestions = questions.filter(q => 
                q.question && 
                Array.isArray(q.options) && 
                q.options.length === 4 &&
                typeof q.correctAnswer === 'number' &&
                q.correctAnswer >= 0 && 
                q.correctAnswer <= 3
            );
            
            if (validQuestions.length === 0) {
                throw new Error('No valid questions generated');
            }
            
            // Check for duplicate questions
            const questionTexts = new Set();
            const uniqueQuestions = validQuestions.filter(q => {
                // Normalize the question text for comparison
                const normalizedText = q.question.toLowerCase().trim();
                if (questionTexts.has(normalizedText)) {
                    return false;
                }
                questionTexts.add(normalizedText);
                return true;
            });
            
            console.log(`Generated ${uniqueQuestions.length} unique questions (filtered from ${validQuestions.length})`);
            
            return uniqueQuestions;
            
        } catch (parseError) {
            console.error('Error parsing JSON from AI response:', parseError);
            throw new Error('Failed to parse question data from AI response');
        }
        
    } catch (error) {
        console.error('Error generating quiz questions:', error);
        throw error;
    }
}

module.exports = {
    generateQuizQuestions
}; 