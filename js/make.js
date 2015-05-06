function convertURL() {
  var fullURL = document.myform.url.value;
  var vidId = youtube_parser(fullURL);
  document.myform.url.value = vidId;  
}





function youtube_parser(url){
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    var match = url.match(regExp);
    if (match&&match[7].length==11){
        return match[7];
    }else{
        alert("not a valid youtube url");
    }
}
