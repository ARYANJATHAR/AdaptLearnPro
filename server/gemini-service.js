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
        
        console.log("Raw AI response received, proceeding to extract questions");
        
        // Try multiple approaches to extract JSON
        let questions;
        try {
            // First try: direct JSON parse of the entire response
            try {
                questions = JSON.parse(text);
                console.log("Successfully parsed response as JSON directly");
            } catch (e) {
                console.log("Direct JSON parse failed, trying to extract JSON array");
                // Second try: find JSON array pattern
                const jsonMatch = text.match(/\[\s*\{[^]*\}\s*\]/);
                if (jsonMatch) {
                    questions = JSON.parse(jsonMatch[0]);
                    console.log("Successfully extracted and parsed JSON array");
                } else {
                    console.log("JSON array pattern not found, looking for individual question objects");
                    // Third try: look for individual question objects
                    const questionMatches = text.match(/\{[^}]+\}/g);
                    if (questionMatches) {
                        questions = questionMatches.map(q => {
                            try {
                                return JSON.parse(q);
                            } catch (parseErr) {
                                console.warn(`Failed to parse question object: ${q}`);
                                return null;
                            }
                        }).filter(q => q !== null);
                        
                        console.log(`Found ${questions.length} individual question objects`);
                    } else {
                        console.error("Could not find valid JSON in response");
                        // Last resort: Try to create questions manually from the text
                        questions = tryManualExtraction(text);
                        
                        if (questions.length === 0) {
                            throw new Error('No valid JSON found in response');
                        }
                    }
                }
            }
            
            console.log(`Initial extraction yielded ${questions ? questions.length : 0} questions, preprocessing options...`);
            
            // Then in your generateQuizQuestions function, add this before validation:
            if (Array.isArray(questions)) {
                questions = preprocessQuestionOptions(questions);
            } else {
                console.error("Questions is not an array:", typeof questions);
                questions = [];
            }
            
            // If we failed to extract anything meaningful, provide fallback questions
            if (!questions || questions.length === 0) {
                console.warn("Failed to extract questions, using fallback questions");
                questions = generateFallbackQuestions(topic, difficulty, count);
            }
            
            // Log the processed questions for debugging
            console.log(`Processing ${questions.length} questions, validating format...`);
            
            // Validate the questions format
            const validQuestions = questions.filter(q => {
                try {
                    const isValid = (
                        q && typeof q === 'object' &&
                        q.question && 
                        typeof q.question === 'string' &&
                        Array.isArray(q.options) && 
                        q.options.length === 4 &&
                        q.options.every(opt => typeof opt === 'string') &&
                        typeof q.correctAnswer === 'number' &&
                        q.correctAnswer >= 0 && 
                        q.correctAnswer <= 3
                    );
                    
                    if (!isValid) {
                        const issues = [];
                        if (!q || typeof q !== 'object') issues.push("Question is not an object");
                        else {
                            if (!q.question) issues.push("Missing question field");
                            if (typeof q.question !== 'string') issues.push("Question is not a string");
                            if (!Array.isArray(q.options)) issues.push("Options is not an array");
                            if (!q.options || q.options.length !== 4) issues.push(`Options length is ${q.options?.length}`);
                            if (q.options && !q.options.every(opt => typeof opt === 'string')) issues.push("Not all options are strings");
                            if (typeof q.correctAnswer !== 'number') issues.push("CorrectAnswer is not a number");
                            if (q.correctAnswer < 0 || q.correctAnswer > 3) issues.push(`CorrectAnswer out of range: ${q.correctAnswer}`);
                        }
                        console.warn(`Invalid question format: ${issues.join(', ')}`);
                    }
                    
                    return isValid;
                } catch (e) {
                    console.error("Error validating question:", e);
                    return false;
                }
            });
            
            console.log(`Validation complete: ${validQuestions.length} valid questions out of ${questions.length}`);
            
            if (validQuestions.length === 0) {
                console.error('No valid questions found in response');
                // Use fallback questions if no valid questions are found
                const fallbackQuestions = generateFallbackQuestions(topic, difficulty, count);
                console.log(`Using ${fallbackQuestions.length} fallback questions`);
                return fallbackQuestions;
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
            
            // If we don't have enough questions, but have some valid ones, return what we have
            if (uniqueQuestions.length < count && uniqueQuestions.length > 0) {
                console.log(`Warning: Only generated ${uniqueQuestions.length} questions instead of requested ${count}`);
                return uniqueQuestions;
            }
            
            return uniqueQuestions.slice(0, count);
            
        } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
            console.error('Raw response:', text);
            // In case of a parsing error, still try to use fallback questions
            const fallbackQuestions = generateFallbackQuestions(topic, difficulty, count);
            console.log(`Using ${fallbackQuestions.length} fallback questions due to parsing error`);
            return fallbackQuestions;
        }
        
    } catch (error) {
        console.error('Error generating quiz questions:', error);
        // Final fallback in case of any other errors
        return generateFallbackQuestions(topic, difficulty, count);
    }
}

