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
        $id	= $request->getId();
        $resource = $request->getResource();

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
                else if ($resource == 'comments')
                {
                    $this->handle_comments($request);
                }
                else
                {
                    echo 'no such resource';
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
        switch ($request->getMethod())
        {
            case 'GET':
                $this->getVideo($request);
                break;
            case 'POST':
                $this->createComment($request);
                break;
            case 'PUT':
                $this->updateComment($request);
                break;
            case 'DELETE':
                $this->deleteComment($request);
                break;
            default:
                echo 'error';
                break;
        }
    }

    public function getVideos($request)
    {
        try {
            $database = new Database;
        }
        catch (Exception $e) {
            $response = new Response(500, $e->getMessage());
        }
        try {
            $videos = $database->getVideos();
            $response = new Response(200, $videos);
        }
        catch (VideoNotFoundException $vnfe) {
            $response = new Response(404, $videos);
        }
        catch (Exception $e) {
            $response = new Response(500, $videos);
        }
        $this->sendResponse($response);
    }

    public function createVideo($request)
    {
        try {
            $database = new Database;
        }
        catch (Exception $e) {
            $response = new Response(500, $e->getMessage());
        }
        try {
            $video = $database->createVideo($request);
            $response = new Response(201, $video);
        }
        catch (VideoNotFoundException $vnfe) {
            $response = new Response(400, $vnfe->errorMessage);
        }
        catch (Exception $e) {
            $response = new Response(500, $e->getMessage());
        }
        $this->sendResponse($response);
    }


    public function getVideo($request)
    {
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
        catch (VideoNotFoundException $vnfe) {
            $response = new Response(404, $vnfe->errorMessage());
        }
        catch (Exception $e) {
            $response = new Response(500, $e->getMessage());
        }
        $this->sendResponse($response);
    }

    public function updateVideo($request)
    {
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
        catch (VideoNotFoundException $vnfe) {
            $response = new Response(404, $vnfe->errorMessage());
        }
        catch (Exception $e) {
            $response = new Response(500, $e->getMessage());
        }
        $this->sendResponse($response);
    }

    public function deleteVideo($request)
    {
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
        catch (VideoNotFoundException $vnfe) {
            $response = new Response(404, $vnfe->errorMessage());
        }
        catch (Exception $e) {
            $response = new Response(500, $e->getMessage());
        }
        $this->sendResponse($response);
    }

    public function createComment($request)
    {
        try {
            $database = new Database;
        }
        catch (Exception $e) {
            $response = new Response(500, $e->getMessage());
        }
        try {
            $video = $database->createComment($request);
            $response = new Response(201, $video);
        }
        catch (VideoNotFoundException $vnfe) {
            $response = new Response(400, $vnfe->errorMessage());
        }
        catch (Exception $e) {
            $response = new Response(500, $e->getMessage());
        }
        $this->sendResponse($response);
    }

    public function updateComment($request)
    {
        try {
            $database = new Database;
        }
        catch (Exception $e) {
            $response = new Response(500, $e->getMessage());
        }
        try {
            $video = $database->updateComment($request);
            $response = new Response(200, $video);
        }
        catch (VideoNotFoundException $vnfe) {
            $response = new Response(400, $vnfe->errorMessage());
        }
        catch (Exception $e) {
            $response = new Response(500, $e->getMessage());
        }
        $this->sendResponse($response);
    }

    public function deleteComment($request)
    {
        try {
            $database = new Database;
        }
        catch (Exception $e) {
            $response = new Response(500, $e->getMessage());
        }
        try {
            $video = $database->deleteComment($request);
            $response = new Response(200, $video);
        }
        catch (VideoNotFoundException $vnfe) {
            $response = new Response(400, $vnfe->errorMessage());
        }
        catch (Exception $e) {
            $response = new Response(500, $e->getMessage());
        }
        $this->sendResponse($response);
    }

    public function sendResponse($response)
    {
        $status = $response->getStatus();
        $video = $response->getBody();

        $status_header = 'HTTP/1.1 ' . $status . ' ' . $this->getStatusMsg($status);
        header($status_header);
        header('Content-Type: application/json');
        if (gettype($video) == 'object')
        {
            $video_body = $video->getVidObj();
            echo json_encode($video_body, JSON_PRETTY_PRINT);
        }
        else if (gettype($video) == 'array')
        {
            echo json_encode($video, JSON_PRETTY_PRINT);
        }
        else
        {
            echo $video;
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

    public function setId($id)
    {
        $this->id = $id;
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
        $username = "root";
        $password = "admin";
        $dbname = "ytc";

        $connection = new mysqli($servername, $username, $password, $dbname);
        if ($connection->connect_errno)
        {
            die("Unable to connect to database" . $connection->connect_error);
        }
        $this->connection =  $connection;
    }

    public function getVideos()
    {
        $stmt = $this->connection->prepare("SELECT * FROM videos");
        $stmt->execute();
        $stmt->bind_result($vid_id, $title, $youtube_id, $created);
        $videos = array();

        while ($stmt->fetch())
        {
            $video_row = array("id"=>$vid_id, "title"=>$title, "youtubeId"=>$youtube_id);
            $video = new Video($video_row);
            $videos[] = $video->getVidObj();
        }
        return $videos;
    }

    public function getVideo($request)
    {
        $id = $request->getId();
        $stmt = $this->connection->prepare("SELECT * FROM videos WHERE id = ?");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $stmt->bind_result($vid_id, $title, $youtube_id, $created);

        while ($stmt->fetch())
        {
            $video_row = array("id"=>$vid_id, "title"=>$title, "youtubeId"=>$youtube_id);
        }
        if ($video_row == null)
        {
            throw new VideoNotFoundException();
        }
        $video  = new Video($video_row);
        $comments = $this->getComments($request);
        $video->addComments($comments);
        return $video;
    }

    public function createVideo($request)
    {
        $title = $request->getData()['title'];
        $youtubeId = $request->getData()['youtubeId'];
        $stmt = $this->connection->prepare("INSERT INTO videos (title, youtubeId)
                VALUES (?, ?)");
        $stmt->bind_param('ss', $title, $youtubeId);

        if ($stmt->execute())
        {
            $last_id = $stmt->insert_id;
            $request->setId($last_id);
        }
        return $this->getVideo($request);
    }

    public function updateVideo($request)
    {
        $id = $request->getId();
        $title = $request->getData()['title'];
        $youtubeId = $request->getData()['youtubeId'];
        $stmt = $this->connection->prepare("UPDATE videos SET
                title = ?, youtubeId = ? WHERE id = ?");
        $stmt->bind_param('ssi', $title, $youtubeId, $id);
        $stmt->execute();
        return $this->getVideo($request);
    }

    public function deleteVideo($request)
    {
        $id = $request->getId();
        $video = $this->getVideo($request);
        $stmt = $this->connection->prepare("DELETE FROM videos WHERE id = ?");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        return $video;
    }

    public function getComments($request)
    {
        $id = $request->getId();
        $stmt = $this->connection->prepare(
            "SELECT time, comments, style FROM comments WHERE id = ?");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $stmt->bind_result($time, $comment, $style);
        $comments = array();

        while ($stmt->fetch())
        {
            $comment_row = array("time"=>$time, "comment"=>$comment, "style"=>$style);
            $comments[] = $comment_row;
        }
        return $comments;
    }

    public function createComment($request)
    {
        $data = $request->getData();
        $id = $request->getId();
        $time = $data['time'];
        $comment = $data['comment'];
        $style = $data['style'];
        $stmt = $this->connection->prepare("INSERT INTO comments
                (id, time, comments, style) VALUES (?, ?, ?, ?)");
        $stmt->bind_param('iiss', $id, $time, $comment, $style);
        $stmt->execute();
        return $this->getVideo($request);
    }

    public function updateComment($request)
    {
        $data = $request->getData();
        $id = $request->getId();
        $time = $data['time'];
        $comment = $data['comment'];
        $style = $data['style'];
        $stmt = $this->connection->prepare("UPDATE comments SET comments = ?, style = ?
                WHERE time = ? and id = ?");
        $stmt->bind_param('ssii', $comment, $style, $time, $id);
        $stmt->execute();
        return $this->getVideo($request);
    }

    public function deleteComment($request)
    {
        $data = $request->getData();
        $id = $request->getId();
        $time = $data['time'];
        $stmt = $this->connection->prepare("DELETE FROM comments WHERE time =
                ? and id = ?");
        $stmt->bind_param('ii', $time, $id);
        $stmt->execute();
        return $this->getVideo($request);
    }
}

class Video
{
    private $id;
    private $title;
    private $youtubeId;
    private $comments;

    public function __construct($video_row)
    {
        $this->id = $video_row['id'];
        $this->title = $video_row['title'];
        $this->youtubeId = $video_row['youtubeId'];
    }

    public function addComments($comments)
    {
        $this->comments = $comments;
    }

    public function getVidObj()
    {
        $video['id'] = $this->id;
        $video['title'] = $this->title;
        $video['youtubeId'] = $this->youtubeId;
        $video['comments'] = $this->comments;

        return $video;
    }
}

class VideoNotFoundException extends Exception
{
    public function errorMessage()
    {
        $error_msg = 'Video Not Found';
        return $error_msg;
    }
}

$controller = new Controller;
$request    = $controller->processRequest();
$controller->route($request);
?>
