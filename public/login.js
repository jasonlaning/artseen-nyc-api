'use strict';


function signInUser(username, password) {

	var settings = {
	  url: "../users/login",
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
				$('.log-in-form')[0].reset();
				$('.js-error-message').html('Invalid username or password');
			}
	});
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