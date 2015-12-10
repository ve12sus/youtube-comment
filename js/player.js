var Controller = (function () {

  var doc = document;
  var resources = new Resources;
  var id = resources.id;
  var mode = resources.mode;
  var url = '/~jeff/ytcserver/api/videos/' + id;
  var errorDisplay = doc.getElementById('error');
  var commentList;

  window.onYouTubeIframeAPIReady = function() {
    sendRequest('GET', url).done(function(data) {
      if (id) {
        Video.set(data);
      } else {
        Video.setCollection(data);
      }
    });
  };

  function Resources() {
    var paths = window.location.pathname.split('/');
    var index = paths.indexOf('ytcserver');

    if (index) {
      this.id = paths[index + 1];
      if (this.id) {
        this.mode = paths[index + 2];
      }
    } else {
      this.id = null;
      this.mode = null;
    }
  }

  /*function getResources() {
    var pathname = window.location.pathname;
    var paths = pathname.split('/');
    var indexLocation = paths.indexOf('ytcserver');
    var obj = {
      id: '',
      mode: ''
    };

    if (indexLocation) {
      obj.id = paths[indexLocation + 1];
      if (obj.id) {
        obj.mode = paths[indexLocation + 2];
      }
    } else {
      obj.id = null;
      obj.mode = 'main';
    }
    return obj;
  }*/

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

    var style; //not used yet

    var comment = {
      time: Math.round(Player.time()),
      comment: text,
      style: style
    };

    Video.addComment(comment);

    try {
      var commentURL = url + '/comments';
      sendRequest('POST', commentURL, JSON.stringify(comment));
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

  function publicUpdateTitle(title) {
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
          title: '',
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

    updateTitle: publicUpdateTitle,

    createVideo: publicCreateVideo

  };

})();

var Video = (function () {

  var video = {
    id: null,
    title: '',
    youtubeId: '',
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

  var commentList;

  function publicRender(data) {
    showTitle(data.title);
    if (data.title == '' || data.title == 'default') {
      showTitleForm();
      setSuper('Enter a title:');
    } else {
      switch (mode) {
        case 'edit':
          showUpdateSubscript();
          setSuper('Now Editing');
          showButton();
          break;
        default:
          setSuper('Now Playing');
      }
    }
  }

  function Title(text) {
    var textNode = doc.createTextNode(text);
    var heading = doc.createElement('h1');
    heading.appendChild(textNode);
    heading.id = 'title-text';
    return heading;
  }

  function showTitle(text) {
    var heading = new Title(text);

    if (title.childNodes[0]) {
      title.replaceChild(heading, title.childNodes[0]);
    } else {
      title.appendChild(heading);
    }
  }

  function setSuper(text) {
    superscript.innerHTML = text;
  }

  function Subscript() {
    var textNode = doc.createTextNode('update');
    var span = doc.createElement('span');
    span.setAttribute('class', 'update-link');
    span.onclick = updateTitle;
    span.appendChild(textNode);
    return span;
  }

  function showUpdateSubscript() {
    var update = new Subscript();

    if (!doc.getElementsByClassName(update.className).length) {
      insertAfter(update, title);
    }
  }

  function TitleForm() {
    var form;

    form = doc.createElement('input');
    form.type = 'text';
    form.setAttribute('id', 'title-form');
    form.setAttribute('maxlength', '30');
    form.setAttribute('placeholder', 'Press enter to save');
    form.addEventListener('keyup', function(e) {
      var key = e.which || e.KeyCode;
      if (key === 13 && form.value.length > 0) {
        Controller.updateTitle(form.value);
      }
      if (key === 27) {
        Controller.updateTitle(Video.get().title);
      }
    });
    return form;
  }

  function showTitleForm() {
    var form =  new TitleForm();

    if (title.childNodes[0]) {
      title.replaceChild(form, title.childNodes[0]);
    } else {
      title.appendChild(form);
    }
  }

  function updateTitle() {
    var form = new TitleForm();
    var oldTitle = Video.get().title;
    form.value = oldTitle;
    if (title.childNodes[0]) {
      title.replaceChild(form, title.childNodes[0]);
    } else {
      title.appendChild(form);
    }
    form.focus();
  }

  function CommentButton() {
    var button = doc.createElement('input');
    var buttonAction = function(e) {
      var key = e.which || e.KeyCode;
      if (key === 13 || key === 32) {
        toggleCommentBar();
        if (this.value == 'Add comment') {
          this.value = 'Cancel';
          Player.pause();
          showCommentSlot();
        } else if (this.value == 'Cancel') {
          this.value = 'Add comment';
          Player.play();
          removeCommentSlot();
        }
      }
    };

    button.type = 'button';
    button.setAttribute('id', 'comment-button');
    button.setAttribute('value', 'Add comment');
    button.addEventListener('keyup', buttonAction);
    button.addEventListener('mouseup', function() {
      toggleCommentBar();
      if (this.value == 'Add comment') {
        this.value = 'Cancel';
        Player.pause();
        showCommentSlot();
      } else if (this.value == 'Cancel') {
        this.value = 'Add comment';
        Player.play();
        removeCommentSlot();
      }
    });
    return button;
  }

  function showButton() {

    var commentButton = new CommentButton();

    if (buttons.childNodes[0]) {
      buttons.replaceChild(commentButton, buttons.childNodes[0]);
    } else {
      buttons.appendChild(commentButton);
    }
    commentButton.focus();
  }

  function CommentBar() {
    var commentBar = doc.createElement('div');
    var inputText = doc.createElement('input');
    var inputButton = doc.createElement('input');
    var wordCount = doc.createElement('div');

    inputText.type = 'text';
    inputText.setAttribute('id', 'new-comment-text');
    inputText.setAttribute('placeholder', 'Enter a comment');
    inputText.setAttribute('maxlength', '70');
    inputText.addEventListener('keyup', function() {
      var text = this.value;
      livePreview(text);
    });
    inputText.addEventListener('keyup', function(e) {
      var key = e.which || e.KeyCode;
      if (key === 13) {
        Player.play();
        toggleCommentBar();
        removeCommentSlot();
        Controller.createComment(inputText.value);
      }
      if (key === 27) {
        toggleCommentBar();
        Player.play();
        removeCommentSlot();
      }
    });

    inputButton.type = 'button';
    inputButton.setAttribute('id', 'new-comment-button');
    inputButton.setAttribute('value', 'Add');
    inputButton.addEventListener('mouseup', function() {
      toggleCommentBar();
      removeCommentSlot();
      Controller.createComment(inputText.value);
      Player.play();
    });

    wordCount.setAttribute('id', 'word-count');

    commentBar.setAttribute('id', 'comment-bar');
    commentBar.appendChild(inputText);
    insertAfter(inputButton, inputText);
    insertAfter(wordCount, inputButton);

    return commentBar;
  }

  function livePreview(text) {
    var count = doc.getElementById('word-count');
    var slot = doc.getElementById('live-comment');

    slot.innerHTML = text;
    if (text.length > 0) {
      count.innerHTML = 70 - text.length;
    }
  }

  function toggleCommentBar() {
    var bar;

    if (!doc.getElementById('comment-bar')) {
      bar = new CommentBar();
      info.insertBefore(bar, commentsDiv);
      bar.firstChild.focus();
    } else {
      bar = doc.getElementById('comment-bar');
      bar.parentElement.removeChild(bar);
      showButton();
    }
  }

  function CommentSlot(time) {
    var slot;
    var text;
    var div;

    slot = doc.createElement('li');
    slot.setAttribute('id', 'comment-slot');
    div = doc.createElement('div');
    div.setAttribute('id', 'live-comment');
    span = doc.createElement('span');
    text = doc.createTextNode(time);
    span.appendChild(text);

    slot.appendChild(span);
    slot.appendChild(div);
    return slot;
  }

  function showCommentSlot() {
    var i;
    var comments = commentList.childNodes;
    var playerTime;
    var slot;
    var vidComments = Video.get().comments;
    var commentTime;

    playerTime = Math.round(Player.time());
    slot = new CommentSlot(secondsToHms(playerTime));

    if (vidComments.length == 0) {
      commentList.appendChild(slot);
    } else {
      for ( i = 0; i < vidComments.length; i+=1 ) {
        commentTime = vidComments[i].time;
        if (playerTime <= commentTime) {
          commentList.insertBefore(slot, comments[i]);
          break;
        } else {
          commentList.appendChild(slot);
        }
      }
    }
  }

  function removeCommentSlot() {
    var slot = doc.getElementById('comment-slot');

    if (doc.getElementById('comment-slot')) {
      slot.parentElement.removeChild(slot);
    }
  }

  function publicShowNewLink() {
    var makelink;
    var label;
    var youtubeLink;
    var youtubeLinkButton;

    if (!doc.getElementById('youtube-link')) {
      makelink = doc.getElementById('makelink');
      label = doc.createElement('label');
      label.setAttribute('for', 'youtube-link');
      label.innerHTML = 'Make your own!';

      youtubeLink = doc.createElement('input');
      youtubeLink.type = 'text';
      youtubeLink.setAttribute('id', 'youtube-link');
      youtubeLink.setAttribute('placeholder', 'Paste YouTube link');
      youtubeLink.setAttribute('size', '35');
      youtubeLink.addEventListener('keyup', function(e) {
        var key = e.which || e.KeyCode;
        if (key === 13) {
          Controller.createVideo(youtubeLink.value);
        }
      });
      youtubeLinkButton = doc.createElement('input');
      youtubeLinkButton.type = 'button';
      youtubeLinkButton.setAttribute('id', 'youtube-link-button');
      youtubeLinkButton.setAttribute('value', 'Go');
      youtubeLinkButton.addEventListener('mouseup', function() {
        Controller.createVideo(youtubeLink.value);
      });
      makelink.appendChild(label);
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

      commentNode = doc.createTextNode(video.comments[i].comment);
      listItem.appendChild(timeSpan);
      listItem.appendChild(commentNode);

      if (mode == 'edit') {
        deleteNode = doc.createTextNode('delete');
        deleteSpan = doc.createElement('span');
        deleteSpan.setAttribute('class', 'delete-link');
        deleteSpan.appendChild(deleteNode);
        deleteSpan.onclick = deleteClick;
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
    };
    Controller.deleteComment(comment);
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
      playerVars: {
        iv_load_policy: 3,
        modestbranding: 1,
        showinfo: 0
      },
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

  function publicPause() {
    player.pauseVideo();
  }

  function publicPlay() {
    player.playVideo();
  }

  function publicTime() {

    return player.getCurrentTime();
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

    pause: publicPause,

    play: publicPlay,

    time: publicTime

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
