function loadPlayer(json) {
  var tag = document.createElement('script');

  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  // 3. This function creates an <iframe> (and YouTube player)
  //    after the API code downloads.
  var player;
  window.onYouTubeIframeAPIReady = function() {
    player = new YT.Player('player', {
      height: '390',
      width: '640',
      videoId: json.youtubeId,
      events: {
        'onReady': onPlayerReady,
        //'onStateChange': onPlayerStateChange
      }
    });
  }

  // 4. The API will call this function when the video player is ready.
  function onPlayerReady(event) {
    event.target.playVideo();
  }
}

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

    setSuccess: function() {
      params.success = function(json) {loadPlayer(json);}
    },

    getParams: function() {
      return params;
    }
  }
})();

clientRequest.setUrl("http://localhost/~jeff/ytcserver/videos/1");
clientRequest.setType("GET");
clientRequest.setDataType("json");
clientRequest.setSuccess();

var cr = clientRequest.getParams();

$.ajax(cr);

function showComments(video) {

  for (i = 0; i < video.comments.length; i++) {
    var listItemId = video.comments[i][0].toString();
  }
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

