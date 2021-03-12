/*

The Game Project Final
Created by Evan Akselrad

*/
'use strict';

var scrollPos;
var floorPos_y

// Scenery & Player
var trees;
var canyons;
var collectables;
var clouds;
var mountains;
var platforms;
var camp;
var player;
var color;

// Game overlay
var game_score;
var gameLevel
var lives;

// Sounds
var jumpSound;
var fireSound;
var collectSound;
var fallSound;

function preload(){
    soundFormats('mp3','wav');
    // load sounds
    jumpSound = loadSound('assets/jump.mp3');
    jumpSound.setVolume(1);
    
    fireSound = loadSound('assets/fire.mp3');
    fireSound.setVolume(0.3);
    
    collectSound = loadSound('assets/gulp.mp3');
    collectSound.setVolume(0.3);
    
    fallSound = loadSound('assets/falling.mp3');
    fallSound.setVolume(0.3);
}

function setup()
{
	createCanvas(1024, 576);
	floorPos_y = height * .75;
    
    color = {
        // Character
        touque:   [25,25,112],
        backpack: [85,107,47],
        packEdge: [0,100,0],
        body:     [70,130,180],
        strap:    [47,79,79],
        head:     [200,150,150],
        shoe:     [0],
        
        // Scenery
        cloud:    [255],
        sky:      [100,155,255],
        ground:   [0,155,0],
        mountain: [147,112,219],
        mtnShade: [106,90,205],
        mtnPeak:  [255],
        trunk:    [120,100,40],
        branch:   [0,155,0],
        canyon:   [75],
        
        // Collectable
        cupBody:  [139,0,0],
        cupRim:   [255],
        cupCoffee:[0],
        
        // Camp
        tent:     [255,165,0],
        tentSide: [255,140,0],
        log:      [139,69,19],
        logStroke:[160,82,45],
        rock:     [100],
        rockStroke:[50]
    };
    
    gameLevel = 1;
    startGame();
}

// Function to set initial gamestate, called at the beginning of the game and after losing a life
function startGame(prev_score){
    fireSound.pause(); // pause the campfire sound if it was playing from the previous level
	// Variable to control the background scrolling.
	scrollPos = 1800;

    player = new Player();
    player.initialize();
    
    clouds = new Cloud(random(15,30));
    clouds.initialize();
    
    mountains = new Mountain(random(10,15));
    mountains.initialize();
    
    canyons = new Canyon(5);
    canyons.initialize();
    
    platforms = [];
    for (let i = 0; i < canyons.get().length - 1; i++){ 
        // length-1 since last canyon is always impassable on the far left of the level
        if (canyons.get()[i].halfWidth > 50){
            let currentPlatform = createPlatform(canyons.get()[i].x,canyons.get()[i].halfWidth);
            platforms.push(currentPlatform);
        }
    }
    
    trees = new Tree(random(10,20),canyons.get());
    trees.initialize();    
    
    collectables = new Collectable(random(5,10),canyons.get());
    collectables.initialize();
    
    camp = new Camp(1700);
    camp.initialize();
    
    // carry over score from last level
    if (game_score == null){
        game_score = 0;
    } else { game_score = prev_score;}
    
    if (lives < 1 || lives == null){
        lives = 3;
    }
}

function draw()
{
	background(color.sky); // fill the sky blue

	noStroke();
	fill(color.ground);
	rect(0, floorPos_y, width, height/4); // draw some green ground
    
    push();
    translate(scrollPos,0);

    clouds.draw();
    mountains.draw();
	trees.draw();
    canyons.draw();
    
    // use factory pattern to create platforms above large canyons
    for (let i = 0; i < platforms.length; i++){
            platforms[i].draw();
    }
    
	collectables.draw();
    camp.draw();
    
    pop();
    
    // Show score
    drawOverlay();
    
    player.draw();
    player.move(platforms);
    
    
    // Check game over
    if (lives < 1){
        textSize(20);
        fill(255,255,0);
        stroke(0);
        strokeWeight(3);
        text("Game over. Press space to continue.",width*.35,height/2);
        return;
    }
    
    // Check level complete
    if (camp.isReached){
        textSize(20);
        fill(255,255,0);
        stroke(0);
        strokeWeight(3);
        text("Level complete. Press space to continue.", width*.3,height/2);
        return;
    }
    
    // Check if player has fallen into a canyon, decrement lives and continue game
    player.checkDie(); 
}
// Function to show current game score.
function drawOverlay(){
    textSize(20);
    fill(255,255,0);
    stroke(0);
    strokeWeight(3);
    text("Level: " + gameLevel,10,30);
    text("Score: " + game_score,10,60);
    text("Lives: " + lives, 10,90);
    noStroke();
}

