var WIDTH = document.getElementById("mycanvas").width;
var HEIGHT = document.getElementById("mycanvas").height;
var ctx = document.getElementById("mycanvas").getContext('2d');
var mycanvas = document.getElementById("mycanvas")

var score = 0,alive = true,lives = 3;
var gameStarted = false;
speed_game = 1000/30;
timer = 0;
// Mobile and gameplay enhancements
var autoFire = true;
var fireIntervalMs = 200; // fire every 200ms when active
var lastShotTime = 0;
var pointerActive = false;
var coinsCollected = 0;
var diamondsCollected = 0;
var coinList = [];
var diamondList = [];
// On-screen control state
var moveLeft = false;
var moveRight = false;
var moveSpeed = 8;

var ship = { //Object ship which contains all attributes of the ship
	x:245,
	y: 525,
	w: 50,
	h: 50,
	speedBullet: 15,

	draw: function() {
		if(ship.x > (WIDTH - 50)) {
			ship.x = (WIDTH - 50);
		}
		if(ship.y > (HEIGHT - 50)) {
			ship.y = (HEIGHT - 50);
		}
		if(ship.x < 50) {
			ship.x = 50
		}
		if(ship.y < 50) {
			ship.y = 50
		}

		ctx.drawImage(shipImage,ship.x,ship.y,ship.w,ship.h) //Used to draw our ship on the canvas with required coordinates along with height and width
	},
}

function clearCanvas() {
	ctx.clearRect(0,0,WIDTH,HEIGHT);
}

function init() {
	//Loading all required images
	enemyImage = new Image()
	shipImage = new Image();
	bulletImage = new Image();
	shipImage.src = "Images/spaceship.png";
	enemyImage.src = "Images/enemy2.png";
	bulletImage.src = "Images/bullet.png";

	mycanvas.addEventListener('click',gameStart, false);

	// Touch controls: tap to start, drag to move ship
	mycanvas.addEventListener('touchstart', function(e){
		if(!gameStarted) gameStart();
		pointerActive = true;
		updateShipFromTouch(e);
	}, {passive:true});
	mycanvas.addEventListener('touchmove', function(e){
		if(pointerActive) updateShipFromTouch(e);
	}, {passive:true});
	mycanvas.addEventListener('touchend', function(){
		pointerActive = false;
	}, {passive:true});

	// On-screen buttons (left/right)
	var leftBtn = document.getElementById('leftBtn');
	var rightBtn = document.getElementById('rightBtn');
	if (leftBtn && rightBtn) {
		var startLeft = function(e){ moveLeft = true; e && e.preventDefault && e.preventDefault(); };
		var endLeft = function(e){ moveLeft = false; e && e.preventDefault && e.preventDefault(); };
		var startRight = function(e){ moveRight = true; e && e.preventDefault && e.preventDefault(); };
		var endRight = function(e){ moveRight = false; e && e.preventDefault && e.preventDefault(); };
		// Mouse
		leftBtn.addEventListener('mousedown', startLeft);
		leftBtn.addEventListener('mouseup', endLeft);
		rightBtn.addEventListener('mousedown', startRight);
		rightBtn.addEventListener('mouseup', endRight);
		leftBtn.addEventListener('mouseleave', endLeft);
		rightBtn.addEventListener('mouseleave', endRight);
		// Touch
		leftBtn.addEventListener('touchstart', startLeft, {passive:false});
		leftBtn.addEventListener('touchend', endLeft, {passive:false});
		leftBtn.addEventListener('touchcancel', endLeft, {passive:false});
		leftBtn.addEventListener('touchmove', function(e){ e.preventDefault(); }, {passive:false});
		rightBtn.addEventListener('touchstart', startRight, {passive:false});
		rightBtn.addEventListener('touchend', endRight, {passive:false});
		rightBtn.addEventListener('touchcancel', endRight, {passive:false});
		rightBtn.addEventListener('touchmove', function(e){ e.preventDefault(); }, {passive:false});
		// Pointer events (covers stylus/touch/mouse reliably)
		if (window.PointerEvent) {
			leftBtn.addEventListener('pointerdown', startLeft);
			leftBtn.addEventListener('pointerup', endLeft);
			leftBtn.addEventListener('pointercancel', endLeft);
			rightBtn.addEventListener('pointerdown', startRight);
			rightBtn.addEventListener('pointerup', endRight);
			rightBtn.addEventListener('pointercancel', endRight);
		}
		// Prevent context menu disrupting hold
		leftBtn.addEventListener('contextmenu', function(e){ e.preventDefault(); });
		rightBtn.addEventListener('contextmenu', function(e){ e.preventDefault(); });
	}

	addEnemies();
	// Ensure game starts even without initial click/tap
	if (!gameStarted) { gameStart(); }
	gameLoop();
}

