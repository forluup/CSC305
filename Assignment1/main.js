var canvas;
var gl;

var program;

var near = 1;
var far = 100;

var left = -6.0;
var right = 6.0;
var ytop = 6.0;
var bottom = -6.0;

var lightPosition2 = vec4(100.0, 100.0, 100.0, 1.0);
var lightPosition = vec4(0.0, 0.0, 100.0, 1.0);

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4(0.4, 0.4, 0.4, 1.0);
var materialShininess = 30.0;

var ambientColor, diffuseColor, specularColor;

var modelMatrix, viewMatrix, modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var RX = 0;
var RY = 0;
var RZ = 0;

var MS = []; // modeling matrix stack
var TIME = 0.0; // realtime
var dt = 0.0;
var prevTime = 0.0;
var resetTimerFlag = true;
var animFlag = true;
var controller;

var sphereRotation = [0, 0, 0];
var spherePosition = [-4, 0, 0];

var numStars = 50;  // number of stars to generate
var starSpeed = 0.03; // speed of star movement

// Setting the color which is needed during illumination of a surface
function setColor(c) {
    ambientProduct = mult(lightAmbient, c);
    diffuseProduct = mult(lightDiffuse, c);
    specularProduct = mult(lightSpecular, materialSpecular);
    
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);
}

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // 
    // Load shaders and initialize attribute buffers
    //
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    setColor(materialDiffuse);

    // Initialize some shapes, note that the curved ones are procedural which allows you to parameterize how nice they look
	// Those number will correspond to how many sides are used to "estimate" a curved surface. More = smoother
    Cube.init(program);
    Cylinder.init(20, program);
    Cone.init(20, program);
    Sphere.init(36, program);

    // Matrix uniforms
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    // Lighting Uniforms
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));    
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

    // Generate stars
    generateStars();

    render(0);
};

// Set modelview and normal matrix in shaders
function setMV() {
    modelViewMatrix = mult(viewMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    normalMatrix = inverseTranspose(modelViewMatrix);
    gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix));
}

function setAllMatrices() {
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    setMV();
}

function drawCube() {
    setMV();
    Cube.draw();
}

function drawSphere() {
    setMV();
    Sphere.draw();
}

function drawCylinder() {
    setMV();
    Cylinder.draw();
}

function drawCone() {
    setMV();
    Cone.draw();
}

function gTranslate(x, y, z) {
    modelMatrix = mult(modelMatrix, translate([x, y, z]));
}

function gRotate(theta, x, y, z) {
    modelMatrix = mult(modelMatrix, rotate(theta, [x, y, z]));
}

function gScale(sx, sy, sz) {
    modelMatrix = mult(modelMatrix, scale(sx, sy, sz));
}

function gPop() {
    modelMatrix = MS.pop();
}

function gPush() {
    MS.push(modelMatrix);
}

function generateStars() {
    stars = [];
    for (var i = 0; i < numStars; i++) {
        var x = Math.random() * 12 - 6; // random x position (-6 to 6)
        var y = Math.random() * 12 - 6; // random y position (-6 to 6)
        var z = -6; // fixed z position (farthest back)

        // random size for each star (between 0.05 and 0.2)
        var size = Math.random() * 0.05 + 0.01; 

        // Fixed speeds for northeast movement
        var speed = Math.random() * starSpeed + 0.01;
        var speedX = 0.01; 
        var speedY = 0.01; // Fixed movement along the y-axis (northeast direction)

        stars.push({x: x, y: y, z: z, size: size, speed: speed, speedX: speedX, speedY: speedY});
    }
}

function drawStars() {
    for (var i = 0; i < stars.length; i++) {
        var star = stars[i];

        gPush();
        gTranslate(star.x, star.y, star.z); // translate to the star's position
        setColor(vec4(1.0, 1.0, 1.0, 1.0));

        gPush();
        gScale(star.size, star.size, star.size); // scale by the star's random size
        drawSphere();
        gPop();
        
        gPop(); // pop the matrix
    }
}

function moveStars() {
    for (var i = 0; i < stars.length; i++) {
        var star = stars[i];

        // move northeast
        star.x += star.speedX; 
        star.y += star.speedY; 

        // reset stars when they go out of bounds
        if (star.x > 6 || star.y > 6) {
            // randomly respawn on left or bottom side
            if (Math.random() < 0.5) {
                star.x = -6;
                star.y = Math.random() * 12 - 6;
            } else {
                star.x = Math.random() * 12 - 6;
                star.y = -6;
            }
        }
    }
}

