var Controller = (function () {

  var doc = document;
  var id = getResources().id;
  var mode = getResources().mode;
  var url = '/~jeff/ytcserver/api/videos/' + id;
  var errorDisplay = doc.getElementById('error');

  window.onYouTubeIframeAPIReady = function() {
    sendRequest('GET', url).done(function(data) {
      if (id) {
        Video.set(data);
      } else {
        Video.setCollection(data);
      }
    });
  };

  function getResources() {
    var pathname = window.location.pathname;
    var paths = pathname.split('/');
    var indexLocation = paths.indexOf('ytcserver');
    var obj = {
      id: '',
      mode: ''
    };

    if (indexLocation) {
      obj.id = paths[indexLocation + 1];
      if (id) {
        obj.mode = paths[indexLocation + 2];
      }
    } else {
      obj.id = null;
      obj.mode = 'main';
    }
    return obj;
  }

  function sendRequest(method, url, data) {

    return $.ajax({
      url: url,
      contentType: "application/json",
      dataType: "json",
      type: method,
      data: data
    });
  }

  function youtube_parser(url){
    var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    var match = url.match(regExp);
    if (match && match[2].length == 11) {
      return match[2];
    } else {
      return undefined;
    }
  }

  function publicGetMode() {
    return mode;
  }

  function publicCreateComment(text) {

    var currentTime = Math.round(Player.get().getCurrentTime());
    var style = '';

    var comment = {
      time: currentTime,
      comment: text,
      style: style
    };

    Video.addComment(comment);

    try {
      var commentURL = url + '/comments';
      var data = JSON.stringify(comment);
      sendRequest('POST', commentURL, data);
    }
    catch(err) {
      errorDisplay.innerHTML = err.message;
    }
  }

  function publicDeleteComment(comment) {

    Video.deleteComment(comment);

    try {
      var commentURL = url + '/comments';
      var data = JSON.stringify(comment);
      sendRequest('DELETE', commentURL, data);
    }
    catch(err) {
      errorDisplay.innerHTML = err.message;
    }
  }

  function publicChangeTitle(title) {
    var data;

    try {
      Video.updateTitle(title);

      data = JSON.stringify(Video.get());
      sendRequest('PUT', url, data);
    }
    catch(err) {
      errorDisplay.innerHTML = err.message;
    }
  }

  function publicCreateVideo(youtubeLink) {
    try {
      var youtubeId = youtube_parser(youtubeLink);

      if (youtubeId === undefined) {
        errorDisplay.innerHTML = 'Not a valid YouTube link';
      } else {
        var createURL = '/~jeff/ytcserver/api/videos';

        var obj = {
          title: 'I am the title of your video',
          youtubeId: youtubeId
        };

        var data = JSON.stringify(obj);
        sendRequest('POST', createURL, data).done(function(data) {
          window.location = '/~jeff/ytcserver/' + data.id + '/edit';
        });
      }
    }
    catch(err) {
      errorDisplay.innerHTML = err.message;
    }
  }

  return {

    getMode: publicGetMode,

    createComment: publicCreateComment,

    deleteComment: publicDeleteComment,

    changeTitle: publicChangeTitle,

    createVideo: publicCreateVideo

  };

})();