// Update ship position from touch/pointer
function updateShipFromTouch(e){
    if(!e.touches || e.touches.length === 0) return;
    var rect = mycanvas.getBoundingClientRect();
    var tx = e.touches[0].clientX - rect.left;
    var ty = e.touches[0].clientY - rect.top;
    ship.x = Math.min(Math.max(tx - ship.w/2, 50), WIDTH - 50);
    ship.y = Math.min(Math.max(ty - ship.h/2, 50), HEIGHT - 50);
}

function gameStart() {
	gameStarted = true;
	mycanvas.removeEventListener('click',gameStart,false);
}

var enemyList = [];
enemyTotal = 5;

function enemy(x,y,speed) {
	this.x = x,
	this.y = y,
	this.w = 50,
	this.h = 50,
	this.speed = speed,
	this.vx = (Math.random() * 2 - 1) * 1.5, // random horizontal drift
	this.vy = 2 + Math.random() * 2, // base vertical speed varies per enemy
	this.count = 0, //To measure the cycle from left to right

	this.draw = function() {
		ctx.drawImage(enemyImage,this.x,this.y,this.w,this.h);
	}
}

function addEnemies() {
	// Spawn enemies across available width
	var speed = 5;
	for(var i=0; i<enemyTotal; i++) {
		var rx = Math.random() * (WIDTH - 100) + 50;
		var e = new enemy(rx, -25, speed);
		enemyList.push(e);
	}
}

function drawEnemies() {
	for(var i=0;i<enemyList.length;i++) {
		enemyList[i].draw();
	}
}

function moveEnemies() {
	for(var i = 0;i < enemyList.length; i++) {
		var e = enemyList[i];
		if(e.y < HEIGHT) {
			// Difficulty ramp affects vertical speed
			var ramp = 1 + (timer / 1800); // slow, continuous increase
			e.y += e.vy * ramp;
			e.x += e.vx;
			// bounce on edges
			if (e.x <= 0 || e.x + e.w >= WIDTH) {
				e.vx *= -1;
				// nudge inside bounds
				e.x = Math.max(0, Math.min(e.x, WIDTH - e.w));
			}
			// occasional small random direction change for unpredictability
			if (Math.random() < 0.01) {
				e.vx += (Math.random() * 2 - 1) * 0.5;
				// limit vx
				e.vx = Math.max(-3, Math.min(3, e.vx));
			}
		}
		else if(e.y > HEIGHT - 1) {
			e.y = -40;
			e.x = Math.random() * (WIDTH - e.w);
			// refresh movement a bit on wrap
			e.vx = (Math.random() * 2 - 1) * 1.5;
			e.vy = 2 + Math.random() * 2;
		} 
	}
	// Gradually increase number of enemies up to a cap
	var maxEnemies = 8;
	if (timer % 240 === 0 && enemyList.length < maxEnemies) {
		var e = new enemy((Math.random() * (WIDTH - 100)) + 50, -25,5);
		enemyList.push(e);
	}
}

//%%%%%%%%%%%BULLET

var bulletTotal = 5;
bulletList = [];

function bullet(x,y,speed) {
	this.x = x;
	this.y = y;
	this.w = 5;
	this.h = 10,
	this.state = "active"
	this.speed = speed;
	
	this.draw = function() {
		ctx.drawImage(bulletImage,this.x,this.y,this.w,this.h)
	}
}

function drawBullet() {
	for(var i=0;i<bulletList.length;i++) {
		bulletList[i].draw();
	}
}

function moveBullet() {
	for(var i=0; i<bulletList.length;i++) {
		if(bulletList[i].y > -11) {
			bulletList[i].y -= bulletList[i].speed
		}
		else if(bulletList[i].y < -10) {
			bulletList.splice(i,1);
		}
	}
}

//%%%%%%%Collision Test and Score increment

