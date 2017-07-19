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
	$('.form-message').html('Sign in to your account');
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
	})
}

function watchLogIn() {
	$('.log-in-form').submit(function(event) {
		event.preventDefault();
		var username = $('#username').val();
		var password = $('#password').val();
		signInUser(username, password);

	})
}

$(watchLogIn());