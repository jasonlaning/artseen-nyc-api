const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const faker = require('faker');
const bcrypt = require('bcryptjs');
const should = chai.should();

const {User} = require('../users/models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

function seedUserData() {
	const username = 'testuser';
	const password = 'password';
	const seedData = [];

	for (let i=1; i<=10; i++) {
		seedData.push(generateUserData());
	}

	seedData[5].username = username;
	seedData[5].password = password;
	const hashedPassword = bcrypt.hash(password, 10);
	return hashedPassword
		.then(_hashedPassword => {
			seedData[5].password = _hashedPassword;
			console.warn('\n Seeding database');
			return User.create(seedData);
		})
}

function generateUserData() {
	return {
		username: faker.internet.userName(),
		password: faker.internet.password(),
		location: faker.address.city(),
		about: faker.lorem.sentence(),
		profilePicURL: faker.image.imageUrl(),
		favoriteUsers: [faker.internet.userName(), faker.internet.userName()]
	}
}

function tearDownDb() {
	console.warn('Deleting database\n');
	return mongoose.connection.dropDatabase();
}

describe('Users API resource', function() {
	before(function() {
		return runServer(TEST_DATABASE_URL);
	});

	beforeEach(function() {
		return seedUserData();
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
				.get('/api/users/login') // first have to log in
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