// Load the IFrame Player API code asynchronously.
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/player_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Replace the 'ytplayer' element with an <iframe> and
// YouTube player after the API code downloads.
var player;
setTimeout(function onYouTubeIframeAPIReady() {
  player = new YT.Player('ytplayer', {
    height: '390',
    width: '640',
    videoId: parsedData.id, 
	events: {
	  'onReady' : onPlayerReady,
	}
  });
}, 1000);

function onPlayerReady(event) {
  event.target.playVideo();
  setInterval(commentLoad, 1000);
}

function commentLoad() {
  playerTime = Math.round(player.getCurrentTime());
  console.log(playerTime);
  for (var i = 0; i < parsedData.comments.length; i ++) {
    if (playerTime >= parsedData.comments[i][0]) {
	  document.getElementById('currentComment').innerHTML = parsedData.comments[i][1];
    }
  }
}
