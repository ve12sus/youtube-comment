<?php
$api = new RestUtils;
$new_request = $api->processRequest();
echo gettype($new_request);

class RestUtils {
	public function processRequest() {
		$request_method = strtolower($_SERVER['REQUEST_METHOD']);
		$request_uri 	= $_SERVER['REQUEST_URI'];
		$request_body	= file_get_contents('php://input');
		$return_obj		= new clientRequest();

		$return_obj->setMethod($request_method);
		$return_obj->setURI($request_uri);
		$return_obj->setRequestBody(json_decode($request_body));

		return $return_obj;
	}

	public function sendResponse($status = 200, $body = '',
								 $content_type = 'application/json') {
		$status_header = 'HTTP/1.1 '. $status. ' '. $this->getStatusCodeMsg($status);
		header($status_header);
		header("'Content-Type: ' . $content_type");
		if ($body != '') {
			echo $body;
			exit;
		} else {
			//todo make switch with different status and message body
		}
	}

	public function getStatusCodeMsg($status) {
		$codes = array(
				 100 => 'Continue',
				 200 => 'OK'
				 );
		return $codes[$status];
	}
}

class clientRequest {
	private $method;
	private $uri;
	private $request_body;

	public function __construct() {
		$this->method 		= 'get';
		$this->uri 			= array();
		$this->request_body = array();
	}

	public function setMethod($method) {
		$this->method = $method;
	}

	public function setURI($uri) {
		$this->uri = $uri;
	}
	public function setRequestBody($request_body) {
		$this->request_body = $request_body;
	}

	public function getMethod() {
		return $this->method;
	}

	public function getURI() {
		return $this->URI;
	}

	public function getRequestBody() {
		return $this->request_body;
	}
}

class SendResponse {
}

class video {
	private $video_obj = array();
	private $comments  = array();

	public function set_video($id, $title, $youtubeId) {
		$this->video_obj['id'] = $id;
		$this->video_obj['title'] = $title;
		$this->video_obj['youtubeId'] = $youtubeId;
	}

	public function get_video() {
		return $this->video_obj;
	}

	public function set_comment($time, $text, $style) {
		$comments = array("time"=>$time, "text"=>$text, "style"=>$style);
		$this->video_obj['comments'][] = $comments;
	}

	public function delete_comment($time) {
		//todo remove comment somehow from video_obj
	}

	public function get_comments() {
	}

}

class DatabaseUtils {

	private function dbConnect() {
		$servername = "localhost";
		$username 	= "root";
		$password 	= "admin";
		$dbname 	= "ytc";

		//$connection =
	}
}

$new = new video();
$new->set_video(1, 'new video', 'new id');
$new->set_comment(10, "new comment", "no style");
$new->set_comment(20, "2nd comment", "second ytid");
$new->delete_comment(10);
echo json_encode($new->get_video(), JSON_PRETTY_PRINT);














?>
