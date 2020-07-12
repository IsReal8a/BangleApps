/*
 * BreakOut clone BrickBreaker for Banglejs
 *
 * Author: Israel Ochoa https://github.com/IsReal8a/
 * Created: July 2020
 *
 */

const SCREEN_WIDTH = 240;
const SCREEN_HEIGHT = 240;
const FPS = 16;
const BALLRADIUS = 4;

var BTN_L = BTN1;
var BTN_R = BTN2;
var score = 0;
var lives = 3;
var interval = 0;

var x = SCREEN_WIDTH/2;
var y = SCREEN_HEIGHT - 20;
var dx = 2;
var dy = -2;

var paddleHeight = 5;
var paddleWidth = 35;
var paddleY = 0;
var paddleX = (SCREEN_WIDTH - paddleWidth)/2;

var rightPressed = false;
var leftPressed = false;

var brickRowCount = 5;
var brickColumnCount = 8;
var brickWidth = 22;
var brickHeight = 5;
var brickPadding = 5;
var brickOffsetTop = 30;
var brickOffsetLeft = 15;

var bricks = [];
for(var c = 0; c < brickColumnCount; c++) {
  bricks[c] = [];
    for(var r = 0; r < brickRowCount; r++) {
      bricks[c][r] = { x: 0, y: 0, status: 1 };
    }
}

function drawBallOfDestruction() {
  g.setColor(-1).fillCircle(x,y,4);
}

function drawBrickDestroyer() {
  g.setColor(-1);
  paddleY = SCREEN_HEIGHT - paddleHeight;
  g.fillRect(paddleX, paddleY, paddleX + paddleWidth, paddleY + paddleHeight);
}

function drawBricks() {
  g.setColor(-1);
  for(var c = 0; c < brickColumnCount; c++) {
    for(var r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status == 1) {
        var brickX = (c * (brickWidth+brickPadding)) + brickOffsetLeft;
        var brickY = (r * (brickHeight+brickPadding)) + brickOffsetTop;
        bricks[c][r].x = brickX;
        bricks[c][r].y = brickY;
        g.fillRect(brickX, brickY, brickX + brickWidth, brickY + brickHeight);
      }
    }
  }
}

function collisionDetection() {
  for (var c = 0; c < brickColumnCount; c++) {
    for (var r = 0; r < brickRowCount; r++) {
      var b = bricks[c][r];
      if (b.status == 1) {
        if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
          dy = -dy;
          b.status = 0;
          score++;
          if(score == brickRowCount*brickColumnCount) {
            drawYouWin();
          }
        }
      }
    }
  }
}

function drawScore() {
  g.setColor(-1);
  g.setFont('6x8', 1);
  g.drawString("Score: "+score, 5, 7);
}

function drawLives() {
  g.setColor(-1);
  g.setFont('6x8', 1);
  g.drawString("Lives: "+lives, SCREEN_WIDTH - 52, 7);
}

function startGame() {
  interval = setInterval(draw, 1000 / FPS);
}

function drawGameOver() {
  g.setFont("6x8", 2);
  g.drawString("Game Over", 75, SCREEN_WIDTH/2 - 10);
}

function drawYouWin() {
  g.setFont("6x8", 2);
  g.drawString("You WON!", 75, SCREEN_WIDTH/2 - 10);
}

function draw() {
  g.clear();
  g.setColor(0);
  g.fillRect(0,0,240,240);
  drawScore();
  drawLives();
  drawBricks();
  drawBallOfDestruction();
  drawBrickDestroyer();
  collisionDetection();

  if(x + dx > SCREEN_WIDTH - BALLRADIUS || x + dx < BALLRADIUS) {
    dx = -dx;
  }
  if(y + dy < BALLRADIUS) {
    dy = -dy;
  } else if(y + dy > SCREEN_HEIGHT - BALLRADIUS) {
    if(x > paddleX && x < paddleX + paddleWidth) {
      dy = -dy;
    } else {
      lives--;
      if(!lives) {
        drawGameOver();
      } else {
        x = SCREEN_WIDTH/2;
        y = SCREEN_HEIGHT - 20;
        dx = 3;
        dy = -3;
        paddleX = (SCREEN_WIDTH - paddleWidth)/2;
      }
    }
  }

  if(rightPressed && paddleX < SCREEN_WIDTH - paddleWidth) {
    paddleX += 5;
  } else if(leftPressed && paddleX > 0) {
    paddleX -= 5;
  }

  x += dx;
  y += dy;
}

startGame();
setWatch(o => {
  leftPressed = true;
  rightPressed = false;
}, BTN_L, {repeat: true});
setWatch(o => {
  rightPressed = true;
  leftPressed = false;
}, BTN_R, {repeat: true});
setWatch(o => {
  startGame();
  clearInterval(interval);
}, BTN3, {repeat: true});