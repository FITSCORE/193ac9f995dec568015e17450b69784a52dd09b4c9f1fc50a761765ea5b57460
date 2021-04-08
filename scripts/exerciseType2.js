let modelLoc = "../data/models/"
let poseToDetect;

let video;
let poseNet;
let pose, skeleton;
let brain;

let minCon;

let predictedLabel = "NULL";
let currentCardName = "first-card";

function scriptSetup(){
  let script = document.getElementById('logicScript');
  let modelName =  script.getAttribute('model-name');
  poseToDetect = script.getAttribute('exercise-name').toUpperCase();
  modelLoc += (modelName+"/");
  minCon = parseFloat(script.getAttribute('min-confidence'));
}

function setupPoseNet(){
  const poseNetOptions = {
    architecture: 'MobileNetV1',
    outputStride: 16,
    detectionType: 'single',
    inputResolution: 224,
    multiplier: 0.75,
  }
  poseNet = ml5.poseNet(video, poseNetOptions,() => console.log("PoseNet Ready"));
}

function setupBrain(){
  brain = ml5.neuralNetwork();
  const modelDetails = {
    model: modelLoc+'model.json',
    metadata: modelLoc+'model_meta.json',
    weights: modelLoc+'model.weights.bin'
  }
  brain.load(modelDetails, modelReady);
}

function setupCounters(){
  timer = new Counter(60);
  startCounting = new Counter(5);
}

function setup(){
  scriptSetup();
  setupCounters();
  updateData();
  updateStartStatus("Loading ...");
  updateStatus("Not Started");
  noCanvas();

  //Camera Setup
  const videoOptions = {
    video: {
      optional: [{maxAspectRatio: 1}]
    },
    audio: false
  }
  video = createCapture(videoOptions);
  video.size(300,300);
  video.parent('cameraHolder');
  //video.hide();

  setupPoseNet();
  poseNet.on('pose', gotPoses);

  setupBrain();
}

function gotPoses(poses){  
  if (poses.length > 0){  
    pose = poses[0].pose;
    skeleton = poses[0].skeleton;
  }
}

function modelReady(){
  console.log('Model Ready');
  classifyPose();
}

function classifyPose(){
  if (pose) {
    let inputs = [];
    for(let i=0; i < pose.keypoints.length; i++) {
      inputs.push(pose.keypoints[i].position.x);
      inputs.push(pose.keypoints[i].position.y);
    }
    brain.classify(inputs, gotResults);
  } else {
    updateStatus("Pose Not Detected");
    setTimeout(classifyPose, 100);
  } 
}

function gotResults(error, results){
  let result = results[0];
//   console.log(result.label, Math.floor(result.confidence * 100) + "%", currentPose);

  if (result.confidence >= minCon){
    predictedLabel = result.label.toUpperCase();
    if (timer.state == "NONE" && startCounting.state == "FINISHED"){
      if(predictedLabel == poseToDetect){
        timer.count();
      } else {
        timer.pause();
      }
      updateStatus("Great Going");
    } 
    else if (timer.state == "FINISHED"){
      pose = null;
      poseNet.removeListener('pose', gotPoses);
      console.log("PoseNet Stopped");
      video.stop();
      updateStatus("Woah, Session Completed");
      if (currentCardName == 'second-card'){
        setScoreCard();
        loadCard("third-card");
        video.remove();
      }
    } 
    if (startCounting.getState == "FINISHED"){
      if (currentCardName == "first-card"){
        loadCard("second-card");
      }
    } else {
      if (predictedLabel == poseToDetect){
        startCounting.count();
      } else {
        startCounting.resetcount();
      }
      updateStartStatus("Hold "+poseToDetect+" position for "+startCounting.timeRemaining+" sec to START.")
    }
  } else {
    startCounting.resetcount();
    updateStatus("That Not Correct!");
  }
  updateData();
  classifyPose();
}

class Counter{
  constructor(counterTime){
    this.counterTime = counterTime;
    this.state = "NONE";
    this.timePassed = 0;
    this.toP = null;
  }
  get timeRemaining(){
    return this.counterTime - this.timePassed;
  }
  get _timePassed() {
    return this.timePassed;
  }
  get getState(){
    return this.state;
  }
  count(){
    if (this.timeRemaining == 0){
      this.state = "FINISHED";
    }
    if (this.state == "NONE"){ 
      this.state = "COUNTING";
      this.toP = setTimeout(() => {this.state = "NONE"; this.timePassed += 1;}, 1000);
    }
  }
  pause(){
    if (this.state = "COUNTING" && this.toP){
      clearTimeout(this.toP);
      setTimeout(() => {this.state = "NONE";}, 1000);
    }
  }
  resetcount(){
    if (this.state != "FINISHED"){
      this.timePassed = 0;
    }
  }
}

function updateData(){
    select("#timer").html("Time: " + timer.timeRemaining + " sec ")
    // select("#counter").html("Reps: "+ correctCount);
    select("#predictedResult").html("Predicted Position: " + predictedLabel.toUpperCase());
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
  // select("#scorecard-score").html();
  select("#scorecard-time").html(timer.counterTime);

  let date = new Date();
  select("#scorecard-generation-time").html(date.toLocaleString());
}