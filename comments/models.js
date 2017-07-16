const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const commentSchema = mongoose.Schema({
	username: {
		type: String
	},
	profilePicURL: {
		type: String
	},
	date: {
		type: Date
	},
	text: {
		type: String
	},
	discussion: {
		id: String,
		name: String
	}
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = {Comment};