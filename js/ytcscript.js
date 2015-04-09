var xmlhttp = new XMLHttpRequest();
var url = "http://localhost/ytcserver/server.php";

xmlhttp.open("GET", url, false);
xmlhttp.send();

var JSONtext = xmlhttp.responseText;
var myArr = JSON.parse(JSONtext);

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
	  //'onReady': onPlayerReady,
	  'onReady': setInterval(commentLoad, 1000),
	  //'onStateChange': onPlayerStateChange
    }
  });
}

function commentLoad() {
  time = Math.round(player.getCurrentTime());
  document.getElementById('testing').innerHTML = time;
  for (var i = 0; i < myArr.comments.length; i++) {
    if (time >= myArr.comments[i][0]) {
      document.getElementById('comment').innerHTML = myArr.comments[i][1];
    }
  } 
  //clearInterval(commentLoad);		
}

function enterComment() {
    newComment = document.getElementById('commenttext').value; 
    time = Math.round(player.getCurrentTime());
    myArr.comments.push([time, newComment]);
    document.getElementById('inputdisplay').innerHTML = time + " " + newComment + " Added!";

}

function checkObj() {
    document.getElementById('testing').innerHTML = myArr.comments;
}

	  
	
 
