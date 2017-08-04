const {BasicStrategy} = require('passport-http');
const express = require('express');
const jsonParser = require('body-parser').json();
const passport = require('passport');
const moment = require('moment');
const cors = require('cors');
const axios = require('axios');
const {parseString} = require ('xml2js');

const {User} = require('./users/models');
const {Discussion} = require('./discussions/models');
const {Comment} = require('./comments/models');
const {CLIENT_URL} = require('./config');
const MEMBER_URL = 'https://jasonlaning.github.io/test-repo';

const router = express.Router();

router.use(jsonParser);

router.use(cors({credentials: true, origin: [CLIENT_URL, MEMBER_URL]}));

const basicStrategy = new BasicStrategy((username, password, callback) => {
	let user;
	User
		.findOne({username: username})
		.exec()
		.then(_user => {
			user = _user;
			if (!user) {
				return callback(null, false, {message: 'Incorrect username'});
			}
			return user.validatePassword(password);
		})
		.then(isValid => {
			if (!isValid) {
				return callback(null, false, {message: 'Incorrect password'});
			}
			else {
				return callback(null, user);
			}
		})
		.catch(err => console.log('Invalid username or password'))
});

router.use(require('express-session')({ 
  secret: 'something something',
  resave: false,
  saveUninitialized: false 
}));

passport.use(basicStrategy);
router.use(passport.initialize());
router.use(passport.session());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

function loggedIn(req, res, next) {
	if (req.user) {
		next();
	} else {
		res.status(400).json({message: 'Please sign in'});
	}
}

router.get('/search', (req, res, next) => {
	axios.get('http://www.nyartbeat.com/list/event_free.en.xml')
		.then(_res => {
			parseString(_res.data, (err, result) => {
				if (err) {
					throw new Error(err);
				} else {
				res.json({result})
				}
			})
		})
		.catch(err => {
			res.status(500).json({message: `Internal server error ${err}`});
		})
})

// GET for user to sign in
router.get('/users/login',
	passport.authenticate('basic', {session: true, failureRedirect: '/fail'}),
		(req, res) => {
			res.json({user: req.user.apiRepr(), message: 'Sign in successful'});
		}
);

// GET for user session
router.get('/users/me', loggedIn, (req, res, next) => {
  	res.json({user: req.user.apiRepr()});
	}
);

// GET for user to sign out
router.get('/users/logout', (req, res) => {
	req.session.destroy(function (err) {
  		return res.status(200).json({message: 'logged out'});
  	});
});

// GET for view other user profile
router.get('/users/:username', loggedIn, (req, res, next) => {

	User
		.findOne({username: req.params.username})
		.then(user => {
			return res.status(200).json({user: user.apiRepr()});
		})
		.catch(err => {
			res.status(500).json({message: `Internal server error: ${err}`});
		});

})

// GET single discussion
router.get('/single-discussion/:id', loggedIn, (req, res, next) => {

	Discussion
		.findOne({id: req.params.id})
		.then(discussion => {
			let usernames = discussion.comments.map(comment => comment.username);
			User
				.find()
				.where('username').in(usernames)
				.then(users => {
					discussion.comments.forEach(comment => {
						users.forEach(user => {
							if (comment.username === user.username) {
								comment.profilePicURL = user.profilePicURL;
							}
						})
					})
					return res.status(200).json({discussion})
				})
		})
		.catch(err => {
			res.status(500).json({message: `Internal server error: ${err}`})
		})
})

// GET for discussion search
router.get('/discussion/:q', loggedIn, (req, res) => {

	const searchTerms = req.params.q.split('+');

	Discussion 
		.find()
		.where('searchTerms').in(searchTerms)
		.limit(10)
		.sort('lastActiveDate')
		.then(discussions => {
			return res.status(200).json({discussions})
		})
		.catch(err => {
			res.status(500).json({message: `Internal server error: ${err}`});
		});
});

// GET most recent discussions
router.get('/discussions', loggedIn, (req, res) => {

	//console.log(req.params.skip);

	Discussion 
		.find()
		.sort({lastActiveDate: -1})
		.limit(10)
		.then(_discussions => {
			let discussions = [];
			_discussions.forEach(disc => {
				if (disc.comments.length > 0) {
					discussions.push(disc);
				}
			})
			return res.status(200).json({discussions})
		})
		.catch(err => {
			res.status(500).json({message: 'Internal server error'});
		});
});

