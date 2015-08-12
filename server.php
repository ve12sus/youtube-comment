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
				$this-updateVideo($request);
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
		echo 'get comments';
	}

	public function getVideos($request)
	{
		$database = New Database;
		$video = $database->getVideos();
		$this->sendResponse($video);
	}

	public function createVideo($request)
	{
		$database = New Database;
		$video = $database->createVideo($request);
		$this->sendResponse($video);
	}

	public function getVideo($request)
	{
		$database = New Database;
		$video = $database->getVideo($request);
		$this->sendResponse($video);
	}

	public function deleteVideo($request)
	{
		$database = New Database;
		$database->deleteVideo($request);
		$this->sendResponse();
	}

	public function sendResponse($video)
	{
		/*$status_header = 'HTTP/1.1 ' . $response->getStatus() . ' ' .
			$this->getStatusMsg($response->getStatus());
		header($status_header);*/
		header('Content-Type: application/json');

		if ($video->getVidObj())
		{
			echo json_encode($video->getVidObj(), JSON_PRETTY_PRINT);
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
        $this->id         = next($url);
		$this->resource   = next($url);
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
        $video_obj = $result->fetch_assoc();

		$sql	= "SELECT time, comments, style FROM comments WHERE id = $id";
		$result = $this->connection->query($sql);
		while ($row = $result->fetch_assoc())
		{
			$comments[] = $row;
		}
		if ($video_obj)
		{
			$video_obj['comments'] = $comments;
		}
        $video  = new Video;
        $video->setVidObj($video_obj);
        return $video;
    }

    public function createVideo($request)
    {
        $title      = $request->getData()['title'];
        $youtubeId  = $request->getData()['youtubeId'];
        $sql        = "INSERT INTO videos (title, youtubeId)
                        VALUES ('$title', '$youtubeId')";
        $result     =$this->connection->query($sql);
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
		return $this->getVideo($id);
	}

    public function deleteVideo($request)
    {
		$id = $request->getId();
        $video = $this->getVideo($id);
        $sql    = "DELETE FROM videos WHERE id = $id";
        $result = $this->connection->query($sql);
		return $video;
    }

	public function createComment($request)
	{
		$id = $request->getId();
		$time = $request->getData()['time'];
		$comment = $request->getData()['comment'];
		$style = $request->getData()['style'];
		$sql = "INSERT INTO comments (id, time, comments, style)
				VALUES ($id, $time, '$comment', '$style')";
		$result = $this->connection->query($sql);
		return $this->getVideo($id);
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

$request    = $controller->processRequest();
$controller->route($request);
?>
