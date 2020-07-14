/*
 * BreakOut clone BrickBreaker for BangleJS
 *
 * Author: Israel Ochoa https://github.com/IsReal8a/
 * Created: July 2020
 *
 * Inspired and copy-pasted from:
 * BangleJS Pong game : Frederic Rousseau https://github.com/fredericrous
 */

const SCREEN_WIDTH = 240;
const FPS = 16;
const LIVES = 3;
let scores = [0, LIVES];
let winnerMessage = '';

const sound = {
  ping: () => Bangle.beep(8, 466),
  pong: () => Bangle.beep(8, 220),
  fall: () => Bangle.beep(16*3, 494).then(_ => Bangle.beep(32*3, 3322))
};

class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  add(x) {
    this.x += x.x || 0;
    this.y += x.y || 0;
    return this;
  }
}

const constrain = (n, low, high) => Math.max(Math.min(n, high), low);
const random = (min, max) => Math.random() * (max - min) + min;
const intersects = (circ, rect, right) => {
  var c = circ.pos;
  var r = circ.r;
  if (c.y - r < rect.pos.y + rect.height && c.y + r > rect.pos.y) {
    if (right) {
      return c.x + r > rect.pos.x - rect.width*2 && c.x < rect.pos.x + rect.width;
    } else {
      return c.x - r < rect.pos.x + rect.width*2 && c.x > rect.pos.x - rect.width;
    }
  }
  return false;
};

/////////////////////////////  Ball  //////////////////////////////////////////

class Ball {
  constructor() {
    this.r = 4;
    this.prevPos = null;
    this.originalSpeed = 4;
    this.maxSpeed = 6;
    this.reset();
  }
  reset() {
    this.speed = this.originalSpeed;
    var x = scores[0] < scores[1] || (scores[0] === 0 && scores[1] === 0) ? -this.speed : this.speed;
    var bounceAngle = Math.PI / 6;
    this.velocity = new Vector(x * Math.cos(bounceAngle), this.speed * -Math.sin(bounceAngle));
    this.pos = new Vector(SCREEN_WIDTH / 2, random(230, SCREEN_WIDTH));
   // this.ballReturn = 0;
  }
  restart() {
    this.reset();
    brickBreaker.pos = new Vector(brickBreaker.width * 2, SCREEN_WIDTH / 2 - brickBreaker.height / 2);
    this.pos = new Vector(SCREEN_WIDTH / 2, SCREEN_WIDTH / 2);
  }
  show(invert) {
    if (this.prevPos != null) {
      g.setColor(invert ? -1 : 0);
      g.fillCircle(this.prevPos.x, this.prevPos.y, this.prevPos.r);
    }
    g.setColor(invert ? 0 : -1);
    g.fillCircle(this.pos.x, this.pos.y, this.r);
    this.prevPos = {
      x: this.pos.x,
      y: this.pos.y,
      r: this.r
    };
  }
  bounceBrickBreaker(directionX, directionY, brickBreaker) {
   // this.ballReturn++;
    this.speed = constrain(this.speed + 2, this.originalSpeed, this.maxSpeed);
    var MAX_BOUNCE_ANGLE = 4 * Math.PI / 12;
    var angle = bounceAngle(brickBreaker.pos.y, this.pos.y, brickBreaker.height, MAX_BOUNCE_ANGLE);
    this.velocity.x = this.speed * angle.x * directionX;
    this.velocity.y = this.speed * angle.y * directionY;
   // this.ballReturn % 2 === 0 ? sound.ping() : sound.pong();
  }
  bounce(directionX, directionY, brickBreaker) {
    if (brickBreaker) {
      return this.bounceBrickBreaker(directionX, directionY, brickBreaker);
    }
    if (directionX) {
      this.velocity.x = Math.abs(this.velocity.x) * directionX;
    }
    if (directionY) {
      this.velocity.y = Math.abs(this.velocity.y) * directionY;
    }
  }
  fall(brickBreakerId) {
    scores[brickBreakerId]--;
    if (scores[brickBreakerId] === 0) {
      this.restart();
      state = 3;
      if (brickBreakerId === 1) {
        winnerMessage = "Game Over";
      } else {
        winnerMessage = "You Won!";
      }
    } else {
      sound.fall();
      this.reset();
    }
  }
  wallCollision() {
    if (this.pos.y < 0) {
      this.bounce(0, 1);
    } else if (this.pos.y > SCREEN_WIDTH) {
      this.fall(1);
    } else if (this.pos.x < 0) {
      this.bounce(1, 0);
    } else if (this.pos.x > SCREEN_WIDTH) {
      this.bounce(-1, 0);
    } else {
      return false;
    }
    return true;
  }
  brickBreakerCollision(brickBreaker) {
    if (intersects(this, brickBreaker)) {
      if (this.pos.x < SCREEN_WIDTH / 2) {
        this.bounce(1, 1, brickBreaker);
        this.pos.add(new Vector(this.width, 0));
      } else {
        this.bounce(-1, 1, brickBreaker);
        this.pos.add(new Vector(-(this.width / 2 + 1), 0));
    }
      return true;
    }
      return false;
  }
  collisions() {
    return this.wallCollision() || this.brickBreakerCollision(brickBreaker); // || this.brickBreakerCollision(ai);
  }
  updatePosition() {
    var elapsed = new Date().getTime() - this.lastUpdate;
    var x = (elapsed / 50) * this.velocity.x;
    var y = (elapsed / 50) * this.velocity.y;
    this.pos.add(new Vector(x, y));
  }
  update() {
    this.updatePosition();
    this.lastUpdate = new Date().getTime();
    this.collisions();
  }
}
function bounceAngle(brickBreakerY, ballY, brickBreakerHeight, maxHangle) {
  let relativeIntersectY = (brickBreakerY + (brickBreakerHeight/2)) - ballY;
  let normalizedRelativeIntersectionY = relativeIntersectY / (brickBreakerHeight/2);
  let bounceAngle = normalizedRelativeIntersectionY * maxHangle;
  return { x: Math.cos(bounceAngle), y: -Math.sin(bounceAngle) };
}

