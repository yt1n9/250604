let video;
let handpose;
let predictions = [];
let score = 0;
let gameOver = false;

let eduWords = ["AI", "VR", "AR", "Coding", "STEAM", "EdTech", "IoT", "BigData"];
let fakeWords = ["Cat", "Dog", "Apple", "Car", "Tree", "Book", "Fish"];
let fallingItems = [];
let bombEmoji = "💣";

function setup() {
  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO);
  video.size(windowWidth, windowHeight); // 修正：用 windowWidth, windowHeight
  video.hide();

  handpose = ml5.handpose(video, modelReady);
  handpose.on("predict", function(results) {
    predictions = results;
  });

  spawnItem();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  video.size(windowWidth, windowHeight); // 修正：用 windowWidth, windowHeight
}

function modelReady() {
  console.log("Handpose ready");
}

function draw() {
  background(0);

  // 顯示左右翻轉的攝影機畫面
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);
  pop();

  // 畫出拇指與食指之間的線
  if (predictions.length > 0) {
    let keypoints = predictions[0].landmarks;
    let videoW = video.width;
    let videoH = video.height;

    let thumbTip = keypoints[4];
    let indexTip = keypoints[8];

    // x 座標做鏡像
    let tx = width - (thumbTip[0] * width / videoW);
    let ty = thumbTip[1] * height / videoH;
    let ix = width - (indexTip[0] * width / videoW);
    let iy = indexTip[1] * height / videoH;

    stroke(0, 255, 255);
    strokeWeight(6);
    line(tx, ty, ix, iy);
  }

  // 顯示標題
  fill(255);
  textSize(48);
  textAlign(CENTER, TOP);
  text("淡江教育科技系", width / 2, 10);

  // 遊戲結束畫面
  if (gameOver) {
    fill(255, 0, 0, 200);
    textSize(80);
    textAlign(CENTER, CENTER);
    text("遊戲結束", width / 2, height / 2);
    textSize(40);
    text("分數: " + score, width / 2, height / 2 + 80);
    return;
  }

  // 畫食指紅點
  drawIndexFinger();

  // 畫出掉落物
  for (let i = fallingItems.length - 1; i >= 0; i--) {
    let item = fallingItems[i];
    item.y += item.speed;

    textAlign(CENTER, CENTER);
    if (item.type === "bomb") {
      textSize(60);
      fill(30, 30, 120);
      text(bombEmoji, item.x, item.y);
    } else {
      textSize(48);
      fill(255);
      text(item.word, item.x, item.y);
    }

    // 判斷碰撞
    if (isIndexTouching(item.x, item.y)) {
      if (item.type === "bomb") {
        gameOver = true;
      } else if (item.type === "edu") {
        score++;
      } else if (item.type === "fake") {
        score--;
      }
      fallingItems.splice(i, 1);
      continue;
    }

    // 掉出畫面就移除
    if (item.y > height + 50) {
      fallingItems.splice(i, 1);
    }
  }

  // 顯示分數
  fill(255);
  textSize(32);
  textAlign(LEFT, TOP);
  text("分數: " + score, 20, 70);

  // 每秒生成新物件
  if (frameCount % 60 === 0 && !gameOver) {
    spawnItem();
  }
}

// 只畫食指指尖紅點
function drawIndexFinger() {
  if (predictions.length > 0) {
    let keypoints = predictions[0].landmarks;
    let indexTip = keypoints[8];

    // x 座標做鏡像
    let ix = width - (indexTip[0] * width / video.width);
    let iy = indexTip[1] * height / video.height;

    fill(255, 0, 0);
    noStroke();
    ellipse(ix, iy, 30, 30);
  } else {
    fill(255, 0, 0);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("請將手放到鏡頭前", width / 2, height / 2);
  }
}

function isIndexTouching(x, y) {
  if (predictions.length > 0) {
    let keypoints = predictions[0].landmarks;
    let indexTip = keypoints[8];
    if (indexTip) {
      // x 座標做鏡像
      let ix = width - (indexTip[0] * width / video.width);
      let iy = indexTip[1] * height / video.height;

      let d = dist(x, y, ix, iy);
      return d < 40;
    }
  }
  return false;
}

// 產生新掉落物
function spawnItem() {
  let r = random();
  let item = {};
  item.x = random(100, width - 100);
  item.y = -50;
  item.speed = random(4, 8);

  if (r < 0.15) {
    item.type = "bomb";
    item.word = "";
  } else if (r < 0.55) {
    item.type = "edu";
    item.word = random(eduWords);
  } else {
    item.type = "fake";
    item.word = random(fakeWords);
  }
  fallingItems.push(item);
}