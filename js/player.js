var Controller = (function () {

  var doc = document;
  var resources = new Resources();
  var id = resources.id;
  var mode = resources.mode;
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
      time: Math.floor(Player.time()),
      comment: text,
      style: style
    };

    Video.addComment(comment);

    var commentURL = url + '/comments';
    sendRequest('POST', commentURL, JSON.stringify(comment)).done(
      function(data) {
        Video.set(data);
      });
  }

  function publicDeleteComment(time) {

    var comment = {
      time: time,
    };

    var commentURL = url + '/comments';
    sendRequest('DELETE', commentURL, JSON.stringify(comment)).done(
      function(data) {
        Video.set(data);
      });
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
    alert(comment.time + comment.comment);
    var i;
    var length = video.comments.length;
    for ( i = 0; i < length; i+=1 ) {
      if (video.comments[i].time == comment.time &&
          video.comments[i].comment == comment.comment) {
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

  var doc = document;
  var mode = Controller.getMode();
  var caption = doc.getElementById('caption');
  var title = doc.getElementById('title');
  var buttons = doc.getElementById('buttons');
  var commentsDiv = doc.getElementById('comments');

  function publicRender(data) {
    showTitle(data.title);
    showComments(data);
    if (data.title === '' || data.title === 'default') {
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
    form.id = 'title-form';
    form.className = 'text-border';

    text = doc.createElement('input');
    text.type = 'text';
    text.id = 'title-text';
    text.setAttribute('maxlength', '30');
    text.setAttribute('placeholder', 'Enter a video title');
    text.addEventListener('keyup', function(e) {
      var key = e.which || e.KeyCode;
      save.className = 'save enabled';
      if (key === 13 && text.value.length > 0) {
        Controller.updateTitle(text.value);
      }
      if (key === 27) {
        Controller.updateTitle(Video.get().title);
      }
    });

    cancel = doc.createElement('input');
    cancel.type = 'button';
    //cancel.id = 'title-cancel';
    cancel.className = 'cancel';
    cancel.value = 'Cancel';
    cancel.addEventListener('mouseup', function() {
      Controller.updateTitle(Video.get().title);
    });

    save = doc.createElement('input');
    save.type = 'button';
    //save.id = 'title-save';
    save.className = 'save disabled';
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
    button.id = 'comment-button';
    button.className = 'save enabled';
    button.value = '+ Add a comment';

    var buttonAction = function(e) {
      var key = e.which || e.KeyCode;
      if (key === 13 || key === 32) {
        Player.pause();
        showCommentBar();
      }
    };

    button.addEventListener('keyup', buttonAction);

    button.addEventListener('mouseup', function() {
      Player.pause();
      showCommentBar();
    });
    return button;
  }

  function showButton() {

    var commentButton = new CommentButton();

    //there should be a better implementation later
    buttons.style.height = '55px';

    if (buttons.childNodes[0]) {
      buttons.replaceChild(commentButton, buttons.childNodes[0]);
    } else {
      buttons.appendChild(commentButton);
    }
    commentButton.focus();
  }

  function CommentBar() {
    var commentBar = doc.createElement('div');
    var form = doc.createElement('div');
    var buttonsGroup = doc.createElement('div');
    var text;
    var save;
    var cancel;
    var word;

    text = doc.createElement('input');
    text.type = 'text';
    text.setAttribute('id', 'comment-text');
    text.setAttribute('placeholder', 'Press enter to save');
    text.setAttribute('maxlength', '70');
    text.addEventListener('focus', showCommentSlot);
    text.addEventListener('keyup', function() {
      var preview = this.value;
      //save.setAttribute('id', 'comment-save');
      //save.setAttribute('value', 'Save');
      save.className = 'save enabled';
      livePreview(preview);
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
    save.id = 'comment-save';
    save.value = 'Save';
    save.className = 'save disabled';
    save.addEventListener('mouseup', function() {
      removeCommentSlot();
      Controller.createComment(text.value);
      showButton();
      Player.play();
    });

    cancel = doc.createElement('input');
    cancel.type = 'button';
    cancel.id = 'comment-cancel';
    cancel.className = 'cancel';
    cancel.value = 'cancel';
    cancel.addEventListener('mouseup', function() {
      removeCommentSlot();
      showButton();
      Player.play();
    });

    word = doc.createElement('div');
    word.setAttribute('id', 'comment-wordcount');
    word.innerHTML = '0/70';

    form.id = 'comment-input';
    form.className = 'text-border';
    form.appendChild(text);
    form.appendChild(word);

    buttonsGroup.setAttribute('id', 'comment-buttons');
    buttonsGroup.appendChild(save);
    buttonsGroup.appendChild(cancel);

    commentBar.appendChild(form);
    commentBar.appendChild(buttonsGroup);
    commentBar.setAttribute('id', 'comment-bar');

    return commentBar;
  }

  function showCommentBar() {
    var bar = new CommentBar();

    if (buttons.childNodes[0]) {
      buttons.replaceChild(bar, buttons.childNodes[0]);
    } else {
      buttons.appendChild(bar);
    }
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
    var div;
    var span;
    var text;

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
    var list = doc.getElementById('comment-list');
    var comments = list.childNodes;
    var playerTime;
    var pslot;
    var slot;
    var vidComments = Video.get().comments;
    var length = vidComments.length;

    playerTime = Player.time().toFixed(2);
    slot = new CommentSlot(secondsToHms(playerTime));

    pslot = doc.getElementById('comment-slot');

    if (pslot) {
      pslot.parentElement.removeChild(pslot);
    }

    if (length === 0) {
      list.appendChild(slot);
    } else {
      for ( i = 0; i < length; i+=1 ) {
        if (playerTime <= vidComments[i].time) {
          list.insertBefore(slot, comments[i]);
          break;
        } else {
          list.appendChild(slot);
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

  function MakeLink() {
    var words;
    var form;
    var link;
    var button;

    words = doc.createElement('h1');
    words.innerHTML = 'Comment and caption YouTube videos:';

    form = doc.createElement('div');
    form.setAttribute('id', 'new-link-form');

    link = doc.createElement('input');
    link.type = 'text';
    link.setAttribute('placeholder', 'Paste YouTube link');
    link.setAttribute('id', 'new-link-text');
    link.addEventListener('keyup', function(e) {
      button.className = 'save enabled';
      var key = e.which || e.KeyCode;
      if (key === 13) {
        Controller.createVideo(link.value);
      }
    });

    button = doc.createElement('input');
    button.type = 'button';
    button.value = 'Go';
    button.id = 'new-link-go';
    button.className = 'save disabled';
    button.addEventListener('mouseup', function() {
      Controller.createVideo(link.value);
    });

    form.appendChild(words);
    form.appendChild(link);
    form.appendChild(button);

    return form;
  }

  function publicShowLink() {
    var form = new MakeLink;

    title.style.height = 'auto';
    title.parentElement.insertBefore(form, title);
  }

  function Collection(data) {
    var list = doc.createElement('ul');
    var i;
    var length = data.length;
    var thumb;
    var title;
    var link;
    var url;
    var image;
    var item;

    for ( i = 0; i < length; i += 1 ) {
      title = doc.createTextNode(data[i].title);
      link = doc.createElement('a');
      url = '/~jeff/ytcserver/' + data[i].id;
      thumb = 'http://img.youtube.com/vi/' + data[i].youtubeId + '/1.jpg';

      image = doc.createElement('img');
      image.src = thumb;

      item = doc.createElement('li');
      link.appendChild(title);
      link.setAttribute('class', 'time-link');
      link.setAttribute('href', url);
      item.appendChild(image);
      item.appendChild(link);
      list.appendChild(item);
    }

    return list;
  }

  function newShowCollection(data) {
    var list = new Collection(data);
    var text = doc.createElement('h1');
    text.innerHTML = 'Latest Videos';

    commentsDiv.appendChild(text);
    commentsDiv.appendChild(list);
  }

  function Comments(data) {

    var i;
    var item;
    var id;
    var length = data.comments.length;
    var list;
    var node;
    var span;
    var comment;
    var deleteNode;
    var deleteSpan;

    list = doc.createElement('ul');
    list.setAttribute('id', 'comment-list');

    for ( i = 0; i < length; i += 1 ) {
      item = doc.createElement('li');
      id = data.comments[i].time;
      item.setAttribute('id', id);

      node = doc.createTextNode(secondsToHms(id));

      span = doc.createElement('span');
      span.setAttribute('class', 'time-link');
      span.appendChild(node);
      span.onclick = skipToComment;

      comment = doc.createTextNode(data.comments[i].comment);
      item.appendChild(span);
      item.appendChild(comment);

      deleteNode = doc.createTextNode('delete');
      deleteSpan = doc.createElement('span');
      deleteSpan.setAttribute('class', 'delete-link');
      deleteSpan.appendChild(deleteNode);
      deleteSpan.onmouseup = deleteClick;
      item.appendChild(deleteSpan);
      item.onmouseover = showDelete;
      item.onmouseout = hideDelete;

      list.appendChild(item);
    }
    return list;
  }

  function showComments(data) {
    var list = new Comments(data);

    if (commentsDiv.childNodes[0]) {
      commentsDiv.replaceChild(list, commentsDiv.childNodes[0]);
    } else {
      commentsDiv.appendChild(list);
    }
  }

  function showDelete() {
    this.lastChild.style.visibility = 'visible';
  }

  function hideDelete() {
    this.lastChild.style.visibility = 'hidden';
  }

  function Caption(data) {
    var text = doc.createTextNode(data.comment);
    var span = doc.createElement('span');
    var id = 'cap-' + data.time;
    span.setAttribute('id', id);
    span.appendChild(text);

    return span;
  }

  function publicShowCap(data) {
    var span = new Caption(data);
    caption.innerHTML = '';
    caption.appendChild(span);
    setTimeout(function(){ capOut(span); }, 3000);
  }

  function capOut(span) {
    var cap = doc.getElementById(span.id);
    if (cap) {
      cap.parentElement.removeChild(cap);
    }
  }

  function publicShiftCapUp() {
    caption.style.top = '-70px';
  }

  function publicShiftCapDown() {
    caption.style.top = '-45px';
  }

  function skipToComment() {
    Player.get().seekTo(this.parentNode.id);
  }

  function deleteClick() {
    var time = this.parentElement.id;
    deletePrompt(time);
  }

  function deletePrompt(time) {
    if (confirm("Delete this comment?") == true) {
      Controller.deleteComment(time);
    } else {
      console.log("not confirmed!");
    }
  }

  function secondsToHms(d) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);
    return ((h > 0 ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' +
      (s < 10 ? '0' : '') + s);
  }

  return {

    render: publicRender,

    showNew: publicShowLink,

    showCollection: newShowCollection,

    showCap: publicShowCap,

    capUp: publicShiftCapUp,

    capDown: publicShiftCapDown

  };

})();

var Player =(function () {
  var doc = document;
  var tag = doc.createElement('script');

  tag.src = '//www.youtube.com/iframe_api';
  var firstScriptTag = doc.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  var player;

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
        'onReady': onPlayerReady
      }
    });

    doc.getElementById('player').addEventListener('mouseenter', function () {
      View.capUp();
    });

    doc.getElementById('player').addEventListener('mouseout', function() {
      View.capDown();
    });
  }

  function onPlayerReady(event) {
    event.target.playVideo();

    setInterval(commentLoad, 500);
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

    if (player.getPlayerState() === 1) {
      //change to math.floor to check accuracy
      pTime = Math.floor(player.getCurrentTime());
      comments = Video.get().comments;
      length = comments.length;
      for ( i = 0; i < length; i+=1 ) {
        cTime = comments[i].time;
        if (pTime == cTime) {
          View.showCap(comments[i]);
        }
      }
    }
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
