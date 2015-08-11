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

        return $request;
    }

}

class Request
{
    private $method;
    private $resource;
    private $id;

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

    public function getVideo($id)
    {
        $sql    = "SELECT * FROM videos WHERE id = $id";
        $result = $this->connection->query($sql);
        $row    = $result->fetch_assoc();

        $video  = new Video;
        $video->setTitle($row);
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

    public function deleteVideo($id)
    {
        $video  = getVideo($id);
        $sql    = "DELETE FROM videos WHERE id = $id";
        $result = $this->connection->query($sql);
        if ($this->connection->affected_rows < 1)
        {
            $video->setStatus = 404;
        } else
            {
            $video->setStatus = 200;
            }
        return $video;
    }
}

class Video
{
    private $title;
    private $youtubeId;
    private $comments;

    public function setTitle($title)
    {
        $this->title = $title;
    }

    public function getTitle($title)
    {
        return $this->title;
    }
}

$controller = new Controller;
$request    = $controller->processRequest();
echo $request->getResource();
echo $request->getId();
echo $request->getMethod();
/*public function
switch($request->getResource())
{
	case 'video';*/
?>