var Video = (function () {

  var video = {
    id: null,
    title: 'Default Title',
    youtubeId: 'Default id',
    comments: []
  };

  var collection = [];

  function commentSort() {
    try {
    video.comments.sort(function (a, b) {
      if (a.time > b.time) {
        return 1;
      }
      if (a.time < b.time) {
        return -1;
      }
      return 0;
    });
    }
    catch(err) {
      document.getElementById('error').innerHTML = err.message;
    }
  }

  function publicSet(data) {
    video.id = data.id;
    video.title = data.title;
    video.youtubeId = data.youtubeId;
    video.comments = data.comments;
    commentSort();
    this.notify(video);
  }

  function publicAddComment(comment) {
    video.comments.push(comment);
    commentSort();
    this.notify(video);
  }

  function publicDeleteComment(comment) {
    var i;
    for ( i = 0; i < video.comments.length; i+=1 ) {
      if (video.comments[i].time === comment.time &&
          video.comments[i].comment == comment.text) {
        video.comments.splice(i, 1);
      }
    }
    this.notify(video);
  }

  function publicUpdateTitle(title) {
    video.title = title;
    this.notify(video);
  }

  function publicGet() {
    return video;
  }

  function publicSetCollection(data) {
    var i;
    for ( i = 0; i < data.length; i+=1 ) {
      collection.push(data[i]);
    }
    this.notify(collection);
  }

  return {

    set: publicSet,

    get: publicGet,

    addComment: publicAddComment,

    deleteComment: publicDeleteComment,

    updateTitle: publicUpdateTitle,

    setCollection: publicSetCollection

  };

})();

