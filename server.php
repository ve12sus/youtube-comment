<?php
$new_request = RestUtils::processRequest();
$video = new ResponseObj;

if ($new_request->getResource() == 'videos') {
	if (!$new_request->getId()) {
		switch($new_request->getMethod()) {
		case 'get':
			$video->selectVideos();
			RestUtils::sendResponse($video);
			break;
		case 'post':
			$video->createVideo($new_request);
			RestUtils::sendResponse($video);
			break;
		default:
			header('HTTP/1.1 405 Method Not Allowed');
			header('Allow: GET, POST');
			break;
		}
	} else if ($new_request->getId()[0] and !$new_request->getId()[1]) {
		switch($new_request->getMethod()) {
		case 'get':
			$video->selectVideo($new_request);
			RestUtils::sendResponse($video);
			break;
		case 'put':
			$video->updateVideo($new_request);
			RestUtils::sendResponse($video);
			break;
		case 'delete':
			$video->deleteVideo($new_request);
			RestUtils::sendResponse($video);
			break;
		default:
			header('HTTP/1.1 405 Method Not Allowed');
			header('Allow: GET, PUT, DELETE');
		}
	} else if ($new_request->getId()[0] and $new_request->getId()[1] == 'comments') {
		switch($new_request->getMethod()) {
		case 'post':
			$video->createComment($new_request);
			RestUtils::sendResponse($video);
			echo 'hello world';
			break;
		case 'put':
			break;
		case 'delete':
			break;
		}
	} else {
		header('HTTP/1.1 404 Not Found');
	}
} else {
	header('HTTP/1.1 404 Not Found');
}

class RestUtils {
	public static function processRequest() {
		$request_method = strtolower($_SERVER['REQUEST_METHOD']);
		$data			= json_decode(file_get_contents('php://input'), TRUE);
		$return_obj		= new RequestObj();

		$return_obj->setMethod($request_method);
		$return_obj->setRequestVars();
		$return_obj->setData($data);

		return $return_obj;
	}

	public static function sendResponse($response_obj) {
		$status_header = 'HTTP/1.1 ' . $response_obj->getStatus() . ' ' .
						  RestUtils::getStatusCodeMsg($response_obj->getStatus());
		header($status_header);
		header('Content-Type: application/json');
		$response_body = $response_obj->getVidObj();
		if (isset($response_body)) {
			echo json_encode($response_body, JSON_PRETTY_PRINT);
		}
	}
	public static function getStatusCodeMsg($status) {
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
}

class RequestObj {
	private $method;
	private $resource;
	private $id;
	private $data;

	public function __construct() {
		$this->method 		= strtolower($_SERVER['REQUEST_METHOD']);
		$this->resource		= '';
		$this->id			= array();
		$this->data 		= array();
	}

	public function setMethod($method) {
		$this->method = $method;
	}

	public function setRequestVars() {
		$request_URI = explode('/',$_SERVER['REQUEST_URI']);
		$script_name = explode('/', $_SERVER['SCRIPT_NAME']);
			for ($i=0; $i < sizeof($script_name); $i++) {
				if ($request_URI[$i] == $script_name[$i]) {
					unset($request_URI[$i]);
					}
			}
		$rest_URI = array_values($request_URI);
		$rest_resource = $rest_URI[0];
		$rest_id = array_slice($request_URI, 1);
		$this->resource = $rest_resource;
		$this->id = $rest_id;
	}

	public function setData($data) {
		$this->data = $data;
	}

	public function getMethod() {
		return $this->method;
	}

	public function getResource() {
		return $this->resource;
	}

	public function getId() {
		return $this->id;
	}

	public function getData() {
		return $this->data;
	}
}

class ResponseObj {
	private $video_obj;
	private $comments;
	private $status;

	public function getVidObj() {
		return $this->video_obj;
	}

	public function getStatus() {
		return $this->status;
	}

	public function selectVideos() {
		$sql = "SELECT * from videos";
		$new_conn = $this->dbConnect();
		$result = $new_conn->query($sql);
		while ($row = $result->fetch_assoc()) {
			$this->video_obj[] = $row;
		}
		$this->status = 200;
	}

	public function selectVideo($request_obj) {
		$id = $request_obj->getId()[0];
		$sql = "SELECT * FROM videos WHERE id =$id";
		$new_conn = $this->dbConnect();
		$result = $new_conn->query($sql);
		$row = $result->fetch_assoc();
		$this->video_obj = $row;
		if ($row == NULL) {
			$this->status = 404;
		} else {
			$this->status = 200;
		}
		$sql = "SELECT time, comments, style FROM comments WHERE id=$id";
		$new_conn = $this->dbConnect();
		$result = $new_conn->query($sql);
		while ($row = $result->fetch_assoc()) {
			$this->comments[] = $row;
		}
		$this->video_obj['comments'] = $this->comments;
	}

	public function createVideo($request_obj) {
		$title = $request_obj->getData()['title'];
		$youtubeId = $request_obj->getData()['youtubeId'];
		$sql = "INSERT INTO videos (title, youtubeId)
				VALUES ('$title', '$youtubeId')";
		$new_conn = $this->dbConnect();
		$result = $new_conn->query($sql);
		if ($result === TRUE) {
			//$last_id = $new_conn->insert_id;
			$this->video_obj = $result->fetch_assoc();
			$this->status = 201;
		} else {
			$this->status = 400;
		}
	}

	public function updateVideo($request_obj) {
		$title = $request_obj->getData()['title'];
		$youtubeId = $request_obj->getData()['youtubeId'];
		$id = $request_obj->getId()[0];
		$sql = "UPDATE videos
				SET title = '$title',
					youtubeId = '$youtubeId'
				WHERE id = $id";
		$new_conn = $this->dbConnect();
		$new_conn->query($sql);
		if ($new_conn->affected_rows < 1) {
			$this->status = 400;
		} else {
			$this->selectVideo($id);
			$this->status = 200;
		}
	}

	public function deleteVideo($request_obj) {
		$id = $request_obj->getId()[0];
		$sql = "DELETE FROM videos WHERE id=$id";
		$new_conn = $this->dbConnect();
		$new_conn->query($sql);
		if ($new_conn->affected_rows < 1 ) {
			$this->status = 404;
		} else {
			$this->status = 200;
		}
	}

	public function createComment($request_obj) {
		$id = $request_obj->getId()[0];
		$time = $request_obj->getData()['time'];
		$comment = $request_obj->getData()['comment'];
		$style = $request_obj->getData()['style'];
		$sql = "INSERT INTO comments (id, time, comments, style)
				VALUES ($id, $time, '$comment', '$style')";
		$new_conn = $this->dbConnect();
		$new_conn->query($sql);
		if ($new_conn->affected_rows < 1) {
			$this->status = 400;
		} else {
			$this->status = 201;
			//$this->selectVideo($
		}
	}

	/*public function updateComment() {
	}

	public function deleteComment() {
	}*/

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
?>
