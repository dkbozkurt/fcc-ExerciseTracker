const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
let bodyParser = require('body-parser');
let mongoose = require('mongoose');

// Connect to the database
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })

app.use('/',bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
	res.sendFile(__dirname + '/views/index.html')
});

// User Schema
const userSchema = new mongoose.Schema({
	username: {type:String, required:true}
});
let userModel = mongoose.model('user', userSchema);

app.post('/api/users', (req, res) => {
	let username = req.body.username;
	let newUser = userModel({username: username});

	newUser.save();
	res.json(newUser);
});

app.get('/api/users', (req, res) => {
	userModel.find({}).then(users => {
		res.json(users)
	})
})

const listener = app.listen(process.env.PORT || 3000, () => {
	console.log('Your app is listening on port ' + listener.address().port)
})