/* ---------------------
** Key control functions
** -------------------*/ 

function keyPressed(){    
    // move left
    if (keyCode === LEFT_ARROW && player.isPlummeting == false){
        player.isLeft = true;
    }
    
    // move right
    if (keyCode === RIGHT_ARROW && player.isPlummeting == false){
        player.isRight = true;
    }
    
    // restart game OR jump
    if (keyCode === 32 && (camp.isReached == true || lives < 1)) {
        if (camp.isReached == true){ 
            gameLevel += 1;
            startGame(game_score);
            return;
        }
        startGame(0); // reset score to 0 if all lives are gone
    } else if (keyCode === 32 && player.isFalling == false && player.isPlummeting == false){ //(player.y == floorPos_y)
        isFalling = true;
        player.y -= 100;
        jumpSound.play();
    }
}

function keyReleased(){
    if (keyCode === LEFT_ARROW){
        player.isLeft = false;
    }
    if (keyCode === RIGHT_ARROW){
        player.isRight = false;
    }
}

/* --------------------------------------------
** Constructors for scenery and player objects
** ------------------------------------------*/

function Player(){
    // Function to check if player has fallen, and restart game if lives remain
    this.checkDie = function(){
        if (this.y > height){
            lives -= 1;
            if (lives > 0){
                startGame(game_score);
            }
        }
    }
    
    this.draw = function(){
        // draw game character
        // Not moving
        if (((this.isLeft == false && this.isRight == false) || (this.isLeft == true && this.isRight == true)) && this.isFalling == false){
            //BACKPACK//
            stroke(color.packEdge);
            fill(color.backpack);
            rect(this.x-16,this.y-42, 31,25, 7,7,5,5);
            noStroke();
            //HEAD
            fill(color.head);
            ellipse(this.x, this.y-52,30);
            //TOUQUE
            fill(color.touque);
            rect(this.x-13,this.y-67, 26,7, 40,40,0,0);
            //BODY
            fill(color.body);
            rect(this.x-13,this.y-37, 26,30, 10,10,0,0);
            //BACKPACK STRAPS
            fill(color.strap);
            rect(this.x-5,this.y-37, 2,18);
            rect(this.x+3,this.y-37, 2,18);
            rect(this.x-13,this.y-19,26,2);
            //SHOES
            fill(color.shoe);
            rect(this.x-15,this.y-7,10,10);
            rect(this.x+5,this.y-7,10,10);
        }

        // Moving left
        if (this.isLeft == true && this.isRight == false && this.isFalling == false){

            stroke(color.packEdge);
            fill(color.backpack);
            rect(this.x+5,this.y-42, 10,25,7,5,5,0);
            noStroke();
            fill(color.head);
            rect(this.x-18, this.y-67,30,30, 30,20,20,30);
            fill(color.touque);
            rect(this.x-16,this.y-67, 26,7, 40,40,0,0);
            fill(color.body);
            rect(this.x-8,this.y-37, 13,30, 10,10,0,0);
            fill(color.strap);
            rect(this.x-5,this.y-37, 2,18);
            rect(this.x-8,this.y-19,13,2);
            stroke(color.strap);
            strokeWeight(2);
            beginShape(LINES);
                vertex(this.x-4,this.y-37);
                vertex(this.x+5,this.y-35);
            endShape();
            strokeWeight(1);
            stroke(color.shoe);
            noStroke();
            fill(color.shoe);
            rect(this.x-10,this.y-7,10,10);
        }

        //Moving right
        if (this.isRight == true && this.isLeft == false && this.isFalling == false){
            stroke(color.packEdge);
            fill(color.backpack);
            rect(this.x-14,this.y-42, 10,25,5,7,0,5);
            noStroke();
            fill(color.head);
            rect(this.x-10, this.y-67,30,30, 30,20,20,30);
            fill(color.touque);
            rect(this.x-8,this.y-67, 26,7, 40,40,0,0);
            fill(color.body);
            rect(this.x-3,this.y-37, 13,30, 10,10,0,0);
            fill(color.strap);
            rect(this.x+5,this.y-37, 2,18);
            rect(this.x-3,this.y-19,13,2);
            stroke(color.strap);
            strokeWeight(2);
            beginShape(LINES);
                vertex(this.x+6,this.y-37);
                vertex(this.x-3,this.y-35);
            endShape();
            strokeWeight(1);
            stroke(color.shoe);
            noStroke();
            fill(color.shoe);
            rect(this.x+2,this.y-7,10,10);
        }

        //Jumping up
        if (((this.isLeft == false && this.isRight == false) || (this.isLeft == true && this.isRight == true)) && this.isFalling == true){
            stroke(color.packEdge);
            fill(color.backpack);
            rect(this.x-16,this.y-45, 31,25, 7,5,5,7);
            noStroke();
            fill(color.head);
            ellipse(this.x, this.y-55,30);
            fill(color.touque);
            rect(this.x-13,this.y-70, 26,7, 40,40,0,0);
            fill(color.body);
            rect(this.x-13,this.y-40, 26,20, 10,10,0,0);
            fill(color.strap);
            rect(this.x-5,this.y-40, 2,18);
            rect(this.x+3,this.y-40, 2,18);
            rect(this.x-13,this.y-22,26,2);
            fill(color.shoe);
            rect(this.x-15,this.y-20,10,10);
            rect(this.x+5,this.y-20,10,10);
        }

        // Jumping left
        if (this.isLeft == true && this.isRight == false && this.isFalling == true){
            stroke(color.packEdge);
            fill(color.backpack);
            rect(this.x+5,this.y-42, 10,25,7,5,5,0);
            noStroke();
            fill(color.head);
            rect(this.x-18, this.y-67,30,30, 30,20,20,30);
            fill(color.touque);
            rect(this.x-16,this.y-67, 26,7, 40,40,0,0);
            fill(color.body);
            rect(this.x-8,this.y-37, 13,20, 10,10,0,0);
            fill(color.strap);
            rect(this.x-5,this.y-37, 2,18);
            rect(this.x-8,this.y-19,13,2);
            stroke(color.strap);
            strokeWeight(2);
            beginShape(LINES);
                vertex(this.x-4,this.y-37);
                vertex(this.x+5,this.y-35);
            endShape();
            strokeWeight(1);
            stroke(color.shoe);
            noStroke();
            fill(color.shoe);
            rect(this.x-10,this.y-17,10,10);
        }

        // Jumping right
        if (this.isRight == true && this.isLeft == false && this.isFalling == true){
            stroke(color.strap);
            fill(color.backpack);
            rect(this.x-14,this.y-42, 10,25,5,7,0,5);
            noStroke();
            fill(color.head);
            rect(this.x-10, this.y-67,30,30, 30,20,20,30);
            fill(color.touque);
            rect(this.x-8,this.y-67, 26,7, 40,40,0,0);
            fill(color.body);
            rect(this.x-3,this.y-37, 13,20, 10,10,0,0);
            fill(color.strap);
            rect(this.x+5,this.y-37, 2,18);
            rect(this.x-3,this.y-19,13,2);
            stroke(color.strap);
            strokeWeight(2);
            beginShape(LINES);
                vertex(this.x+6,this.y-37);
                vertex(this.x-3,this.y-35);
            endShape();
            strokeWeight(1);
            stroke(color.shoe);
            noStroke();
            fill(color.shoe);
            rect(this.x+2,this.y-17,10,10);
        }
        
    }
    
    this.move = function(platforms){
        this.platforms = platforms;
        
        if (camp.isReached == false){ // if the player has reached the goal, only allowable movement is down due to gravity
            if (this.isLeft){
                if (this.x > width * 0.2){
                    this.x -= 5;
                } else {
                    scrollPos += 5;
                }
            }

            if (this.isRight){
                if (this.x < width * 0.8){
                    this.x  += 5;
                } else {
                    scrollPos -= 5; // negative for moving against the background
                }
            }
        }
        // Logic to make the game character rise and fall.
        if (this.y < floorPos_y){
            let isContact = false;
            for (var i = 0; i < this.platforms.length; i++){
                if (this.platforms[i].check(this.worldX,this.y) == true){ // check if player is standing on a platform
                    isContact = true;
                    this.isFalling = false;
                   // break;
                }
            }
            if (isContact == false){
                this.y += 2;
                this.isFalling = true;
            }
        } else {
                this.isFalling = false;
        }

        if (this.isPlummeting == true){
            this.isLeft = false;
            this.isRight = false;
            this.isFalling = false;
            this.y += 4;
        }
        // Update real position of gameChar for collision detection.
        this.worldX = this.x - scrollPos;
    }
    
    this.initialize = function(){
        this.isLeft = false;
        this.isRight = false;
        this.isFalling = false;
        this.isPlummeting = false;
        this.x = width/2;
	    this.y= floorPos_y;
        this.worldX = this.x - scrollPos;
    }
    
}

