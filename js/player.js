var Controller = (function () {

  var doc = document;
  var id = findId().id;
  var mode = findId().mode;
  var url = '//localhost/~jeff/ytcserver/api/videos/' + id;
  var errorDiv = doc.getElementById('error');

  function findId() {
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

  window.onYouTubeIframeAPIReady = function() {
    sendRequest('GET', url).done(function(data) {
      if (id) {
        VideoModel.set(data);
      } else {
        VideoModel.setCollection(data);
      }
    });
  };

  function publicGetMode() {
    return mode;
  }

  function sendRequest(method, url, data) {

    return $.ajax({
      url: url,
      dataType: 'json',
      type: method,
      data: data
    });
  }

  function publicCreateComment() {

    var currentTime = Math.round(PlayerModel.getPlayer().getCurrentTime());
    var text = doc.getElementById('new-comment-text').value;
    var style =  'kappa';

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
      errorDiv.innerHTML = err.message;
    }
  }

  function publicDeleteComment(time) {

    VideoModel.deleteComment(time);

    try {
      var data = JSON.stringify({ time: time });
      var commentURL = url + '/comments';
      sendRequest('DELETE', commentURL, data);
    }
    catch(err) {
      errorDiv.innerHTML = err.message;
    }
  }

  function publicChangeTitle() {
    var titleElement;
    var key;
    var newTitle;
    var oldTitle = VideoModel.get().title;
    var hint;
    var data;

    try {
      titleElement = doc.getElementById('title');
      titleElement.setAttribute('contenteditable', 'true');
      titleElement.addEventListener('focus', function() {
        hint = 'Press enter to save';
        View.showHint(hint);
      });
      titleElement.focus();

      titleElement.addEventListener('keypress', function(e) {
        key = e.which || e.keyCode;
        if (key === 13) {
          e.preventDefault();
          doc.getElementById('title').blur();
          newTitle = titleElement.innerHTML;

          VideoModel.updateTitle(newTitle);

          data = JSON.stringify(VideoModel.get());
          sendRequest('PUT', url, data);

          hint = 'Title updated';
          View.showHint(hint);
        }
      });
    }
    catch(err) {
      errorDiv.innerHTML = err.message;
    }
  }

  function youtube_parser(url){
    var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    var match = url.match(regExp);
    if (match && match[2].length == 11) {
      return match[2];
    } else {
      //error
    }
  }

  function publicCreateVideo() {
    try {
      var createURL = '//localhost/~jeff/ytcserver/api/videos';
      var youtubeLink = doc.getElementById('youtube-link').value;
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
      errorDiv.innerHTML = err.message;
    }
  }

  function publicPlayVideo() {
    try {
      PlayerModel.getPlayer().playVideo();
    }
    catch(err) {
      errorDiv.innerHTML = err.message;
    }
  }

  function publicPauseVideo() {
    try {
      PlayerModel.getPlayer().pauseVideo();
    }
    catch(err) {
      errorDiv.innerHTML = err.message;
    }
  }

  return {

    createComment: publicCreateComment,

    deleteComment: publicDeleteComment,

    changeTitle: publicChangeTitle,

    createVideo: publicCreateVideo,

    getMode: publicGetMode,

    playVideo: publicPlayVideo,

    pauseVideo: publicPauseVideo
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
  var infoPane = doc.getElementById('info-panel');
  var superscript = doc.getElementById('superscript');
  var title = doc.getElementById('title');
  var buttons = doc.getElementById('buttons');
  var commentsDiv = doc.getElementById('comments');

  var startButton;
  var titleButton;
  var addCommentDiv;
  var commentTextInput;
  var commentSlot;
  var wordCount;
  var commentList;

  function publicShowBigButtons() {
    var i;

    if (!doc.getElementById('start-button')) {
      startButton = doc.createElement('input');
      startButton.type = 'button';
      startButton.setAttribute('id', 'start-button');
      startButton.setAttribute('value', 'add a comment');
      startButton.addEventListener('click', function() {
        Controller.pauseVideo();
        showAddComment();
        showCommentSlot();
      });
      startButton.addEventListener('mouseover', function() {
        var hint = 'add a comment at the current time'
        showHint(hint);
      });
      startButton.addEventListener('mouseout', function() {
        removeHint();
      });
      buttons.appendChild(startButton);
    }

    if (!doc.getElementById('change-title-button')) {
      titleButton = doc.createElement('input');
      titleButton.type = 'button';
      titleButton.setAttribute('id', 'change-title-button');
      titleButton.setAttribute('value', 'change the title');
      titleButton.addEventListener('click', function() {
        Controller.changeTitle();
      });
      titleButton.addEventListener('mouseover', function() {
        var hint = 'click to change the title of your quickcap';
        showHint(hint);
      });
      titleButton.onmouseout = removeHint;
      buttons.appendChild(titleButton);
    }
  }

  function showAddComment() {
    var addButton;
    var cancelButton;

    if (!doc.getElementById('new-comment-text')) {

      commentTextInput = doc.createElement('input');
      commentTextInput.type = 'text';
      commentTextInput.setAttribute('id', 'new-comment-text');
      commentTextInput.setAttribute('placeholder', 'type a comment');
      commentTextInput.setAttribute('maxlength', '70');

      commentTextInput.addEventListener('mouseover', function() {
        var hint = 'comments can be 70 characters long';
        showHint(hint);
      });
      commentTextInput.addEventListener('mouseout', function() {
        removeHint();
      });
      commentTextInput.addEventListener('keyup', function() {
        commentPreview();
      });

      addCommentDiv = doc.createElement('div');
      addCommentDiv.setAttribute('id', 'new-comment-inputs');
      addCommentDiv.appendChild(commentTextInput);

      addButton = doc.createElement('input');
      addButton.type = 'button';
      addButton.setAttribute('id', 'new-comment-button');
      addButton.setAttribute('value', 'add comment');
      addButton.addEventListener('click', function() {
        var hint = 'new comment added';
        Controller.createComment();
        Controller.playVideo();
        removeCommentSlot();
        removeCommentDiv();
        showHint(hint);
      });
      insertAfter(addButton, commentTextInput);

      cancelButton = doc.createElement('input');
      cancelButton.type = 'button';
      cancelButton.setAttribute('id', 'new-comment-cancel');
      cancelButton.setAttribute('value', 'cancel');
      cancelButton.addEventListener('click', function() {
        Controller.playVideo();
        removeCommentSlot();
        removeCommentDiv();
      });
      insertAfter(cancelButton, addButton);

      wordCount = doc.createElement('div');
      wordCount.setAttribute('id', 'word-count');
      insertAfter(wordCount, cancelButton);

      infoPane.insertBefore(addCommentDiv, commentsDiv);
    }
  }

  function removeCommentDiv() {
    if (doc.getElementById('new-comment-inputs')) {
      addCommentDiv.parentNode.removeChild(addCommentDiv);
    }
  }

  function showCommentSlot() {
    var playerTime;
    var timeSpan;
    var timeNode;
    var commentNode;
    var vidComments;
    var i;

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

  function commentPreview() {
    var node;
    node = doc.getElementById('live-comment');
    node.innerHTML = ' ' + commentTextInput.value;
    wordCount.innerHTML = 70 - commentTextInput.value.length;
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
      youtubeLinkButton.addEventListener('click',
        function() { Controller.createVideo(); });

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
    var vl = doc.createElement('ul');
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
      vl.appendChild(listItem);
    }
    title.innerHTML = 'Video List';
    commentsDiv.appendChild(vl);
  }

  function publicShowTitle(video) {
    if (mode == 'edit') {
      superscript.innerHTML = 'Now editing';
    } else {
      superscript.innerHTML = 'Now playing';
    }

    title.innerHTML = video.title;
    /*if (mode == 'edit' && !doc.getElementById('change-title-button')) {
      titleButton = doc.createElement('input');
      titleButton.type = 'button';
      titleButton.setAttribute('id', 'change-title-button');
      titleButton.setAttribute('value', 'change the title');
      titleButton.addEventListener('click', function() {
        Controller.changeTitle();
      });
      buttons.appendChild(titleButton);
    }
    /*  title.setAttribute('contenteditable', 'true');
      title.addEventListener('keypress', function(e) {
        var key = e.which || e.keyCode;
        if (key === 13) {
          Controller.saveTitle();
        }});
    }*/
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
        var hint = 'seek to this comment';
        showHint(hint);
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
        deleteSpan.addEventListener('click', function () {
          var hint = 'comment deleted';
          showHint(hint);
        });
        deleteSpan.addEventListener('mouseover', function() {
          var hint = 'delete this comment';
          showHint(hint);
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

  function publicShowHint(hint) {
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

    showTitle: publicShowTitle,

    showComments: publicShowComments,

    showNew: publicShowNewLink,

    showShare: publicShowShare,

    showCollection: publicShowCollection,

    showBig: publicShowBigButtons,

    showHint: publicShowHint

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
    setInterval(commentLoad, 1000);
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
          hideCaption();
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

    getPlayer: publicGetPlayer

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
  if (data[0]) {
    View.showCollection(data);
    View.showNew();
  } else if (Controller.getMode() == 'edit') {
    View.showBig();
    View.showTitle(data);
    View.showComments(data);
  } else {
    View.showTitle(data);
    View.showComments(data);
  }
};

PlayerModel.update = function(video) {
  if (video[0]) {
    return;
  } else {
    var player = PlayerModel.getPlayer();
    if (player === undefined) {
      PlayerModel.createPlayer(video);
    }
  }
};

VideoModel.addObserver(View);

VideoModel.addObserver(PlayerModel);