var View = (function () {

  var mode = Controller.getMode();
  var doc = document;
  var info = doc.getElementById('info');
  var superscript = doc.getElementById('superscript');
  var title = doc.getElementById('title');
  var buttons = doc.getElementById('buttons');
  var commentsDiv = doc.getElementById('comments');

  var commentButton;
  var commentBar;
  var commentSlot;
  var commentList;

  function publicRender(data) {
    setTitle(data);
    setSuper();

    if (mode == 'edit') {
      showBigButtons();
    }
  }

  function showBigButtons() {
    var titleButton;

    if (!doc.getElementById('comment-button') &&
        !doc.getElementById('new-cancel-button')) {

      commentButton = doc.createElement('input');
      commentButton.type = 'button';
      commentButton.setAttribute('id', 'comment-button');
      commentButton.setAttribute('value', 'Add comment');
      commentButton.addEventListener('click', function() {
        if (commentButton.id == 'comment-button') {
          toggle();
          Player.pause();
          showCommentBar();
          showCommentSlot();
        } else if (commentButton.id == 'new-cancel-button') {
          toggle();
          Player.play();
          removeCommentBar();
          removeCommentSlot();
        }
      });
      commentButton.addEventListener('mouseover', function() {
        if (commentButton.id == 'comment-button') {
          showHint('Click to add a comment at the current time');
        } else if (commentButton.id == 'new-cancel-button') {
          showHint('Click to cancel');
        }
      });
      commentButton.onmouseout = removeHint;
      buttons.appendChild(commentButton);
    }

    if (!doc.getElementById('title-button')) {
      titleButton = doc.createElement('input');
      titleButton.type = 'button';
      titleButton.setAttribute('id', 'title-button');
      titleButton.setAttribute('value', 'Change title');
      titleButton.addEventListener('click', function() {
        changeTitle();
      });
      titleButton.addEventListener('mouseover', function() {
        showHint('Click to change the title');
      });
      titleButton.onmouseout = removeHint;
      buttons.appendChild(titleButton);
    }
  }

  function toggle() {
    if (commentButton.id == 'comment-button') {
      commentButton.id = 'new-cancel-button';
      commentButton.value = 'Cancel';
    } else if (commentButton.id == 'new-cancel-button') {
      commentButton.id = 'comment-button';
      commentButton.value = 'Add comment';
    }
  }

  function changeTitle() {

    title.setAttribute('contenteditable', 'true');
    title.innerHTML = '';
    title.addEventListener('focus', function() {
      showHint('Press enter to save');
    });
    title.addEventListener('keypress', function(e) {
      var key;
      key = e.which || e.KeyCode;
      if (key === 13) {
        e.preventDefault();
        title.blur();

        if (title.innerHTML.length !== 0) {
          Controller.changeTitle(title.innerHTML);
          showHint('Title updated');
        }
      }
    });
    title.focus();
  }

  function showCommentBar() {
    var textInput;
    var addButton;
    var wordCount;

    if (!doc.getElementById('comment-bar')) {

      textInput = doc.createElement('input');
      textInput.type = 'text';
      textInput.setAttribute('id', 'new-comment-text');
      textInput.setAttribute('placeholder', 'Enter a comment');
      textInput.setAttribute('maxlength', '70');

      textInput.addEventListener('mouseover', function() {
        showHint('comments can be 70 characters long');
      });
      textInput.onmouseout = removeHint;
      textInput.addEventListener('keyup', function() {
        var node = doc.getElementById('live-comment');
        node.innerHTML = textInput.value;
        wordCount.innerHTML = 70 - textInput.value.length;
      });
      textInput.addEventListener('keypress', function(e) {
        var key = e.which || e.KeyCode;
        if (key === 13) {
          Controller.createComment(textInput.value);
          Player.play();
          toggle();
          removeCommentSlot();
          removeCommentBar();
          showHint('New comment added');
        }
      });

      commentBar = doc.createElement('div');
      commentBar.setAttribute('id', 'comment-bar');
      commentBar.appendChild(textInput);

      addButton = doc.createElement('input');
      addButton.type = 'button';
      addButton.setAttribute('id', 'new-comment-button');
      addButton.setAttribute('value', 'Add');
      addButton.addEventListener('click', function() {
        Controller.createComment(textInput.value);
        Player.play();
        toggle();
        removeCommentSlot();
        removeCommentBar();
        showHint('New comment added');
      });
      insertAfter(addButton, textInput);

      wordCount = doc.createElement('div');
      wordCount.setAttribute('id', 'word-count');
      insertAfter(wordCount, addButton);

      info.insertBefore(commentBar, commentsDiv);
      textInput.focus();
    }
  }

  function removeCommentBar() {
    if (doc.getElementById('comment-bar')) {
      commentBar.parentNode.removeChild(commentBar);
    }
  }

  function showCommentSlot() {
    var playerTime = Math.round(Player.get().getCurrentTime());
    var timeSpan;
    var timeNode;
    var commentNode;
    var comments;
    var commentTime;
    var i;

    removeCommentSlot();

    timeNode = doc.createTextNode(secondsToHms(playerTime));

    commentSlot = doc.createElement('li');
    commentSlot.setAttribute('id', 'comment-slot');

    timeSpan = doc.createElement('span');
    timeSpan.appendChild(timeNode);

    commentNode = doc.createElement('div');
    commentNode.setAttribute('id', 'live-comment');

    commentSlot.appendChild(timeSpan);
    commentSlot.appendChild(commentNode);

    comments = Video.get().comments;
    for ( i = 0; i < comments.length; i+=1 ) {
      commentTime = comments[i].time;
      if (playerTime <= commentTime) {
        commentList.insertBefore(commentSlot, commentList.childNodes[i]);
      } else {
        insertAfter(commentSlot, commentList.lastChild);
      }
    }
  }

  function removeCommentSlot() {
    if (doc.getElementById('comment-slot')) {
      commentSlot.parentElement.removeChild(commentSlot);
    }
  }

  function publicShowNewLink() {
    var makelink;
    var text;
    var youtubeLink;
    var youtubeLinkButton;

    if (!doc.getElementById('youtube-link')) {
      makelink = doc.getElementById('makelink');
      text = doc.createTextNode('Make your own!');

      youtubeLink = doc.createElement('input');
      youtubeLink.type = 'text';
      youtubeLink.setAttribute('id', 'youtube-link');
      youtubeLink.setAttribute('placeholder', 'Paste YouTube link');
      youtubeLink.setAttribute('size', '35');

      youtubeLinkButton = doc.createElement('input');
      youtubeLinkButton.type = 'button';
      youtubeLinkButton.setAttribute('id', 'youtube-link-button');
      youtubeLinkButton.setAttribute('value', 'Go');
      youtubeLinkButton.addEventListener('click', function() {
        Controller.createVideo(youtubeLink.value);
      });
      makelink.appendChild(text);
      makelink.appendChild(youtubeLink);
      makelink.appendChild(youtubeLinkButton);
    }
  }

  function publicShowCollection(collection) {
    var videoList = doc.createElement('ul');
    var i;
    var titleText;
    var link;
    var url;
    var listItem;

    for ( i = 0; i < collection.length; i+=1 ) {
      titleText = doc.createTextNode(collection[i].title);
      link = doc.createElement('a');
      url = '/~jeff/ytcserver/' + collection[i].id;
      listItem = doc.createElement('li');

      link.appendChild(titleText);
      link.setAttribute('class', 'time-link');
      link.setAttribute('href', url);
      listItem.appendChild(link);
      videoList.appendChild(listItem);
    }
    title.innerHTML = 'Video List';
    commentsDiv.appendChild(videoList);
  }

  function setTitle(data) {
    title.innerHTML = data.title;
  }

  function setSuper() {
    switch(mode) {
      case 'edit':
        superscript.innerHTML = 'Now editing';
        break;
      default:
        superscript.innerHTML = 'Now playing';
    }
  }

  function publicShowComments(video) {

    var i;
    var timeSpan;
    var timeNode;
    var commentNode;
    var listItem;
    var listItemId;
    var deleteSpan;
    var deleteNode;

    commentList = doc.createElement('ul');
    commentList.setAttribute('id', 'comment-list');

    for ( i = 0; i < video.comments.length; i+=1 ) {
      listItem = doc.createElement('li');
      listItemId = video.comments[i].time;
      listItem.setAttribute('id', listItemId);
      listItem.setAttribute('class', 'comment');

      timeNode = doc.createTextNode(
        secondsToHms(video.comments[i].time));

      timeSpan = doc.createElement('span');
      timeSpan.setAttribute('class', 'time-link');
      timeSpan.appendChild(timeNode);
      timeSpan.onclick = skipToComment;
      timeSpan.addEventListener('mouseover', function() {
        showHint('Seek to this comment');
      });
      timeSpan.onmouseout = removeHint;

      commentNode = doc.createTextNode(video.comments[i].comment);
      listItem.appendChild(timeSpan);
      listItem.appendChild(commentNode);

      if (mode == 'edit') {
        deleteNode = doc.createTextNode('delete');
        deleteSpan = doc.createElement('span');
        deleteSpan.setAttribute('class', 'delete-link');
        deleteSpan.appendChild(deleteNode);
        deleteSpan.onclick = deleteClick;
        deleteSpan.addEventListener('click', function() {
          showHint('comment deleted');
        });
        deleteSpan.addEventListener('mouseover', function() {
          showHint('delete this comment');
        });
        deleteSpan.onmouseout = removeHint;
        listItem.appendChild(deleteSpan);
      }

      commentList.appendChild(listItem);
    }

    if (commentsDiv.hasChildNodes() ) {
      commentsDiv.removeChild(commentsDiv.firstChild);
      commentsDiv.appendChild(commentList);
    } else {
      commentsDiv.appendChild(commentList);
    }
  }

  function skipToComment() {
    Player.get().seekTo(this.parentNode.id);
  }

  function deleteClick() {
    var comment = {
      time: parseInt(this.parentNode.id),
      text: this.parentNode.childNodes[1].nodeValue
    }
    Controller.deleteComment(comment);
  }

  function showHint(hint) {
    var hintDiv = doc.getElementById('hints');
    hintDiv.innerHTML = hint;
  }

  function removeHint() {
    var hintDiv = doc.getElementById('hints');
    hintDiv.innerHTML = "";
  }

  function secondsToHms(d) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);
    return ((h > 0 ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' +
      (s < 10 ? '0' : '') + s);
  }

  function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  }

  return {

    render: publicRender,

    showComments: publicShowComments,

    showNew: publicShowNewLink,

    showCollection: publicShowCollection

  };

})();

