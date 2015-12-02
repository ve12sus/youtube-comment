var Controller = (function () {

  var doc = document;
  var id = getResources().id;
  var mode = getResources().mode;
  var url = '//localhost/~jeff/ytcserver/api/videos/' + id;
  var errorDisplay = doc.getElementById('error');

  window.onYouTubeIframeAPIReady = function() {
    sendRequest('GET', url).done(function(data) {
      if (id) {
        VideoModel.set(data);
      } else {
        VideoModel.setCollection(data);
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
      dataType: 'json',
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
      errorDisplay.innerHTML = 'Not a valid YouTube link';
    }
  }

  function publicGetMode() {
    return mode;
  }

  function publicCreateComment() {

    var currentTime = Math.round(PlayerModel.getPlayer().getCurrentTime());
    var text = doc.getElementById('new-comment-text').value;
    var style = '';

    var comment = {
      time: currentTime,
      comment: text,
      style: style
    };

    VideoModel.addComment(comment);

    try {
      var commentURL = url + '/comments';
      var data = JSON.stringify(comment);
      sendRequest('POST', commentURL, data);
    }
    catch(err) {
      errorDisplay.innerHTML = err.message;
    }
  }

  function publicDeleteComment(time) {

    VideoModel.deleteComment(time);

    try {
      var commentURL = url + '/comments';
      var data = JSON.stringify({ time: time });
      sendRequest('DELETE', commentURL, data);
    }
    catch(err) {
      errorDisplay.innerHTML = err.message;
    }
  }

  function publicChangeTitle(title) {
    var data;

    try {
      VideoModel.updateTitle(title);

      data = JSON.stringify(VideoModel.get());
      sendRequest('PUT', url, data);
    }
    catch(err) {
      errorDisplay.innerHTML = err.message;
    }
  }

  function publicCreateVideo(youtubeLink) {
    try {
      var createURL = '//localhost/~jeff/ytcserver/api/videos';
      var videoId = youtube_parser(youtubeLink);
      var video = {
        title: 'I am the title of your video',
        youtubeId: videoId
      };
      var data = JSON.stringify(video);
      sendRequest('POST', createURL, data).done(function(data) {
        window.location = '//localhost/~jeff/ytcserver/' + data.id + '/edit';
      });
    }
    catch(err) {
      errorDisplay.innerHTML = err.message;
    }
  }

  function publicPlayVideo() {
    try {
      PlayerModel.getPlayer().playVideo();
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

    createVideo: publicCreateVideo,

    playVideo: publicPlayVideo

  };

})();

var VideoModel = (function () {

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

  function publicDeleteComment(time) {
    var i;
    for ( i = 0; i < video.comments.length; i+=1 ) {
      if (video.comments[i].time === time) {
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

  var addCommentDiv;
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
    var commentButton;
    var titleButton;

    if (!doc.getElementById('comment-button')) {
      commentButton = doc.createElement('input');
      commentButton.type = 'button';
      commentButton.setAttribute('id', 'comment-button');
      commentButton.setAttribute('value', 'Add comment');
      commentButton.addEventListener('click', function() {
        PlayerModel.pause();
        showAddComment();
        publicShowCommentSlot();
      });
      commentButton.addEventListener('mouseover', function() {
        showHint('Click to add a comment at the current time');
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

  function showAddComment() {
    var textInput;
    var addButton;
    var cancelButton;
    var wordCount;

    if (!doc.getElementById('new-comment-text')) {

      textInput = doc.createElement('input');
      textInput.type = 'text';
      textInput.setAttribute('id', 'new-comment-text');
      textInput.setAttribute('placeholder', 'type a comment');
      textInput.setAttribute('maxlength', '70');

      textInput.addEventListener('mouseover', function() {
        showHint('comments can be 70 characters long');
      });
      textInput.onmouseout = removeHint;
      textInput.addEventListener('keyup', function() {
        var node = doc.getElementById('live-comment');
        node.innerHTML = ' ' + textInput.value;
        wordCount.innerHTML = 70 - textInput.value.length;
      });
      textInput.addEventListener('keypress', function(e) {
        var key = e.which || e.KeyCode;
        if (key === 13) {
          Controller.createComment();
          Controller.playVideo();
          removeCommentSlot();
          removeAddComment();
          showHint('New comment added');
        }
      });

      addCommentDiv = doc.createElement('div');
      addCommentDiv.setAttribute('id', 'new-comment-inputs');
      addCommentDiv.appendChild(textInput);

      addButton = doc.createElement('input');
      addButton.type = 'button';
      addButton.setAttribute('id', 'new-comment-button');
      addButton.setAttribute('value', 'add comment');
      addButton.addEventListener('click', function() {
        Controller.createComment();
        Controller.playVideo();
        removeCommentSlot();
        removeAddComment();
        showHint('New comment added');
      });
      insertAfter(addButton, textInput);

      cancelButton = doc.createElement('input');
      cancelButton.type = 'button';
      cancelButton.setAttribute('id', 'new-comment-cancel');
      cancelButton.setAttribute('value', 'cancel');
      cancelButton.addEventListener('click', function() {
        Controller.playVideo();
        removeCommentSlot();
        removeAddComment();
      });
      insertAfter(cancelButton, addButton);

      wordCount = doc.createElement('div');
      wordCount.setAttribute('id', 'word-count');
      insertAfter(wordCount, cancelButton);

      info.insertBefore(addCommentDiv, commentsDiv);
      textInput.focus();
    }
  }

  function removeAddComment() {
    if (doc.getElementById('new-comment-inputs')) {
      addCommentDiv.parentNode.removeChild(addCommentDiv);
    }
  }

  function publicShowCommentSlot() {
    var playerTime;
    var timeSpan;
    var timeNode;
    var commentNode;
    var vidComments;
    var commentTime;
    var i;

    removeCommentSlot();

    if (!doc.getElementById('comment-slot')) {
      playerTime = Math.round(PlayerModel.getPlayer().getCurrentTime());
      timeNode = doc.createTextNode(secondsToHms(playerTime));

      commentSlot = doc.createElement('li');
      commentSlot.setAttribute('id', 'comment-slot');

      timeSpan = doc.createElement('span');
      timeSpan.appendChild(timeNode);

      commentNode = doc.createElement('div');
      commentNode.setAttribute('id', 'live-comment');

      commentSlot.appendChild(timeSpan);
      commentSlot.appendChild(commentNode);

      vidComments = VideoModel.get().comments;
      for ( i = 0; i < vidComments.length; i+=1 ) {
        commentTime = vidComments[i].time;
        if (playerTime <= commentTime) {
          commentList.insertBefore(commentSlot, commentList.childNodes[i]);
        } else {
          insertAfter(commentSlot, commentList.lastChild);
        }
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
    var link;

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
        link = youtubeLink.value;
        Controller.createVideo(link);
      });
      makelink.appendChild(text);
      makelink.appendChild(youtubeLink);
      makelink.appendChild(youtubeLinkButton);
    }
  }

  function publicShowShare() {
    //TODO feature to share newly created video

    /*if (mode == 'edit' && !document.getElementById('share')) {
      var shareURL = document.createElement('input');
      var id = VideoModel.get().id;
      var url = '//localhost/~jeff/ytcserver/videos/' + id;
      shareURL.type = 'text';
      shareURL.setAttribute('id', 'share');
      shareURL.setAttribute('value', url);
      shareURL.setAttribute('size', '30');
      infoPane.insertBefore(shareURL, infoPane.lastChild);
    }*/
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
      url = '//localhost/~jeff/ytcserver/' + collection[i].id;
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

      commentNode = doc.createTextNode(' ' + video.comments[i].comment);

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
    PlayerModel.getPlayer().seekTo(this.parentNode.id);
  }

  function deleteClick() {
    Controller.deleteComment(parseInt(this.parentNode.id));
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

    showCommentSlot: publicShowCommentSlot,

    showNew: publicShowNewLink,

    showShare: publicShowShare,

    showCollection: publicShowCollection

  };

})();

var PlayerModel =(function () {
  var doc = document;
  var caption = doc.getElementById('caption');
  var tag = doc.createElement('script');

  tag.src = '//www.youtube.com/iframe_api';
  var firstScriptTag = doc.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  var player;
  var hold = false;

  function publicCreatePlayer(video) {
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

  function publicGetPlayer() {
    return player;
  }

  function publicPauseVideo() {
    player.pauseVideo();
  }

  function commentLoad() {
    var playerTime;
    var comments;
    var i;

    try {
      if (hold) { return; }
      playerTime = Math.round(player.getCurrentTime());
      comments = VideoModel.get().comments;

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

    createPlayer: publicCreatePlayer,

    getPlayer: publicGetPlayer,

    pause: publicPauseVideo

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

extend(VideoModel, new Subject() );

extend(View, new Observer() );

extend(PlayerModel, new Observer() );

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

PlayerModel.update = function(video) {
  switch (Object.prototype.toString.call(video)) {
    case ('[object Array]'):
      break;
    default:
      if (PlayerModel.getPlayer() === undefined) {
        PlayerModel.createPlayer(video);
      }
  }
};

VideoModel.addObserver(View);

VideoModel.addObserver(PlayerModel);
