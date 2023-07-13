const router = require('express').Router();
const Question = require('../../models/question');
const User = require('../../models/user');
const auth = require('../../middleware/auth');
const isAdmin = require('../../middleware/isAdmin');
const validator = require('express-validator');
const axios = require('axios');
const nodemailer = require('nodemailer');

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
            return res.status(200).json({
                success: true,
                data: newQuestion,
            });
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
                return res.status(200).json({ 
                    success: true,
                    data: question,
                });
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
                return res.status(200).json({
                    success: true,
                    data: question.testcases[question.testcases.length - 1],
                });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

// @route   DELETE api/questions/:id/testcase/:testcase_id
// @desc    Delete a testcase from a question
// @access  Private
router.delete('/:id/testcase/:testcase_id', auth, isAdmin, async (req, res) => {
    try {
        let question = await Question.findById(req.params.id);
        if (!question) {
            return res.status(404).json({ msg: 'Question not found' });
        } else if (!question.testcases.find(testcase => testcase._id.toString() === req.params.testcase_id)) {
            return res.status(404).json({ msg: 'Testcase not found' });
        } else {
            // Inactive the testcase
            const result = await axios.put(
                process.env.SPHERE_ENGINE_API_URL + 'problems/' + question.problemId + '/testcases/' + question.testcases.find(testcase => testcase._id.toString() === req.params.testcase_id).testId + '?access_token=' + process.env.SPHERE_ENGINE_ACCESS_TOKEN,
                {
                    active: false
                }
            );
            question.testcases = question.testcases.filter(testcase => testcase._id.toString() !== req.params.testcase_id)
            await question.save()
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
            let question = await Question.findById(req.params.id);
            if (!question) {
                return res.status(404).json({ msg: 'Question not found' });
            } else {
                // Find the compilerId
                const compilers = await axios.get(
                    process.env.SPHERE_ENGINE_API_URL + 'compilers?access_token=' + process.env.SPHERE_ENGINE_ACCESS_TOKEN,  
                );
                const { solution, language } = req.body
                // Equal Ignore Case
                const compilerId = compilers.data.items.find(compiler => compiler.name.toLowerCase() === language.toLowerCase()).id 
                // Use Sphere Engine API to submit solution
                const form = {
                    source: solution,
                    compilerId,
                    problemId: question.problemId
                };
                const result = await axios.post(
                    process.env.SPHERE_ENGINE_API_URL + 'submissions?access_token=' + process.env.SPHERE_ENGINE_ACCESS_TOKEN,
                    form
                );
                console.log(result.data)
                const timeLimit = question.timeLimit || 1
                // sleep for timeLimit seconds
                while(true){
                    await new Promise(resolve => setTimeout(resolve, timeLimit * 1000));
                    // Use Sphere Engine API to get submission
                    const submission = await axios.get(
                        process.env.SPHERE_ENGINE_API_URL + 'submissions/' + result.data.id + '?access_token=' + process.env.SPHERE_ENGINE_ACCESS_TOKEN,
                    );
                    console.log(submission.data.result.status)
                    if(submission.data.result.status.code > 7){
                        const transporter = nodemailer.createTransport({
                            service: 'gmail',
                            auth: {
                                user: process.env.EMAIL,
                                pass: process.env.EMAIL_PASSWORD
                            }
                        });
                        const mailOptions = {
                            from: process.env.EMAIL,
                            to: req.user.email,
                            subject: 'Solution submitted',
                            text: 'Your solution to question ' + question.title + ' has been submitted. Status: ' + submission.data.result.status.name + '(' + submission.data.result.status.code + ').'
                        };
                        transporter.sendMail(mailOptions, function (error, info) {
                            if (error) {
                                console.log('Error sending email');
                            } else {
                                console.log('Email sent: ' + info.response);
                            }
                        });
                        return res.status(200).json({ msg: 'Solution submitted', result: submission.data.result });
                    }
                }
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

// @route   GET api/questions/:id/submit/:submission_id
// @desc    Get a submission
// @access  Private
router.get('/:id/submit/:submission_id', auth, async (req, res) => {
    try {
        let question = await Question.findById(req.params.id);
        if (!question) {
            return res.status(404).json({ msg: 'Question not found' });
        } else {
            // Use Sphere Engine API to get submission
            const result = await axios.get(
                process.env.SPHERE_ENGINE_API_URL + 'submissions/' + req.params.submission_id + '?access_token=' + process.env.SPHERE_ENGINE_ACCESS_TOKEN,
            );
            console.log(result.data)
            return res.status(200).json({ msg: 'Submission retrieved' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});



module.exports = router;