////////////////////////////  BrickBreaker  /////////////////////////////////////////

class BrickBreaker {
  constructor(right) {
    this.width = 30;
    this.height = 4;
    this.pos = new Vector(SCREEN_WIDTH / 2 - this.width / 2, SCREEN_WIDTH - this.height);
    this.acc = new Vector(0, 0);
    this.speed = 15;
    this.maxSpeed = 25;
    this.prevPos = null;
    this.right = right;
  }
  show() {
    if (this.prevPos != null) {
      g.setColor(0);
      g.fillRect(this.prevPos.x1, this.prevPos.y1, this.prevPos.x2, this.prevPos.y2);
    }
    g.setColor(-1);
    g.fillRect(this.pos.x, this.pos.y, this.pos.x + this.width, this.pos.y + this.height);
    this.prevPos = {
      x1: this.pos.x,
      y1: this.pos.y,
      x2: this.pos.x + this.width,
      y2: this.pos.y + this.height
    };
  }
  leftMove() {
    this.acc.x -= this.speed;
  }
  rightMove() {
    this.acc.x += this.speed;
  }
  stop() {
    this.acc.x = 0;
  }
  update() {
    this.acc.x = constrain(this.acc.x, -this.maxSpeed, this.maxSpeed);
    this.pos.add(this.acc);
    this.pos.x = constrain(this.pos.x, 0, SCREEN_WIDTH - this.width);
  }
}

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

function drawBricks() {
  g.setColor(-1);
  for (var c = 0; c < brickColumnCount; c++) {
    for (var r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status == 1) {
        var brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
        var brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
        bricks[c][r].x = brickX;
        bricks[c][r].y = brickY;
        g.fillRect(brickX, brickY, brickX + brickWidth, brickY + brickHeight);
      }
    }
  }
}

function drawScores() {
  let x1 = SCREEN_WIDTH / 16 + 2;
  let x2 = SCREEN_WIDTH * 3 / 4;

  g.setColor(0);
  g.setFont('6x8', 1);
  g.drawString("Score:" + prevScores[0], x1, 7);
  g.drawString("Lives:" + prevScores[1], x2, 7);
  g.setColor(-1);
  g.setFont('6x8', 1);
  g.drawString("Score:" + scores[0], x1, 7);
  g.drawString("Lives:" + scores[1], x2, 7);
  prevScores = scores.slice();
}

function drawGameOver() {
  g.setFont("6x8", 2);
  g.drawString(winnerMessage, 65, SCREEN_WIDTH / 2 - 10);
}

function drawStartScreen(hide) {
  g.setColor(hide ? 0 : -1);
  g.setFont("6x8", 2);
  g.drawString("Press BTN3", 65, 80);
  g.drawString("to start", 76, 100);
}

function drawStartTimer(count, callback) {
  setTimeout(_ => {
    brickBreaker.show();
    g.setColor(0);
    g.fillRect(117-7, 115-7, 117+14, 115+14);
    if (count >= 0) {
      g.setFont("4x6", 2);
      g.drawString(count+1, 115, 115);
      g.setColor(-1);
      g.drawString(count === 0 ? 'Go!' : count, 115 - (count === 0 ? 4: 0), 115);
      drawStartTimer(count - 1, callback);
    } else {
      g.setColor(0);
      g.fillRect(117-7, 115-7, 117+14, 115+14);
      callback();
    }
  }, 800);
}

//////////////////////////////// Main /////////////////////////////////////////

function onFrame() {
  if (state === 1) {
    ball.update();
    brickBreaker.update();
    ball.show();
    brickBreaker.show();
    ball.show();
    g.flip();
  } else if (state === 3) {
    g.clear();
    g.setColor(0);
    g.fillRect(0,0,240,240);
    state++;
  } else if (state === 4) {
    drawGameOver();
  } else {
    brickBreaker.show();
  }
  drawScores();
}

function startThatGame() {
  brickBreaker.show();
  drawBricks();
  drawScores();
  drawStartTimer(3, () => setInterval(onFrame, 1000 / FPS));
}

var brickBreaker = new BrickBreaker();
var ball = new Ball();
var state = 0;
var prevScores = [0, 0];

g.clear();
g.setColor(0);
g.fillRect(0,0,240,240);
setTimeout(() => {
  drawStartScreen();
}, 2000);

////////////////////////////// Controls ///////////////////////////////////////

setWatch(o => {
  if (state === 0) {
    if (o.state) {
      drawStartScreen();
    }
  } else o.state ? brickBreaker.leftMove() : brickBreaker.stop();
}, BTN1, {repeat: true, edge: 'both'});
setWatch(o => {
  if (state === 0) {
    if (o.state) {
      drawStartScreen();
    }
  } else o.state ? brickBreaker.rightMove() : brickBreaker.stop();
}, BTN2, {repeat: true, edge: 'both'});
setWatch(o => {
  state++;
  clearInterval();
  if (state >= 2) {
    g.setColor(0);
    g.fillRect(0, 0, 240, 240);
    ball.show(true);
    scores = [0, LIVES];
    brickBreaker = new BrickBreaker();
    ball = new Ball();
    state = 1;
    startThatGame();
  } else {
    drawStartScreen(true);
    startThatGame();
  }
}, BTN3, {repeat: true});