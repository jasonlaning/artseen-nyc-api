const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const discussionSchema = mongoose.Schema({
	id: {
		type: String
	},
	href: {
		type: String
	},
	name: {
		type: String
	},
	lastActiveDate: {
		type: Date,
	},
	venue: {
		name: {
			type: String
		},
		address: {
			type: String
		},
		area: {
			type: String
		}
	},
	description: {
		type: String
	},
	image: {
		type: String
	},
	dateStart: {
		type: Date
	},
	dateEnd: {
		type: Date
	},
	comments: [
		{
			date: {
				type: Date
			},
			username: {
				type: String
			},
			text: {
				type: String
			}
		}
	],
	searchTerms: {
		type: Array,
		default: []
	}
});

discussionSchema.methods.apiRepr = function() {
	return {
		id: this.id || '',
		href: this.href || '',
		name: this.name || '',
		lastActiveDate: this.lastActiveDate || '',
		venue: this.venue || {},
		description: this.description || '',
		image: this.image || '',
		dateStart: this.dateStart || '',
		dateEnd: this.dateEnd || '',
		comments: this.comments || [],
		searchTerms: this.searchTerms || []
	};
}

const Discussion = mongoose.model('Discussion', discussionSchema);

module.exports = {Discussion};