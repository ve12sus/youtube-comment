var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;

function loadPlayer(json) {
  player = new YT.Player('player', {
    height: '390',
    width: '640',
    videoId: json.youtubeId,
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

function onPlayerReady(event) {
  event.target.playVideo();
  showComments(json);
}

function onPlayerStateChange() {
}

var videoModule = (function () {

  // privates

  var video = {};

  function doSomethingPrivate() {
    //...
  }

    // Return an object exposed to the public
  return {

    // set Object
    setVideo: function(vid_object) {
      video = vid_object;
    },

    getVideo: function() {
      return video;
    },
  }
})();

var clientRequest = (function () {

  var params = {};

  return {

    setUrl: function(url) {
      params.url = url;
    },

    setType: function(type) {
      params.type = type;
    },

    setDataType: function(dataType) {
      params.dataType = dataType;
    },

    setSuccess: function(callback) {
      params.success = callback;
    },

    getParams: function() {
      return params;
    }
  }
})();

function sendRequest(request_object) {
  var cr = request_object.getParams();
  $.ajax(cr);
}

clientRequest.setUrl("http://localhost/~jeff/ytcserver/videos/1");
clientRequest.setType("GET");
clientRequest.setDataType("json");
clientRequest.setSuccess(function(json) {videoModule.setVideo(json); loadPlayer(json);
});

function onYouTubeIframeAPIReady() {
  sendRequest(clientRequest);
}

function showComments(video) {

  for (i = 0; i < video.comments.length; i++) {
    var listItem = document.createElement("li");
    var listItemId = video.comments[i].time;
    var commentNode = document.createTextNode(" " + video.comments[i].comment);
    var timeSpan = document.createElement("span");
    var timeNode = document.createTextNode(secondsToHms(video.comments[i].time));

    timeSpan.appendChild(timeNode);
    listItem.appendChild(timeSpan);
    listItem.appendChild(commentNode);
    listItem.setAttribute("id", listItemId);

    var element = document.getElementById("comments");
    element.appendChild(listItem);
  }
  //here's the seekto function, it will be set to seek to comment.time later
}

function secondsToHms(d) {

  d = Number(d);
  var h = Math.floor(d / 3600);
  var m = Math.floor(d % 3600 / 60);
  var s = Math.floor(d % 3600 % 60);
  return ((h > 0 ? h + ":" + (m < 10 ? "0" : "") : "") + m + ":" + (s < 10 ? "0" : "") +
    s);
}


var videoModule = (function () {

  // privates

  var video = {};

  function doSomethingPrivate() {
    //...
  }

    // Return an object exposed to the public
  return {

    // set Object
    setVideo: function(object) {
      video = object;
    },

    getVideo: function() {
      return video;
    },

    // set Title
    setTitle: function(title) {
      video.title = title;
    },

    //get Title
    getTitle: function() {
      return video.title;
    }
  }
})();

