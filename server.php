<?php
//this is the dev branch
class Server {

    public function serve() {

		$uri = $_SERVER['REQUEST_URI'];
		$method = $_SERVER['REQUEST_METHOD'];
		$paths = explode('/', $this->paths($uri));
		$collection = $paths[3];
		$vid_id = $paths[4];
		$subresource = $paths[5];

		if ($collection == 'videos') {
			
			if (empty($vid_id)) {
				$this->handle_videos($method);
			} else {
				if (empty($subresource)) {
					$this->handle_id($method, $vid_id);
				} else {
					$this->handle_sub($method, $vid_id, $subresource);
				}
			}
		} else {
			//currently only handle 'videos' resource
			header('HTTP/1.1 404 Not Found');
		}
	}

	private function handle_videos($method) {
		switch($method) {
		case 'GET':
			$this->retrieve_videos();
			break;
		case 'POST':
			$this->create_video();
			break;
		default:
			header('HTTP/1.1 405 Method Not Allowed');
			header('Allow: GET, POST');
			break;
		}
	}

	private function handle_id($method, $vid_id) {
		switch($method) {
		case 'POST':
			$this->add_comment($vid_id);
			break;

		case 'DELETE':
			$this->delete_video($vid_id);
			break;

		case 'GET':
			$this->get_video($vid_id);
			break;

		default:
			header('HTTP/1.1 405 Method Not Allowed');
			header('Allow: GET, PUT, DELETE');
			break;
		}
	}
	
	private function add_comment() {
	}
	
	private function handle_sub($method, $vid_id, $subresource) {
		echo $subresource;
	}

	private function create_video($vid_id){
		//get request body and respond with confirmation
	}
	
	private function delete_video($vid_id) {
		//get request to the right video url and delete from mysql
	}

	private function get_video($vid_id) {
		$sql = "SELECT * FROM videos WHERE id = $vid_id";
		$new = $this->mySQLconnect($sql);
        $emparray = array();

		while ($row = $new->fetch_assoc()) {
			$emparray[] = $row;
		}
		if ($emparray == []) {
			header('HTTP/1.1 404 Not Found');
			echo "Video not found";
		} else {
			header('Content-type: application/json');
			echo json_encode($emparray, JSON_PRETTY_PRINT); 
		}
    }

	private function paths($url) {
		$uri = parse_url($url);
		return $uri['path'];
	}

	private function retrieve_videos() {
		$sql = "SELECT * FROM videos";
		$new = $this->mySQLconnect($sql);
		$videos = array();

		while ($row = $new->fetch_assoc()) {
			$videos[] = $row;
		}
		if ($videos == []) {
			header('HTTP/1.1 404 Not Found');
			echo "Record not found";
		} else {
			header('Content-type: application/json');
			echo json_encode($videos, JSON_PRETTY_PRINT);	
		}
	}

	private function mySQLconnect($sql) {
		$servername = "localhost";
		$username = "root";
		$password = "admin";
		$dbname = "ytc";

		$connection = new mysqli($servername, $username, $password, $dbname);
		if ($connection->connect_errno) {
			die("Unable to connect to database" . $connection->connect_error);
		}
		$result = $connection->query($sql);
		return $result;
		$result->free();
		$connection->close();
	}	
}

$server = new Server;
$server->serve();

?>
