<?php
//this is the dev branch
class Server {

    public function serve() {

		$uri = $_SERVER['REQUEST_URI'];
		$method = $_SERVER['REQUEST_METHOD'];
		$paths = explode('/', $this->paths($uri));
		$collection = $paths[3];
		$vid_id = $paths[4];
		$subcollection = $paths[5];
		$subresource = $paths[6];

		if ($collection == 'videos') {
			
			if (empty($vid_id)) {
				$this->handle_videos($method);
			} else {
				if (empty($subcollection)) {
					$this->handle_id($method, $vid_id);
				} else {
					$this->handle_sub($method, $vid_id, $subcollection, $subresource);
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
			$this->update_video($vid_id);
			break;

		case 'DELETE':
			$this->delete_video($vid_id);
			break;

		case 'GET':
			$this->get_video($vid_id);
			break;

		default:
			header('HTTP/1.1 405 Method Not Allowed');
			header('Allow: GET, POST, DELETE');
			break;
		}
	}
	
	private function add_comment() {
	}

	private function get_comments() {
	}

	private function delete_comment() {
	}
	
	private function handle_sub($method, $vid_id, $subcollection, $subresource) {
		switch($method) {
		case 'GET':
			$this->get_comments($vid_id);
			break;

		case 'POST':
			$this->add_comment($vid_id);
			break;

		case 'DElETE':
			$this->delete_comment($vid_id, $subcollection, $subresource);
			break;
		
		default:
			header('HTTP/1.1 405 Method Not Allowed');
			header('Allow: GET, POST');
			break;
		}
		echo $subcollection;
		echo $subresource;
	}

	private function create_video()	{
		$inputJSON = file_get_contents('php://input');
		$input = json_decode($inputJSON, TRUE);
		$title = $input['title'];
		$youtubeId = $input['youtubeId'];
		$sql = "INSERT INTO videos (title, youtubeId)
			    VALUES ('$title', '$youtubeId')";
		$this->mySQLconnect($sql);
		header('HTTP/1.1 201 Created');
		echo 'New video created';
	}
	
	private function update_video($vid_id) {
		$inputJSON = file_get_contents('php://input');
		$input = json_decode($inputJSON, TRUE);
		$title = $input['title'];
		$youtubeId = $input['youtubeId'];
		$sql = "";
			if (count($input) == 2 ) {
				$sql = "UPDATE videos SET title='$title', youtubeId='$youtubeId'
						WHERE id=$vid_id";
			} else {
				if (in_array("title", $input)) {
					$sql = "UPDATE videos SET title='$title' WHERE id=$vid_id";
				} else {
					$sql = "UPDATE videos SET youtubeId='$youtubeId' WHERE id =$vid_id";
				}
			}
		$new = $this->mySQLconnect($sql);
			if ($new->affected_rows == 0) {
				header('HTTP/1.1 404 Not Found');
				echo $new->affected_rows;
				die('Invalid id');
			} else {
				header('HTTP/1.1 200 OK');
			}
	}

	private function delete_video($vid_id) {
		$sql = "DELETE FROM videos WHERE id=$vid_id";
		$new = $this->mySQLconnect($sql);
			if ($new->affected_rows == 0) {
				header('HTTP/1.1 404 Not Found');
				die('Invalid id');
			} else {
				header('HTTP/1.1 200 OK');
			}			 
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
