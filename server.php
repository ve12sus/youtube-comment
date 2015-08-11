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

	public function sendResponse($response)
	{
		$status_header = 'HTTP/1.1 ' . $response->getStatus() . ' ' .
							$this->getStatusMsg($response->getStatus());
		header($status_header);
		header('Content-Type: application/json');
		echo json_encode($response->getBody(), JSON_PRETTY_PRINT);
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

class Request
{
    private $method;
    private $resource;
    private $id;
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
        $this->resource = reset($url);
        $this->id       = next($url);
    }

    public function getResource()
    {
        return $this->resource;
    }

    public function getId()
    {
        return $this->id;
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

	public function setStatus($status)
	{
		$this->status = $status;
	}

	public function setBody($body)
	{
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

	public function getVideos() {
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

    public function getVideo($id)
    {
        $sql    = "SELECT * FROM videos WHERE id = $id";
        $result = $this->connection->query($sql);
        $row    = $result->fetch_assoc();

        $video  = new Video;
        $video->setVidObj($row);
        return $video;
    }

    public function createVideo($data)
    {
        $title      = $data['title'];
        $youtubeId  = $data['youtubeId'];
        $sql        = "INSERT INTO videos (title, youtubeId)
                        VALUES ('$title', '$youtubeId')";
        $result     =$this->connection->query($sql);
        if ($result == TRUE)
        {
            $last_id = $this->connection->insert_id;
        }
        return $this->getVideo($last_id);
    }

	public function updateVideo($id, $data)
	{
		$title		= $data['title'];
		$youtubeId	= $data['youtubeId'];
		$sql		= "UPDATE videos SET
						title = '$title',
						youtubeId = '$youtubeId'
						WHERE id = $id";
		$result = $this->connection->query($sql);
		return $this->getVideo($id);
	}

    public function deleteVideo($id)
    {

        $video = $this->getVideo($id);
        $sql    = "DELETE FROM videos WHERE id = $id";
        $result = $this->connection->query($sql);
		return $video;
    }
}

class Video
{
    private $vid_obj;

    public function setVidObj($vid_obj)
    {
        $this->vid_obj = $vid_obj;
    }

    public function getVidObj()
    {
        return $this->vid_obj;
    }
}

$controller = new Controller;
$database   = new Database;
$response	= new Response;

$request    = $controller->processRequest();

if ($request->getResource() == 'videos' and !$request->getId())
{
	switch($request->getMethod())
	{
		case 'GET':
			$video = $database->getVideos();
			$response->setStatus(200);
			$response->setBody($video->getVidObj());
			$controller->sendResponse($response);
			break;
		case 'POST':
			$video = $database->createVideo($request->getData());
			$response->setStatus(201);
			$response->setBody($video->getVidObj());
			$controller->sendResponse($response);
			break;
		default:
			echo 'hello world';
			break;
	}
}
if ($request->getResource() == 'videos' and $request->getId())
{
	switch($request->getMethod())
	{
		case 'GET':
			$video = $database->getVideo($request->getId());
			$response->setStatus(200);
			$response->setBody($video->getVidObj());
			$controller->sendResponse($response);
			break;
		case 'DELETE':
			$video = $database->deleteVideo($request->getId());
			$response->setStatus(200);
			$response->setBody($video->getVidObj());
			$controller->sendResponse($response);
			break;
		case 'PUT':
			$video = $database->updateVideo($request->getId(),
											$request->getData());
			$response->setStatus(200);
			$response->setBody($video->getVidObj());
			$controller->sendResponse($response);
			break;
		default:
			echo 'hello world';
			break;
	}
}
?>
