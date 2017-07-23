# ArtSEEN NYC #

[ArtSEEN NYC](https://artseennyc.netlify.com) is a platform for discussing current art exhibitions and connecting with the art community in New York City.

It is a responsive, full-stack app (MERN). This repository is for the back-end application only. The front-end application is in a [separate repository](https://github.com/jasonlaning/artseen-nyc-client) and is hosted separately.

## Features ##

### Search Art Exhibitions ###
Find art exhibitions by searching current listings (powered by the NY Art Beat API). Click on a search result to view exhibition stub, then start a discussion by posting a comment. Exhibitions that have at least one comment move to the “All Discussions” feed.
### Discussions and Comments ###
Discussions in the "All Discussions" feed are sorted with the most recently commented on at the top. Click on an individual discussion to view comments and add your own. The Discussions feed shows 10 discussions at a time, with a clickable button at the bottom to load more discussions if they are available.
### View User Profiles and Follow Your Favorites ###
Click on user profile images or usernames on either the All Discussions feed or Community Activity feed to view another user's profile image, location, and “about” section. Follow or unfollow other users to add or remove them from your Community Activity feed.
### Community Activity Feed ###
Community Activity displays the most recent comments from users you've followed. This includes your own comments, so you can keep track of what you've posted. The Community Activity feed displays 10 comments at a time, with a clickable button at bottom to load additional comments if they are available.
### User Settings ###
Upload a new profile photo, or edit location and “about” sections to control what others see when they view your profile.
### Try a Demo ###
Not ready to sign up? Try a demo account instead. Demo accounts are unique instances with pre-populated settings. Commenting is disabled for demo accounts.
### Sign Up ###
Sign up for a unique, secure user account with a username and password.
### Responsive Layout ###
The layout is fully responsive, and the UI is optimized for mobile, tablet and desktop viewports.

## Screenshots ##

![](https://raw.githubusercontent.com/jasonlaning/artseen-nyc-client/master/public/screenshots-artseennyc.jpg)

## Technology ##

### Front End ###
The front end is in a [separate repository](https://github.com/jasonlaning/artseen-nyc-client), and is hosted separately

- React
- Redux
- Enzyme and Axios Mock Adapter (for tests)
- Axios (for ajax requests)
- Continuous integration and deployment with Travis CI
- HTML5
- CSS3

Also uses Moment for date manipulation, React Dropzone for uploading images, and React Stickynode for sticking the nav bar to the top of the browser window on scroll.

### Back End ###
- Node.js + Express.js
- MongoDB
- Mocha + Chai (for tests)
- Passport for securing endpoints for authorized users
- bcrypt.js for encrypting passwords
- Continuous integration and deployment with Travis CI


