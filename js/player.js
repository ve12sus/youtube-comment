var Controller = (function () {

  var id = findId().id
  var mode = findId().mode;
  var url = "http://localhost/~jeff/ytcserver/api/videos/" + id;

  function findId() {
    var pathname = window.location.pathname;
    var paths = pathname.split("/");
    var indexLocation = paths.indexOf("ytcserver");
    var obj = {
      id: "",
      mode: "",
    };

    if (indexLocation) {
      obj.id = paths[indexLocation + 1];
      if (id) {
        obj.mode = paths[indexLocation + 2];
      }
    } else {
      obj.id = null;
      obj.mode = "main";
    }
    return obj;
  }

  window.onYouTubeIframeAPIReady = function() {
    sendRequest('GET', url).done(function(data) {
      if (id) {
        VideoModel.set(data);
      } else {
        VideoModel.setCollection(data);
      }
    });
  }

  function publicGetMode() {
    return mode;
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

    var currentTime = Math.round(PlayerModel.getPlayer().getCurrentTime());
    var text = document.getElementById("text").value;
    var style =  "kappa";

    var comment = {
      time: currentTime,
      comment: text,
      style: style
    }

    VideoModel.addComment(comment);

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

    VideoModel.deleteComment(time);

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

      VideoModel.updateTitle(newTitle);

      var data = JSON.stringify(VideoModel.get());
      sendRequest('PUT', url, data);
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

  function publicCreateVideo() {
    try {
      var createURL = "http://localhost/~jeff/ytcserver/api/videos";
      var link = document.getElementById("link").value;
      var videoId = youtube_parser(link);
      var video = {
        title: "click me to change",
        youtubeId: videoId
      };
      var data = JSON.stringify(video);
      sendRequest('POST', createURL, data).done(function(data) {
        window.location = "http://localhost/~jeff/ytcserver/" + data.id + "/edit";
      });
    }
    catch(err) {
      document.getElementById("error").innerHTML = err.message;
    }
  }

  return {

    createComment: publicCreateComment,

    deleteComment: publicDeleteComment,

    saveTitle: publicSaveTitle,

    createVideo: publicCreateVideo,

    getMode: publicGetMode
  };

})();

var VideoModel = (function () {

  var video = {
    id: null,
    title: "Default Title",
    youtubeId: "Default id",
    comments: []
  };

  var collection = [];

  function commentSort() {
    try {
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
    catch(err) {
      document.getElementById("error").innerHTML = err.message;
    }
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

  function publicSetCollection(data) {
    for (i = 0; i < data.length; i++) {
      collection.push(data[i]);
    }
    this.notify(collection);
  }

  return {

    set: publicSet,

    get: publicGet,

    addComment: publicAddComment,

    deleteComment: publicDeleteComment,

    updateTitle: publicUpdateTitle,

    setCollection: publicSetCollection

  };

})();

var View = (function () {

  var mode = Controller.getMode();

  var infoPane = document.getElementById("infoPane");
  var title = document.getElementById("title");
  var comments = document.getElementById("comments");

  function publicShowAddComment() {
    if (mode == "edit" && !document.getElementById("text")) {
      var commentTextInput = document.createElement("input");
      commentTextInput.type = "text";
      commentTextInput.setAttribute("id", "text");
      commentTextInput.setAttribute("placeholder", "pause video and comment");
      commentTextInput.setAttribute("size", "40");
      infoPane.insertBefore(commentTextInput, infoPane.childNodes[2]);

      var addButton = document.createElement("input");
      addButton.type = "button";
      addButton.setAttribute("id", "add");
      addButton.setAttribute("value", "add comments");
      addButton.addEventListener("click", function() {Controller.createComment()});
      infoPane.insertBefore(addButton, infoPane.childNodes[3]);
    }
  }

  function publicShowNewLink() {
    if (mode != "edit" && !document.getElementById("link")) {
      var makelink = document.getElementById("makelink");

      var text = document.createTextNode("Make your own!");

      var linkTextInput = document.createElement("input");
      linkTextInput.type = "text";
      linkTextInput.setAttribute("id", "link");
      linkTextInput.setAttribute("placeholder", "paste youtube link");

      var parseButton = document.createElement("input");
      parseButton.type = "button";
      parseButton.setAttribute("id", "parseLink");
      parseButton.setAttribute("value", "go");
      parseButton.addEventListener("click", function() {Controller.createVideo()});

      makelink.appendChild(text);
      makelink.appendChild(linkTextInput);
      makelink.appendChild(parseButton);
    }
  }

  function publicShowShare() {
    if (mode == "edit" && !document.getElementById("share")) {
      var shareURL = document.createElement("input");
      var id = VideoModel.get().id;
      var url = "http://localhost/~jeff/ytcserver/videos/" + id;
      shareURL.type = "text";
      shareURL.setAttribute("id", "share");
      shareURL.setAttribute("value", url);
      shareURL.setAttribute("size", "30");
      infoPane.insertBefore(shareURL, infoPane.lastChild);
    }
  }

  function publicShowCollection(collection) {
    var sign = document.getElementById("sign");
    sign.innerHTML = "Video List";
    var vl = document.createElement("ul");

    for (i = 0; i < collection.length; i++) {
      var titleNode = document.createTextNode(collection[i].title);
      var link = document.createElement("a");
      var url = "http://localhost/~jeff/ytcserver/" + collection[i].id;
      var listItem = document.createElement("li");

      link.appendChild(titleNode);
      link.setAttribute("class", "time-link");
      link.setAttribute("href", url);
      listItem.appendChild(link);
      vl.appendChild(listItem);
    }
    infoPane.appendChild(vl);
  }

  function publicShowTitle(video) {
    title.innerHTML = video.title;
    if (mode == "edit") {
      title.setAttribute("contenteditable", "true");
      var outside = document.documentElement;
      outside.addEventListener("click", function() {Controller.saveTitle()});
    }
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

      if (mode == "edit") {
        var deleteSpan = document.createElement("span");
        var deleteNode = document.createTextNode(" " + "delete");
        deleteSpan.appendChild(deleteNode);
        deleteSpan.setAttribute("class", "time-link");
        listItem.appendChild(deleteSpan);

        deleteSpan.onclick = function() {
        Controller.deleteComment(parseInt(this.parentNode.id));
        }
      }

      listItem.setAttribute("id", listItemId);
      timeSpan.onclick = function() {
        PlayerModel.getPlayer().seekTo(this.parentNode.id);
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

    showComments: publicShowComments,

    showAdd: publicShowAddComment,

    showNew: publicShowNewLink,

    showShare: publicShowShare,

    showCollection: publicShowCollection

  };

})();

var PlayerModel =(function () {

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
      var comments = VideoModel.get().comments;
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

extend(VideoModel, new Subject() );

extend(View, new Observer() );

extend(PlayerModel, new Observer() );

View.update = function(data) {
  if (data[0]) {
    View.showCollection(data);
    View.showNew();
  } else {

    View.showAdd();
    View.showNew();
    View.showTitle(data);
    View.showComments(data);
    View.showShare();
    View.showNew();
  }
}

PlayerModel.update = function(video) {
  if (video[0]) {
    return;
  } else {
    var player = PlayerModel.getPlayer();
    if (player == null) {
      PlayerModel.createPlayer(video);
    }
  }
}

VideoModel.addObserver(View);

VideoModel.addObserver(PlayerModel);
