var videoModule = (function () {

  // A private video variable
  var privateVideo = {};

  // A private function which
  function privateFunction() {
    console.log(privateVideo.title);
  }

  function publicSetTitle(title) {
    privateVideo.title = title;
  }

  function publicGetTitle() {
    privateFunction();
  }

  return {

    setTitle: publicSetTitle,

    getTitle: publicGetTitle

  };
})();

videoModule.setTitle("hello world");
videoModule.getTitle();

function ObserverList() {
  this.observerList = [];
}

ObserverList.prototype.add = function(obj) {
  return this.observerList.push(obj);
}

function Subject() {
  this.observers = new ObserverList();
}

function extend(obj, extension) {
  for (var key in extension) {
    obj[key] = extension[key];
    }
}

extend(videoModule, new ObserverList() );

