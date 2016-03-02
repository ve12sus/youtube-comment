var Controller = (function () {

  var doc = document;
  var resources = new Resources();
  var id = atob(resources.id);
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
          window.location = '/~jeff/ytcserver/' + btoa(data.id) + '/create';
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
    created: '',
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
    video.created = data.created;
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

  var main = doc.getElementById('main');
  var article = main.getElementsByTagName('article')[0];
  var caption = doc.getElementById('caption');
  var info = main.getElementsByClassName('info')[0];

  function publicRender(data) {
    showTitle(data.title);
    showComments(data);
    if (data.title === '' || data.title === 'default') {
      showTitleForm();
    } else {
      switch (mode) {
        case 'create':
          showCommentForm();
          showShareButton();
          break;
        default:
      }
    }
  }

  function Title(text) {
    var node = doc.createTextNode(text);
    var heading = doc.createElement('h1');

    heading.className = "title text";
    heading.appendChild(node);
    if ( mode === 'create' ) {
      heading.addEventListener('mouseup', function() {
        showTitleForm();
      });
    }
    return heading;
  }

  function showTitle(text) {
    var heading = new Title(text);
    var title = main.getElementsByClassName('title')[0];

    if (title) {
      info.replaceChild(heading, title);
    } else {
      info.appendChild(heading);
    }
  }

  function TitleForm() {
    var form;
    var text;
    var cancel;
    var save;

    form = doc.createElement('div');
    form.className = 'title form';

    text = doc.createElement('input');
    text.type = 'text';
    text.maxLength = '30';
    text.placeholder = 'Enter a video title';
    text.addEventListener('focus', function() {
      save.className = 'save highlight';
    });
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
    cancel.className = 'cancel';
    cancel.value = 'Cancel';
    cancel.addEventListener('mouseup', function() {
      Controller.updateTitle(Video.get().title);
    });

    save = doc.createElement('input');
    save.type = 'button';
    save.className = 'save';
    save.value = 'Save';
    save.addEventListener('mouseup', function() {
      Controller.updateTitle(text.value);
    });

    form.appendChild(text);
    form.appendChild(cancel);
    form.appendChild(save);

    return form;
  }

  function showTitleForm() {
    var form = new TitleForm();
    var old = Video.get().title;
    var title = main.getElementsByClassName('title')[0];

    form.firstChild.value = old;
    if (title) {
      info.replaceChild(form, title);
    } else {
      info.appendChild(form);
    }
    form.firstChild.focus();
  }

  function CommentForm() {
    var form;
    var text;
    var cancel;
    var save;

    form = doc.createElement('div');
    form.className = 'comment-form';

    text = doc.createElement('input');
    text.type = 'text';
    text.placeholder = 'Add a new comment';
    text.addEventListener('focus', function() {
      showCommentSlot();
      Player.pause();
      save.className = 'save highlight';
      span = doc.createElement('span');
      span.id = 'live-comment';
      caption.innerHTML = '';
      caption.appendChild(span);
    });
    text.addEventListener('keyup', function(e) {
      var key;

      livePreview(this.value);
      key = e.which || e.KeyCode;
      if (key === 13) {
        Player.play();
        showCommentForm();
        removeCommentSlot();
        Controller.createComment(this.value);
      }
      if (key === 27) {
        Player.play();
        showCommentForm();
        removeCommentSlot();
      }
    });

    cancel = doc.createElement('input');
    cancel.type = 'button';
    cancel.className = 'cancel';
    cancel.value = 'Cancel';
    cancel.addEventListener('mouseup', function() {
      Player.play();
      showCommentForm();
      removeCommentSlot();
    });

    save = doc.createElement('input');
    save.type = 'button';
    save.className = 'save';
    save.value = '+ Add';
    save.addEventListener('mouseup', function() {
      Player.play();
      showCommentForm();
      removeCommentSlot();
      Controller.createComment(text.value);
    });

    form.appendChild(text);
    form.appendChild(cancel);
    form.appendChild(save);

    return form;
  }

  function showCommentForm() {
    var form = new CommentForm();
    var old = doc.getElementsByClassName('comment-form')[0];
    var comments;

    if (old) {
      info.replaceChild(form, old);
    } else {
      comments = doc.getElementsByClassName('comments')[0];
      info.insertBefore(form, comments);
    }
  }

  function livePreview(text) {
    var span = doc.getElementById('live-comment');

    span.innerHTML = text;
  }

  function CommentSlot(time) {
    var row;
    var cell1;
    var cell2;
    var text;

    text = doc.createTextNode(time);

    row = doc.createElement('TR');
    row.id = 'comment-slot';
    cell1 = doc.createElement('TD');
    cell1.className = 'time';
    cell1.appendChild(text);

    text = doc.createTextNode('adding comment...');
    cell2 = doc.createElement('TD');
    cell2.className = 'live-cell';
    cell2.appendChild(text);

    row.appendChild(cell1);
    row.appendChild(cell2);

    return row;
  }

  function showCommentSlot() {
    var table;
    var videoComments;
    var tableComments;
    var length;
    var old;
    var playerTime;
    var slot;
    var i;

    old = doc.getElementById('comment-slot');
    if (old) {
      old.parentElement.removeChild(old);
    }

    playerTime = Player.time().toFixed(2);
    slot = new CommentSlot(secondsToHms(playerTime));
    videoComments = Video.get().comments;
    table = info.getElementsByClassName('comments')[0];

    if (length === 0) {
      table.appendChild(slot);
    } else {
      length = videoComments.length;
      tableComments = table.childNodes;
      for ( i = 0; i < length; i += 1 ) {
        if (playerTime <= videoComments[i].time) {
          table.insertBefore(slot, tableComments[i]);
          break;
        } else {
          table.appendChild(slot);
        }
      }
    }
  }

  function removeCommentSlot() {
    var slot = doc.getElementById('comment-slot');

    if (slot) {
      slot.parentElement.removeChild(slot);
      caption.innerHTML = '';
    }
  }

  function Share() {
    var div = doc.createElement('div');
    var link = doc.createElement('input');
    var text = doc.createTextNode('Share');
    var span = doc.createElement('span');

    span.appendChild(text);

    link.type = 'text';
    link.value = 'http:/localhost/~jeff/ytcserver/' + btoa(Video.get().id);

    div.className = 'share-panel';
    div.appendChild(span);
    div.appendChild(link);
    return div;
  }

  function ShareButton() {
    var button;

    button = doc.createElement('input');
    button.type = 'button';
    button.value = 'Share';
    button.className = 'share';
    return button;
  }

  function showShareButton() {
    var share = new Share;
    var button = doc.getElementsByClassName('share-panel')[0];
    var length = Video.get().comments.length;

    if ( length === 0 && button ) {
      info.removeChild(button);
    }
    if ( length > 0 && !button ) {
      info.appendChild(share);
    }
  }

  function CreateLink() {
    var form;
    var text;
    var button;

    text = doc.createElement('input');
    text.type = 'text';
    text.placeholder = 'Enter YouTube URL';
    text.addEventListener('keyup', function(e) {
      var key = e.which || e.KeyCode;
      if (key === 13) {
        Controller.createVideo(text.value);
      }
    });
    button = doc.createElement('input');
    button.type = 'button';
    button.value = 'Create';
    button.addEventListener('mouseup', function() {
      Controller.createVideo(text.value);
    });

    form = doc.createElement('form');
    form.className = 'create';
    form.appendChild(text);
    form.appendChild(button);

    return form;
  }

  function Collection(data) {
    var form;
    var collection
    var i;
    var length;
    var title;
    var thumb;
    var url;
    var a;
    var b;
    var image;
    var item;
    var heading;
    var info;
    var cap;
    var comment;
    var span;
    var views;
    var viewText;
    var createDate;

    form = new CreateLink;

    collection = doc.createElement('div');
    collection.className = 'collection';
    collection.appendChild(form);

    length = data.length;
    for ( i = 0; i < length; i += 1 ) {

      url = '/~jeff/ytcserver/' + btoa(data[i].id);
      thumb = 'http://img.youtube.com/vi/' + data[i].youtubeId + '/mqdefault.jpg';

      image = doc.createElement('img');
      image.src = thumb;

      a = doc.createElement('a');
      a.href = url;
      a.appendChild(image);

      /* placeholder for actual feature */
      if (data[i].comments[0]) {
        cap = doc.createTextNode(data[i].comments[0].comment);
      } else {
        cap = doc.createTextNode('check out this video');
      }
      span = doc.createElement('span');
      span.className = 'thumb-cap';
      span.appendChild(cap);
      comment = doc.createElement('div');
      comment.className = 'thumb-comment';
      comment.appendChild(span);

      title = doc.createTextNode(data[i].title);
      b = doc.createElement('a');
      b.href = url;
      b.appendChild(title);

      heading = doc.createElement('h3');
      heading.appendChild(b);
      info = doc.createElement('div');
      info.appendChild(heading);

      /* placeholder for actual feature */
      createDate = data[i].created;

      views = doc.createElement('span');
      views.className = 'views';
      viewText = doc.createTextNode('Created on ' + createDate);
      views.appendChild(viewText);
      info.appendChild(views);

      item = doc.createElement('div');
      item.className = 'item';
      item.appendChild(a);
      item.appendChild(comment);
      item.appendChild(info);

      collection.appendChild(item);
    }

    return collection;
  }

  function showCollection(data) {
    var collection = new Collection(data);

    info.appendChild(collection);
  }

  function publicRenderFront(data) {
    var nav = doc.getElementsByTagName('nav')[0];
    var aside = doc.getElementsByTagName('aside')[0];

    article.className = 'frontpage';
    nav.className = 'frontpage';
    aside.className = 'frontpage';

    showCollection(data);
  }

  function Comments(data) {

    var length = data.comments.length;
    var table = doc.createElement('TABLE');
    var row;
    var cell1;
    var cell2;
    var cell3;
    var text;
    var time;
    var del;

    table.className = 'comments';

    for ( i = 0; i < length; i += 1 ) {
      row = doc.createElement('TR');
      td = doc.createElement('TD');

      time = doc.createTextNode(secondsToHms(data.comments[i].time));
      cell1 = doc.createElement('TD');
      cell1.className = 'time';
      cell1.id = data.comments[i].time;
      cell1.onclick = skipToComment;
      cell1.appendChild(time);

      text = doc.createTextNode(data.comments[i].comment);
      cell2 = doc.createElement('TD');
      cell2.className = 'comment';
      cell2.appendChild(text);

      row.appendChild(cell1);
      row.appendChild(cell2);

      if ( mode === 'create' ) {
        del = doc.createTextNode('x');
        cell3 = doc.createElement('TD');
        cell3.className = 'delete';
        cell3.appendChild(del);
        cell3.onmouseup = deleteClick;
        row.appendChild(cell3);
      }

      table.appendChild(row);
    }

    return table;
  }

  function showComments(data) {
    var list = new Comments(data);
    var comments = main.getElementsByClassName('comments')[0];

    if (comments) {
      info.replaceChild(list, comments);
    } else {
      info.appendChild(list);
    }
  }

  function Caption(data) {
    var text = doc.createTextNode(data.comment);
    var span = doc.createElement('span');
    var id = 'cap-' + data.time;

    span.id = id;
    span.appendChild(text);

    return span;
  }

  function publicShowCap(data) {
    var span = new Caption(data);

    caption.innerHTML = '';
    caption.appendChild(span);
  }

  function skipToComment() {
    Player.get().seekTo(this.id);
  }

  function deleteClick() {
    var time = this.parentElement.firstChild.id;
    deletePrompt(time);
  }

  function deletePrompt(time) {
    if (confirm("Delete this comment?") === true) {
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

    renderFront: publicRenderFront,

    showCap: publicShowCap
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
      View.renderFront(data);
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
