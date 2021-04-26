function takePhoto(stream){
    let photoCanvas = createCanvas(stream.width,stream.height);
    photoCanvas.hide();
    image(stream,0,0);
    return photoCanvas.canvas.toDataURL("image/png");
}

function addPhoto(elementId, stream){
    let tempImg = createImg(takePhoto(stream));
    tempImg.size(80,80);
    tempImg.parent(elementId);
}

//Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  // const R = 6371 * 1000; // m
  let dLat = (lat2 - lat1).toRad();
  let dLon = (lon2 - lon1).toRad(); 
  let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) * 
          Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  let d = R * c;
  return d;
}
Number.prototype.toRad = function() {
  return this * Math.PI / 180;
}

class Counter{
    constructor(counterTime){
      this.counterTime = counterTime;
      this.state = "NONE";
      this.timePassed = 0;
      this.currentTimeout = null;
      this.startTrigger = null;
    }
    get timeRemaining(){
      return this.counterTime - this.timePassed;
    }
    start(){
      this.startTrigger = setInterval(()=>this.count(),0);
    }
    stop(){
      clearInterval(this.startTrigger);
    }
    count(){
      if (this.timeRemaining == 0){
        this.state = "FINISHED";
      }
      if (this.state == "NONE"){ 
        this.state = "COUNTING";
        this.currentTimeout = setTimeout(() => {this.state = "NONE"; this.timePassed += 1;}, 1000);
      }
    }
    pauseCount(){
      if (this.state == "COUNTING" && this.currentTimeout){
        clearTimeout(this.currentTimeout);
        this.state = "NONE";
      }
    }
    resetcount(){
      if (this.state != "FINISHED"){
        this.timePassed = 0;
      }
    }
  }