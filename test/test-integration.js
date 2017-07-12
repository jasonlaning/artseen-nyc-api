const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const faker = require('faker');
const bcrypt = require('bcryptjs');
const should = chai.should();

const {User} = require('../users/models');
const {Discussion} = require('../discussions/models');
const {Comment} = require('../comments/models');

const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

const seedCommentData = () => {
	const seedData = [];
	for (let i=1; i<=10; i++) {
		seedData.push(generateCommentData());
	}

	seedData[5].username = 'friend';
	seedData[7].username = 'friend';

	return Comment.create(seedData);
}

const generateCommentData = () => {
	return {
		username: faker.internet.userName(),
		date: faker.date.past(),
		text: faker.lorem.sentence(),
		discussion: {
			id: faker.random.uuid(),
			name: faker.lorem.sentence()
		}
	}
}

const seedDiscussionData = () => {
	const seedData = [];

	for (let i=1; i<=10; i++) {
		seedData.push(generateDiscussionData());
	}

	seedData[5].searchTerms.push('picasso');
	seedData[7].searchTerms.push('picasso');
	seedData[2].id = 'knownDiscussionId';
	seedData[2].name = 'knownDiscussionName';

	return Discussion.create(seedData);
}

const generateDiscussionData = () => {
	return {
		id: faker.random.uuid(),
		href: faker.internet.url(),
		name: faker.lorem.sentence(),
		lastActiveDate: faker.date.past(),
		venue: {
			name: faker.company.companyName(),
			address: faker.address.streetAddress(),
			area: faker.address.county()
		},
		description: faker.lorem.sentence(),
		image: faker.image.imageUrl(),
		dateStart: faker.date.past(),
		dateEnd: faker.date.future(),
		comments: [
			{
				date: faker.date.past(),
				username: faker.internet.userName(),
				text: faker.lorem.sentence()
			},
			{
				date: faker.date.past(),
				username: faker.internet.userName(),
				text: faker.lorem.sentence()
			}
		],
		searchTerms: [faker.lorem.word(), faker.lorem.word()]
	}
}

const seedUserData = () => {
	const username = 'testuser';
	const password = 'password';
	const seedData = [];

	for (let i=1; i<=10; i++) {
		seedData.push(generateUserData());
	}

	seedData[5].username = username;
	seedData[5].password = password;
	seedData[5].favoriteUsers.push('friend');
	seedData[6].username = 'userToView';
	seedData[2].username = 'friend';
	const hashedPassword = bcrypt.hash(password, 10);
	return hashedPassword
		.then(_hashedPassword => {
			seedData[5].password = _hashedPassword;
			console.warn('\n Seeding database');
			return User.create(seedData);
		})
}

const generateUserData = () => {
	return {
		username: faker.internet.userName(),
		password: faker.internet.password(),
		location: faker.address.city(),
		about: faker.lorem.sentence(),
		profilePicURL: faker.image.imageUrl(),
		favoriteUsers: [faker.internet.userName(), faker.internet.userName()]
	}
}

const tearDownDb = () => {
	console.warn('Deleting database\n');
	return mongoose.connection.dropDatabase();
}