var Player =(function () {
  var doc = document;
  var caption = doc.getElementById('caption');
  var tag = doc.createElement('script');

  tag.src = '//www.youtube.com/iframe_api';
  var firstScriptTag = doc.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  var player;
  var hold = false;

  function publicCreate(video) {
    player = new YT.Player('player', {
      height: '390',
      width: '640',
      videoId: video.youtubeId,
      events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange
      }
    });
  }

  function onPlayerReady(event) {
    event.target.playVideo();
    setInterval(commentLoad, 500);
  }

  function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PAUSED) {
      hold = true;
      caption.style.visibility = 'hidden';
    }
    if (event.data == YT.PlayerState.PLAYING) {
      hold = false;
    }
  }

  function publicGet() {
    return player;
  }

  function publicPauseVideo() {
    player.pauseVideo();
  }

  function publicPlayVideo() {
    player.playVideo();
  }

  function commentLoad() {
    var playerTime;
    var comments;
    var i;

    try {
      if (hold) { return; }
      playerTime = Math.round(player.getCurrentTime());
      comments = Video.get().comments;

      for ( i = 0; i < comments.length; i+=1 ) {
        if (playerTime == comments[i].time) {
          caption.style.visibility = 'visible';
          caption.innerHTML = comments[i].comment;
          if (!comments[i + 1] || comments[i+1].time > (playerTime + 4) ) {
            hideCaption();
          }
        }
      }
    }
    catch(err) {
        doc.getElementById('error').innerHTML = err.message;
    }
  }

  function hideCaption() {
    setTimeout( function() {
      caption.style.visibility = 'hidden';
    }, 3000);
  }

  return {

    create: publicCreate,

    get: publicGet,

    pause: publicPauseVideo,

    play: publicPlayVideo

  };

})();

