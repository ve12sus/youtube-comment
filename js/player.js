var videoModel = (function () {

  // A private video variable
  var privateVideo = {
    title: "Default Title",
    youtubeId: "Default Id",
    comments: [
      { time: 10,
        comment: "Default Comment",
        style: "Default Style"
      }
    ]
  };

  // A private function which
  function privateFunction() {
  }

  function publicSetData(data) {
    privateVideo.title = data.title;
    privateVideo.youtubeId = data.youtubeId;
    privateVideo.comments = data.comments;
  }

  function publicGetData() {
    return privateVideo;
  }

  return {

    setData: publicSetData,

    getData: publicGetData

  };
})();

var playerModel = (function () {

  var tag = document.createElement('script');

  tag.src = "http://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  var player;

  window.onYouTubeIframeAPIReady = function() {
    player = new YT.Player('player', {
      height: '390',
      width: '640',
      videoId: 'M7lc1UVf-VE',
    });
  }

  function publicLoadVid(video) {
    player.loadVideoById({videoId:video.youtubeId});
  }

  function publicGetPlayer() {
    return player;
  }

  return {

    loadVid: publicLoadVid,

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
    console.log(context);
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
        playerModel.getPlayer().seekTo(this.parentNode.id);
      }
      cl.appendChild(listItem);
    }
    commentDiv.replaceChild(cl, commentDiv.childNodes[0]);
  }

  function displayComment() {
  }

  return {

    showTitle: publicShowTitle,

    showComments: publicShowComments

  };

})();

var Controller = (function () {

  var button = document.getElementById("button");

  var search = window.location.pathname;

  var params = search.split("/");
  var before = params.indexOf("ytcserver");
  var after;

  if (before) {
    var after = params[before + 1];
    alert(after);
  }

  button.onclick = function() {
    $.ajax({
      url: "http://localhost/~jeff/ytcserver/api/videos/1",
      dataType: "json",
      success: function(data) {
        videoModel.setData(data);
        videoModel.notify(videoModel.getData());
      }
    });
  }
})();

function secondsToHms(d) {
  d = Number(d);
  var h = Math.floor(d / 3600);
  var m = Math.floor(d % 3600 / 60);
  var s = Math.floor(d % 3600 % 60);
  return ((h > 0 ? h + ":" + (m < 10 ? "0" : "") : "") + m + ":" + (s < 10 ? "0" : "") + s);
}


extend(videoModel, new Subject() );

extend(playerModel, new Observer() );

extend(View, new Observer() );

View.update = function(video) {
  View.showTitle(video);
  View.showComments(video);
}

playerModel.update = function(video) {
  if (playerModel.getPlayer()) {
    playerModel.loadVid(video);
  } else {
    return;
  }
}

videoModel.addObserver(playerModel);

videoModel.addObserver(View);

videoModel.notify(videoModel.getData());