// Particle and Emitter functions used for campfire effect
function Emitter(x,y,xSpeed,ySpeed,size){
    this.x = x;
    this.y = y;
    this.xSpeed = xSpeed;
    this.ySpeed = ySpeed;
    this.size = size;
    
    this.startParticles = 0;
    this.lifetime = 0;
    
    this.particles = [];
    
    this.addParticle = function(){
        var p = new Particle(random(this.x-8, this.x+8),
                             random(this.y-10, this.y+10),
                             random(this.xSpeed-.5, this.xSpeed+.5),
                             random(this.ySpeed-2, this.ySpeed-1),
                             random(this.size-4, this.size+4)
                            );
        return p;
    }
    
    this.startEmitter = function(startParticles, lifetime){
        this.startParticles = startParticles;
        this.lifetime = lifetime;
        
        // start emitter with initial particles
        for(var i = 0; i < this.startParticles; i++){
            this.particles.push(this.addParticle());
        }
    }
    
    this.updateParticles = function(type){
        this.type = type;
        // iterate through particles and draw
        var deadParticles = 0;
        for (var i = this.particles.length - 1; i >= 0; i--){
            this.particles[i].drawParticle(type);
            this.particles[i].updateParticle();
            
            // remove old particles
            if (this.particles[i].age > random(0,this.lifetime)){
                this.particles.splice(i,1);
                deadParticles++;
            }
        }
        
        // replace removed particles
        if (deadParticles > 0){
            for (var i = 0; i < deadParticles; i++){
                this.particles.push(this.addParticle());
            }
        }
    }
}

