let modelLoc = "../data/models/"
let countSequence;

let video;
let poseNet;
let pose, skeleton;
let brain;

let minCon = 0.8;

let predictedLabel = "NULL";
let currentCardName = "first-card";

function scriptSetup(){
  let script = document.getElementById('logicScript');
  let exerciseName =  script.getAttribute('exercise-name');
  modelLoc += (exerciseName+"/");
  countSequence = script.getAttribute('sequence').split(' ');
}

function setupPoseNet(){
  const poseNetOptions = {
    architecture: 'MobileNetV1',
    outputStride: 16,
    detectionType: 'single',
    inputResolution: 224,
    multiplier: 0.75,
  };
  poseNet = ml5.poseNet(video, poseNetOptions,() => console.log("PoseNet Ready"));
}

function setupBrain(){
  const brainOptions = {
    task: 'classification'
  };
  brain = ml5.neuralNetwork(brainOptions);
  const modelDetails = {
    model: modelLoc+'model.json',
    metadata: modelLoc+'model_meta.json',
    weights: modelLoc+'model.weights.bin'
  };
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
  video = createCapture(VIDEO);
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
    setTimeout(classifyPose, 100);
  } 
}

let correctCount = 0;
let currentPose = 0;

function gotResults(error, results){
  let result = results[0];
  // console.log(result.label, Math.floor(result.confidence * 100) + "%", currentPose);

  if (result.confidence >= minCon){
    predictedLabel = result.label;
    if (timer.state == "COUNTING"){
      if(predictedLabel == countSequence[currentPose]){
        currentPose += 1;
      }
      if (currentPose == countSequence.length){
        correctCount += 1;
        currentPose = 0;
      }
      updateStatus("Great Going");
    } else if (timer.state == "FINISHED"){
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
      timer.count();
    } else {
      if (predictedLabel == countSequence[0]){
        startCounting.count();
      } else {
        startCounting.resetcount();
      }
      updateStartStatus("Hold"+countSequence[0].toUpperCase()+" for "+startCounting.timeRemaining+"sec.")
    }
    changeSvg();
  } else {
    resetSvg();
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
  }
  get timeRemaining(){
    return this.counterTime - this.timePassed;
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
      setTimeout(() => {this.state = "NONE"; this.timePassed += 1;}, 1000);
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
  select("#counter").html("Reps: "+ correctCount);
  select("#predictedResult").html("Predicted: " + predictedLabel.toUpperCase());
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
  select("#scorecard-score").html(correctCount);
  select("#scorecard-time").html(timer.counterTime);
  
  let date = new Date();
  select("#scorecard-generation-time").html(date.toLocaleString());
}

function changeSvg(){
  let upSvg = document.getElementById("up-svg");
  let downSvg = document.getElementById("down-svg");
  if (predictedLabel.toUpperCase() == "UP"){
    upSvg.style.backgroundColor = "green";
    downSvg.style.backgroundColor = "whitesmoke";
  }
  else if (predictedLabel.toUpperCase() == "DOWN"){
    upSvg.style.backgroundColor = "whitesmoke";
    downSvg.style.backgroundColor = "green";
  }
}

function resetSvg(){
  let upSvg = document.getElementById("up-svg");
  let downSvg = document.getElementById("down-svg");
  upSvg.style.backgroundColor = "whitesmoke";
  downSvg.style.backgroundColor = "whitesmoke";
  
}
