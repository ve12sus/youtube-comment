<?php
//this is the dev branch
class Server {

    public function serve() {

		$uri = $_SERVER['REQUEST_URI'];
		$method = $_SERVER['REQUEST_METHOD'];
		$paths = explode('/', $this->paths($uri));
		array_shift($paths); //get rid of initials empty string
		//get the right URL on my LAMP stack todo: remove
		$resource = array_shift($paths);      
		$resource = array_shift($paths);
		$resource = array_shift($paths);

		if ($resource == 'videos') {
			$vid_id = array_shift($paths);

			if (empty($vid_id)) {
				$this->handle_videos($method);
			} else {
				$this->handle_id($method, $vid_id);
			}
          
		} else {
			// We only handle resources under 'videos'
			header('HTTP/1.1 404 Not Found');
		}
	}

	private function handle_videos($method) {
		switch($method) {
		case 'GET':
			$this->result();
			break;
		default:
			header('HTTP/1.1 405 Method Not Allowed');
			header('Allow: GET');
			break;
		}
	}

	private function handle_id($method, $vid_id) {
		switch($method) {
		case 'PUT':
			$this->create_video($vid_id);
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

	private function result() {
		$sql = "SELECT * FROM videos";
		$new = $this->mySQLconnect($sql);
		$emparray = array();

		while ($row = $new->fetch_assoc()) {
			$emparray[] = $row;
		}
		if ($emparray == []) {
			header('HTTP/1.1 404 Not Found');
			echo "Record not found";
		} else {
			header('Content-type: application/json');
			echo json_encode($emparray, JSON_PRETTY_PRINT);
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