function drawAstronaut() {
    gPush(); 

    // helmet
    gPush();
    gScale(0.4, 0.4, 0.4);
    drawSphere();
    gPop();

    // visor
    gPush();
    setColor(vec4(1.0, 0.7, 0.3, 1.0)); 
    gTranslate(0.1, 0, 0.35); 
    gScale(0.4, 0.25, 0.2);
    drawSphere();
    gPop();

    let rightArmAngle = 15 * Math.sin(TIME * 1);
    let leftArmAngle = 15 * Math.sin(TIME * 1+3); 

    // right arm
    gPush();
    setColor(vec4(1.0, 1.0, 1.0, 1.0));
    gTranslate(-0.75, -0.8, 0);
    gRotate(-45 + leftArmAngle, 0, 0, 1);
    gTranslate(0, -0.25, 0); // account for shift off origin
    gScale(0.15, 0.5, 0.15);
    drawCube();
    gPop();

    // left arm
    gPush();
    setColor(vec4(1.0, 1.0, 1.0, 1.0));
    gTranslate(0.75, -0.8, 0.0);  
    gRotate(45 - rightArmAngle, 0, 0, 1);   
    gTranslate(0, -0.25, 0); 
    gScale(0.15, 0.5, 0.15);
    drawCube();
    gPop();

    // body
    gPush();
    setColor(vec4(1.0, 1.0, 1.0, 1.0));
    gTranslate(0, -1, 0);
    gScale(0.5, 0.7, 0.25);  
    drawCube(); 

    // inlets/outlets
    //top
    gPush();
    setColor(vec4(0.0, 0.3, 1.0, 1.0));
    gScale(1/0.5,1/0.7,1/0.25);
    gScale(0.1,0.1,0.1);
    gTranslate(-1.5,0.5,3);
    drawSphere();
    gTranslate(3,0,0);
    drawSphere();

    //mid
    setColor(vec4(0.7, 0.6, 1.0, 1.0));
    gTranslate(1,-3,0);
    drawSphere();
    gTranslate(-5,0,0);
    drawSphere();

    //bottom
    setColor(vec4(1.0, 0.4, 0.0, 1.0));
    gTranslate(0.5,-2.5,0);
    drawSphere();
    gTranslate(4,0,0);
    drawSphere();
    gPop();

    // nasa logo
    gPush();
    setColor(vec4(0.0, 0.3, 0.8, 1.0));
    gTranslate(-0.3,0.6,1.4);
    gScale(1/0.5,1/0.7,1/0.25);
    gScale(0.15,0.15,0.05);
    drawSphere();
    gPop();

    let leftThighAngle = 10 * Math.sin(TIME * 1);
    let leftLowerLegAngle = 10 * Math.sin(TIME * 1);
    let rightThighAngle = 10 * Math.sin(TIME * 1+3);
    let rightLowerLegAngle = 10 * Math.sin(TIME * 1+3);

    // left thigh
    gPush();
    setColor(vec4(1.0,1.0,1.0,1.0));
    gTranslate(-0.5, -2.15, -1.2); 
    gScale(1 / 0.5, 1 / 0.7, 1 / 0.25); // undo inherited body scale
    gRotate(25 + leftThighAngle, 1, 0, 0); // leg swaying motion
    gTranslate(0, 0.3, 0); 
    gScale(0.15, 0.6, 0.15); // apply leg scale
    drawCube();

    // left lower leg
    gPush();
    gTranslate(0, -1.7, -2.7); 
    gScale(1 / 0.15, 1 / 0.6, 1 / 0.15); 
    gRotate(50+leftLowerLegAngle, 1, 0, 0);
    gScale(0.15, 0.6, 0.15); 
    drawCube();

    // left foot
    gPush();
    gTranslate(0, -1, 1); 
    gScale(1 / 0.15, 1 / 0.6, 1 / 0.15); 
    gScale(0.15, 0.07, 0.3); 
    drawCube();
    gPop();
    gPop();
    gPop(); // pop stack back to body matrix

    // right thigh
    gPush();
    gTranslate(0.5, -2.15, -1.2); 
    gScale(1 / 0.5, 1 / 0.7, 1 / 0.25); 
    gRotate(25 + rightThighAngle, 1, 0, 0);
    gTranslate(0, 0.3, 0);
    gScale(0.15, 0.6, 0.15); 
    drawCube();

    // right lower leg
    gPush();
    gTranslate(0, -1.6, -3.2); 
    gScale(1 / 0.15, 1 / 0.6, 1 / 0.15); 
    gRotate(50+rightLowerLegAngle, 1, 0, 0);
    gScale(0.15, 0.6, 0.15); 
    drawCube();

    // right foot
    gPush();
    gTranslate(0, -1, 1); 
    gScale(1 / 0.15, 1 / 0.6, 1 / 0.15); 
    gScale(0.15, 0.07, 0.3); 
    drawCube();
    gPop(); 
    gPop(); 
    gPop(); 
    gPop(); // end body
}