describe('API resource for users, comments, and discussions', function() {
	before(function() {
		return runServer(TEST_DATABASE_URL);
	});

	beforeEach(function() {
		return seedUserData();
	});

	beforeEach(function() {
		return seedDiscussionData();
	});

	beforeEach(function() {
		return seedCommentData();
	});

	afterEach(function() {
		return tearDownDb();
	});

	after(function() {
		return closeServer();
	});

	
	describe('GET endpoint for signing in', function() {

		it('should sign in user and return user account', function() {
			let res;
			let agent = chai.request.agent(app);
			return agent
				.get('/api/users/login')
				.auth('testuser', 'password')
				.then(_res => {				
					res = _res;
					res.should.have.status(200);
					res.body.user.username.should.equal('testuser');
					res.body.user.should.include.keys(
						'username', 'location', 'about', 'profilePicURL', 'favoriteUsers');
				})
		});
	});

	describe('GET endpoint for user session', function() {

		it('should return user that is signed in', function() {
			let agent = chai.request.agent(app);
			return agent
				.get('/api/users/login')
				.auth('testuser', 'password')
				.then(() => {				
					return agent.get('/api/users/me')
						.then(res => {
							res.should.have.status(200);
							res.body.user.username.should.equal('testuser');
							res.body.user.should.include.keys(
								'username', 'location', 'about', 'profilePicURL', 'favoriteUsers');
						})					
				});
		});
	});

	describe('GET endpoint to sign out', function() {

		it('should sign out the user', function() {
			let agent = chai.request.agent(app);
			return agent
				.get('/api/users/login')
				.auth('testuser', 'password')
				.then(() => {				
					return agent.get('/api/users/logout')
						.then(res => {
							res.should.have.status(200);
							res.body.message.should.equal('logged out');							
						})					
				});
		});
	});

	describe('GET endpoint to view other user profiles', function() {

		it('should get the other user', function() {

			let agent = chai.request.agent(app);
			let username = 'testuser';
			let password = 'password';
			let userToView = 'userToView';

			return agent
				.get('/api/users/login')
				.auth(username, password)
				.then(() => {				
					return agent
						.get(`/api/users/${userToView}`)
						.then(res => {							
							res.should.have.status(200);
							res.body.user.username.should.equal(userToView);
							res.body.user.should.include.keys(
								'username', 'location', 'about', 'profilePicURL', 'favoriteUsers');
						})
				})
		})
	})

	describe('GET endpoint to  retrieve a single discussion by id', function() {

		it('should return a single discussion by id', function() {

			let agent = chai.request.agent(app);
			let username = 'testuser';
			let password = 'password';
			let discussionToFind = 'knownDiscussionId';

			return agent
				.get('/api/users/login')
				.auth(username, password)
				.then(() => {				
					return agent
						.get(`/api/single-discussion/${discussionToFind}`)
						.then(res => {
							res.should.have.status(200);
							res.body.discussion.id.should.equal(discussionToFind);
							res.body.discussion.should.include.keys(
								'id', 'href', 'name', 'lastActiveDate', 'venue', 'description',
								'image', 'dateStart', 'dateEnd', 'comments');
						})
				})
		})
	})

	describe('GET endpoint to search discussions', function() {

		it('should return discussions matching the search terms', function() {
			let agent = chai.request.agent(app);
			let username = 'testuser';
			let password = 'password';
			let fakeSearchTerm = 'picasso';

			return agent
				.get('/api/users/login') 
				.auth(username, password)
				.then(() => {				
					return agent
						.get(`/api/discussion/${fakeSearchTerm}`)
						.then(res => {
							res.should.have.status(200);
							res.body.discussions.forEach(discussion => {
								discussion.searchTerms.should.contain(fakeSearchTerm);
							});
						})
				})
		})
	})

	describe('GET endpoint for most recently active discussions', function() {

		it('should return the most recently active discussions', function() {
			let agent = chai.request.agent(app);
			let username = 'testuser';
			let password = 'password';

			return agent
				.get('/api/users/login') 
				.auth(username, password)
				.then(() => {				
					return agent
						.get('/api/discussions')
						.then(res => {
							res.should.have.status(200);
							res.body.discussions.forEach(discussion => {
								discussion.should.include.keys(
									'id', 'href', 'name', 'lastActiveDate', 'venue',
									'description', 'image', 'dateStart', 'dateEnd',
									'comments', 'searchTerms')
							})
						})
				})
		})
	})

	describe('GET endpoint for community activity', function() {

		it('should return the comments from user\'s favorite users', function() {
				let agent = chai.request.agent(app);
				let username = 'testuser';
				let password = 'password';

				return agent
					.get('/api/users/login') 
					.auth(username, password)
					.then(() => {				
						return agent
							.get('/api/users/me/community')
							.then(res => {
								res.should.have.status(200);
								res.body.comments.forEach(comment => {
									comment.username.should.equal('friend')
								})
							})
					})
		})
	})

	describe('POST endpoint to create new user', function() {

		it('should create a new user', function() {

			let testUsername = 'testuser2010';
			let testPassword = 'password123';
			
			return chai.request(app)
				.post('/api/users/sign-up')
				.send({username: testUsername, password: testPassword})
				.then(res => {							
					res.should.have.status(201);
					res.body.user.username.should.equal(testUsername);
					res.body.user.should.include.keys(
					'username', 'location', 'about', 'profilePicURL', 'favoriteUsers');			
					User.findOne({username: testUsername})
						.then(user => {
							user.should.exist;
							user.username.should.equal(testUsername);
						})
				})
		});
	});

	describe('POST endpoint to add new favorite user', function() {

		it('should add a new favorite user', function() {
			let agent = chai.request.agent(app);
			let username = 'testuser';
			let password = 'password';

			return agent
				.get('/api/users/login') 
				.auth(username, password)
				.then(() => {				
					return agent
						.post('/api/users/me/favorites')
						.send({username: 'newFavoriteUser'})
						.then(res => {
							res.should.have.status(201);
							res.body.user.favoriteUsers.should.contain('newFavoriteUser');
						})
				})
		})
	})

	describe('POST endpoint to create new discussion', function() {

		it('should create a new discussion', function() {
			let agent = chai.request.agent(app);
			let username = 'testuser';
			let password = 'password';
			let fakeDiscussion = generateDiscussionData();

			return agent
				.get('/api/users/login') 
				.auth(username, password)
				.then(() => {				
					return agent
						.post('/api/discussions')
						.send(fakeDiscussion)
						.then(res => {
							res.should.have.status(201);
							res.body.discussion.href.should.equal(fakeDiscussion.href);
							res.body.discussion.name.should.equal(fakeDiscussion.name);
							res.body.discussion.venue.name.should.equal(fakeDiscussion.venue.name);
							res.body.discussion.venue.address.should.equal(fakeDiscussion.venue.address);
							res.body.discussion.venue.area.should.equal(fakeDiscussion.venue.area);
							res.body.discussion.description.should.equal(fakeDiscussion.description);
							res.body.discussion.image.should.equal(fakeDiscussion.image);
							res.body.discussion.searchTerms.should.contain(fakeDiscussion.searchTerms[0]);
							res.body.discussion.searchTerms.should.contain(fakeDiscussion.searchTerms[1]);
						})
				})
		})
	})

	describe('POST endpoint to create new comment', function() {

		it('should create a new comment', function() {
			let agent = chai.request.agent(app);
			let username = 'testuser';
			let password = 'password';
			let fakeComment = generateCommentData();
			fakeComment.discussionId = 'knownDiscussionId';
			fakeComment.discussionName = 'knownDiscussionName';

			return agent
				.get('/api/users/login') 
				.auth(username, password)
				.then(() => {				
					return agent
						.post('/api/discussions/comment')
						.send(fakeComment)
						.then(res => {
							let resComment = {};
							res.body.discussion.comments.forEach(comment => {
								if (comment.text === fakeComment.text) {
									resComment = comment;
								}
							})
							res.should.have.status(201);
							resComment.text.should.equal(fakeComment.text);
							res.body.discussion.id.should.equal(fakeComment.discussionId);
							res.body.discussion.name.should.equal(fakeComment.discussionName);							
						})
				})
		})
	})

	describe('PUT endpoint to edit user profile', function() {

		it('should update profile info', function() {
			let agent = chai.request.agent(app);
			let username = 'testuser';
			let password = 'password';
			let newProfileInfo = {
				location: faker.address.city(),
				about: faker.lorem.sentence(),
				profilePicURL: faker.image.imageUrl(),
			}

			return agent
				.get('/api/users/login') 
				.auth(username, password)
				.then(() => {				
					return agent
						.put('/api/users/me')
						.send(newProfileInfo)
						.then(res => {
							res.should.have.status(200);
							res.body.user.location.should.equal(newProfileInfo.location);
							res.body.user.about.should.equal(newProfileInfo.about);
							res.body.user.profilePicURL.should.equal(newProfileInfo.profilePicURL);
						})
				})
		})
	})

	describe('DELETE endpoint for removing favorite user', function() {

		it('should remove the username from favorite users', function() {
			let agent = chai.request.agent(app);
			let username = 'testuser';
			let password = 'password';
			let newFavorite = {
				username: 'myNewFavorite'
			};

			return agent
				.get('/api/users/login') 
				.auth(username, password)
				.then(() => {				
					return agent
						.post('/api/users/me/favorites')
						.send(newFavorite)
						.then(() => {
							return agent
							.delete('/api/users/me/favorites')
								.send(newFavorite)
								.then(res => {
									res.should.have.status(200);
									res.body.user.favoriteUsers.should.not.contain(newFavorite);
								})
						})
				})
		})
	})

	describe('DELETE endpoint for user account', function() {

		it('should delete the user account', function() {
			let agent = chai.request.agent(app);
			return agent
				.get('/api/users/login')
				.auth('testuser', 'password')
				.then(() => {				
					return agent
						.delete('/api/users/me')
						.then(res => {
							res.should.have.status(200);
							return User
								.findOne({username: 'testuser'})
								.then(res => {
									should.not.exist(res);
								})
						})					
				});
		});
	});	

});