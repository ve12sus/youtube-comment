// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player = null;

function onYouTubeIframeAPIReady() {
  //Controller.send();
}

$('#loadvid').click(function() {
  playerStuff($('#videoid').val());
});

function playerStuff(vidid) {
  if (player === null) {
    player = new YT.Player('player', {
      height: '390',
      width: '640',
      videoId: vidid,
      events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange
      }
    });
  }
  else {
    player.loadVideoById(vidid);
  }
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
  event.target.playVideo();
  setInterval(commentLoad, 1000);
}

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.

var done = false;

function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.PLAYING && !done) {
    //setTimeout(stopVideo, 6000);
    done = true;
  }
}

function stopVideo() {
  player.stopVideo();
}

function commentLoad() {
  var playerTime = Math.round(player.getCurrentTime());
  var data = videoModel.get();
  for (var i = 0; i < data.comments.length; i ++) {
    if (playerTime >= data.comments[i][0]) {
      document.getElementById('currentComment').innerHTML = data.comments[i][1];
    }
  }
}

function displayComment() {
  playerTime = Math.round(player.getCurrentTime());
  video = videoModel.get();
  for (var i = 0; i < video.comments.length; i ++) {
    if (playerTime >= video.comments[i][0]) {
      document.getElementById('currentComment').style.visibility = 'visible';
      document.getElementById("currentComment").innerHTML = video.comments[i][1];
    }
  }
}

var videoModel = (function () {

  // A private video variable
  var video = {
    id: 1,
    title: "Default Title",
    youtubeId: "HGfC4CFBAns",
    comments: [
      { time: 10,
        comment: "daigo san",
        style: "pogchamp"
      },
      {
        time: 24,
        comment: "infiltration jump in",
        style: null
      },
      {
        time: 36,
        comment: "a fraud move",
        style: "jchensor"
      }
    ]
  };

  // A private function which
  function privateFunction() {
  }

  function publicSet(data) {
    video.title = data.title;
    video.youtubeId = data.youtubeId;
    video.comments = data.comments;
    playerStuff(video);
    videoModel.notify(video);
  }

  function publicGet() {
    return video;
  }

  return {

    set: publicSet,

    get: publicGet

  };
})();



function ObserverList() {
  this.observerList = [];
}

ObserverList.prototype.add = function(obj) {
  return this.observerList.push(obj);
}

ObserverList.prototype.count = function() {
  return this.observerList.length;
}

ObserverList.prototype.get = function(index) {
  if(index > -1 && index < this.observerList.length) {
    return this.observerList[index];
  }
}

ObserverList.prototype.indexOf = function(obj, startIndex) {
  var i = startIndex;

  while(i < this.observerList.length) {
    if(this.observerList[i] === obj) {
      return i;
    }
    i++;
  }

  return -1;
}

ObserverList.prototype.removeAt = function(index) {
  this.observerList.splice(index, 1);
}

function Subject() {
  this.observers = new ObserverList();
}

Subject.prototype.addObserver = function(observer) {
  this.observers.add(observer);
}

Subject.prototype.removeObserver = function(observer) {
  this.observers.removeAt(this.observers.indexOf(observer, 0));
}

Subject.prototype.notify = function(context){
  var observerCount = this.observers.count();
  for (var i = 0; i < observerCount; i++) {
    this.observers.get(i).update(context);
  }
}

function extend(obj, extension) {
  for (var key in extension) {
    obj[key] = extension[key];
    }
}

// The Observer
function Observer() {
  this.update = function(context) {
    //to be updated later
  };
}

var View = (function () {

  var heading = document.getElementById("title");
  var commentDiv = document.getElementById("comments");

  function publicShowTitle(video) {
    heading.innerHTML = video.title;
  }

  function publicShowComments(video) {
    var cl = document.createElement("ul");

    for (i = 0; i < video.comments.length; i++) {
      var timeSpan = document.createElement("span");
      var timeNode = document.createTextNode(
        secondsToHms(video.comments[i].time));

      var commentNode = document.createTextNode(" " + video.comments[i].comment);
      var listItem = document.createElement("li");
      var listItemId = video.comments[i].time;

      timeSpan.appendChild(timeNode);
      timeSpan.setAttribute("class", "time-link");
      listItem.appendChild(timeSpan);
      listItem.appendChild(commentNode);
      listItem.setAttribute("id", listItemId);

      timeSpan.onclick = function() {
        player.seekTo(this.parentNode.id);
      }
      cl.appendChild(listItem);
    }
    commentDiv.replaceChild(cl, commentDiv.childNodes[0]);
  }

  return {

    showTitle: publicShowTitle,

    showComments: publicShowComments

  };

})();

var Controller = (function () {
  function sendRequest() {
    $.ajax({
      url: "http://localhost/~jeff/ytcserver/api/videos/1",
      dataType: "json",
      success: function(data) {
        videoModel.set(data);
      }
    });
  }

  return {

    send: sendRequest

  };

})();

function secondsToHms(d) {
  d = Number(d);
  var h = Math.floor(d / 3600);
  var m = Math.floor(d % 3600 / 60);
  var s = Math.floor(d % 3600 % 60);
  return ((h > 0 ? h + ":" + (m < 10 ? "0" : "") : "") + m + ":" + (s < 10 ? "0" : "") + s);
}


extend(videoModel, new Subject() );

extend(View, new Observer() );

View.update = function(video) {
  View.showTitle(video);
  View.showComments(video);
}

videoModel.addObserver(View);
