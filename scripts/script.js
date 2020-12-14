//Metering
const meter = new Tone.Meter();
const analyser = new Tone.Analyser('fft', 1024);
// Effects
const filter = new Tone.AutoFilter(4).start();
//Input instance
const mic = new Tone.UserMedia().connect(meter).connect(filter).connect(analyser);
let dbLev = 0;
let playing = true;

// Begin input
function beginListening() {
    mic.open().then(() => {
        Tone.start();
        setInterval(() => dbLev= meter.getValue()), 500;
    }).catch(e => {
        console.log("Err: mic not open");
    });
}

function setup() {
    createCanvas(100, 100);
    amplitudes = new Array(analyser.size).fill(0);
  }
  
  function draw() {
    console.log(dbLev);
    if (!mic || !analyser) return;
    
    const dim = Math.min(width, height);
  
    // Black background
    background(0);
    
    strokeWeight(dim * 0.0175);
    stroke(255);
    noFill();
    
    
    const values = analyser.getValue();
    const dt = deltaTime / 1000;
    const power = 250;
    for (let i = 0; i < amplitudes.length; i++) {
      // Previous value
      const a = amplitudes[i];
      
      // Here we take the decibels and map it to some 0..1 value
      const minDb = -100;
      const maxDb = -20;
      const db = max(minDb, min(maxDb, values[i]));
      
      // New target (i.e. from audio)
      const b = inverseLerp(minDb, maxDb, db);
      
      // Spring toward
      amplitudes[i] = spring(a, b, power, dt);
    }
  
    // Draw FFT values
    stroke(255);
    strokeWeight(dim * 0.0175);
    noFill();    
    const maxRadius = dim * 0.3;
    const minRadius = dim * 0.175;
    const bands = 10;
    const L = amplitudes.length;
    for (let i = 0; i < bands; i++) {
      const tStart = i / bands;
      const tEnd = tStart + (1 / bands);
      const bandStart = min(L, floor(tStart * L));
      const bandEnd = min(L, floor(tEnd * L));
      const avg = average(amplitudes, bandStart, bandEnd);
  
      const r = minRadius + maxRadius * tStart;
  
      // Min and max line thickness
      const maxThickness = maxRadius / bands * 1;
      const minThickness = maxRadius / bands * 0.1;
      const signal = max(0, min(1, avg));
      const thickness = lerp(minThickness, maxThickness, signal);
  
      strokeWeight(thickness);
      stroke(255);
      // draw an arc
      const d = r * 2; // diameter
      arc(width / 2, height / 2, d, d, 0, PI * 2);
    }
    
    // the center shape
    noStroke();
    fill(255);
    sideMap = map(dbLev, -50, -1, 5, 20)
    polygon(width / 2, height / 2, dim * 0.1, sideMap);
    ellipse(200, 200 , dbLev, dbLev).fill(255);
  }
  
  function average (list, startIndex, endIndex) {
    let sum = 0;
    const count = endIndex - startIndex;
    if (count <= 0) return 0;
    for (let i = startIndex; i < endIndex; i++) {
      sum += list[i];
    }
    return sum / count;
  }
  
  function mousePressed () {
    if (mic && mic.loaded) {
      if (playing) {
        playing = false;
        mic.stop();
      } else {
        playing = true;
        mic.restart();
      }
    }
  }
  
  function inverseLerp (min, max, current) {
    if (Math.abs(min - max) < 1e-10) return 0;
    else return (current - min) / (max - min);
  }
  

  function polygon(x, y, radius, sides = 3, angle = 0) {
    beginShape();
    for (let i = 0; i < sides; i++) {
      const a = angle + TWO_PI * (i / sides);
      let sx = x + cos(a) * radius;
      let sy = y + sin(a) * radius;
      vertex(sx, sy);
    }
    endShape(CLOSE);
  }

  function spring (a, b, power, dt) {
    return lerp(a, b, 1 - Math.exp(-power * dt));
  }