// GET more recent discussions
router.get('/discussions/:skip', loggedIn, (req, res) => {

	console.log(req.params.skip);

	const skip = (req.params.skip) * 1;

	Discussion 
		.find()
		.sort({lastActiveDate: -1})
		.skip(skip)
		.limit(10)
		.then(_discussions => {
			let discussions = [];
			_discussions.forEach(disc => {
				if (disc.comments.length > 0) {
					discussions.push(disc);
				}
			})
			return res.status(200).json({discussions})
		})
		.catch(err => {
			res.status(500).json({message: 'Internal server error'});
		});
});

// GET user's community activity
router.get('/users/me/community', loggedIn, (req, res) => {

	const community = req.user.favoriteUsers;
	community.push(req.user.username);

	Comment
		.find()
		.where('username').in(community)
		.sort({date: -1})
		.limit(10)
		.then(comments => {
			let usernames = comments.map(comment => comment.username);
			User
				.find()
				.where('username').in(usernames)
				.then(users => {
					comments.forEach(comment => {
						users.forEach(user => {
							if (comment.username === user.username) {
								comment.profilePicURL = user.profilePicURL;
							}
						})
					})
					return res.status(200).json({comments})
				})
		})
		.catch(err => {
			res.status(500).json({message: `Internal server error: ${err}`})
		});
});

// GET more community activity
router.get('/users/me/community/:skip', loggedIn, (req, res) => {

	const community = req.user.favoriteUsers;
	community.push(req.user.username);

	const skip = req.params.skip * 1;

	Comment
		.find()
		.where('username').in(community)
		.skip(skip)
		.sort({date: -1})
		.limit(10)
		.then(comments => {
			let usernames = comments.map(comment => comment.username);
			User
				.find()
				.where('username').in(usernames)
				.then(users => {
					comments.forEach(comment => {
						users.forEach(user => {
							if (comment.username === user.username) {
								comment.profilePicURL = user.profilePicURL;
							}
						})
					})
					return res.status(200).json({comments})
				})
		})
		.catch(err => {
			res.status(500).json({message: `Internal server error: ${err}`})
		});
});

router.post('/members', (req, res, next) => {

	axios.get(req.body.url, {
		headers: {
			'X-API-Key': 'f3eJCOiKbJ2ZMrlU898kj7q8g11J4hEW5IbJY9Zl'
		}
	})
		.then(result => {
			res.json({result: result.data})
		})
		.catch(err => {
			res.status(500).json({message: `Internal server error: ${err}`})
		})
})

// POST for creating new user account
router.post('/users/sign-up', (req, res) => {

	if (!req.body) {
		return res.status(400).json({message: 'No request body'});
	}
	if (!('username' in req.body)) {
		return res.status(422).json({message: 'Missing field: username'});
	}

	let {username, password, location, about, favoriteUsers} = req.body;

	if (typeof username !== 'string') {
		return res.status(422).json({message: 'Incorrect field type: username'});
	}

	username = username.trim();

	if (username ==='') {
		return res.status(422).json({message: 'Incorrect field length: username'});
	}

	if (!(password)) {
		return res.status(422).json({message: 'Missing field: password'});
	}

	if (typeof password !== 'string') {
		return res.status(422).json({message: 'Incorrect field type: password'});
	}

	password = password.trim();

	if (password === '') {
		return res.status(422).json({message: 'Incorrect field length: password'});
	}

	User
		.find({username})
		.count()
		.exec()
		.then(count => {
			if (count > 0) {
				return res.status(422).json({message: 'Username already taken'});
			}
			return User.hashPassword(password);
		})
		.then(hash => {
			return User
				.create({
					username,
					password: hash,
					location,
					about,
					favoriteUsers
				});
		})
		.then(user => {
			return res.status(201).json({user: user.apiRepr(), message: 'New account created! Please sign in'});
		})
		.catch(err => {
			res.status(500).json({message: 'Internal server error'});
		});
});

