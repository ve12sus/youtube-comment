var parsedData = {};

function processData() {
  // taking care of data
//  parsedData = JSON.parse(data);
  for (i = 0; i < parsedData.comments.length; i++) {
    var listItem = document.createElement("li");
    var node = document.createTextNode(
    parsedData.comments[i][0] + " " + parsedData.comments[i][1]);
    listItem.appendChild(node);

    var element = document.getElementById("objView");
    element.appendChild(listItem);
  }  
}

function handler() {
  if(this.status == 200 &&
    this.responseText != null) {
    // success!
	parsedData = JSON.parse(this.responseText);
    processData();
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
  commentTime = Math.round(player.getCurrentTime())e
  parsedData.comments.push([commentTime, "infiltration loses"]);
  document.getElementById('demo2').innerHTML = parsedData.comments;
} 

function newDate() {
  document.getElementById('demo1').innerHTML = player.getCurrentTime();
}  
