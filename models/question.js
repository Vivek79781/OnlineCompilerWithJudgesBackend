const mongoose = require('mongoose');

// Coding Challenge Schema
const QuestionSchema = new mongoose.Schema({
    name: String,
    testcases: [
        {
            input: String,
            output: String,
            testId: String,
        }
    ],
    description: String,
    problemCode: String,
    problemId: String
});

const Question = mongoose.model('question', QuestionSchema);

module.exports = Question;