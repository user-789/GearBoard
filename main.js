/* jshint esversion:6 */

/*
 * Utility
 */

const BACKSPACE = "\u2190";
const ENTER = "\u21B5";

function distance(x1, y1, x2, y2) {
	let distX = x1 - x2;
	let distY = y1 - y2;
	return Math.sqrt(distX*distX + distY*distY);
}

function clamp(val, min, max) {
	return Math.min(max, Math.max(min, val));
}

/*
 * Segment
 */

// can only be vertical or horizontal
function Segment(x1, y1, x2, y2) {
	this.x1 = Math.min(x1, x2);
	this.y1 = Math.min(y1, y2);
	this.x2 = Math.max(x1, x2);
	this.y2 = Math.max(y1, y2);
}

Segment.prototype.drawOuter = function() {
	ctx.strokeRect(this.x1-5.5, this.y1-5.5, this.x2-this.x1+11, this.y2-this.y1+11);
};

Segment.prototype.drawInner = function() {
	ctx.fillStyle = "#EEEEEE";
	ctx.fillRect(this.x1-5, this.y1-5, this.x2-this.x1+10, this.y2-this.y1+10);
};

Segment.prototype.getClosestPoint = function(x, y) {
	if (this.x1 === this.x2) {
		return {"x": this.x1, "y": clamp(y, this.y1, this.y2)};
	} else {
		return {"x": clamp(x, this.x1, this.x2), "y": this.y1};
	}
};

/*
 * Letter
 */

function Letter(char, x, y, below) {
	this.char = char;
	this.x = x;
	this.y = y;
	segments.push(new Segment(x, y - (below ? 50 : 0), x, y + (below ? 0 : 50)));
}

Letter.prototype.draw = function() {
	if (this.char == ENTER) {
		ctx.fillStyle = "#00FF00";
	} else if (this.char == BACKSPACE) {
		ctx.fillStyle = "#FF0000";
	} else {
		ctx.fillStyle = "#EEEEEE";
	}
	ctx.beginPath();
	ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
	ctx.fill();
	ctx.stroke();
	ctx.fillStyle = "#000000";
	ctx.fillText(this.char, this.x, this.y);
};
Letter.prototype.radius = 20;

function prepareLetters() {
	let chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ,.?!_-'".split("");
	chars.push(BACKSPACE, ENTER);
	for (let i = 0; i < 71; i++) {
		let randomIndex = i + Math.floor(Math.random()*(72-i));
		[chars[i], chars[randomIndex]] = [chars[randomIndex], chars[i]];
	}
	return chars;
}

/*
 * Stick
 */

function Stick(x, y) {
	this.x = x;
	this.y = y;
	this.draw();
}

Stick.prototype.draw = function() {
	ctx.fillStyle = "hsl(25,0%,50%,0.6)";
	ctx.beginPath();
	ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
	ctx.fill();
};

Stick.prototype.moveToClosestPoint = function(x, y) {
	let closestPoint = {"x": Infinity, "y": Infinity};
	let leastDistance = Infinity;
	for (let segment of segments) {
		let closestInSegment = segment.getClosestPoint(x, y);
		let dist = distance(x, y, closestInSegment.x, closestInSegment.y);
		if (dist < leastDistance) {
			closestPoint = closestInSegment;
			leastDistance = dist;
		}
	}
	Object.assign(stick, closestPoint);
	if (leastDistance > 0) {
		ctx.putImageData(backgroundImage, 0, 0);
	}
	this.draw();
};

Stick.prototype.radius = 20;

/*
 * Other
 */

function mouseDown(event) {
	let dist = distance(event.offsetX, event.offsetY, stick.x, stick.y);
	if (dist < stick.radius) {
		isDragging = true;
		stick.moveToClosestPoint(event.offsetX, event.offsetY);
	}
}

function mouseMove(event) {
	if (isDragging) {
		let dist = distance(event.offsetX, event.offsetY, stick.x, stick.y);
		if (dist < stick.radius+5) {
			stick.moveToClosestPoint(event.offsetX, event.offsetY);
		}
	}
}

function mouseUp(event) {
	if (isDragging) {
		isDragging = false;
	}
	for (let letter of letters) {
		if (distance(stick.x, stick.y, letter.x, letter.y) < 10) {
			selectedChar = letter.char;
			return;
		}
	}
	selectedChar = "";
}
let shuffledLetters = prepareLetters();

function typeSelected() {
	shuffledLetters = prepareLetters();
	reassignLetters();
	drawLetters();
	backgroundImage = drawBackground();
	stick.draw();
	if (selectedChar == "") {
		return;
	} else if (selectedChar == BACKSPACE) {
		writtenChars.pop();
	} else if (selectedChar == ENTER) {
		alert(writtenChars.join(""));
		writtenChars = [];
		input.innerHTML = "Type here whatever you want!";
		return;
	} else {
		writtenChars.push(selectedChar);
	}
	input.innerHTML = writtenChars.join("");
}

function drawBackground() {
	for (let segment of segments) {
		segment.drawOuter();
	}
	for (let segment of segments) {
		segment.drawInner();
	}
	drawLetters();
	return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function drawLetters() {
	for (let letter of letters) {
		letter.draw();
	}
}

const info = document.getElementById("info");
const input = document.getElementById("input");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
ctx.font = "24px serif";
ctx.textAlign = "center";
ctx.textBaseline = "middle";
const segments = [
	new Segment(40, 90, 960, 90),
	new Segment(40, 270, 960, 270),
	new Segment(40, 450, 960, 450),
	new Segment(500, 90, 500, 450)
];

let letters = [];
function reassignLetters() {
	letters = []
	for (let i = 0; i < 72; i++) {
	let y = Math.floor(i/12);
		let x = i % 12;
		let shaft = Math.floor(y/2);
		let below = y % 2 === 1;
		letters.push(new Letter(shuffledLetters[i], 80*x + (x < 6 ? 40 : 80), 180*shaft + (below ? 140 : 40), below));
	}
}
reassignLetters();
let writtenChars = [];
let selectedChar = letters[0].char;
let backgroundImage = drawBackground();
const stick = new Stick(40, 40);
let isDragging = false;
