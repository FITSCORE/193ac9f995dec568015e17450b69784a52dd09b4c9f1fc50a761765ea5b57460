let currentCardName = "first-card";

let startPosition = null;
let currentPosition, currentAccuracy ;
let watchPositon;
let distanceCovered = 0;
let timerIntervalId = null;

const minAccuracy = 5; //in meters
function setup(){

  updateStartStatus("Loading...");
  noCanvas();

  timer = new Counter(720); //12 min = 12* 60 sec = 720 sec

  select("#incomplete-tag").hide();
  if('geolocation' in navigator) {
    updateStartStatus("GPS Available");
    startButton = createButton("Start");
    startButton.parent("first-card");
    startButton.class("btn-large waves-effect waves-light black");
    startButton.mousePressed(startNavigation);

    lapButton = createButton("Lap");
    lapButton.parent("second-card");
    lapButton.class("btn-large waves-effect waves-light black");
    lapButton.attribute('disabled', '');
    lapButton.mousePressed(makeLap);

    stopButton = createButton("Stop");
    stopButton.parent("second-card");
    stopButton.class("btn-large waves-effect waves-light black");
    stopButton.mousePressed(() => {select("#incomplete-tag").show();stopNavigation();});
  } else {
    updateStartStatus("GPS Not Available");
  }
}

function startNavigation(){

  const geolocationOptions = {
    enableHighAccuracy: true,
    timeout: 1000,
    maximumAge: 0
  }

  watchPositon = navigator.geolocation.watchPosition(
    (position) => {
      currentPosition = [position.coords.latitude, position.coords.longitude];
      currentAccuracy = position.coords.accuracy;

      if (startPosition == null){
        if(setStartPoint()){
          timerIntervalId = setInterval(() => {
            select("#timer").html("Time : " + Math.floor(timer.timeRemaining/60) + " min "+ timer.timeRemaining%60 + " sec ");
          },0);
        }
      }
      if (currentAccuracy <= minAccuracy){
        lapButton.removeAttribute('disabled');
      } else {
        lapButton.attribute('disabled', '');
      }
      updateGPSData();


      if (timer.timeRemaining === 0){
        stopNavigation();
      }
    },
    (error) => {updateStatus("Error: "+error)},
    geolocationOptions
  );

  loadCard("second-card");
}

function stopNavigation(){
  navigator.geolocation.clearWatch(watchPositon);
  updateStatus("GPS Stopped");
  try{makeLap();}catch{}
  stopButton.hide();
  lapButton.hide();
  timer.stop();
  clearInterval(timerIntervalId);
  setScoreCard();
  loadCard("third-card");
}

function setStartPoint(){
  if (currentAccuracy <= minAccuracy){
  startPosition = [currentPosition[0],currentPosition[1]];
  updateStatus("GPS Acquired");
  timer.start();
  return true;
  } else {
    updateStatus("GPS Acquiring, Please Wait");
    select("#gps-accuracy").html("Accuracy: "+(currentAccuracy).toFixed(4));
    return false;
  }
}

function makeLap(){
  distanceCovered += calculateDistance(startPosition[0],startPosition[1],currentPosition[0],currentPosition[1]);
  startPosition = [currentPosition[0],currentPosition[1]]
}

function updateGPSData(){
  // select("#gps-position").html("Co-Ord: "+(currentPosition[0]).toFixed(4)+" "+(currentPosition[1]).toFixed(4));
  select("#gps-accuracy").html("Accuracy: "+(currentAccuracy).toFixed(2)+" meters");
  try{
  select("#distance-covered").html("Distance: "+(calculateDistance(startPosition[0],startPosition[1],currentPosition[0],currentPosition[1])+distanceCovered).toFixed(4)+" KM")
  }catch{}
}

function updateStatus(status){
  select("#status").html(status);
}

function updateStartStatus(status){
  select("#start-status").html(status);
}

function loadCard(cardName) {
  document.getElementById(currentCardName).classList.toggle("hide");
  document.getElementById(cardName).classList.toggle("hide");
  currentCardName = cardName;
}
  
function setScoreCard() {
  select("#scorecard-score").html(distanceCovered.toFixed(2));
  select("#scorecard-time-min").html(Math.floor(timer.timePassed/60));
  select("#scorecard-time-sec").html(timer.timePassed%60);
  
  let date = new Date();
  select("#scorecard-generation-time").html(date.toLocaleString());
}
