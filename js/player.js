var videoModel = (function () {

  // A private video variable
  var privateVideo = {
    title: "Default Title",
    comments: [
      { time: 10,
        comment: "Default Comment",
        style: "Default Style"
      }
    ]
  };

  // A private function which
  function privateFunction() {
  }

  function publicSetData(data) {
    privateVideo.title = data.title;
    privateVideo.comments = data.comments;
  }

  function publicGetData() {
    return privateVideo;
  }

  return {

    setData: publicSetData,

    getData: publicGetData

  };
})();

var playerModel = (function () {

  var playerVars = {};

  function publicPlayVid() {
    console.log('playing a video!');
  }

  return {

    playVid: publicPlayVid

  };
})();

function ObserverList() {
  this.observerList = [];
}

ObserverList.prototype.add = function(obj) {
  return this.observerList.push(obj);
}

ObserverList.prototype.count = function() {
  return this.observerList.length;
}

ObserverList.prototype.get = function(index) {
  if(index > -1 && index < this.observerList.length) {
    return this.observerList[index];
  }
}

ObserverList.prototype.indexOf = function(obj, startIndex) {
  var i = startIndex;

  while(i < this.observerList.length) {
    if(this.observerList[i] === obj) {
      return i;
    }
    i++;
  }

  return -1;
}

ObserverList.prototype.removeAt = function(index) {
  this.observerList.splice(index, 1);
}

function Subject() {
  this.observers = new ObserverList();
}

Subject.prototype.addObserver = function(observer) {
  this.observers.add(observer);
}

Subject.prototype.removeObserver = function(observer) {
  this.observers.removeAt(this.observers.indexOf(observer, 0));
}

Subject.prototype.notify = function(context){
  var observerCount = this.observers.count();
  for (var i = 0; i < observerCount; i++) {
    this.observers.get(i).update(context);
  }
}

function extend(obj, extension) {
  for (var key in extension) {
    obj[key] = extension[key];
    }
}

// The Observer
function Observer() {
  this.update = function(context) {
    console.log(context);
  };
}

var View = (function () {

  var heading = document.getElementById("title");
  var commentDiv = document.getElementById("comments");

  function publicShowTitle(video) {
    heading.innerHTML = video.title;
  }

  function publicShowComments(video) {
    var cl = document.createElement("ul");

    for (i = 0; i < video.comments.length; i++) {
      var commentNode = document.createTextNode(video.comments[i].comment);
      var listItem = document.createElement("li");
      listItem.appendChild(commentNode);
      cl.appendChild(listItem);
    }
    commentDiv.replaceChild(cl, commentDiv.childNodes[0]);
  }

  return {

    showTitle: publicShowTitle,

    showComments: publicShowComments

  };

})();

var Controller = (function () {

  var button = document.getElementById("button");

  button.onclick = function() {
    $.ajax({
      url: "http://localhost/~jeff/ytcserver/videos/1",
      dataType: "json",
      success: function(data) {
        videoModel.setData(data);
        videoModel.notify(videoModel.getData());
      }
    });
  }
})();

extend(videoModel, new Subject() );

extend(playerModel, new Observer() );

extend(View, new Observer() );

View.update = function(video) {
  View.showTitle(video);
  View.showComments(video);
}

videoModel.addObserver(playerModel);

videoModel.addObserver(View);

videoModel.notify(videoModel.getData());
