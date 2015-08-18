$(function() {
	$("#button").click(function () {
		$("#frame").attr("src", "http://www.youtube.com/embed/" +
			 $("input#videoUrl").val() + "?rel=0&autoplay=1");
	});
});
