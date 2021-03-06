exports.DATABASE_URL = process.env.DATABASE_URL ||
					   global.DATABASE_URL ||
					   'mongodb://localhost/artseen-nyc';
exports.TEST_DATABASE_URL = (process.env.TEST_DATABASE_URL ||
							'mongodb://localhost/test-app');
exports.PORT = process.env.PORT || 8080;

exports.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';