function collisionBullet() {
	var check = false;
	for(var i=0; i<bulletList.length;i++) {
		for(var j=0;j<enemyList.length;j++){
			if(bulletList[i].y <= (enemyList[j].y + enemyList[j].h) && bulletList[i].x >= enemyList[j].x && bulletList[i].x <= (enemyList[j].x + enemyList[j].w)) {
				check = true;
				enemyList.splice(j,1);
				score += 10;
				var e = new enemy((Math.random() * (WIDTH - 100)) + 50, -25,5);
				enemyList.push(e);
			}
		}
		if(check == true) {
			bulletList.splice(i,1);
			check = false;
		}
	}
}

function collisionShip() {
	var ship_xw = ship.x + ship.w, ship_yh = ship.y + ship.h;
	for(var i=0; i<enemyList.length; i++) {
		if(ship.x > enemyList[i].x && ship.x < (enemyList[i].x + enemyList[i].w) && ship.y > enemyList[i].y && ship.y < (enemyList[i].y + enemyList[i].h)) {
			checkLives();
			//console.log("1");
		}
		if (ship_xw < enemyList[i].x + enemyList[i].w && ship_xw > enemyList[i].x && ship.y > enemyList[i].y && ship.y < enemyList[i].y + enemyList[i].h) {
      		checkLives();
      		//console.log("2");
    	}
    	if (ship_yh > enemyList[i].y && ship_yh < enemyList[i].y + enemyList[i].h && ship.x > enemyList[i].x && ship.x < enemyList[i].x + enemyList[i].w) {
      		checkLives();
      		//console.log("3");
    	}
    	if (ship_yh > enemyList[i].y && ship_yh < enemyList[i].y + enemyList[i].h && ship_xw < enemyList[i].x + enemyList[i].w && ship_xw > enemyList[i].x) {
      		checkLives();
      		//console.log("4");
    	}
 	}
}
//%%%%%%%Score display
function displayScore() {
	ctx.font = 'bold 15px Orbitron';
	ctx.fillStyle = '#fff'
	// Adjusted for 360px width
	ctx.fillText('Score:', 10, 30);
	ctx.fillText(score, 60, 30);
	ctx.fillText('Coins:', 110, 30);
	ctx.fillText(coinsCollected, 165, 30);
	ctx.fillText('Diam:', 200, 30);
	ctx.fillText(diamondsCollected, 245, 30);
	ctx.fillText('Lives:', 280, 30);
	ctx.fillText(lives, 325, 30);
	
	if (!gameStarted) {
      ctx.font = 'bold 22px Orbitron';
      ctx.fillText('Generic Space Shooter', WIDTH/2-140,HEIGHT/2);
      ctx.font = 'bold 16px Orbitron';
      ctx.fillText('Tap to Play • Drag to Move', WIDTH/2-120, HEIGHT/2+28);
      ctx.fillText('Auto-fire enabled', WIDTH/2-70,HEIGHT/2+50);
  }

	if (!alive) {
	   ctx.fillText('Game Over!',245,HEIGHT/2);
	   ctx.fillText('Click anywhere to play again',WIDTH/2-110,HEIGHT/2+25);
	   mycanvas.addEventListener('click',gameRestart,false);
	}
}

//%%%%%%%%%Lives check and Reset
function checkLives() {
    lives -= 1;
    if (lives > 0) {
        reset();
    } else if (lives === 0) {
        alive = false;
    }
}

function reset() {
    ship.x = Math.min(Math.max(245, 50), WIDTH - 50);
    ship.y = Math.min(Math.max(525, 50), HEIGHT - 50);
    enemyList = [];
    addEnemies();
    coinList = [];
    diamondList = [];
}

function gameRestart() {
    ship.x = Math.min(Math.max(245, 50), WIDTH - 50);
    ship.y = Math.min(Math.max(525, 50), HEIGHT - 50);
    score = 0;
    lives = 3;
    enemyList = [];
    alive = true;
    addEnemies();
    mycanvas.removeEventListener('click',gameRestart,false);
    coinsCollected = 0;
    diamondsCollected = 0;
    coinList = [];
    diamondList = [];
}

// Keyboard controls (still supported on desktop)
document.onkeydown = function(event) {
    if (event.keyCode == 37) { // left
        ship.x = ship.x - 10;
    }
    else if (event.keyCode == 38) { // up
        ship.y = ship.y - 10;
    }
    else if (event.keyCode == 39) { // right
        ship.x = ship.x + 10;
    }
    else if (event.keyCode == 40) { // down
        ship.y = ship.y + 10;
    }
    else if (event.keyCode == 32 && bulletList.length <= bulletTotal) { // space manual fire
        var b = new bullet(ship.x+25,ship.y-10,ship.speedBullet)
        bulletList.push(b);
    }
}

