#YouTube Commentator
This project currently lives [here](http://ve12sus.com/ytc).

I like video games, and like to make videos showing gameplay and
strategy. There exists a culture of players who likes watching and
recording their own gameplay. I felt a simple way to comment
and timestamp these videos would benefit the community.

This solution is full-stack. I made this as I was learning how to
program so I focused on making everything 'from scratch' (no frameworks)
in an effort to understand.

### What it does:
* Enter a YouTube URL to comment on that video.
* Add/Delete comments tied to a time.
* Add a title of your commented video.
* Share them with your friends with the comments displayed as subtitles.
* Browse and watch captioned videos.

---
##API
Code [here](https://github.com/ve12sus/youtube-comment/blob/master/api/server.php)

I started from here because I knew the front end would need a backbone to
interact with, and to reach data stored on a server. I chose PHP after
reading about RESTFUL APIs, it was well documented and many websites ran
PHP at the time.

### Features and details:
* Takes standard HTTP request methods GET, PUT, POST, DELETE.
* Access a MySQL database and performs CRUD operations.
* A response is given with a server message and a JSON object representing
the requested resource.
* The API is stateless and has URIs pointing to specific resources.
* API [documentation](#apidoc).

### What I learned:

* How browsers 'ask' for information and how it is passed, and
how a server answers with a response.
* Represent information as URIs and resources, and giving that info as a
response object.
* Coding principles like syntax, DRY, try/catch, loops, classes and
patterns.

---
## JavaScript MVC
Code to JavaScript [here](https://github.com/ve12sus/youtube-comment/blob/master/js/player.js)

I wrote the JS portion next. I felt like if I can take some time to write
my own lightweight MVC I would be able to eventually use and understand
JavaScript (thus most JS frameworks), as opposed to learning one framework
ridigly.

### Features and details:
* Models from 2 APIs. My own from above and YouTube's API.
* Uses a auto-updating observer pattern. The models get updated through
user actions then the view gets rendered through model updates.
* The controller controls many UI functions from creating a video to
alterating the contents.
* Uses AJAX from Jquery and Resig's PrettyDate function as only 'outside'
code.
* The view function renders all of the page on the fly.
* refactored many times to be light weight. 

### What I learned:

* I learned different methods of programming. The code started off as
very executional step by step instructions. As I went I realized the
purpose and power of object-oriented programming so I went that direction.
Eventually I discovered functional programming and been refactoring it
down with that principle.
* I learned how to keep the entire process in 'the right order' since JS
is not multi-threaded, different tricks like callbacks and were learned
and used.
* How a single-page application works using all the newest paradigms
and technologies.
* Ajax and it's many different varied interactions with it.
* How to use an API like YouTube's.
	
---
## HTML and CSS
Code to [HTML](https://github.com/ve12sus/youtube-comment/blob/master/index.html)
Code to [CSS](https://github.com/ve12sus/youtube-comment/blob/master/css/style.css)

I am not a graphic designer so I kept things simple. The HTML is very
minimal and most of the website is rendered by the MVC.

## Features and details:
* Uses HTML5 tags.
* Small amount of scripts for speed.
* Minimal amount of css tags/ids/animations for simplicity.
* The front end is very fast!
* A simple UI that is easy to use and easy to understand.

### What I learned:
* Graphic design is hard, making something that 'looks' okay was a new
territory.
* Sizing things with CSS.
* How to arrange pieces of a website using CSS.
* UI principles like what draws the eye, what users look at, what they
anticipate actions to do, and how to use that information to build it
better and easier to use.
* How simple hover, click,and similar animations can effect the user
experience.

---
## Database and hosting
The next step was to hook up a database to the API, and also move it to
a hosting. 

### Features and details:
* Uses MySQL, the tables store video title, comment, and other data as
they relate to a YouTube ID.
* The server uses Apache and points request to the PHP API script. Each
URL is representational of a resource stored in the database.
* Live [API](http://ve12sus.com/ytc/api/videos)

### What I learned:

* How to deploy things onto hosting, the steps to get permissions all in
working order, and how each piece relates to the rest.
* How to set up a database, the syntax used, and things you can do to it.
* How to use prepared statments in PHP to interact with MySQL.
* How to use CURL/Browser to test hosted APIs.

---
## What's next?

YTC is ongoing. The process so far taught me how to build/test/release a
product and all the big and small steps involved, but I have a lot to
learn still.

The next few things to do are to fix bugs, implement new features,
introduce automatic testing, and security/authentication when
features such as user accounts are made.

---

## <a name="apidoc">API Documentation</a>

### api/videos
* GET - get videos
* POST - create video

### api/videos/id
* GET - get video
* PUT - update video
* DELETE - delete video

### api/videos/id/comments
* GET - get video comments
* POST - create comment
* DELETE - delete comment

### request header:
`"Content-Type: application/json"`

### request body (videos/id):
`{"title":"video title", "youtubeId": "youtube id"}`

### request body (videos/id/comments):
`{"id":"video id", "time":"timestamp", "comment": "comment", "style": "styling"}`
