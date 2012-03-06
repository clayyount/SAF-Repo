function debug(message){
	if(window.console){
		console.log(message);
	}
}
var commandStack = [];

var canvasFactor=.5
var replayStack = [];
var pluginLoaded=false;
var brushes=[]
var brushColor={r:0,g:0,b:0}
var brushAlpha=1;
var brushSize=5;
var marker="marker_black";
var defaultZoomLevel=1;
var currentZoomLevel=1;
var showAllZoomLevel=1;

var pressure;
var ctx;
var drawing=false;
var screenW;
var screenH;
var canvas;
var canvas_red;
var canvas_blue;
var canvas_green;
var canvas_orange;
var canvas_yellow;
var canvas_purple;
var canvas_grey;
var canvas_white;

var brushColors;
var canvasLayers;


var canvasPos = {x:0.0, y:0.0};
var lastX = 0.0;
var lastY = 0.0;
var showAll=false



   function plugin()
   {
       return document.getElementById('wtPlugin');
   }
$(window).load(function(){
	canvasPos.x=$("#canvas").position().left
	canvasPos.y=$("#canvas").position().top
})
   $(document).ready(function(){
	// GET SCREEN HEIGHT AND WIDTH

	canvas = document.getElementById('canvas');
	canvas_red= document.getElementById('canvas_red');
	canvas_blue= document.getElementById('canvas_blue');
	canvas_green= document.getElementById('canvas_green');
	canvas_orange= document.getElementById('canvas_orange');
	canvas_yellow= document.getElementById('canvas_yellow');
	canvas_purple= document.getElementById('canvas_purple');
	canvas_grey= document.getElementById('canvas_grey');
	canvas_white= document.getElementById('canvas_white');
brushColors={
"marker_black":{"rgb":{r:0,g:0,b:0},canvas:canvas},
"marker_red":{"rgb":{r:255,g:0,b:0},canvas:canvas_red},
"marker_blue":{"rgb":{r:0,g:0,b:255},canvas:canvas_blue},
"marker_green":{"rgb":{r:0,g:255,b:0},canvas:canvas_green},
"marker_orange":{"rgb":{r:255,g:152,b:0},canvas:canvas_orange},
"marker_yellow":{"rgb":{r:255,g:255,b:0},canvas:canvas_yellow},
"marker_purple":{"rgb":{r:182,g:0,b:255},canvas:canvas_purple},
"marker_grey":{"rgb":{r:158,g:158,b:158},canvas:canvas_grey},
"marker_white":{"rgb":{r:255,g:255,b:255},canvas:canvas_white}
}
canvasLayers =[
canvas,
canvas_red,
canvas_blue,
canvas_green,
canvas_orange,
canvas_yellow,
canvas_purple,
canvas_grey,
canvas_white
]
	
	//$(window).resize(resize);
	//resize()
	ctx = canvas.getContext("2d");
 	

	var initObj={lastX:0,lastY:0,curX:0,curY:0,pressure:0, brushColor:brushColor, brushSize:0}
	commandStack.push(initObj)
	screenW=$(document).width()-22;
	screenH=$(document).height()-22;
	$("#canvasHolder").css({width:screenW, height:screenH})
	setAllCanvasSize((1080*canvasFactor),(1920*canvasFactor))
	
	//canvas.width=1920*canvasFactor;
	//canvas.height=1080*canvasFactor;
	//screenW=3000
	//screenH=3000
	canvasRatio=canvas.width/canvas.height;
	screenRatio=screenW/screenH;

	
		if(canvasRatio>screenRatio){
			defaultZoomLevel=(canvas.height/screenH)
		}else{
			defaultZoomLevel =(canvas.width/screenW)
		}
		brushSize=5*defaultZoomLevel;
	
	
		if(canvasRatio>screenRatio){
			showAllZoomLevel=(canvas.width/screenW)
		}else{
			showAllZoomLevel=(canvas.height/screenH)
		}
	
debug("currentZoomLevel="+ currentZoomLevel);
	zoomcanvas(defaultZoomLevel);
	$("#buttonHolder").css({marginTop:(screenH-50)+"px"});
	$("#markerHolder").children().click(function(evt){
		selectmarker(evt);
	})
	$("#brush_size_2").css({backgroundPosition: "top right"})
	$("#marker_black").css({backgroundPosition: "top right"})
	$("#brushHolder").children().click(function(evt){
		selectbrush(evt);
	})
	
	$("#canvas").mousedown(mousedown).mouseup(mouseup).mousemove(mousemove)
	canvas.addEventListener("touchstart", function(e){e.preventDefault();mousedown(e);});
	canvas.addEventListener("touchend", function(e){mouseup(e);});
	canvas.addEventListener("touchmove", function(e){ mousemove(e);});
	$("#clearbutton").click(clearAllCanvas);
	$("#redrawbutton").click(redrawcanvas);
	$("#redrawbutton2").click(redraw2);
	$("#zoombutton").click(function(){zoomcanvas(defaultZoomLevel*.5);showAll=false;});
	$("#zoomoutbutton").click(function(){zoomcanvas(defaultZoomLevel);showAll=false;});
	$("#fullscreenbutton").click(function(){
		zoomcanvas(showAllZoomLevel);
		showAll=true;
		$(".canvas").css({
			marginLeft:0,
			marginTop:0
		});
debug($("#canvas"))
		canvasPos.x=$("#canvas").position().left
		canvasPos.y=$("#canvas").position().top
	});
//figure out how to get the canvas's actual position without manual margin
	canvasPos.x=$("#canvas").position().left
	canvasPos.y=$("#canvas").position().top
	debug($("#canvas"));

});
function setAllCanvasSize(h,w){
canvas.width=w;
canvas.height=h;
	
	canvas_red.width=w;
	canvas_blue.width=w;
	canvas_green.width=w;
	canvas_orange.width=w;
	canvas_yellow.width=w;
	canvas_purple.width=w;
	canvas_grey.width=w;
	canvas_white.width=w;
	
	canvas_red.height=h;
	canvas_blue.height=h;
	canvas_green.height=h;
	canvas_orange.height=h;
	canvas_yellow.height=h;
	canvas_purple.height=h;
	canvas_grey.height=h;
	canvas_white.height=h;
	
}
function clearAllCanvas(){
var canW=canvas.width;
var canH=canvas.width;
ctx=canvas_red.getContext("2d");
ctx.clearRect ( 0 , 0 , canW , canH );
ctx=canvas_blue.getContext("2d");
ctx.clearRect ( 0 , 0 , canW , canH );
ctx=canvas_green.getContext("2d");
ctx.clearRect ( 0 , 0 , canW , canH );
ctx=canvas_orange.getContext("2d");
ctx.clearRect ( 0 , 0 , canW , canH );
ctx=canvas_yellow.getContext("2d");
ctx.clearRect ( 0 , 0 , canW , canH );
ctx=canvas_purple.getContext("2d");
ctx.clearRect ( 0 , 0 , canW , canH );
ctx=canvas_grey.getContext("2d");
ctx.clearRect ( 0 , 0 , canW , canH );
ctx=canvas_white.getContext("2d");
ctx.clearRect ( 0 , 0 , canW , canH );
ctx=canvas.getContext("2d");
ctx.clearRect ( 0 , 0 , canW , canH );	
	
}