function Particle(x,y,xSpeed,ySpeed,size){
    //initialize particle vars
    this.x = x;
    this.y = y;
    this.xSpeed = xSpeed;
    this.ySpeed = ySpeed;
    this.size = size;
    this.age = 0;
    this.alpha = 200;
    
    // draw either a smoke or a fire particle
    this.drawParticle = function(type){
        this.type = type;
        // set color to a random "fire" or "smoke" palette
        if (this.type == 'fire'){
            fill(random(200,230),random(50,150),10,this.alpha)
        } else if (this.type == 'smoke'){
            fill(random(50,150),random(0,this.alpha));
        }
        ellipse(this.x,this.y,this.size);
    }
    
    // move and age the particle
    this.updateParticle = function(){
        this.x += this.xSpeed;
        this.y += this.ySpeed;
        this.age++;
        this.alpha -= 2; // becomes more transparent the longer it exists
    }
}

/*
** Scenery items
*/
function Camp(x_pos){
    this.x = x_pos;
    
    this.check= function(){
        if (dist(this.x,0,player.worldX,0) <= 5){
            fireSound.loop();
            this.isReached = true;
        }
    }
   
    // turns on the campfire if gameChar has reached the tent, otherwise check if gameChar has reached the tent
    this.goalReached = function(){
       if (this.isReached == true){
           smoke.updateParticles('smoke');
           fire.updateParticles('fire');
       } else { this.check(); }
    }
    
    this.initialize = function(){
        this.isReached = false;
        
        // Emitter(x,y,xSpeed,ySpeed,size)
        // startEmitter(startParticles,lifetime)
        var smoke = new Emitter(this.x-105, floorPos_y -60, 2.5,-.1,5);
        smoke.startEmitter(700,700);

        var fire = new Emitter(this.x-105, floorPos_y -30, 0,1,6);
        fire.startEmitter(200,180);
    }
    
    this.draw = function(){
        //logs
        strokeWeight(2);
        stroke(color.logStroke);
        fill(color.log);
        let fireLoc = this.x -114;
        for (var i = 0; i < 5; i++){
            quad(fireLoc, floorPos_y -10,
                 fireLoc +5, floorPos_y -10,
                 this.x -102, floorPos_y -30,
                 this.x -107, floorPos_y -30);
            fireLoc += 5;
        }

        //rock circle
        strokeWeight(1);
        stroke(50);
        fill(100);
        let rockLoc = this.x -114;
        for (var i = 0; i < 5; i++){
            ellipse(rockLoc,floorPos_y-5,10);
            rockLoc += 6;
        }
        noStroke();

        // draw tent
        fill(color.tent);
        noStroke();
        triangle(this.x-40,floorPos_y,
                this.x+40,floorPos_y,
                this.x,floorPos_y-80);
        fill(color.tentSide);
        beginShape();
            vertex(this.x,floorPos_y-80);
            vertex(this.x+40,floorPos_y);
            vertex(this.x+120,floorPos_y);
            vertex(this.x+80,floorPos_y-80);
        endShape();
        fill(0);
        rect(this.x-10,floorPos_y-30,20,30);
        
        this.goalReached(); // Now check if gameChar has reached the end of the level
    }
}

