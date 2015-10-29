var Controller = (function () {

  var search = window.location.pathname;
  var params = search.split("/");
  var before = params.indexOf("ytcserver");
  var id;
  var mode;

  if (before) {
    var id = params[before + 1];
    if (id) {
      var mode = params[before + 2];
    }
    document.getElementById("error").innerHTML = mode;
  }

  var url = "http://localhost/~jeff/ytcserver/api/videos/" + id;

  window.onYouTubeIframeAPIReady = function() {
    sendRequest('GET', url).done(function(data) {
      videoModel.set(data);
    });
  }

  function sendRequest(method, url, data) {

    return $.ajax({
      url: url,
      dataType: "json",
      type: method,
      data: data
    });
  }

  function publicCreateComment() {

    var currentTime = Math.round(playerModel.getPlayer().getCurrentTime());
    var text = document.getElementById("text").value;
    var style =  "kappa";

    var comment = {
      time: currentTime,
      comment: text,
      style: style
    }

    videoModel.addComment(comment);

    try {
      var commentURL = url + "/comments";
      var data = JSON.stringify(comment);
      sendRequest('POST', commentURL, data);
    }
    catch(err) {
      document.getElementById("error").innerHTML = err.message;
    }
  }

  function publicDeleteComment(time) {

    videoModel.deleteComment(time);

    try {
      var data = JSON.stringify({ time: time });
      var commentURL = url + "/comments";
      sendRequest('DELETE', commentURL, data);
    }
    catch(err) {
      document.getElementById("error").innerHTML = err.message;
    }
  }

  function publicSaveTitle() {

    try {
      var titleElement = document.getElementById("title");
      var newTitle = titleElement.innerHTML;

      videoModel.updateTitle(newTitle);

      var data = JSON.stringify(videoModel.get());
      sendRequest('PUT', url, data);
    }
    catch(err) {
      document.getElementById("error").innerHTML = err.message;
    }
  }

  function publicParseURL() {
    try {
      var link = document.getElementById("link").value;
      var videoId = youtube_parser(link);
      document.getElementById("error").innerHTML = videoId;
      playerModel.getPlayer().loadVideoById(videoId);
    }
    catch(err) {
      document.getElementById("error").innerHTML = err.message;
    }
  }

  function youtube_parser(url){
    var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    var match = url.match(regExp);
    if (match && match[2].length == 11) {
      return match[2];
    } else {
      //error
    }
  }

  return {

    createComment: publicCreateComment,

    deleteComment: publicDeleteComment,

    saveTitle: publicSaveTitle,

    parseURL: publicParseURL

  };

})();

var videoModel = (function () {

  // A private video variable
  var video = {
    id: 1,
    title: "Default Title",
    youtubeId: "Default id",
    comments: []
  };

  function commentSort() {
    video.comments.sort(function (a, b) {
      if (a.time > b.time) {
        return 1;
      }
      if (a.time < b.time) {
        return -1;
      }
      return 0;
    });
  }

  function publicSet(data) {
    video.id = data.id;
    video.title = data.title;
    video.youtubeId = data.youtubeId;
    video.comments = data.comments;
    commentSort();
    this.notify(video);
  }

  function publicAddComment(comment) {
    video.comments.push(comment);
    commentSort();
    this.notify(video);
  }

  function publicDeleteComment(time) {
    for (i = 0; i < video.comments.length; i++) {
      if (video.comments[i].time === time) {
        video.comments.splice(i, 1);
      }
  }
    this.notify(video);
  }

  function publicUpdateTitle(title) {
    video.title = title;
    this.notify(video);
  }

  function publicGet() {
    return video;
  }

  return {

    set: publicSet,

    get: publicGet,

    addComment: publicAddComment,

    deleteComment: publicDeleteComment,

    updateTitle: publicUpdateTitle

  };

})();

var View = (function () {

  var addButton = document.getElementById("add");
  addButton.addEventListener("click", function() {Controller.createComment()});
  var title = document.getElementById("title");
  var comments = document.getElementById("comments");

  var outside = document.documentElement;
  outside.addEventListener("click", function() {Controller.saveTitle()});

  var parseButton = document.getElementById("parseLink");
  parseButton.addEventListener("click", function() {Controller.parseURL()});

  function publicShowTitle(video) {
    title.innerHTML = video.title;
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

      var deleteSpan = document.createElement("span");
      var deleteNode = document.createTextNode(" x");

      deleteSpan.appendChild(deleteNode);
      deleteSpan.setAttribute("class", "time-link");

      timeSpan.appendChild(timeNode);
      timeSpan.setAttribute("class", "time-link");

      listItem.appendChild(timeSpan);
      listItem.appendChild(commentNode);
      listItem.appendChild(deleteSpan);
      listItem.setAttribute("id", listItemId);

      timeSpan.onclick = function() {
        playerModel.getPlayer().seekTo(this.parentNode.id);
      }

      deleteSpan.onclick = function() {
        Controller.deleteComment(parseInt(this.parentNode.id));
      }

      cl.appendChild(listItem);
    }

    if (comments.hasChildNodes() ) {
      comments.removeChild(comments.firstChild);
      comments.appendChild(cl);
    } else {
      comments.appendChild(cl);
    }
  }

  function secondsToHms(d) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);
    return ((h > 0 ? h + ":" + (m < 10 ? "0" : "") : "") + m + ":" +
      (s < 10 ? "0" : "") + s);
  }

  return {

    showTitle: publicShowTitle,

    showComments: publicShowComments

  };

})();

var playerModel =(function () {

  var player;
  var hold = false;

  function publicCreatePlayer(video) {
    player = new YT.Player('player', {
      height: '390',
      width: '640',
      videoId: video.youtubeId,
      events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange
      }
    });
  }

  function onPlayerReady(event) {
    event.target.playVideo();
    setInterval(commentLoad, 1000);
  }

  function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PAUSED) {
      hold = true;
      document.getElementById("caption").style.visibility = "hidden";
    }
    if (event.data == YT.PlayerState.PLAYING) {
      hold = false;
    }
  }

  function publicGetPlayer() {
    return player;
  }

  function commentLoad() {
    try {
      if (hold) { return; };
      var playerTime = Math.round(player.getCurrentTime());
      var comments = videoModel.get().comments;
      for (var i = 0; i < comments.length; i++) {
        if (playerTime == comments[i].time) {
          document.getElementById("caption").style.visibility = "visible";
          document.getElementById("caption").innerHTML = comments[i].comment;
          setTimeout( function() {
            document.getElementById("caption").style.visibility = "hidden";
          }, 3000);
        }
      }
    }
    catch(err) {
      document.getElementById("error").innerHTML = err.message;
    }
  }

  return {

    createPlayer: publicCreatePlayer,

    getPlayer: publicGetPlayer

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

Subject.prototype.notify = function(context) {
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

extend(videoModel, new Subject() );

extend(View, new Observer() );

extend(playerModel, new Observer() );

View.update = function(video) {
  View.showTitle(video);
  View.showComments(video);
}

playerModel.update = function(video) {
  var player = playerModel.getPlayer();
  if (player == null) {
    playerModel.createPlayer(video);
  }
}

videoModel.addObserver(View);

videoModel.addObserver(playerModel);
