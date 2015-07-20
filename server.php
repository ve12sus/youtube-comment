<?php
class Server {

	private $comments = array('1' => array('vidId' => 'HGfCFBAns', 
												'url' => '/videos/1', 
												'comments' => array(
					'10' => 'new comment', 
					'24' => 'Infiltration jump-in')),
                              '2' => array('vidId' => 'qzhxsbDMGLM',
											    'url'=> '/videos/2')
					);
	
    public function serve() {

		$uri = $_SERVER['REQUEST_URI'];
        $method = $_SERVER['REQUEST_METHOD'];
        $paths = explode('/', $this->paths($uri));
        array_shift($paths); // Hack; get rid of initials empty string
        $resource = array_shift($paths);      
		$resource = array_shift($paths);
		$resource = array_shift($paths);

		if ($resource == 'videos') {
            $vid_id = array_shift($paths);
	
            if (empty($vid_id)) {
                $this->handle_base($method);
            } else {
                $this->handle_id($method, $vid_id);
            }
          
        } else {
            // We only handle resources under 'videos'
            header('HTTP/1.1 404 Not Found');
        }
	}

	private function handle_base($method) {
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
            $this->create_contact($vid_id);
            break;

        case 'DELETE':
            $this->delete_contact($vid_id);
            break;
      
        case 'GET':
            $this->display_comments($vid_id);
            break;

        default:
            header('HTTP/1.1 405 Method Not Allowed');
            header('Allow: GET, PUT, DELETE');
            break;
        }
    }

	private function create_contact($vid_id){
        if (isset($this->comments[$vid_id])) {
            header('HTTP/1.1 409 Conflict');
            return;
        }
        /* PUT requests need to be handled
         * by reading from standard input.
         */
        $data = json_decode(file_get_contents('php://input'));
        if (is_null($data)) {
            header('HTTP/1.1 400 Bad Request');
            $this->result();
            return;
        }
        $this->comments[$vid_id] = $data; 
        $this->result();
    }

	private function display_comments($vid_id) {
		$sql = "SELECT * FROM videos WHERE id = $vid_id";
		
    	$this->mySQLconnect($sql); 
         
    }

	private function paths($url) {
        $uri = parse_url($url);
        return $uri['path'];
    }

	private function result() {
		$sql = "SELECT * FROM videos";
		$this->mySQLconnect($sql);
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
		$emparray = array();

		while ($row = $result->fetch_assoc()) {
			$emparray[] = $row; 
		}
		if ($emparray == []){
		header('HTTP/1.1 404 Not Found');
		echo "Record not found";
		} else {
		header('Content-type: application/json');
		echo json_encode($emparray, JSON_PRETTY_PRINT);
		}
		$connection->close();
		
	}	
}

$server = new Server;
$server->serve();

?>