function Canyon(qty){
    this.qty = qty;
    this.canyons = [];
    // make sure we're not spawning canyons too close to each other or under gameChar start location
    this.getX = function(){
        let canyonX = random(-1100,1400);
        let i = 0;
        while(i < this.canyons.length){
                if (abs(dist(canyonX,0,this.canyons[i].x+this.canyons[i].halfWidth,0)) < 300){
                    canyonX = random(-1100,1400);
                    i = 0; // if there is a canyon generated too close to an existing one, generate a new one and compare against all canyons again
                } else { 
                    i++;
                }
        }
        return canyonX;
    }
    
    this.get = function(){
        return this.canyons;
    }
    
    this.addCanyon = function(){
        var c = {
            x: this.getX(),    //x will be the center of the canyon
            halfWidth: random(40,135)
            };
        return c;
    }
    
    this.initialize = function(){
        for (var i = 0; i < this.qty; i++){
            this.canyons.push(this.addCanyon());
        }
        // have an impossible canyon to "encourage" player to move right at game start
        this.canyons.push({x:-2000,halfWidth:500});
    }
    
    // check if player has fallen into canyon
    this.check = function(t_canyon){
        this.t_canyon = t_canyon;
         
        if ((player.worldX >= this.t_canyon.x -this.t_canyon.halfWidth && 
         player.worldX < this.t_canyon.x +this.t_canyon.halfWidth) && 
         player.y == floorPos_y)
        {
                player.isPlummeting = true;
                fallSound.play();
        }
    }
    
    this.draw = function(){
          for (var i = 0; i < this.canyons.length; i++){
            fill(color.canyon);
            rect(this.canyons[i].x-this.canyons[i].halfWidth, floorPos_y, this.canyons[i].halfWidth*2, height-floorPos_y);
            noStroke();
            
            this.check(this.canyons[i]); //every time canyon is drawn, check if player has fallen into it
        }
        
    }
}

