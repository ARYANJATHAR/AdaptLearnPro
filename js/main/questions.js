// Quiz Questions by difficulty level
const questions = {
    1: [ // Easy questions
        {
            question: "What is the capital of France?",
            options: ["London", "Berlin", "Paris", "Madrid"],
            correctAnswer: 2 // Index of correct answer (Paris)
        },
        {
            question: "Which planet is known as the Red Planet?",
            options: ["Earth", "Mars", "Jupiter", "Venus"],
            correctAnswer: 1
        },
        {
            question: "What is 2 + 3?",
            options: ["4", "5", "6", "7"],
            correctAnswer: 1
        },
        {
            question: "Which element has the chemical symbol 'O'?",
            options: ["Gold", "Iron", "Oxygen", "Silver"],
            correctAnswer: 2
        },
        {
            question: "How many sides does a triangle have?",
            options: ["2", "3", "4", "5"],
            correctAnswer: 1
        }
    ],
    2: [ // Medium questions
        {
            question: "Which scientist proposed the theory of relativity?",
            options: ["Isaac Newton", "Albert Einstein", "Galileo Galilei", "Stephen Hawking"],
            correctAnswer: 1
        },
        {
            question: "What is the square root of 144?",
            options: ["12", "14", "16", "18"],
            correctAnswer: 0
        },
        {
            question: "Which of these countries is NOT in Europe?",
            options: ["Poland", "Portugal", "Pakistan", "Norway"],
            correctAnswer: 2
        },
        {
            question: "What is the largest organ in the human body?",
            options: ["Heart", "Liver", "Brain", "Skin"],
            correctAnswer: 3
        },
        {
            question: "Which famous painting was created by Leonardo da Vinci?",
            options: ["Starry Night", "The Scream", "Mona Lisa", "Guernica"],
            correctAnswer: 2
        }
    ],
    3: [ // Hard questions
        {
            question: "Which of these is NOT a prime number?",
            options: ["17", "19", "21", "23"],
            correctAnswer: 2
        },
        {
            question: "What is the chemical symbol for Tungsten?",
            options: ["Tn", "Tu", "W", "Tg"],
            correctAnswer: 2
        },
        {
            question: "In which year did World War I begin?",
            options: ["1912", "1914", "1916", "1918"],
            correctAnswer: 1
        },
        {
            question: "Which of these languages is NOT Indo-European?",
            options: ["Spanish", "Persian", "Hungarian", "Greek"],
            correctAnswer: 2
        },
        {
            question: "What is the value of π (pi) to 4 decimal places?",
            options: ["3.1415", "3.1416", "3.1425", "3.1426"],
            correctAnswer: 0
        }
    ]
};

// Make questions available globally for the QuizLogic module
window.questions = questions;

// Also export for ES modules
export { questions }; 