const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
let bodyParser = require('body-parser');
let mongoose = require('mongoose');

// Connect to the database
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })

app.use('/', bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
	res.sendFile(__dirname + '/views/index.html')
});

// User Schema
const userSchema = new mongoose.Schema({
	username: { type: String, required: true }
});
let userModel = mongoose.model('user', userSchema);

const exerciseSchema = new mongoose.Schema({
	userId: { type: String, required: true },
	description: { type: String, required: true },
	duration: { type: Number, required: true },
	date: { type: Date, default: new Date() }
})
let exerciseModel = mongoose.model('exercise', exerciseSchema);

app.post('/api/users', (req, res) => {
	let username = req.body.username;
	let newUser = userModel({ username: username });

	newUser.save();
	res.json(newUser);
});

app.get('/api/users', (req, res) => {
	userModel.find({}).then(users => {
		res.json(users)
	})
})

app.post('/api/users/:_id/exercises', (req, res) => {
	let userId = req.params._id;
	let exerciseObj = {
		userId: userId,
		description: req.body.description,
		duration: req.body.duration,
	}
	if (req.body.date != '') {
		exerciseObj.date = req.body.date
	}

	let newExercise = new exerciseModel(exerciseObj);

	userModel.findById(userId)
		.then(userFound => {
			if (!userFound) {
				res.status(404).json({ error: 'User not found' });
			}
			newExercise.save();
			res.json({
				_id: userFound._id,
				username: userFound.username,
				description: newExercise.description,
				duration: newExercise.duration,
				date: newExercise.date.toDateString()
			});
		})
		.catch(err => console.log(err));
})

app.get('/api/users/:_id/logs', (req, res) => {
	let userId = req.params._id;

	let responseObj = {};

	let limitParam = req.query.limit;
	let toParam = req.query.to;
	let fromParam = req.query.from;

	limitParam = limitParam ? parseInt(limitParam) : limitParam;

	let queryObj = { userId: userId }

	if (fromParam || toParam) {
		queryObj.date = {};
		if (fromParam) {
			queryObj.date['$gte'] = fromParam;
		}
		if (toParam) {
			queryObj.date['$lte'] = toParam;
		}
	}

	userModel.findById(userId)
		.then(userFound => {
			if (!userFound) {
				res.status(404).json({ error: 'User not found' });
			}

			let username = userFound.username;
			let userId = userFound._id;

			responseObj = {
				_id: userId,
				username: username
			}

			exerciseModel.find(queryObj).limit(limitParam)
				.then((exercises) => {

					exercises = exercises.map(exercise => {
						return {
							description: exercise.description,
							duration: exercise.duration,
							date: exercise.date.toDateString()
						}
					});

					responseObj.log = exercises;
					responseObj.count = exercises.length;
					res.json(responseObj);
				}).catch(err => console.log(err));
		})
		.catch(err => console.log(err));
});

const listener = app.listen(process.env.PORT || 3000, () => {
	console.log('Your app is listening on port ' + listener.address().port)
})
