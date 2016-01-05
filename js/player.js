var Controller = (function () {

  var doc = document;
  var resources = new Resources();
  var id = resources.id;
  var mode = resources.mode;
  var url = '/~jeff/ytcserver/api/videos/' + id;
  var errorDisplay = doc.getElementById('error');
  //var commentList;

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

    var commentURL = url + '/comments';
    sendRequest('POST', commentURL, JSON.stringify(comment));
  }

  function publicDeleteComment(comment) {

    Video.deleteComment(comment);

    var commentURL = url + '/comments';
    sendRequest('DELETE', commentURL, JSON.stringify(comment));
  }

  function publicUpdateTitle(title) {

    Video.updateTitle(title);

    var data = Video.get();
    sendRequest('PUT', url, JSON.stringify(data));
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
    var length = video.comments.length;
    for ( i = 0; i < length; i+=1 ) {
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
    var length = data.length;
    for ( i = 0; i < length; i+=1 ) {
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
  var title = doc.getElementById('title');
  var buttons = doc.getElementById('buttons');
  var commentsDiv = doc.getElementById('comments');

  var commentList;

  function publicRender(data) {
    showTitle(data.title);
    if (data.title == '' || data.title == 'default') {
      updateTitle();
    } else {
      switch (mode) {
        case 'edit':
          showButton();
          break;
        default:
      }
    }
  }

  function Title(text) {
    var textNode = doc.createTextNode(text);
    var heading = doc.createElement('h1');
    heading.appendChild(textNode);
    heading.id = 'title-text';
    heading.addEventListener('mouseup', function() {
      updateTitle();
    });
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

  function TitleForm() {
    var form;
    var text;
    var cancel;
    var save;

    form = doc.createElement('div');
    form.setAttribute('id', 'title-form');

    text = doc.createElement('input');
    text.type = 'text';
    text.setAttribute('id', 'title-text');
    text.setAttribute('maxlength', '30');
    text.setAttribute('placeholder', 'Press enter to save');
    text.addEventListener('keyup', function(e) {
      var key = e.which || e.KeyCode;
      if (key === 13 && text.value.length > 0) {
        Controller.updateTitle(text.value);
      }
      if (key === 27) {
        Controller.updateTitle(Video.get().title);
      }
    });

    cancel = doc.createElement('input');
    cancel.type = 'button';
    cancel.setAttribute('id', 'title-cancel');
    cancel.value = 'Cancel';
    cancel.addEventListener('mouseup', function() {
      Controller.updateTitle(Video.get().title);
    });

    save = doc.createElement('input');
    save.type = 'button';
    save.setAttribute('id', 'title-save');
    save.value = 'Save';
    save.addEventListener('mouseup', function() {
      Controller.updateTitle(text.value);
    });

    form.appendChild(text);
    form.appendChild(cancel);
    form.appendChild(save);

    return form;
  }

  function updateTitle() {
    var form = new TitleForm();
    var oldTitle = Video.get().title;
    form.firstChild.value = oldTitle;
    if (title.childNodes[0]) {
      title.replaceChild(form, title.childNodes[0]);
    } else {
      title.appendChild(form);
    }
    form.firstChild.focus();
  }

  function CommentButton() {
    var button = doc.createElement('input');
    button.type = 'button';
    button.setAttribute('id', 'comment-button');
    button.setAttribute('value', '+ Add a comment');

    var buttonAction = function(e) {
      var key = e.which || e.KeyCode;
      if (key === 13 || key === 32) {
        Player.pause();
        showCommentBar();
      }
    }

    button.addEventListener('keyup', buttonAction);

    button.addEventListener('mouseup', function() {
      Player.pause();
      showCommentBar();
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
    var input = doc.createElement('div');
    var buttons = doc.createElement('div');
    var text;
    var save;
    var cancel;
    var word;

    text = doc.createElement('input');
    text.type = 'text';
    text.setAttribute('id', 'comment-text');
    text.setAttribute('placeholder', '<enter> to save');
    text.setAttribute('maxlength', '70');
    text.addEventListener('focus', showCommentSlot);
    text.addEventListener('keyup', function() {
      var text = this.value;
      save.setAttribute('id', 'comment-save');
      save.setAttribute('value', 'Save');
      livePreview(text);
    });
    text.addEventListener('keyup', function(e) {
      var key = e.which || e.KeyCode;
      if (key === 13) {
        Player.play();
        showButton();
        removeCommentSlot();
        Controller.createComment(text.value);
      }
      if (key === 27) {
        showButton();
        Player.play();
        removeCommentSlot();
      }
    });

    save = doc.createElement('input');
    save.type = 'button';
    save.setAttribute('id', 'comment-add');
    save.setAttribute('value', 'Add');
    save.addEventListener('mouseup', function() {
      removeCommentSlot();
      Controller.createComment(text.value);
      showButton();
      Player.play();
    });

    cancel = doc.createElement('input');
    cancel.type = 'button'
    cancel.setAttribute('id', 'comment-cancel');
    cancel.setAttribute('value', 'cancel');
    cancel.addEventListener('mouseup', function() {
      removeCommentSlot();
      showButton();
      Player.play();
    });

    word = doc.createElement('div');
    word.setAttribute('id', 'comment-wordcount');
    word.innerHTML = '0/70';

    input.setAttribute('id', 'comment-input');
    input.appendChild(text);
    input.appendChild(word);

    buttons.setAttribute('id', 'comment-buttons');
    buttons.appendChild(save);
    buttons.appendChild(cancel);

    commentBar.appendChild(input);
    commentBar.appendChild(buttons);
    commentBar.setAttribute('id', 'comment-bar');

    return commentBar;
  }

  function showCommentBar() {
    var bar = new CommentBar();
    buttons.replaceChild(bar, buttons.childNodes[0]);
    bar.firstChild.firstChild.focus();
  }

  function livePreview(text) {
    var count = doc.getElementById('comment-wordcount');
    var slot = doc.getElementById('live-comment');

    slot.innerHTML = text;
    count.innerHTML = (0 + text.length) + '/70';
  }

  function CommentSlot(time) {
    var slot;
    var text;
    var div;

    slot = doc.createElement('li');
    slot.setAttribute('id', 'comment-slot');
    div = doc.createElement('div');
    div.setAttribute('id', 'live-comment');
    div.innerHTML = 'adding comment...';
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
    var pslot;
    var slot;
    var vidComments = Video.get().comments;
    var length = vidComments.length;

    playerTime = Math.round(Player.time());
    slot = new CommentSlot(secondsToHms(playerTime));

    pslot = doc.getElementById('comment-slot');

    if (pslot) {
      pslot.parentElement.removeChild(pslot);
    }

    if (length == 0) {
      commentList.appendChild(slot);
    } else {
      for ( i = 0; i < length; i+=1 ) {
        if (playerTime <= vidComments[i].time) {
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

    if (slot) {
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
    var length = collection.length;
    var titleText;
    var link;
    var url;
    var listItem;

    for ( i = 0; i < length; i+=1 ) {
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
    var length = video.comments.length;
    var timeSpan;
    var timeNode;
    var commentNode;
    var listItem;
    var listItemId;
    var deleteSpan;
    var deleteNode;

    commentList = doc.createElement('ul');
    commentList.setAttribute('id', 'comment-list');

    for ( i = 0; i < length; i+=1 ) {
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
    if (hold) { return; }

    setInterval(commentLoad, 500);
  }

  function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PAUSED) {
      hold = true;
      caption.style.visibility = 'hidden';
    } else if (event.data == YT.PlayerState.PLAYING) {
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
    var cTime;
    var pTime;
    var comments;
    var i;
    var length;

    pTime = Math.round(player.getCurrentTime());
    comments = Video.get().comments;
    length = comments.length;
    for ( i = 0; i < length; i+=1 ) {
      cTime = comments[i].time;
      if (pTime == cTime) {
        caption.style.visibility = 'visible';
        caption.innerHTML = comments[i].comment;
        if (!comments[i + 1] || comments[i+1].time > (pTime + 4) ) {
          hideCaption();
        }
      }
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
