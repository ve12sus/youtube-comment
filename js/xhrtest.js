var parsedData = {};

function processData() {
  for (i = 0; i < parsedData.comments.length; i++) {
    var listItemId = parsedData.comments[i][0].toString();
    var commentExists = document.getElementById(listItemId);
    if (typeof(commentExists) != 'undefined' && commentExists !=null){
      continue;
    } else {
      var timeSpan = document.createElement("span");
	  var timeNode = document.createTextNode(
	    secondsToHms(parsedData.comments[i][0]));
	  timeSpan.appendChild(timeNode);
	  timeSpan.setAttribute("class", "time-link");
	  //timeSpan.onclick = function() {
	  //player.seekTo();
	  

	  var listItem = document.createElement("li")
	  var commentNode = document.createTextNode(
		" " + parsedData.comments[i][1]);

	  listItem.appendChild(timeSpan);
	  listItem.appendChild(commentNode);
	  listItem.setAttribute("id", listItemId);

	  var element = document.getElementById("objView");
	  element.appendChild(listItem);
	  timeSpan.onclick = function() {
	    player.seekTo(this.parentNode.id);
	  }
	}
  }
}

function handler() {
  if(this.status == 200 &&
    this.responseText != null) {
    // success!
	parsedData = JSON.parse(this.responseText);
    processData();
	startPlayer();
  } else {
    // something went wrong
    console.log("something went wrong"); 
  }
}

var client = new XMLHttpRequest();
client.onload = handler;
client.open("GET", "comments.json");
client.send();

function newCommentSubmit() {
  var commentTime = Math.floor(player.getCurrentTime())
  var commentText = document.getElementById("commentField").value 
  parsedData.comments.push([commentTime, commentText]);
  document.getElementById('demo2').innerHTML = parsedData.comments;
  processData();
} 

function removeComment() {
  //do something to remove comment from objView and parsedData
}

/*function saveTo() {
  //create new XHR
  var saveXHR = new XMLHttpRequest();
  //specify location of .php
  var url = "save.php";
  //get the parsedData variable somehow to php
  saveXHR.onreadystatechange = function() {
    if (saveXHR.readyState == 4 && saveXHR.status == 200) {
	  document.getElementById("saveDisplay").innerHTML = "saved";
	}
  //XHR.open("POST", url, true);
  saveXHR.send(
  //XHR.onreadystatechange = function() { if readystate == 4 && etc, show file saved }
  //XHR.send(variables)
  }
}*/

function secondsToHms(d) {
  d = Number(d);
  var h = Math.floor(d / 3600);
  var m = Math.floor(d % 3600 / 60);
  var s = Math.floor(d % 3600 % 60);
  return ((h > 0 ? h + ":" + (m < 10 ? "0" : "") : "") + m + ":" + (s < 10 ? "0" : "") + s); }