function selectmarker(evt){
$("#markerHolder").children().css({backgroundPosition: "top left"})
$(evt.currentTarget).css({backgroundPosition: "top right"})
var markerName=$(evt.currentTarget).attr("id")
commandStack.push({brushColor: markerName})
setColorLevel(markerName)
}
function setColorLevel(markerName){
	marker= markerName;
	brushColor=brushColors[marker]["rgb"]
	ctx = brushColors[marker]["canvas"].getContext("2d");
}
function selectbrush(evt){
$("#brushHolder").children().css({backgroundPosition: "top left"})
$(evt.currentTarget).css({backgroundPosition: "top right"})
switch($(evt.currentTarget).attr("id")){
	case "brush_size_1":
	brushSize=1* defaultZoomLevel;
	break;
	case "brush_size_2":
	brushSize=5* defaultZoomLevel;
	break;
	case "brush_size_3":
	brushSize=10* defaultZoomLevel;
	break;
	case "brush_size_4":
	brushSize=15* defaultZoomLevel;
	break;
	case "brush_size_5":
	brushSize=19* defaultZoomLevel;
	break;
	case "brush_size_6":
	brushSize=24* defaultZoomLevel;
	break;
	}
}


function roundNumber(num, dec) {
	var result = Math.round(num*Math.pow(10,dec))/Math.pow(10,dec);
	return result;
	//return num;
}
function centerCanvas(){
	showAll=false;
	zoomcanvas(defaultZoomLevel);
debug("canvas width="+$("#canvas").width())
debug("lastX="+lastX)
debug("defaultZoomLevel ="+ defaultZoomLevel)
debug(($("#canvas").width()/2)-(lastX*defaultZoomLevel))
	$(".canvas").css({
		marginLeft:(screenW/2)-lastX,
		marginTop:(screenH/2)-lastY
	});

	canvasPos.x=$("#canvas").offset().left
	canvasPos.y=$("#canvas").offset().top
}
	



