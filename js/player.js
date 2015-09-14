var videoModule = (function () {

  // A private video variable
  var privateVideo = {};

  // A private function which _________
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
