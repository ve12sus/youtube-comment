<html>
<body>
<?php $vidid = $_POST["url"]; ?>
This is the video url: <?php echo $vidid; ?>
<?php $filename = $vidid . ".json";
  $arr = array('id' => $vidid);
  file_put_contents($filename, json_encode($arr));
  echo json_encode($arr);
?>
</body>
</html>
