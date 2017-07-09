const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const userSchema = mongoose.Schema({
	username: {
		type: String,
		required: true,
		unique: true
	},
	password: {
		type: String,
		required: true
	},
	location: {
		type: String
	},
	about: {
		type: String
	},
	profilePicURL: {
		type: String
	},
	favoriteUsers: {
		type: Array
	}
});

userSchema.methods.apiRepr = function() {
	return {
		username: this.username || '',
		location: this.location || '',
		about: this.about || '',
		profilePicURL: this.profilePicURL || '',
		favoriteUsers: this.favoriteUsers || []
	};
}

userSchema.methods.validatePassword = function(password) {
	return bcrypt.compare(password, this.password);
}

userSchema.statics.hashPassword = function(password) {
	return bcrypt.hash(password, 10);
}

const User = mongoose.model('User', userSchema);

module.exports = {User};