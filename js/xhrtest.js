var parsedData = {};

function processData() {
  // taking care of data
//  parsedData = JSON.parse(data);
  for (i = 0; i < parsedData.comments.length; i++) {
	var listItemId = parsedData.comments[i][0].toString();
	var commentExists = document.getElementById(listItemId);
	if (typeof(commentExists) != 'undefined' && commentExists !=null){ 
	  continue; 
	} else {
	  var listItem = document.createElement("li");
      var node = document.createTextNode(
      secondsToHms(parsedData.comments[i][0]) + " " + parsedData.comments[i][1]);
      listItem.appendChild(node);
	  listItem.setAttribute("id", listItemId);
	  console.log(typeof(listItem.id));
	  listItem.onclick = function () { 
	    //this.parentElement.removeChild(this); 
		player.seekTo(this.id);
	  }
      var element = document.getElementById("objView");
      element.appendChild(listItem);
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

function saveTo() {
  //create new XHR
  //specify location of .php
  //get the parsedData variable somehow to php
  //XHR.open("POST", url, true);
  //XHR.onreadystatechange = function() { if readystate == 4 && etc, show file saved }
  //XHR.send(variables)
}

function secondsToHms(d) {
  d = Number(d);
  var h = Math.floor(d / 3600);
  var m = Math.floor(d % 3600 / 60);
  var s = Math.floor(d % 3600 % 60);
  return ((h > 0 ? h + ":" + (m < 10 ? "0" : "") : "") + m + ":" + (s < 10 ? "0" : "") + s); }