function Collectable(qty,obstacle){
    this.qty = qty;
    this.obstacle = obstacle;
    
    this.collectables = [];
    
    // chooses an x position that isn't too close to any other collectable
    this.getX = function(){
        this.x_pos = random(-1500,1500);
        for (var i = 0; i < this.collectables.length; i++){
            if (abs(dist(this.x_pos,0,this.collectables[i].x,0)) < 50){
                this.x_pos = random(-1500,1500);
                i = -1;
            }
        }
        return this.x_pos;
    }
    
    // chooses a y value that is elevated if the collectable is spawning over a canyon
    this.getY = function(collectX){
        var collectX = collectX;
        var y_pos = 390;
        for (var i = 0; i < this.obstacle.length; i++){
            if (collectX >= this.obstacle[i].x-this.obstacle[i].halfWidth && collectX < this.obstacle[i].x +this.obstacle[i].halfWidth){
                y_pos = 330;
            }
        }
        return y_pos;
    }
    
    this.addCollectable = function(){
        var collectableX = this.getX();
        var c = {
                x: collectableX,
                y: this.getY(collectableX),
                size: 30,
                isFound: false
        }
        return c;
    }
    
    this.initialize = function(){
        for (var i = 0; i < this.qty; i++){
            this.collectables.push(this.addCollectable());
        }
    }
    
    this.draw = function(){
        for (var i = 0; i < this.collectables.length; i++){
            if (this.collectables[i].isFound == false){
                //cup body
                fill(color.cupBody);
                beginShape();
                    vertex(this.collectables[i].x,this.collectables[i].y);
                    vertex(this.collectables[i].x+(this.collectables[i].size*.25),this.collectables[i].y+this.collectables[i].size*1.25);
                    vertex(this.collectables[i].x+(this.collectables[i].size*.75),this.collectables[i].y+this.collectables[i].size*1.25);
                    vertex(this.collectables[i].x+this.collectables[i].size,this.collectables[i].y);
                endShape();
                    //cup rim
                fill(color.cupRim);
                ellipseMode(RADIUS);
                ellipse(this.collectables[i].x+(this.collectables[i].size*.5),this.collectables[i].y,this.collectables[i].size*.57,this.collectables[i].size*.15);
                    //cup coffee
                ellipseMode(CENTER);
                fill(color.cupCoffee);
                ellipse(this.collectables[i].x+(this.collectables[i].size*.5),this.collectables[i].y,this.collectables[i].size*.85,this.collectables[i].size*.20);
                
                this.check(this.collectables[i]);
            }
        }
    }
    
    this.check = function(t_collectable){
        this.t_collectable = t_collectable;
        if (dist(this.t_collectable.x, this.t_collectable.y,player.worldX,player.y-15) <= 30){
            this.t_collectable.isFound = true;
            game_score += 1;
            collectSound.play();
        }    
    }
}

function Cloud(qty){
    this.clouds = [];
    this.qty = qty;
    
    this.addCloud = function(){
        var c = {
                x: random(-1500,2000),
                y: random(75,200),
                size: random(75,125)
            };
        return c;
    }
    
    this.initialize = function(){
        for (var i = 0; i < this.qty; i++){
            this.clouds.push(this.addCloud());
        }
    }

    // draw each cloud with a main circle with a circle on either side
    this.draw = function(){
        for (var i = 0; i < this.clouds.length; i++){
            fill(color.cloud);
            ellipse(this.clouds[i].x-(this.clouds[i].size*.5),this.clouds[i].y,this.clouds[i].size*.75,this.clouds[i].size*.75);
            ellipse(this.clouds[i].x+(this.clouds[i].size*.5),this.clouds[i].y,this.clouds[i].size*.75,this.clouds[i].size*.75);
            ellipse(this.clouds[i].x,this.clouds[i].y,this.clouds[i].size,this.clouds[i].size);
        }
    }
}

// Factory pattern to draw and control platforms
function createPlatform(x,halfWidth){
    var platform = {
                    x: x - (halfWidth*.75),
                    y: floorPos_y - 60,
                    width: (2*halfWidth)*.75,
                    draw: function(){
                        strokeWeight(1);
                        stroke(color.logStroke); //222,184,135
                        fill(color.log); //218,165,32
                        rect(this.x,this.y,this.width,20);
                        noStroke();
                    },
                    check: function(gameCharX,gameCharY){
                        var gameCharX = gameCharX;
                        var gameCharY = gameCharY;
                        if (gameCharX > this.x && gameCharX < this.x+this.width){
                            var d = this.y - gameCharY;
                            if (d >= 0 && d < 5){
                                return true;
                            } 
                            return false;
                        }
                    }
                }
    return platform;
}

