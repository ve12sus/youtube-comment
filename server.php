<?php
$new_request = RestUtils::processRequest();
$video = new VideoController;

if ($new_request->getResource() == 'videos') {
	switch($new_request->getMethod()) {
	case 'get':
		$video->selectVideos();
		//echo json_encode($video->getObj(), JSON_PRETTY_PRINT);
		RestUtils::sendResponse(200, $video->getObj());
		break;
	default:
		echo 'default message';
		break;
	}
}

class RestUtils {
	public static function processRequest() {
		$request_method = strtolower($_SERVER['REQUEST_METHOD']);
		$data			= file_get_contents('php://input');
		$return_obj		= new ClientRequest();

		$return_obj->setMethod($request_method);
		$return_obj->setRequestVars();
		$return_obj->setData($data);

		return $return_obj;
	}

	public static function sendResponse($status = 200, $object,
								 $content_type = 'application/json') {
		$status_header = 'HTTP/1.1 '. $status. ' '. RestUtils::getStatusCodeMsg($status);
		header($status_header);
		header("'Content-Type: ' . $content_type");
		echo json_encode($object, JSON_PRETTY_PRINT);
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

class ClientRequest {
	private $method;
	private $resource;
	private $id;
	private $data;

	public function __construct() {
		$this->method 		= 'get';
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

class VideoController {
	private $video_obj;
	private $comments;

	public function getObj() {
		return $this->video_obj;
	}

	public function selectVideos() {
		$sql = "SELECT * from videos";
		$new_conn = $this->dbConnect();
		$result = $new_conn->query($sql);
		while ($row = $result->fetch_assoc()) {
			$this->video_obj[] = $row;
		}
	}

	public function selectVideo() {
	}

	public function createVideo() {
	}

	public function updateVideo() {
	}

	public function createComment() {
	}

	public function updateComment() {
	}

	public function deleteComment() {
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
?>