// Function to preprocess options that are improperly formatted
function preprocessQuestionOptions(questions) {
    return questions.map(question => {
        // Handle null or undefined options
        if (!question.options) {
            question.options = ["Option A", "Option B", "Option C", "Option D"];
            console.warn("Question had no options, added default options");
            return question;
        }
        
        // Check if options is a single string containing A:, B:, etc.
        if (question.options.length === 1) {
            const optionText = question.options[0];
            
            // Check if it's a typical A, B, C, D format
            if (optionText.includes('A:') || optionText.includes('A.') || 
                optionText.includes('\nA:') || optionText.includes('\nA.')) {
                
                const options = [];
                
                // More flexible regex to capture options with different formatting
                // This handles A:, A., B:, B., etc. with or without newlines
                const optionRegex = /(?:^|\n)([A-D][:.]\s*)(.*?)(?=(?:\n[A-D][:.]\s*)|$)/gs;
                let match;
                
                while ((match = optionRegex.exec(optionText)) !== null) {
                    // Extract just the text after the letter marker
                    options.push(match[2].trim());
                }
                
                // If we successfully extracted options
                if (options.length > 0) {
                    question.options = options;
                    console.log(`Split combined options into ${options.length} separate options`);
                    
                    // If we didn't get exactly 4 options, pad or trim
                    while (question.options.length < 4) {
                        question.options.push(`Option ${String.fromCharCode(65 + question.options.length)}`);
                    }
                    if (question.options.length > 4) {
                        question.options = question.options.slice(0, 4);
                    }
                }
            }
            
            // Handle cases where options might be in a single string but not with A, B, C, D markers
            else if (optionText.includes('\n')) {
                // Try splitting by newlines if there are at least 3 newlines
                const splitByNewline = optionText.split('\n').filter(line => line.trim().length > 0);
                if (splitByNewline.length >= 4) {
                    question.options = splitByNewline.slice(0, 4);
                    console.log("Split options by newlines");
                }
            }
        }
        
        // Final sanity check to ensure we have exactly 4 options
        if (!Array.isArray(question.options) || question.options.length !== 4) {
            console.warn(`Question has ${question.options?.length || 0} options, adjusting to 4...`);
            const existingOptions = Array.isArray(question.options) ? question.options : [];
            question.options = [];
            
            // Keep existing options
            for (let i = 0; i < Math.min(existingOptions.length, 4); i++) {
                question.options.push(existingOptions[i]);
            }
            
            // Add placeholder options if needed
            while (question.options.length < 4) {
                question.options.push(`Option ${String.fromCharCode(65 + question.options.length)}`);
            }
            
            // Trim if needed
            if (question.options.length > 4) {
                question.options = question.options.slice(0, 4);
            }
        }
        
        return question;
    });
}

// Function to try manual extraction of questions from text
function tryManualExtraction(text) {
    console.log("Attempting manual extraction of questions");
    const extractedQuestions = [];
    
    // Try to find question patterns
    const questionBlocks = text.split(/\n\s*\d+[\.\)]/);
    
    questionBlocks.forEach((block, index) => {
        if (block.trim().length === 0) return;
        
        // Try to extract a question
        const questionMatch = block.match(/.*\?/);
        if (!questionMatch) return;
        
        const questionText = questionMatch[0].trim();
        
        // Try to find options in the text after the question
        const optionsText = block.substr(questionMatch[0].length).trim();
        let options = [];
        
        // Look for A), B), etc. or A., B., etc.
        const optionMatches = optionsText.match(/[A-D][\.\)]\s*[^\n]*/g);
        if (optionMatches && optionMatches.length > 0) {
            options = optionMatches.map(o => o.replace(/^[A-D][\.\)]\s*/, '').trim());
        } else {
            // Just split by newlines if no option markers found
            options = optionsText.split('\n').filter(o => o.trim().length > 0).slice(0, 4);
        }
        
        // Ensure we have 4 options
        while (options.length < 4) {
            options.push(`Option ${String.fromCharCode(65 + options.length)}`);
        }
        if (options.length > 4) {
            options = options.slice(0, 4);
        }
        
        extractedQuestions.push({
            question: questionText,
            options: options,
            correctAnswer: 0 // Default to first option
        });
    });
    
    console.log(`Manual extraction found ${extractedQuestions.length} potential questions`);
    return extractedQuestions;
}

// Function to generate fallback questions when AI fails
function generateFallbackQuestions(topic, difficulty, count) {
    console.log(`Generating ${count} fallback questions for topic: ${topic}, difficulty: ${difficulty}`);
    
    // Generic questions for any topic
    const questions = [];
    
    // Generate appropriate fallback questions based on topic
    for (let i = 0; i < count; i++) {
        questions.push({
            question: `Question ${i+1} about ${topic}?`,
            options: [
                `Option A for question ${i+1}`,
                `Option B for question ${i+1}`,
                `Option C for question ${i+1}`,
                `Option D for question ${i+1}`
            ],
            correctAnswer: Math.floor(Math.random() * 4) // Random correct answer
        });
    }
    
    return questions;
}

module.exports = {
    generateQuizQuestions
}; 