//Observer pattern
function ObserverList() {
  this.observerList = [];
}

ObserverList.prototype.add = function(obj) {
  return this.observerList.push(obj);
};

ObserverList.prototype.count = function() {
  return this.observerList.length;
};

ObserverList.prototype.get = function(index) {
  if(index > -1 && index < this.observerList.length) {
    return this.observerList[index];
  }
};

ObserverList.prototype.indexOf = function(obj, startIndex) {

  var i = startIndex;

  while(i < this.observerList.length) {
    if(this.observerList[i] === obj) {
      return i;
    }
    i++;
  }

  return -1;
};

ObserverList.prototype.removeAt = function(index) {
  this.observerList.splice(index, 1);
};

function Subject() {
  this.observers = new ObserverList();
}

Subject.prototype.addObserver = function(observer) {
  this.observers.add(observer);
};

Subject.prototype.removeObserver = function(observer) {
  this.observers.removeAt(this.observers.indexOf(observer, 0));
};

Subject.prototype.notify = function(context) {
  var observerCount = this.observers.count();
  var i;
  for ( i = 0; i < observerCount; i+=1 ) {
    this.observers.get(i).update(context);
  }
};

function extend(obj, extension) {
  for ( var key in extension ) {
    obj[key] = extension[key];
  }
}

// The Observer
function Observer() {
  this.update = function(context) {
    //to be updated later
  };
}

extend(Video, new Subject() );

extend(View, new Observer() );

extend(Player, new Observer() );

View.update = function(data) {
  switch (Object.prototype.toString.call(data)) {
    case ('[object Array]'):
      View.showCollection(data);
      View.showNew();
      break;
    default:
      View.render(data);
      View.showComments(data);
  }
};

Player.update = function(video) {
  switch (Object.prototype.toString.call(video)) {
    case ('[object Array]'):
      break;
    default:
      if (Player.get() === undefined) {
        Player.create(video);
      }
  }
};

Video.addObserver(View);

Video.addObserver(Player);