window.addEventListener("keydown", function(e) {
    if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault();
    }
}, false);

function gameLoop() {
    clearCanvas();
    if (alive && lives > 0 && gameStarted) {
        // On-screen button movement
        if (moveLeft && !moveRight) { ship.x -= moveSpeed; }
        if (moveRight && !moveLeft) { ship.x += moveSpeed; }
        // Clamp after movement
        if (ship.x < 50) ship.x = 50;
        if (ship.x > (WIDTH - 50)) ship.x = (WIDTH - 50);
        // Auto-fire
        if (autoFire) {
            var now = Date.now();
            if (now - lastShotTime >= fireIntervalMs && bulletList.length <= bulletTotal) {
                var b = new bullet(ship.x+25,ship.y-10,ship.speedBullet)
                bulletList.push(b);
                lastShotTime = now;
            }
        }
        collisionBullet();
        collisionShip();
        moveEnemies();
        moveBullet();
        spawnCollectibles();
        moveCollectibles();
        collectCollectibles();
        drawEnemies();
        ship.draw();
        drawBullet();
        drawCollectibles();
        displayScore();
        timer = timer + 1;
        if(timer % 100 == 0) {
            speed_game = speed_game - 1/3;
        }
    }
    displayScore();
    game = setTimeout(gameLoop, speed_game);
}

window.onload = init;

// ================= Collectibles (Coins & Diamonds) ================= //
function spawnCollectibles(){
    // Coins spawn more frequently
    if (timer % 90 === 0) {
        var c = { x: Math.random() * (WIDTH-100) + 50, y: -20, r: 8, type: 'coin', speed: 3 };
        coinList.push(c);
    }
    // Diamonds are rarer
    if (timer % 300 === 0) {
        var d = { x: Math.random() * (WIDTH-100) + 50, y: -20, r: 10, type: 'diamond', speed: 3 };
        diamondList.push(d);
    }
}

function moveCollectibles(){
    var fall = 2 + Math.floor(timer/180);
    for (var i=coinList.length-1; i>=0; i--) {
        coinList[i].y += fall;
        if (coinList[i].y > HEIGHT + 20) coinList.splice(i,1);
    }
    for (var j=diamondList.length-1; j>=0; j--) {
        diamondList[j].y += fall;
        if (diamondList[j].y > HEIGHT + 20) diamondList.splice(j,1);
    }
}

function drawCollectibles(){
    // coins - gold circles
    for (var i=0;i<coinList.length;i++){
        ctx.beginPath();
        ctx.fillStyle = '#ffcc33';
        ctx.arc(coinList[i].x, coinList[i].y, coinList[i].r, 0, Math.PI*2);
        ctx.fill();
        ctx.closePath();
    }
    // diamonds - rhombus
    ctx.fillStyle = '#66e0ff';
    for (var j=0;j<diamondList.length;j++){
        var d = diamondList[j];
        ctx.beginPath();
        ctx.moveTo(d.x, d.y - d.r);
        ctx.lineTo(d.x + d.r, d.y);
        ctx.lineTo(d.x, d.y + d.r);
        ctx.lineTo(d.x - d.r, d.y);
        ctx.closePath();
        ctx.fill();
    }
}

function collectCollectibles(){
    var sx1 = ship.x, sy1 = ship.y, sx2 = ship.x + ship.w, sy2 = ship.y + ship.h;
    for (var i=coinList.length-1; i>=0; i--){
        var c = coinList[i];
        if (rectCircleOverlap(sx1, sy1, sx2, sy2, c.x, c.y, c.r)){
            coinsCollected += 1;
            score += 5;
            coinList.splice(i,1);
        }
    }
    for (var j=diamondList.length-1; j>=0; j--){
        var d = diamondList[j];
        if (rectCircleOverlap(sx1, sy1, sx2, sy2, d.x, d.y, d.r)){
            diamondsCollected += 1;
            score += 25;
            diamondList.splice(j,1);
        }
    }
}

function rectCircleOverlap(x1,y1,x2,y2,cx,cy,cr){
    // clamp circle center to rect
    var closestX = Math.max(x1, Math.min(cx, x2));
    var closestY = Math.max(y1, Math.min(cy, y2));
    var dx = cx - closestX;
    var dy = cy - closestY;
    return (dx*dx + dy*dy) <= cr*cr;
}
