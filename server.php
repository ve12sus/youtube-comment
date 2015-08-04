<?php
$utility_obj = new RestUtils;
$new_request = $utility_obj->processRequest();
$controller = new VidController;
switch($new_request->getMethod()) {

	case 'get':
		if (resource == 'videos') {
			$utility_obj->sendResponse($status = 200, $body = $controller->getVideos(),
									   $content_type = 'application/json');
		}
		if (resource == 'id') {
			//get $id with router
			$utility_obj->sendResponse($status = 200, $body = $controller->getVideo($id),
									   $content_type = 'application/json');
		}
		break;

}
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
				 200 => 'OK',
				 201 => 'Created',
				 400 => 'Bad Request',
				 403 => 'Forbidden',
				 404 => 'Not Found',
				 500 => 'Internal Server Error',
				 );
		return (isset($codes[$status])) ? $codes[$status] : '';
	}

	public function getResource($url) {
		$uri = parse_url($url);
		return $uri['path'];
	}
}

class clientRequest {
	private $method;
	private $uri;
	private $request_body;

	public function __construct() {
		$this->method 		= 'get';
		$this->uri		 	= '';
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
		return $this->uri;
	}

	public function getRequestBody() {
		return $this->request_body;
	}
}

class VideoController {
	private $video_obj = array();
	private $comments  = array();

	public function getVideos() {
		$new_video = new video;
		$sql = "SELECT * FROM videos";
		$new_db_connection = new dbConnect();
		$result = $new_db_connection->query($sql);
		while ($row = $result->fetch_assoc()) {
			$video_obj[] = $row;
		}
		return $video_obj;
	}

	public function getVideo($id) {
		$sql = "SELECT * from videos WHERE id = $id";
		$new_db_conn = new dbConnect();
		$result = $new_db_conn->query($sql);
		$video_obj = $result->fetch_assoc();
		$sql = "SELECT * from comments where id = $id";
		$result = $new_db_conn->query($sql);
		while ($row = $result->fetch_assoc()) {
			$comments[] = $row;
		}
		$this->video_obj['comments'][] =  $comments;
		return $video_obj;
	}

	public function dbConnect() {
		$servername = "localhost";
		$username 	= "root";
		$password 	= "admin";
		$dbname 	= "ytc";

		$connection = new mysqli($servername, $username, $password, $dbname);
		if ($connection->connect_errno) {
			die("Unable to connect to database" . $connection->connect_error);
		}
		return $connection;
	}
}

class Video {
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

$new = new Video();
$new->set_video(1, 'new video', 'new id');
$new->set_comment(10, "new comment", "no style");
$new->set_comment(20, "2nd comment", "second ytid");
$new->delete_comment(10);
echo json_encode($new->get_video(), JSON_PRETTY_PRINT);














?>
