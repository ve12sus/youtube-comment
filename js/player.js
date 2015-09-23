var videoModel = (function () {

  // A private video variable
  var privateVideo = {
    title: "Default Title"
  };

  // A private function which
  function privateFunction() {
  }

  function publicSetTitle(title) {
    privateVideo.title = title;
  }

  function publicGetTitle() {
    return privateVideo;
  }

  return {

    setTitle: publicSetTitle,

    getTitle: publicGetTitle

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

  var infoDiv = document.getElementById("info");

  function publicShowTitle(video) {
    infoDiv.innerHTML = video.title;
  }

  return {

    showTitle: publicShowTitle

  };

})();

var Controller = (function () {

  var button = document.getElementById("button");

  button.onclick = function() {
    videoModel.setTitle('new new title');
    videoModel.notify(videoModel.getTitle());
  }
})();

extend(videoModel, new Subject() );

extend(playerModel, new Observer() );

extend(View, new Observer() );

View.update = function(video) {
  View.showTitle(video);
}

videoModel.addObserver(playerModel);

videoModel.addObserver(View);

videoModel.notify(videoModel.getTitle());
