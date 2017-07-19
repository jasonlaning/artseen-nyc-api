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

function signUpUser(username, password, location) {

	updateMessage('Creating new account...');

	var settings = {
	  url: '../api/users/sign-up',
	  method: 'POST',
	  data: JSON.stringify({username: username, password: password, location: location}),
	  contentType: 'application/json',
	  dataType: 'json',
	  error: function(res) {
	  	$('#username').val('');
		$('#password').val('');
		$('#location').val('');
		$('#username').focus();
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
			setTimeout(function(){signInUser(username, password)}, 500);
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
		$('#username').val('');
		$('#password').val('');
		$('#username').focus();
	})
}

function watchSignUp() {
	$('.sign-up-form').submit(function(event) {
		event.preventDefault();
		var username = $('#username').val();
		var location = $('#location').val();
		var password = $('#password').val();
		signUpUser(username, password, location);
	})
}

$(watchSignUp());