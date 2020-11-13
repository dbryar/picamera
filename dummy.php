<?php
$file = "./test.output";
if(file_exists($file)) {
  $res = fopen($file,"r");

  while (!feof($res)) {
    $line = json_decode(fgets($res),true);
    if($line) {
      $line['epoch_time'] = round(microtime(true) * 1000);
      print_r(json_encode($line)."\n");
      usleep(round($line['processing_time_ms']*1000));
    }
  }
  fclose($res);
} else {
  echo ($file." not found\n");
  exit(-1);
}
?>