// POST for adding new favorite user
router.post('/users/me/favorites', loggedIn, (req, res) => {

	User
		.findOneAndUpdate({username: req.user.username},
			{$push: {favoriteUsers: req.body.username}},
			{new: true})
		.then(user => res.status(201).json({user: user.apiRepr()}))
		.catch(err => res.status(500).json({message: 'Internal server error'}));

})

// POST new discussion
router.post('/discussions', loggedIn, (req, res) => {

	if (!req.body) {
		return res.status(400).json({message: 'No request body'});
	}

	const requiredFields = ['id', 'href', 'name', 'venue', 'description', 'image', 
		'dateStart', 'dateEnd', 'searchTerms'];

	for (let i = 0; i < requiredFields.length; i++) {
		const field = requiredFields[i];
		if(!(field in req.body)) {
			return res.status(422).json({message: `Missing field: ${field}`});
		};
	}

	Discussion
		.findOne({id: req.body.id})
		.then(discussion => {
			if (discussion) {
				return res.status(200).json({discussion, message: 'Discussion already exists'});
			}
			Discussion
				.create({
					id: req.body.id,
					href: req.body.href,
					name: req.body.name,
					venue: {
						name: req.body.venue.name,
						address: req.body.venue.address,
						area: req.body.venue.area
					},
					description: req.body.description,
					image: req.body.image,
					dateStart: req.body.dateStart,
					dateEnd: req.body.dateEnd,
					searchTerms: req.body.searchTerms
				})
				.then(discussion => {
					return res.status(201).json({discussion: discussion.apiRepr()});
				})
		})
		.catch(err => {
			console.log(err);
			res.status(500).json({message: 'Internal server error'});
		});
});

// POST new comment
router.post('/discussions/comment', loggedIn, (req, res) => {

	if (!req.body) {
		return res.status(400).json({message: 'No request body'});
	}

	const requiredFields = ['discussionId', 'discussionName', 'text'];

	for (let i = 0; i < requiredFields.length; i++) {
		const field = requiredFields[i];
		if(!(field in req.body)) {
			return res.status(422).json({message: `Missing field: ${field}`});
		};
	}

	const dateUpdated = moment();

	const comment = {
		date: dateUpdated,
		username: req.user.username,
		text: req.body.text,
		profilePicURL: req.user.profilePicURL
	}

	let discussion;

	Discussion
		.findOneAndUpdate({id: req.body.discussionId}, 
			{$set: {
				lastActiveDate: dateUpdated
			},
			$push: {comments: comment}},
			{new: true})
		.then((_discussion) => {
			discussion = _discussion;
			Comment
				.create({
					username: req.user.username,
					profilePicURL: req.user.profilePicURL,
					date: dateUpdated,
					text: req.body.text,
					discussion: {
						id: req.body.discussionId,
						name: req.body.discussionName
					}
				})
		})
		.then(() => {
			return res.status(201).json({discussion: discussion.apiRepr()})
		})
		.catch(err => {
			console.log(err);
			res.status(500).json({message: 'Internal server error'});
		})
});

// PUT for editing user profile 
router.put('/users/me', loggedIn, (req, res) => {

	const location = req.body.location;
	const about = req.body.about;
	const profilePicURL = req.body.profilePicURL;

	const updated = { 
		location,
		about,
		profilePicURL
	}

	User
		.findByIdAndUpdate(req.user.id, {$set: updated}, {new: true})
		.then(user => res.status(200).json({user: user.apiRepr()}))
		.catch(err => res.status(500).json({message: 'Error, update failed'}));

});

// DELETE for removing a favorite user
router.delete('/users/me/favorites', loggedIn, (req, res) => {

	if (!req.body.username) {
		return res.status(400).json({message: 'Username missing'});
	}

	User
		.findOneAndUpdate({username: req.user.username},
			{$pull: {favoriteUsers: req.body.username}},
			{new: true})
		.then(updateRes => res.status(200).json({user: updateRes.apiRepr()}))
		.catch(err => res.status(500).json({message: 'Internal server error'}));
});

// DELETE user account
router.delete('/users/me', loggedIn, (req, res) => {
	User
		.findByIdAndRemove(req.user.id)
		.then(user => res.status(200).json({redirect: '/'}).end())
		.catch(err => res.status(500).json({message: 'Internal server error'}));
});

router.use('*', function(req, res) {
	res.status(404).json({message: 'Not Found'});
});

module.exports = {router};