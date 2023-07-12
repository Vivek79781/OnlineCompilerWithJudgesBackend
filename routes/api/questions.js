const router = require('express').Router();
const Question = require('../../models/question');
const User = require('../../models/user');
const auth = require('../../middleware/auth');
const isAdmin = require('../../middleware/isAdmin');
const validator = require('express-validator');
const axios = require('axios');

// @route   GET api/questions
// @desc    Get all questions
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const questions = await Question.find();
        return res.status(200).json({
            success: true,
            count: questions.length,
            data: questions,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST api/questions
// @desc    Create a question
// @access  Private
router.post('/',
    [
        validator.check('name', 'Name is required').not().isEmpty(),
        validator.check('description', 'Description is required').not().isEmpty(),
    ],
    auth, isAdmin, async (req, res) => {
        const errors = validator.validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const { name, description } = req.body
            const newQuestion = new Question({
                name,
                description,
            })
            // Use Sphere Engine API to add problem
            const form = {
                name,
                masterjudgeId: 1001,
                body: description,
                typeId: 1,
            };
            // console.log(process.env.SPHERE_ENGINE_API_URL + 'problems?access_token=' + process.env.SPHERE_ENGINE_ACCESS_TOKEN)
            const result = await axios.post(
                process.env.SPHERE_ENGINE_API_URL + 'problems?access_token=' + process.env.SPHERE_ENGINE_ACCESS_TOKEN,
                form
            );
            newQuestion.problemId = result.data.id;
            newQuestion.problemCode = result.data.code;
            await newQuestion.save()
            return res.status(200).json({ msg: 'Question created' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

// @route   PUT api/questions/:id
// @desc    Update a question
// @access  Private
router.put('/:id',
[
        validator.check('name', 'Name is required').not().isEmpty(),
        validator.check('description', 'Description is required').not().isEmpty(),
    ],
    auth, isAdmin, async (req, res) => {
        const errors = validator.validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            let question = await Question.findById(req.params.id);
            console.log(question)
            if (!question) {
                return res.status(404).json({ msg: 'Question not found' });
            } else {
                const { name, description } = req.body
                question.name = name
                question.description = description
                const form = {
                    name,
                    masterjudgeId: 1001,
                    body: description,
                    typeId: 1,
                };

                const result = await axios.put(
                    process.env.SPHERE_ENGINE_API_URL + 'problems/' + question.problemId + '?access_token=' + process.env.SPHERE_ENGINE_ACCESS_TOKEN,
                    form
                );
                await question.save()
                return res.status(200).json({ msg: 'Question updated' });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

// @route   DELETE api/questions/:id
// @desc    Delete a question
// @access  Private
router.delete('/:id', auth, isAdmin, async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) {
            return res.status(404).json({ msg: 'Question not found' });
        }
        console.log(process.env.SPHERE_ENGINE_API_URL + 'problems/' + question.problemId + '?access_token=' + process.env.SPHERE_ENGINE_ACCESS_TOKEN)
        const result = await axios.delete(
            process.env.SPHERE_ENGINE_API_URL + 'problems/' + question.problemId + '?access_token=' + process.env.SPHERE_ENGINE_ACCESS_TOKEN,
        );
        await Question.findByIdAndDelete(req.params.id);
        return res.status(200).json({ msg: 'Question removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET api/questions/:id
// @desc    Get a question
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) {
            return res.status(404).json({ msg: 'Question not found' });
        }
        return res.status(200).json(question);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST api/questions/:id/testcases
// @desc    Add a testcase to a question
// @access  Private
router.post('/:id/testcase',
    [
        validator.check('input', 'Input is required').not().isEmpty(),
        validator.check('output', 'Output is required').not().isEmpty(),
    ],
    auth, isAdmin, async (req, res) => {
        const errors = validator.validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            let question = await Question.findById(req.params.id);
            if (!question) {
                return res.status(404).json({ msg: 'Question not found' });
            } else {
                const { input, output } = req.body
                question.testcases.push({
                    input,
                    output
                })
                const form = {
                    input: input,
                    output: output,
                    timeLimit: question.timeLimit || 1,
                    judgeId: 1,
                };
                const result = await axios.post(
                    process.env.SPHERE_ENGINE_API_URL + 'problems/' + question.problemId + '/testcases?access_token=' + process.env.SPHERE_ENGINE_ACCESS_TOKEN,
                    form
                );
                console.log(result.data)
                question.testcases[question.testcases.length - 1].testId = result.data.number
                await question.save()
                return res.status(200).json({ msg: 'Testcase added' });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

// @route   DELETE api/questions/:id/testcases/:testcase_id
// @desc    Delete a testcase from a question
// @access  Private
router.delete('/:id/testcases/:testcase_id', auth, isAdmin, async (req, res) => {
    try {
        let Question = await Question.findById(req.params.id);
        if (!Question) {
            return res.status(404).json({ msg: 'Question not found' });
        } else {
            Question.testcases = Question.testcases.filter(testcase => testcase._id.toString() !== req.params.testcase_id)
            await Question.save()
            return res.status(200).json({ msg: 'Testcase removed' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST api/questions/:id/submit
// @desc    Submit a solution to a question
// @access  Private
router.post('/:id/submit',
    [
        validator.check('solution', 'Solution is required').not().isEmpty(),
        validator.check('language', 'Language is required').not().isEmpty(),
    ],
    auth, async (req, res) => {
        const errors = validator.validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            let Question = await Question.findById(req.params.id);
            if (!Question) {
                return res.status(404).json({ msg: 'Question not found' });
            } else {
                // Use Sphere Engine API to submit solution
                const { solution, language } = req.body
                const response = await axios.post('https://api.compilers.sphere-engine.com/api/v4/submissions?access_token=' + process.env.SPHERE_ENGINE_TOKEN, {
                    sourceCode: solution,
                    compilerId: language,
                    input: '',
                    priority: 1,
                    stdin: '',
                    stdout: '',
                    stderr: '',
                })
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }
);


module.exports = router;