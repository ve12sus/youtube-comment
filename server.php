<?php
class Controller
{
    public function processRequest()
    {
        $request_method = ($_SERVER['REQUEST_METHOD']);
        $request_url    = explode('/', $_SERVER['REQUEST_URI']);
        $script_name    = explode('/', $_SERVER['SCRIPT_NAME']);
        $rest_url       = array_diff($request_url, $script_name);

        $request = new Request;
        $request->setMethod($request_method);
        $request->setResources($rest_url);
		$request->setData(json_decode(file_get_contents('php://input'), TRUE));

        return $request;
    }

	public function route($request)
	{
		$collection = $request->getCollection();
		$id			= $request->getId();
		$resource	= $request->getResource();

		if ($collection == 'videos')
		{
			if (!$id)
			{
				$this->handle_videos($request);
			}
			else
			{
				if (!$resource)
				{
					$this->handle_id($request);
				}
				else
				{
					$this->handle_comments($request);
				}
			}
		}
	}


	public function handle_videos($request)
	{
		switch($request->getMethod())
		{
			case 'GET':
				$this->getVideos($request);
				break;
			case 'POST':
				$this->createVideo($request);
				break;
			default:
				echo 'error';
				break;
		}
	}

	public function handle_id($request)
	{
		switch($request->getMethod())
		{
			case 'GET':
				$this->getVideo($request);
				break;
			case 'PUT':
				$this->updateVideo($request);
				break;
			case 'DELETE':
				$this->deleteVideo($request);
				break;
			default:
				echo 'error';
				break;
		}
	}

	public function handle_comments($request)
	{
		echo 'comments switch';
	}

	public function getVideos($request)
	{
		echo 'get videos function';
	}

	public function createVideo($request)
	{
		echo 'create video function';
	}

	public function getVideo($request)
	{
		$response;
		$database;
		$video;

		try {
			$database = new Database;
		}
		catch (Exception $e) {
			$response = new Response(500, $e->getMessage());
		}
		try {
			$video = $database->getVideo($request);
			$response = new Response(200, $video);
		}
		catch (Exception $e) {
			$response = new Response(404, $e->getMessage());
		}
		$this->sendResponse($response);
	}

	public function updateVideo($request)
	{
		$response;
		$database;
		$video;

		try {
			$database = new Database;
		}
		catch (Exception $e) {
			$response = new Response(500, $e->getMessage());
		}
		try {
			$video = $database->updateVideo($request);
			$response = new Response(200, $video);
		}
		catch (Exception $e) {
			$response = new Response(404, $e->getMessage());
		}
		$this->sendResponse($response);
	}

	public function deleteVideo($request)
	{
		$response;
		$database;
		$video;

		try {
			$database = new Database;
		}
		catch (Exception $e) {
			$response = new Response(500, $e->getMessage());
		}
		try {
			$video = $database->deleteVideo($request);
			$response = new Response(200, $video);
		}
		catch (Exception $e) {
			$response = new Response(404, $e->getMessage());
		}
		$this->sendResponse($response);

	}

	public function sendResponse($response)
	{
		$status = $response->getStatus();
		$video = $response->getBody();

		$status_header = 'HTTP/1.1 ' . $status . ' ' .
			$this->getStatusMsg($status);
		header($status_header);
		header('Content-Type: application/json');
		if (gettype($video) == 'object')
		{
			$video_body = $video->getVidObj();
			echo json_encode($video_body, JSON_PRETTY_PRINT);
		}
		else
		{
			echo $body;
		}
	}

	public function getStatusMsg($status)
	{
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

class Request {

	private $method;
	private $collection;
	private $id;
	private $resource;
	private $data;

    public function setMethod($method)
    {
        $this->method = $method;
    }

    public function getMethod()
    {
        return $this->method;
    }

    public function setResources($url)
    {
        $this->collection = reset($url);
		$this->id = next($url);
		$this->resource = next($url);
    }

    public function getCollection()
    {
        return $this->collection;
    }

    public function getId()
    {
		return $this->id;
	}

	public function getResource()
	{
		return $this->resource;
	}

	public function setData($data)
	{
		$this->data = $data;
	}

	public function getData($data)
	{
		return $this->data;
	}
}

class Response
{
	private $status;
	private $body;

	public function __construct($status, $body)
	{
		$this->status = $status;
		$this->body = $body;
	}

	public function getStatus()
	{
		return $this->status;
	}

	public function getBody()
	{
		return $this->body;
	}
}

class Database
{
	private $connection;

	public function __construct()
	{
		$servername = "localhost";
		$username   = "root";
		$password   = "admin";
		$dbname     = "ytc";

		$connection = new mysqli($servername, $username, $password, $dbname);
		if ($connection->connect_errno)
		{
			die("Unable to connect to database" . $connection->connect_error);
		}
		$this->connection =  $connection;
	}

	public function getVideos()
	{
		$sql 	= "SELECT * FROM videos";
		$result = $this->connection->query($sql);
		$videos = array();

		while ($row = $result->fetch_assoc())
		{
			$videos[] = $row;
		}
		$video = new Video;
		$video->setVidObj($videos);
		return $video;
	}

    public function getVideo($request)
    {
		$id 	= $request->getId();
		$sql    = "SELECT * FROM videos WHERE id = $id";
		$result = $this->connection->query($sql);
		$video_row = $result->fetch_assoc();
		$video  = new Video($video_row);
		return $video;
    }

    public function createVideo($request)
    {
		$title      = $request->getData()['title'];
		$youtubeId  = $request->getData()['youtubeId'];
		$sql        = "INSERT INTO videos (title, youtubeId)
						VALUES ('$title', '$youtubeId')";
		$result		= $this->connection->query($sql);
		if ($result == TRUE)
		{
			$last_id = $this->connection->insert_id;
		}
		return $this->getVideo($last_id);
	}

	public function updateVideo($request)
	{
		$id			= $request->getId();
		$title		= $request->getData()['title'];
		$youtubeId	= $request->getData()['youtubeId'];
		$sql		= "UPDATE videos SET
						title = '$title',
						youtubeId = '$youtubeId'
						WHERE id = $id";
		$result = $this->connection->query($sql);
		return $this->getVideo($request);
	}

	public function deleteVideo($request)
	{
		$id = $request->getId();
		$video = $this->getVideo($request);
		$sql    = "DELETE FROM videos WHERE id = $id";
		$result = $this->connection->query($sql);
		return $video;
	}

	public function createComment($request)
	{
	}

	public function updateComment($request)
	{
	}

	public function deleteComment($request)
	{
	}
}

class Video
{
	private $id;
	private $title;
	private $youtubeId;

	public function __construct($video_row)
	{
		$this->id = $video_row['id'];
		$this->title = $video_row['title'];
		$this->youtubeId = $video_row['youtubeId'];
	}

	public function getVidObj()
	{
		$video['id'] = $this->id;
		$video['title'] = $this->title;
		$video['youtubeId'] = $this->youtubeId;

		return $video;
	}
}

$controller = new Controller;

$request    = $controller->processRequest();
$controller->route($request);
?>
