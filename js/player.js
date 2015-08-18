// Load the IFrame Player API code asynchronously.
class Player
{
	var tag = document.createElement('script');
	tag.src = "https://www.youtube.com/player_api";
	var firstScriptTag = document.getElementsByTagName('script')[0];
	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

	// Replace the 'ytplayer' element with an <iframe> and
	// YouTube player after the API code downloads.
	var player;
	function startPlayer() {
  		window.onYouTubeIframeAPIReady = function() {
    		player = new YT.Player('ytplayer', {
      		height: '390',
      		width: '640',
      		videoId: parsedData.id,
	  		events: {
	    		'onReady' : onPlayerReady,
	  		}
    		});
  		}
	}

	function onPlayerReady(event) {
  		event.target.playVideo();
  		setInterval(commentLoad, 1000);
	}

	function commentLoad() {
		playerTime = Math.round(player.getCurrentTime());
		sortedComments = parsedData.comments.sort();
		for (var i = 0; i < sortedComments.length; i ++) {
			if (playerTime >= sortedComments[i][0]) {
			document.getElementById('currentComment').style.visibility = "visible";
			document.getElementById('currentComment').innerHTML = sortedComments[i][1];
    		}
  		}
	}
}

var player = new Player();
player.startPlayer();
