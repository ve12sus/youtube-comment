<?php
class video {

	private $video_obj = array();


	public function create_video($title, $youtubeId) {
	}

	public function update_video($id, $title, $youtubeId) {
		$this->video_obj['id'] = $id;
		$this->video_obj['title'] = $title;
		$this->video_obj['youtubeId'] = $youtubeId;
	}

	public function get_video() {
		return $this->video_obj;
	}

	public function create_comment($time, $text, $style) {
		$comment = array("time"=>$time, "text"=>$text, "style"=>$style);
		$this->video_obj['comments'][] = $comment;
	}

	public function update_comment($id, $time, $text, $style) {
		//$newcomment = 
	}

	public function delete_comment($id, $time) {
	}

}

$new = new video();
$new->update_video(1, 'new video', 'new id');
$new->create_comment(10, "new comment", "no style");
$new->create_comment(20, "2nd comment", "second ytid");
echo json_encode($new->get_video(), JSON_PRETTY_PRINT);














?>
