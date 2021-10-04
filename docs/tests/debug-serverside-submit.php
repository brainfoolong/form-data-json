<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Test Serverside Conversion by PHP</title>
    <style>
        body{
          white-space: pre;
        }
    </style>
</head>
<body>
<?php
echo "<h2>JSON Data interpreted by PHP</h2>";
echo json_encode($_POST, JSON_PRETTY_PRINT);
echo "<h2>RAW Data interpreted by PHP</h2>";
var_dump($_POST);
?>
</body>
</html>