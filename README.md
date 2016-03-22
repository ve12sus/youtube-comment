# YouTube Commentator

I wanted an easier way to point out things in a YouTube video.

It was also my first time programming, and my first software project.
I concentrated on making everything on my own, to learn the full process.

# Technical Specs

This is a full-stack solution that includes both front-end and back-end.

The idea I worked off of is a website that has a YouTube video embedded,
but you can add your own timestamps and captions and share the link.

Before this project I only knew a little HTML, but I have been using computers
all my life. I knew I needed a server, a database, and a 'website' that sees and
shows the database information.

I read a few books on logical gates and how CPU sees instructions to get an
overview, then off I went.

# Back-end

My idea would not materialize without a foundation so I started here. It was
also the most 'codey' place to start without dealing with visual design which
was daunting at the time.

Originally I naively thought I just need to store .json files individually
'on a server' somewhere. After research I found the concept of a RESTful API.

## The API

It takes GET/POST/UPDATE/DELETE requests, and JSON data. Gives back a
JSON reply and a server message.

This was the first piece of software I wrote. I will never forget the first
time that it 'worked'. I could curl it or hit it with a browser and it gave
back a (at the time hardcoded) response.

## The Database

I chose MySQL because it is one of the standards, and PHP has built-in
functions to interact with it.

The next thing to do was to connect a database with the API, so MySQL syntax
and messing with tables and such was on the agenda. I survived the ordeal
with a functioning database that the API interacted with.

## The Hosting

Until now I was working locally on a LAMP stack. I moved the project onto a new
host, and my first domain. Figuring out .htaccess and permissions was a new
game to me.

The API is [here](http://www.ve12sus.com/ytc/api/videos).
The documentation can be found below.

# Front-end

JavaScript is the focus here. I knew it was how to manipulate client-side
inputs and the responses from the API.

With the exception of the AJAX functions (which uses jQuery) it was important
to me to use vanilla javascript so I can really understand what was going on.

## JavaScript

I wrote my own lightweight MVC for this project.

I spent the longest time in this portion. I was using both the YouTube API and
my own to have a MVC that models both, the Controller that took URL and user
input and rendered a view. They constantly update each other and I wrestled
with it to produce the script to do that.

After I got it to work I spent time really cleaning it up and refactoring it
down.

## HTML/CSS

At the same time I was making a front-end that the user interacted with.

This was a process of figuring out UX/UI, having users test your project and
noting their behaviour and questions. Also a lot of bug squashing.

I learned about button behaviours and where to put certain thing to guide the
user. I learned about making things as easy as possible, as clear as possible.

I learned having just the minimal HTML/CSS you need. I mistakingly was
correcting every issue by adding more code. At some point I restarted the whole
front end from scratch to just produce the essentials.

# Link

[YouTube Commentator](http://ve12sus.com/ytc)

# API documentation

GET api/videos - get videos
POST api/videos - create video

GET api/videos/id - get video
PUT api/videos/id - update video
DELETE api/videos/id - delete video

GET api/videos/id/comments - get video
POST api/videos/id/comments - create comment
DELETE api/videos/id/comments - delete comment

request header is:
"Content-Type: application/json"

request body (videos/id) is:
{"title":"video title", "youtubeId": "youtube id"}

request body (videos/id/comments) is:
{"id":"video id", "time":"timestamp", "comment": "comment", "style": "styling"}







