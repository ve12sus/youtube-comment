var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '390',
    width: '640',
    videoId: obj.id, 
    events: {
	  'onReady': onPlayerReady,
	  'onReady': setInterval(commentLoad, 1000)
    }
  });
}

function onPlayerReady(event) {
  event.target.playVideo();
}

var obj = {
  "id": 'HGfC4CFBAns',
  "comments": [
    [10, 'new comment'],
    [24, 'infiltration jump-in']
  ]
}

function commentLoad(event) {
  var time = player.getCurrentTime();
  for (var i = 0; i < obj.comments.length; i++) {
    if (time >= obj.comments[i][0])
	  document.getElementById('comment').innerHTML = obj.comments[i][1];
  } 
  clearInterval(commentLoad);		
}
	  

 
