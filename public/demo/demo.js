'use strict';

function updateMessage(message) {
	if ($('.form-message').hasClass('message-enter')) {
		$('.form-message').html(message);
	} else {
		$('.title').toggleClass('form-title-remove');
		$('.form-message').html(message);
		$('.form-message').toggleClass('message-enter');
	}
}

function resetFormTitle() {
	$('.form-message').toggleClass('message-enter');
	$('.title').toggleClass('form-title-remove');
	$('.form-message').html('Create a new account');
}

function createDemoAccount() {

	var username = ((Math.random() * 999999999999) + 111111111111).toString();

	var demoData = {
		username: 'Demo123abc' + username,
		password: 'demo',
		location: 'New York, New York',
		about: 'This is a demo profile. Sign up for an account to enable commenting.',
		favoriteUsers: ['jesseDidThis', 'maggie_mags', 'everything_ryan']
	}

	var settings = {
	  url: '../api/users/sign-up',
	  method: 'POST',
	  data: JSON.stringify({
	  	username: demoData.username, 
	  	password: demoData.password, 
	  	location: demoData.location,
	  	about: demoData.about,
	  	favoriteUsers: demoData.favoriteUsers
	  }),
	  contentType: 'application/json',
	  dataType: 'json',
	  error: function(res) {
	  	if (res.responseJSON.message) {
	  		var message = res.responseJSON.message;
	  	} else {
	  		var message = 'Server Error';
	  	}
	  	updateMessage(res.responseJSON.message);
 		}
	};

	$.ajax(settings).done(function (response) {
			updateMessage('Signing in...');
			setTimeout(function(){signInUser(demoData.username, demoData.password)}, 500);
		})
}

function signInUser(username, password) {

	updateMessage('Signing in...');

	var settings = {
	  url: "../api/users/login",
	  method: "GET",
	  headers: {
	    'content-type': "application/json",
	    authorization: "Basic " + btoa(username + ':' + password)
	  }
	};

	$.ajax(settings).done(function (response) {
			if (response.user) {
				location.href = 'https://artseennyc.netlify.com/dashboard';
			}
			else {
				updateMessage('Server Error');
			}
	});

	$(document).ajaxError(function() {
		updateMessage('Invalid Password or Username')
	})
}

$(setTimeout(function(){createDemoAccount()}, 1500));