function Mountain(qty){
    this.mountains = [];
    this.qty = qty;
    
    // chooses a random preset mountain size from an array
    this.getSize = function(sizes){
        this.sizes = sizes;
        let chosenSize = sizes[floor(random()*this.sizes.length)];
        return chosenSize;
    }
    
    // picks a good looking y value based on a given size
    this.getY = function(size){
        this.size = size;
        let chosenY;
        switch(this.size){
            case 200:
                chosenY = 300;
                break;
            case 350:
                chosenY = 200;
                break;
            case 425:
                chosenY = 150;
                break;
        }
        return chosenY;
    }
    
    // returns a mountain object with x,y,size (to be used for populating an array)
    this.addMountain = function(){
        let chosenSize = this.getSize([200,350,425]);
        var mtn = {
                x: random(-1500,2000),    // x value is the middle of the mountain, or the x position of the peak
                y: this.getY(chosenSize), // y value is defined as being the top of the peak of the mountain
                size: chosenSize,         // size is one of three scalars
            }
        return mtn;
    }
    
    // populate an array of mountains to be drawn on current level
    this.initialize = function(){
        for (var i = 0; i < this.qty; i++){
            this.mountains.push(this.addMountain());
        }
    }
    
    // loop through mountain array and draw each mountain to the screen
    this.draw = function(){ 
        for (var i = 0; i < this.mountains.length; i++){
            // mountain base
            fill(color.mountain);
            triangle(
                this.mountains[i].x-(.429*this.mountains[i].size), this.mountains[i].y+(.663*this.mountains[i].size),
                this.mountains[i].x, this.mountains[i].y,
                this.mountains[i].x+(.571*this.mountains[i].size), this.mountains[i].y+(.663*this.mountains[i].size)
                );
            
            // mountain base shade
            fill(color.mtnShade);
            triangle(
                this.mountains[i].x+(.134*this.mountains[i].size), this.mountains[i].y+(.157*this.mountains[i].size),
                this.mountains[i].x-(.111*this.mountains[i].size), this.mountains[i].y+(.663*this.mountains[i].size),
                this.mountains[i].x+(.571*this.mountains[i].size), this.mountains[i].y+(.663*this.mountains[i].size)
                );
            
            // mountain peak
            fill(color.mtnPeak);
            beginShape();
                vertex(this.mountains[i].x,this.mountains[i].y);
                vertex(this.mountains[i].x+(.134*this.mountains[i].size),this.mountains[i].y+(.157*this.mountains[i].size));
                vertex(this.mountains[i].x+(.086*this.mountains[i].size),this.mountains[i].y+(.143*this.mountains[i].size));
                vertex(this.mountains[i].x+(.029*this.mountains[i].size),this.mountains[i].y+(.171*this.mountains[i].size));
                vertex(this.mountains[i].x-(.043*this.mountains[i].size),this.mountains[i].y+(.143*this.mountains[i].size));
                vertex(this.mountains[i].x-(.111*this.mountains[i].size),this.mountains[i].y+(.171*this.mountains[i].size));
            endShape();
        }
    }
}

function Tree(qty,obstacle){
    this.trees = [];
    this.qty = qty;
    this.obstacle = obstacle;
    
    
    this.addTree = function(){
        var t = {
            x: this.getX(),
            scale: random(.25,1)
        }
        return t;
    }
        
    // get a suitable x position such that a tree isn't spawned over a canyon
    this.getX = function(){
        var treeX = random(-1500,2000);
            for (var i = 0; i < this.obstacle.length; i++){
            while(abs(dist(treeX,0, this.obstacle[i].x,0)) < 100){
                treeX = random(-1500,1800);
                i = 0;
            }
        }
        return treeX;
    }
    
    this.initialize = function(){
        for (var i = 0; i < this.qty; i++){
            this.trees.push(this.addTree(this.obstacle));
        }
    }
    
    this.draw = function(){
        for (var i = 0; i < this.trees.length; i++){
            var treePos_y = floorPos_y-(this.trees[i].scale*150);
            
            //trunk
            fill(color.trunk);
            rect(this.trees[i].x-(this.trees[i].scale*30),treePos_y,this.trees[i].scale*60,this.trees[i].scale*150);
            //branches
            fill(color.branch);
            triangle(this.trees[i].x-(this.trees[i].scale*95), treePos_y+(this.trees[i].scale*50),
                     this.trees[i].x, treePos_y-(this.trees[i].scale*50),
                     this.trees[i].x+(this.trees[i].scale*105), treePos_y+(this.trees[i].scale*50));
            triangle(this.trees[i].x-(this.trees[i].scale*80), treePos_y,
                     this.trees[i].x, treePos_y-(this.trees[i].scale*100),
                     this.trees[i].x+(this.trees[i].scale*80), treePos_y);
            triangle(this.trees[i].x-(this.trees[i].scale*60), treePos_y-(this.trees[i].scale*62),
                     this.trees[i].x, treePos_y-(this.trees[i].scale*152),
                     this.trees[i].x+(this.trees[i].scale*60), treePos_y-(this.trees[i].scale*62));
        }
    }
}