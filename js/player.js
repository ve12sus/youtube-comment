var Controller = (function () {

  var resources = new Resources();
  var urls = new Urls();

  window.onYouTubeIframeAPIReady = function() {
    sendRequest('GET', urls.id).done(function(data) {
      if ( resources.videoId ) {
        Video.set(data);
      } else {
        Video.setCollection(data);
      }
    });
  };

  function Urls () {
    this.frontEnd = '/~jeff/ytcserver/';
    this.apiLocation = '/~jeff/ytcserver/api/videos/';
    this.id = this.apiLocation + resources.videoId;
    this.comments = this.apiLocation + resources.videoId + '/comments';
  }

  function Resources() {
    var paths = window.location.pathname.split('/');
    var index = paths.indexOf('ytcserver');

    if (index) {
      this.videoId = paths[index + 1];
      if (this.videoId) {
        this.mode = paths[index + 2];
      }
    } else {
      this.videoId = null;
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
    var regExp;
    var match;

    regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    match = url.match(regExp);
    if (match && match[2].length == 11) {
      return match[2];
    } else {
      return undefined;
    }
  }

  function Comment(time, text) {
    var comment = {
      time: time,
      comment: text
    };
    return comment;
  }

  function publicCreateComment(text) {
    var time;
    var comment;

    if ( text === '' ) {
      alert('Please enter a comment');
    } else {
      time = Math.floor(Player.time());
      comment = new Comment(time, text);

      Video.addComment(comment);

      sendRequest('POST', urls.comments, JSON.stringify(comment)).done(
        function(data) {
          Video.set(data);
        });
    }
  }

  function publicDeleteComment(time, text) {
    var comment;

    comment = new Comment(time, text);
    Video.deleteComment(comment);
    sendRequest('DELETE', urls.comments, JSON.stringify(comment)).done(
      function(data) {
        Video.set(data);
      });
  }

  function publicUpdateTitle(title) {
    var data;

    Video.updateTitle(title);
    data = Video.get;
    sendRequest('PUT', urls.id, JSON.stringify(data));
  }

  function publicCreateVideo(youtubeLink) {
    var data;
    var youtubeId;
    var obj;

    try {
      youtubeId = youtube_parser(youtubeLink);

      if ( youtubeId === undefined ) {
        alert('Not a valid YouTube link');
      } else {
        obj = {
          title: '',
          youtubeId: youtubeId
        };

        data = JSON.stringify(obj);
        sendRequest('POST', urls.apiLocation, data).done(function(data) {
          window.location = urls.frontEnd + data.string_id + '/create';
        });
      }
    }
    catch(err) {
      alert(err.message);
    }
  }

  return {

    mode: resources.mode,

    createComment: publicCreateComment,

    deleteComment: publicDeleteComment,

    updateTitle: publicUpdateTitle,

    createVideo: publicCreateVideo,

    urls: urls

  };

})();

var Video = (function () {

  var video = {
    id: null,
    title: '',
    youtubeId: '',
    created: '',
    string_id: '',
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
    video.string_id = data.string_id;
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
      if (video.comments[i].time == comment.time &&
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

    get: video,

    addComment: publicAddComment,

    deleteComment: publicDeleteComment,

    updateTitle: publicUpdateTitle,

    setCollection: publicSetCollection

  };

})();

var View = (function () {

  var doc = document;
  var mode = Controller.mode;

  var main = doc.getElementById('main');
  var article = main.getElementsByTagName('article')[0];
  var caption = doc.getElementById('caption');
  var info = main.getElementsByClassName('info')[0];


  function publicRender(data) {
    if (data.title === '' || data.title === 'default') {
      showTitleForm();
    } else {
      showTitle(data.title);
    }
    if ( mode === 'create' ) {
      showCommentForm();
    }
    showComments(data);
    if ( mode === 'create') {
      showShare();
    }
    showFooter();
  }

  function publicRenderFront(data) {
    var nav = doc.getElementsByTagName('nav')[0];
    var aside = doc.getElementsByTagName('aside')[0];

    article.className = 'frontpage';
    nav.className = 'frontpage';
    aside.className = 'frontpage';
    showHeader();
    showCreate();
    showSort('Recent');
    showCollection(data);
  }

  var elementGuide = {
    title: 'info',
    commentForm: 'info',
    share: 'info',
    footer: 'footer',
    collection: 'info',
    videoSort: 'info',
    create: 'info',
    comments: 'info',
    headerLogo: 'header'
  };

  function showElement(element) {
    var oldElement = doc.getElementById(element.id);
    var parentElement =
      doc.getElementsByClassName(elementGuide[element.id])[0] ||
      doc.getElementsByTagName(elementGuide[element.id])[0];

    if ( oldElement ) {
      parentElement.replaceChild(element, oldElement);
    } else {
      parentElement.appendChild(element);
    }
  }

  function Title(text) {
    var title;

    title = doc.createElement('h1');
    title.className = 'title text';
    title.id = 'title';
    title.innerHTML = text;
    if ( mode === 'create' ) {
      title.addEventListener('mouseup', showTitleForm);
    }
    return title;
  }

  function showTitle(text) {
    var title = new Title(text);

    showElement(title);
  }

  function TitleForm() {
    var form;
    var text;
    var cancel;
    var save;

    form = doc.createElement('div');
    form.className = 'title form';
    form.id = 'title';

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
        Controller.updateTitle(Video.get.title);
      }
    });

    cancel = doc.createElement('input');
    cancel.type = 'button';
    cancel.className = 'cancel';
    cancel.value = 'Cancel';
    cancel.addEventListener('mouseup', function() {
      Controller.updateTitle(Video.get.title);
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
    var oldTitle = Video.get.title;

    form.firstChild.value = oldTitle;
    showElement(form);
    form.firstChild.focus();
  }

  function CommentForm() {
    var form;
    var text;
    var cancel;
    var save;
    var span;

    form = doc.createElement('div');
    form.className = 'comment-form';
    form.id = 'commentForm';

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

    showElement(form);
  }

  function livePreview(text) {
    var span = doc.getElementById('live-comment');
    if ( span ) {
      span.innerHTML = text;
    }
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
    videoComments = Video.get.comments;
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

  function ShareBox() {
    var div;
    var link;
    var span;
    var url;

    url = 'http://localhost/~jeff/ytcserver/' + Video.get.string_id;

    div = doc.createElement('div');
    link = doc.createElement('input');
    span = doc.createElement('span');
    span.innerHTML = 'Share';
    link.type = 'text';
    link.value = url;
    div.className = 'share-panel';
    div.id = 'share';
    div.appendChild(span);
    div.appendChild(link);
    return div;
  }

  function showShare() {
    var shareBox;
    var length;

    shareBox = new ShareBox();
    length = Video.get.comments.length;

    if ( length > 0 ) {
      showElement(shareBox);
    }
  }

  function CreateLink() {
    var form;
    var text;
    var button;

    text = doc.createElement('input');
    text.type = 'text';
    text.placeholder = 'Paste YouTube link to get started';
    text.addEventListener('keyup', function(e) {
      var key;
      key = e.which || e.KeyCode;
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

    form = doc.createElement('div');
    form.className = 'create';
    form.id = 'create';
    form.appendChild(text);
    form.appendChild(button);

    return form;
  }

  function showCreate() {
    var form;

    form = new CreateLink();
    showElement(form);
  }

  function SortOrder(type) {
    var order;

    order = doc.createElement('h2');
    order.id = 'videoSort';
    order.innerHTML = type + ' Videos';

    return order;
  }

  function showSort(type) {
    var sort = new SortOrder(type);

    showElement(sort);
  }

  function Footer() {
    var footer;
    var form;
    var text;
    var button;
    var span;
    var logo;

    span = doc.createElement('span');
    span.innerHTML = 'YouTube Commentator';
    logo = doc.createElement('div');
    logo.id = 'footer-logo';
    logo.appendChild(span);

    text = doc.createElement('input');
    text.type = 'text';
    text.placeholder = 'Paste YouTube link to get started';
    text.addEventListener('keyup', function(e) {
      var key;
      key = e.which || e.KeyCode;
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

    form = doc.createElement('div');
    form.className = 'foot-create';
    form.appendChild(text);
    form.appendChild(button);

    footer = doc.createElement('div');
    footer.className = 'foot-pane';
    footer.id = 'footer';
    footer.appendChild(logo);
    footer.appendChild(form);

    return footer;
  }

  function showFooter() {
    var footer;

    footer = new Footer();
    showElement(footer);
  }

  function Thumb(data) {
    var linkURL;
    var thumbURL;
    var image;
    var a;
    var captext;
    var span;
    var tinycap;
    var heading;
    var views;
    var info;
    var item;

    linkURL = Controller.urls.frontEnd + data.string_id;
    thumbURL = 'http://img.youtube.com/vi/' + data.youtubeId + '/mqdefault.jpg';

    image = doc.createElement('img');
    image.src = thumbURL;

    a = doc.createElement('a');
    a.href = linkURL;

    if (data.comments[0]) {
      captext = doc.createTextNode(data.comments[0].comment);
    } else {
      captext = doc.createTextNode('check out this video');
    }
    span = doc.createElement('span');
    span.className = 'thumb-cap';
    span.appendChild(captext);

    tinycap = doc.createElement('div');
    tinycap.className = 'thumb-comment';
    tinycap.appendChild(span);

    heading = doc.createElement('h3');
    heading.innerHTML = data.title;

    views = doc.createElement('span');
    views.className = 'views';
    views.innerHTML = (prettyDate(data.created));

    info = doc.createElement('div');
    info.appendChild(heading);
    info.appendChild(views);

    item = doc.createElement('div');
    item.className = 'item';
    item.appendChild(image);
    item.appendChild(tinycap);
    item.appendChild(info);
    item.addEventListener('mouseover', function() {
      heading.className = 'underline';
    });
    item.addEventListener('mouseout', function() {
      heading.className = '';
    });
    a.appendChild(item);
    return a;
  }

  function Collection(data) {
    var collection;
    var rdata;
    var i;
    var thumb;
    var length;

    collection = doc.createElement('div');
    collection.className = 'collection';
    collection.id = 'collection';

    rdata = data.reverse();
    length = data.length;
    for ( i = 0; i < length; i += 1 ) {
      thumb = new Thumb(data[i]);
      collection.appendChild(thumb);
    }
    return collection;
  }

  function showCollection(data) {
    var collection = new Collection(data);

    showElement(collection);
  }

  function prettyDate(time){
    var date = new Date((time || "").replace(/-/g,"/").replace(/[TZ]/g," ")),
      diff = (((new Date()).getTime() - date.getTime()) / 1000),
      day_diff = Math.floor(diff / 86400);

    if ( isNaN(day_diff) || day_diff < 0 || day_diff >= 31 )
      return 'over a month ago';

    return day_diff == 0 && (
      diff < 60 && "just now" ||
      diff < 120 && "1 minute ago" ||
      diff < 3600 && Math.floor( diff / 60 ) + " minutes ago" ||
      diff < 7200 && "1 hour ago" ||
      diff < 86400 && Math.floor( diff / 3600 ) + " hours ago") ||
      day_diff == 1 && "Yesterday" ||
      day_diff < 7 && day_diff + " days ago" ||
      day_diff < 31 && Math.ceil( day_diff / 7 ) + " weeks ago";
  }

  function Header() {
    var span;

    span = doc.createElement('span');
    span.innerHTML = 'YouTube Commander';
    span.id = 'headerLogo';
    return span;
  }

  function showHeader() {
    var header;

    header = new Header();
    showElement(header);
  }

  function Comments(data) {
    var length = data.comments.length;
    var table = doc.createElement('TABLE');
    var row;
    var cell1;
    var cell2;
    var cell3;
    var text;
    var td;
    var time;
    var del;
    var i;

    table.className = 'comments';
    table.id = 'comments';

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

    showElement(list);
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

    setTimeout(function() {checkCap(span); }, 3000);
  }

  function checkCap(cap) {
    if ( doc.getElementById(cap.id) ) {
      caption.innerHTML = '';
    }
  }

  function skipToComment() {
      Player.get().seekTo(this.id - 1);
  }

  function deleteClick() {
    var time = this.parentElement.firstChild.id;
    var comment = this.parentElement.childNodes[1].innerHTML;

    deletePrompt(time, comment);
  }

  function deletePrompt(time, comment) {
    if (confirm("Delete this comment?") === true) {
      Controller.deleteComment(time, comment);
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
  var tag = document.createElement('script');
  tag.src = '//www.youtube.com/iframe_api';

  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  var player;
  var intervalId;
  var comments;
  var YT;

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
  }

  function onPlayerStateChange(event) {

    if (  event.data == YT.PlayerState.PLAYING ) {
      startComments();
    } else {
      stopComments();
    }

    function startComments() {
      comments = Video.get.comments;
      intervalId = setInterval(loadComment, 100);
    }

    function loadComment() {
      var pTime;
      var i;

      pTime = Math.floor(player.getCurrentTime());
      for ( i = 0; i < comments.length; i+=1 ) {
        if ( comments[i].time == pTime ) {
          View.showCap( comments[i] );
        }
      }
    }

    function stopComments() {
      clearInterval(intervalId);
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
