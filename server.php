<?php
$file = htmlspecialchars($_GET["vid"]) . '.json';
$str = file_get_contents($file);
echo $str;
?>