function drawTentacle() {
    let segmentCount = 5;
    let baseSwayMagnitude = 1.7; // degrees of sway at the base
    let swaySpeed = 0.5; // speed of animation
    let segmentDistance = -1.8;
    

    gPush();
    for (let i = 0; i < segmentCount; i++) {
        let swayMagnitude = baseSwayMagnitude * (i + 2); // increase sway effect per segment
        let swayAngle = swayMagnitude * Math.sin(TIME * swaySpeed + i * 0.4); // offset per segment

        gRotate(swayAngle, 1, 0, 0); // rotate around X for upwards/downwards sway
        gTranslate(0, segmentDistance, 0); // move down along Y for hierarchical attachment

        gPush();
        setColor(vec4(1.0, 0.7, 0.3, 1.0)); 
        gScale(0.3, 1, 0.3); 
        drawSphere();
        gPop();
    }
    gPop();
}


function drawJellyfish() {
    let orbitRadius = 3; // distance from astronaut
    let orbitSpeed = -0.3; // speed of rotation

    // calculate position using a circular path
    let sphereX = orbitRadius * Math.cos(TIME * orbitSpeed);
    let sphereZ = orbitRadius * Math.sin(TIME * orbitSpeed);

    let velocityX = -orbitRadius * orbitSpeed * Math.sin(TIME * orbitSpeed);
    let velocityZ = orbitRadius * orbitSpeed * Math.cos(TIME * orbitSpeed);

    // compute rotation angle to face the movement direction
    let angle = Math.atan2(velocityX, velocityZ); // rotation around y-axis

    // jellyfish base
    gPush();
    gTranslate(sphereX, 0, sphereZ);  // rotate around astronaut
    gRotate(angle * (180 / Math.PI), 0, 1, 0); // convert radians to degrees, rotate around y axis
    setColor(vec4(1.0, 0.1, 0.6, 1.0));
    gScale(0.4, 0.4, 0.25);
    drawSphere();
    
    // jellyfish head
    gPush();
    gTranslate(0,0,1.5);
    setColor(vec4(1.0, 0.1, 0.6, 1.0)); 
    gScale(1/0.4, 1/0.4, 1/0.25);
    gScale(0.6, 0.6, 0.3);
    drawSphere();
    gPop();

    // tentacles
    gPush();
    gRotate(90,1,0,0);
    gTranslate(0, 0.5, -1); // upper tentacle
    drawTentacle();
    gTranslate(0, 0, 1);
    drawTentacle();
    gTranslate(0, 0, 1); 
    drawTentacle();
    gPop();
    gPop();
    gPop();
}


function render(timestamp) {
    TIME = timestamp * 0.001
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(0, 0, 10);
    MS = []; // Initialize modeling matrix stack

    modelMatrix = mat4();
    viewMatrix = lookAt(eye, at, up);
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);

    setAllMatrices();

    moveStars();
    drawStars();

    let astronautX = 0.7 * Math.cos(TIME * 0.75); // Moves side to side
    let astronautY = 0.5 * Math.cos(TIME * 0.75); // Moves side to side

    gPush();
    gTranslate(astronautX, astronautY, 0); // Move astronaut to the right
    gRotate(-30, 0, 1, 0);
    drawAstronaut();
    gPop();

    gPush();
    drawJellyfish();
    gPop();

    requestAnimFrame(render);
}
