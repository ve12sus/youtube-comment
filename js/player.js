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
  this.observerList = ['a robot was here', 'hello world', 'hello jeff'];
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
  this.update = function() {
    //...
  }
}
extend(videoModule, new Subject() );

console.log(videoModule.addObserver('Urien'));
console.log(videoModule.observers.get(0));
console.log(videoModule.observers.count());
console.log(videoModule.observers.indexOf('hello jeff', 0));
console.log(videoModule.observers.get(3));
console.log(videoModule.observers.indexOf('mr robot', 0));
console.log(videoModule.removeObserver('Urien'));
console.log(videoModule.observers.count());
