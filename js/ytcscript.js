var xmlhttp = new XMLHttpRequest();
var url = "../comments.json";

xmlhttp.open("GET", url, false);
xmlhttp.send();

var myArr = JSON.parse(xmlhttp.responseText);
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '390',
    width: '640',
    videoId: myArr.id, 
    events: {
	  'onReady': onPlayerReady,
	  'onReady': setInterval(commentLoad, 1000)
    }
  });
}

function onPlayerReady(event) {
  event.target.playVideo();
}

function commentLoad(event) {
  var time = player.getCurrentTime();
  for (var i = 0; i < myArr.comments.length; i++) {
    if (time >= myArr.comments[i][0])
	  document.getElementById('comment').innerHTML = myArr.comments[i][1];
  } 
  clearInterval(commentLoad);		
}

function enterComment() {
	var newComment = document.getElementById('commenttext').value; 
	var currentTime = player.getCurrentTime();
	myArr.comments.push([3, 'haha']);
	document.getElementById('inputdisplay').innerHTML = myArr.comments[2] + "Added!";

}
	  
	
 