function resize(){
debug("resizing")
	screenW=$(document).width()
	screenH=$(document).height()
	var tempCanvas=$('<canvas height="'+ screenH +'" width="'+screenW+'"></canvas>').get(0);
	tempCanvas.getContext('2d').drawImage(canvas);
	canvas.height=3000;
	canvas.width=3000;
	canvas.getContext('2d').drawImage(tempCanvas);

}
function pluginloaded()
{
	pluginLoaded=true;
	debug("PluginLoaded");
}
function mousedown(evt){
	var ev = evt || window.event;
	var mouseX = Math.floor((ev.pageX?(ev.pageX) : (ev.clientX + document.body.scrollLeft))- canvasPos.x)
	var mouseY = Math.floor((ev.pageY?(ev.pageY) : (ev.clientY + document.body.scrollTop))- canvasPos.y)
	lastX =  mouseX *(currentZoomLevel);
	lastY =  mouseY *(currentZoomLevel);
		
	if(showAll){
		centerCanvas();
	}else{
		
		mousemove(evt);
		drawing=true;
	}
}

function mouseup(){
	drawing=false;
	debug("pressure="+pressure);
	
}
function mousemove(evt){
	if(drawing){
		// Non-IE browsers will use evt
        var ev = evt || window.event;
		//curX = (ev.pageX?ev.pageX : ev.clientX + document.body.scrollLeft) - canvasPos.x;
		//curY = (ev.pageY?ev.pageY : ev.clientY + document.body.scrollTop ) - canvasPos.y;
debug(canvasPos.y)
		curX = Math.floor((ev.pageX?ev.pageX : ev.clientX) - canvasPos.x)*(currentZoomLevel);
		curY = Math.floor((ev.pageY?ev.pageY : ev.clientY) - canvasPos.y)*(currentZoomLevel);
		var penAPI = plugin().penAPI;
        //var canvas = document.getElementById('canvas');
        var oldpressure = pressure;
		var pointerType;
        if (penAPI)
        {
			penAPI.setFocus=true;
			
            pressure = roundNumber(penAPI.pressure,6)
			
			if(pressure!=oldpressure){
				if(oldpressure>(pressure*1.1)){
				pressure=roundNumber(oldpressure/1.1,6)
				}
			}
			
            
			
        }
        else
        {
			pressure=1
            //pressure = 1.0;
           
        }

	var lineObj={lastX:lastX,lastY:lastY,curX:curX,curY:curY,pressure:pressure, brushSize:brushSize, marker:marker}	
	commandStack.push(lineObj)	
	//var lineObj2={lastX:lastX,lastY:lastY,curX:curX,curY:curY,pressure:(pressure/2), brushColor:{r:255,g:0,b:0}, brushSize:brushSize}	//TEST 2 player drawingperformance
	//commandStack.push(lineObj2)
	replayStack.push(lineObj)
	lastX = curX;
    lastY = curY;
		
	}
}

function drawline(obj){
		setColorLevel(obj.marker)
		
        ctx.beginPath();
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.globalCompositeOperation = 'darker'
        ctx.moveTo(obj.lastX, obj.lastY);
        ctx.lineTo(obj.curX, obj.curY);
        ctx.lineWidth = obj.brushSize * obj.pressure;
      	ctx.strokeStyle = "rgba("+ brushColors[obj.marker]["rgb"].r+", "+ brushColors[obj.marker].rgb.g+", "+ brushColors[obj.marker].rgb.b+", "+ brushAlpha+")";
        ctx.stroke();
}

function redrawline(obj){
		setColorLevel(obj.marker)
        ctx.beginPath();
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.globalCompositeOperation = 'darker'
        ctx.moveTo((obj.lastX*2), (obj.lastY*2));
        ctx.lineTo((obj.curX*2), (obj.curY*2));
        ctx.lineWidth = (obj.brushSize*2) * (obj.pressure);
      	ctx.strokeStyle = "rgba("+ brushColors[obj.marker]["rgb"].r+", "+ brushColors[obj.marker].rgb.g+", "+ brushColors[obj.marker].rgb.b+", "+ brushAlpha+")";
        ctx.stroke();
}


function redraw2(){
	var tempstack=replayStack.slice(0);
	tempstack.forEach(redrawline)
	
}


function popstack(){
	if(commandStack.length>0){
	var currentCommand=commandStack.shift();
		if(currentCommand.lastX){
			drawline(currentCommand)
		}
	}
}
function clearcanvas(evt){
debug("clearing");
	ctx.clearRect ( 0 , 0 , canvas.width , canvas.height );

}
function redrawcanvas(evt){
	commandStack=replayStack.slice(0)
}

function zoomcanvas(zlevel){
	$(".canvas").css({width:canvas.width/zlevel, height:canvas.height/zlevel})
	currentZoomLevel= zlevel
}

// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
  return  function( callback ){
            window.setTimeout(callback, 10 / 60);
          };
})();


// usage: 
// instead of setInterval(render, 16) ....

(function animloop(){
  requestAnimFrame(animloop);
  popstack();
})();
// place the rAF *before* the render() to assure as close to 
// 60fps with the setTimeout fallback.
