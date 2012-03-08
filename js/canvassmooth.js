function debug(message){
	if(window.console){
		console.log(message);
	}
}

function preload(arrayOfImages) {
    $(arrayOfImages).each(function(){
		$('<img src="' + this + '" />')
        //$('<img/>')[0].src = this;
        // Alternatively you could use:
        // (new Image()).src = this;
    });
}
preload(["images/wheelofdeathbg.png","images/cursor_size_1.cur","images/cursor_size_2.cur","images/cursor_size_3.cur","images/cursor_size_4.cur","images/cursor_size_5.cur","images/cursor_size_6.cur","images/cursor_hand.cur","images/cursor_size_6.cur"])

var commandStack = [];
var userStack = [];
var userID="12345"
var socket;

var canvasFactor=1
var replayStack = [];
var brushes=[]
var brushColor={r:0,g:0,b:0}
var brushAlpha=1;
var brushSize=5;
var modBrushSize=5;
var defaultZoomLevel=1;
var currentZoomLevel=1;
var showAllZoomLevel=1;
var navSize=.1;
var speed=1;
var dragging=false;
var currentCursor="cursor_size_2"
var cursorPosition={"cursor_size_1":4,"cursor_size_2":5,"cursor_size_3":7,"cursor_size_4":9,"cursor_size_5":11,"cursor_size_6":14}
var pluginInstalled=false;
var penAPI=false;
var pressure;
var pressureOn=false;
var ctx;
var navctx;
var navSizePercent;
var drawing=false;
var screenW;
var screenH;
var canvas;
var canvasNav;
var defaultSmoothingFactor=.7
var smoothingFactor=defaultSmoothingFactor
var rounddec=1
var lineDown=0

var smoothingOn=1;

var canvasPos = {x:0.0, y:0.0};
var canvasCenter={x:0,y:0};
var canvasRatio;
var lastX = 0.0;
var lastY = 0.0;
var smoothedMouseX=0;
var smoothedMouseY=0;
var lastSmoothedMouseX=0;
var lastSmoothedMouseY=0;
var lastMouseChangeVectorX=0
var lastMouseChangeVectorY=0
var velocityChange=0;
var lastVelocityChange=0;
var lastRotation=0;
var startX=0;
var startY=0;
var showAll=false;

   function plugin()
   {
       return document.getElementById('wtPlugin');
   }
function copyToClipboard (arr) {
var returnStr='[';
for(i=0;i<arr.length;i++){
	returnStr+='{'
	for(prop in arr[i]){
//debug((typeof arr[i][prop]))
returnStr+='"'+prop+'":'
		if(typeof arr[i][prop]=="object"){
			returnStr+='{'
			
			for(prop2 in arr[i][prop]){
				returnStr+='"'+prop2+'":"'+arr[i][prop][prop2]+'", '
			}
			returnStr=returnStr.substr(0,returnStr.length-2)
			returnStr+='}, '

		}else{
			returnStr+='"'+arr[i][prop]+'", '
		}
	}
	returnStr=returnStr.substr(0,returnStr.length-2)
	returnStr+='}, '
}
returnStr=returnStr.substr(0,returnStr.length-2)
returnStr+=']'
debug(arr)
debug(returnStr)
}

$(document).ready(function(){
	$("#page").hide();
	$(".blackBG").hide();
	$("#pressure").hide();
	$.ajax({
		  url: 'json/wheelofdeath.json',
		  dataType: 'json',
		  success: function(data){
			debug("success!")
			$("#wheelofdeath").WheelOfDeath({wheelItems:data.wheelofdeath.items, onSelect: function(sel){
			debug(sel);$("#wheelofdeath").delay(2000).animate({top:-300},function(){$(".blackBG").hide();});}
			});
			}
		});
	$("#wheelofdeath").css({top:-300, left:($(window).width()/2)-175});
	
})
$(window).load(function(){
	//Check for Wacom plugin and write the plugin object if it is installed
	for(i=0;i<navigator.plugins.length;i++){
		if(navigator.plugins[i].name=="WacomTabletPlugin" && navigator.plugins[i].length>=1){
			pluginInstalled=true
			break;
		}
	}
	if(pluginInstalled){
		$("body").append('<!--[if IE]><object style="visiblity:hidden;" id="wtPlugin" classid="CLSID:092dfa86-5807-5a94-bf3b-5a53ba9e5308" codebase="fbWacomTabletPlugin.cab" width="0" height="0"> <param name="onload" value="pluginloaded" /></object><![endif]--><!--[if !IE]> <--><!-- This is the Firebreath wacomtabletplugin --><object style="visiblity:hidden;" id="wtPlugin" type="application/x-wacomtabletplugin" width="0" height="0"><param name="onload" value="pluginloaded" /></object><!--> <![endif]-->');
		penAPI = plugin().penAPI;
		// if the plugin is working, show the pressure button
		if(penAPI){
			$("#pressure").show();
			pressureOn=true;
			$("#pressure").css({backgroundPosition:"top right"});
		}
	}
	//set the socket
	socket = io.connect('http://ec2-50-19-184-210.compute-1.amazonaws.com:4000');
	//set draw event for the socket
	socket.on('draw', function(data) {
    	commandStack.push(data);
 		replayStack.push(data);
    });

	//Broswer specific actions
	if((navigator.userAgent.match(/chrome/i))){
		$(window).resize(resize);
		canvasFactor=2
	}else if(navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPod/i)){
		window.onorientationchange=resize;
		navSize=.05
		$("#buttonHolder").hide();
		$(".marker").css({marginTop:-15})
	}else if(navigator.userAgent.match(/iPad/i)){
		window.onorientationchange=resize;
		canvasFactor=1
	}else if(navigator.userAgent.match(/firefox/i)){
		$(window).resize(resize);
		canvasFactor=2
	}else if(navigator.userAgent.match(/safari/i)){
		$(window).resize(resize);
		canvasFactor=2
	}
	//define the canvas and canvas nav elements
	canvas = document.getElementById('canvas');
	canvasNav = document.getElementById('canvasNav');
	//set the canvas width and height to a factor of 1080p defending on the browser. for instance, mobile safari won't support more than 5mpx in a canvas
	canvas.width=1920*canvasFactor;
	canvas.height=1080*canvasFactor;
	//get some ratios for the canvas and the nav box
	canvasRatio=canvas.width/canvas.height;
	navSizePercent=navSize/canvasFactor;
	//set the nav h/w to a percentage of the canvas size
	canvasNav.width=canvas.width*navSizePercent;
	canvasNav.height=canvas.height*navSizePercent;
	
	//set the default brush and marker buttons to selected state
	$("#brush_size_2").css({backgroundPosition: "top right"})
	$("#marker_black").css({backgroundPosition: "top right"})
	//set global var for canvas and nav context
	ctx = canvas.getContext("2d");
 	navctx= canvasNav.getContext("2d");
	//Safari seems to have a lag when the canvas is first drawn to.
	//var initObj={lastX:0,lastY:0,curX:0,curY:0,pressure:0, brushColor:brushColor, brushSize:0}
	//drawline(initObj)
	//commandStack.push(initObj)
	
	//Add button events
	$("#markerHolder").children().click(function(evt){
		selectmarker(evt);
	})
	$("#brushHolder").children().click(function(evt){
		selectbrush(evt);
	})
	$("#color_picker").click(function(){
		$("#markerHolder").css({marginTop:(-($("#markerHolder").height()))});
		$("#markerHolder").slideToggle();
		if($("#brushHolder").css("display")!="none"){
		$("#brushHolder").slideToggle();
		}
	})
	$("#size_picker").click(function(){
		$("#brushHolder").css({marginTop:(-($("#brushHolder").height()))});
		$("#brushHolder").slideToggle();
		if($("#markerHolder").css("display")!="none"){
		$("#markerHolder").slideToggle();
		}
	})
	$("#grab_hand").toggle(grabToggleOn,grabToggleOff)
	$("#clearbutton").click(clearcanvas);
	$("#copybutton").click(function(){copyToClipboard(replayStack)});
	$("#redrawbutton").click(redrawcanvas);
	$("#savebutton").click(saveImage);
	$("#redrawbutton2").click(redraw2);
	$("#smoothingon").click(function(){smoothingOn=1; smoothingFactor=defaultSmoothingFactor;$(this).hide();$("#smoothingoff").show() }).hide();
	$("#smoothingoff").click(function(){smoothingOn=0; smoothingFactor=1; $(this).hide();$("#smoothingon").show() })
	$("#spin").click(function(){
		$(".blackBG").show();
		$("#wheelofdeath").animate({top:(($(window).height()/2)-100),left:(($(window).width()/2)-175)},1000,"easeOutBounce",function(){$("#wheelofdeath").spin();});
		
	});
	$("#zoom").toggle(
		function(){
			showAll=false;
			$("#zoom").css({background:"url(images/zoom_out.png) no-repeat top left"});
			zoomCanvasTo(canvasCenter.x,canvasCenter.y,currentZoomLevel,defaultZoomLevel*.5);
		},
		function(){
			showAll=false;
			$("#zoom").css({background:"url(images/zoom_in.png) no-repeat top left"});
			zoomCanvasTo(canvasCenter.x,canvasCenter.y,currentZoomLevel,defaultZoomLevel);
		}
	);
	$("#show_all").click(function(){
		if(dragging){
			grabToggleOff();
		}
		showAll=true;		
		zoomCanvasTo((canvas.width/2), (canvas.height/2), currentZoomLevel,showAllZoomLevel);
		canvasPos.x=$("#canvas").offset().left;
		canvasPos.y=$("#canvas").offset().top;
		if($("#markerHolder").css("display")!="none"){
			$("#markerHolder").slideToggle();
		}
		if($("#brushHolder").css("display")!="none"){
			$("#brushHolder").slideToggle();
		}
	});
	$("#pressure").click(
		function(){
			if(pressureOn){
				pressureOn=false;
				$("#pressure").css({backgroundPosition:"top left"});
			}else{
				pressureOn=true;
				$("#pressure").css({backgroundPosition:"top right"});
			}
		}
	);
	//Add key events for the space bar so you can move the canvas
	$(document).keydown(function(evt){
		if(evt.keyCode==32){
			grabToggleOn();
		}
	}).keyup(function(evt){
		if(evt.keyCode==32){
			grabToggleOff();
		}	
	});
	//Add mouse events to the canvas
	$("#canvas").mousedown(mousedown).mouseup(mouseup).mousemove(mousemove).mouseout(mouseup)
	//get the screen width and height so we can set the defaultZoomLevel
	screenW=$(window).width()-20;
	screenH=$(window).height()-60;
	screenRatio=screenW/screenH;
	if(canvasRatio>screenRatio){
		defaultZoomLevel=(canvas.height/screenH)
	}else{
		defaultZoomLevel =(canvas.width/screenW)
	}
	defaultZoomLevel= defaultZoomLevel/2
	modBrushSize=brushSize*defaultZoomLevel;
	if(canvasRatio>screenRatio){
		showAllZoomLevel=(canvas.width/screenW)
	}else{
		showAllZoomLevel=(canvas.height/screenH)
	}
	//set the currentZoomLevel to the default
	currentZoomLevel= defaultZoomLevel
	//First call to resize
	resize()
	//set the cursor to the #2 brush
	$("#canvas").css({cursor: "url(images/"+currentCursor+".cur) "+cursorPosition[currentCursor]+" "+cursorPosition[currentCursor]+", crosshair"})
	//show the page and slide the brush and marker menus	
	$("#page").show();
	$("#markerHolder").slideToggle();
	$("#brushHolder").slideToggle();
	$.ajax({
	  url: 'json/testopponent.json',
	  dataType: 'json',
	  success: function(data){
		debug("json loaded");
		debug(data);
		var opponentActions=data["testopponent"];
		for(i=0;i<opponentActions.length;i++){
			//commandStack.push(opponentActions[i])
		}
		debug("commandStack")
debug(commandStack)
		}
	});
});

// Function to resize all the page elements based on screen height and width
function resize(){

	screenW=$(window).width()-20;
	screenH=$(window).height()-60;
	$("#buttonHolder").css({width:screenW})
	$("#canvasHolder").css({width:screenW, height:screenH})
	screenRatio=screenW/screenH;
	if(canvasRatio>screenRatio){
		defaultZoomLevel=(canvas.height/screenH)
	}else{
		defaultZoomLevel =(canvas.width/screenW)
	}
	defaultZoomLevel= defaultZoomLevel/2
	modBrushSize=brushSize*defaultZoomLevel;
	if(canvasRatio>screenRatio){
		showAllZoomLevel=(canvas.width/screenW)
	}else{
		showAllZoomLevel=(canvas.height/screenH)
	}
	$("#buttonHolder").css({marginTop:(screenH+50)+"px"});
	$("#markerHolder").css({marginTop:(-($("#markerHolder").height()))});
	zoomCanvasTo((canvas.width/2),(canvas.height/2), currentZoomLevel , currentZoomLevel)
}
//Function to zoom to a point on the canvas takes x/y coordinates from the canvas object
function zoomCanvasTo(_x,_y, oldlevel ,newlevel){
	if(showAll){
		screenH=$(window).height()-20;

		if(canvasRatio>screenRatio){
			showAllZoomLevel=(canvas.width/screenW)
		}else{
			showAllZoomLevel=(canvas.height/screenH)
		}
newLevel= showAllZoomLevel
		$("#canvasHolder").css({width:screenW, height:screenH})
		$("#canvasNavHolder").slideUp("slow").delay(400);
		$("#buttonHolder").css({marginTop:(screenH+70)+"px"});
		$("#canvas").css({cursor: "url(images/cursor_zoom_in.cur) 6.5 6.5, crosshair"})
	}else{
		$("#canvasHolder").css({width:screenW, height:screenH})
		screenH=$(window).height()-60;
		$("#buttonHolder").css({marginTop:(screenH)+"px"}).clearQueue().show();
		$("#canvasNavHolder").slideDown("slow").delay(400);
		$("#canvas").css({cursor: "url(images/"+currentCursor+".cur) "+cursorPosition[currentCursor]+" "+cursorPosition[currentCursor]+", crosshair"})
	}

	canvasCenter={x:_x,y:_y}
	var oldCanvasW=canvas.width/oldlevel;
	var newCanvasW=canvas.width/newlevel;
	var navCanvasW=canvas.width*navSizePercent;
	var oldCanvasH=canvas.height/oldlevel
	var newCanvasH=canvas.height/newlevel
	var navCanvasH=canvas.height*navSizePercent;
	var navX=navCanvasW*((oldCanvasW-(oldCanvasW-(_x/oldlevel)))/oldCanvasW);
	var navY=navCanvasH*((oldCanvasH-(oldCanvasH-(_y/oldlevel)))/oldCanvasH);
	var newX=newCanvasW*((oldCanvasW-(oldCanvasW-(_x/oldlevel)))/oldCanvasW);
	var newY=newCanvasH*((oldCanvasH-(oldCanvasH-(_y/oldlevel)))/oldCanvasH);
	var offsetX=-(newX)+(screenW/2);
	var offsetY=-(newY)+(screenH/2);
	var canvasBoxH=(screenH*navSizePercent)*newlevel;
	var canvasBoxW=(screenW*navSizePercent)*newlevel;
	var navOffsetX=(navX)-(canvasBoxW/2)
	var navOffsetY=(navY)-(canvasBoxH/2)
	currentZoomLevel= newlevel
	// set to draggable so the animate function can properly set the left/top of canvas. figure out why this is the case...
	$("#canvas").draggable({drag:dragfunc})
	$("#canvas").animate({
		left:offsetX,
		top:offsetY,
		width:canvas.width/newlevel,
		height:canvas.height/newlevel
	},300,function(){
		canvasPos.x=$("#canvas").offset().left;
		canvasPos.y=$("#canvas").offset().top;
	});
	//destroy the draggable instance.
	$("#canvas").draggable("destroy")
	canvasPos.x=offsetX;
	canvasPos.y=offsetY;
	$("#canvasNavBox").animate({
		left:navOffsetX,
		top:navOffsetY,
		width:canvasBoxW-2,
		height:canvasBoxH-2
	},300);	
}

function grabToggleOn(){
	dragging=true;
	$("#canvas").draggable({drag:dragfunc});
	debug("set to draggable")
	$("#grab_hand").css({backgroundPosition: "top right"})
	$("#canvas").css({cursor: "url(images/cursor_hand_open.cur) 9 9, crosshair"})
}
function grabToggleOff(){
	dragging=false;
	$("#canvas").draggable("destroy");
	$("#grab_hand").css({backgroundPosition: "top left"})
	canvasPos.x=$("#canvas").offset().left;
	canvasPos.y=$("#canvas").offset().top;
	$("#canvas").css({cursor: "url(images/"+currentCursor+".cur) "+cursorPosition[currentCursor]+" "+cursorPosition[currentCursor]+", crosshair"})

}
function dragfunc(){
	dragging=true;
	canvasPos.x=$("#canvas").offset().left;
	canvasPos.y=$("#canvas").offset().top;
	offsetX=((canvas.width/2)+(canvasPos.x-(screenW/2)))
	offsetY=((canvas.height/2)+(canvasPos.y-(screenH/2)))
	var centerx=((canvas.width/2)-offsetX)*currentZoomLevel;
	var centery=((canvas.height/2)-offsetY)*currentZoomLevel;
	canvasCenter={x:centerx,y: centery}; 
	
	var newCanvasW=canvas.width/currentZoomLevel;
	var newCanvasH=canvas.height/currentZoomLevel
	
	var navCanvasW=canvas.width*navSizePercent;
	var navCanvasH=canvas.height*navSizePercent;
	
	var navX=navCanvasW*((newCanvasW-(newCanvasW-(centerx/currentZoomLevel)))/newCanvasW);
	var navY=navCanvasH*((newCanvasH-(newCanvasH-(centery/currentZoomLevel)))/newCanvasH);
	var canvasBoxH=(screenH*navSizePercent)*currentZoomLevel;
	var canvasBoxW=(screenW*navSizePercent)*currentZoomLevel;
	var navOffsetX=(navX)-(canvasBoxW/2)
	var navOffsetY=(navY)-(canvasBoxH/2)
	$("#canvasNavBox").css({
		left:navOffsetX,
		top:navOffsetY,
		width:canvasBoxW-2,
		height:canvasBoxH-2
	});

}

//Saves a png client-side. I'll need to change this to server-side
function saveImage(){
	var tempCanvas = document.createElement('canvas');
	tempCanvas.height=canvas.height;
	tempCanvas.width=canvas.width;
	var tempctx=tempCanvas.getContext("2d");
	tempctx.fillStyle="white";
	tempctx.fillRect(0,0,canvas.width,canvas.height);
	tempctx.drawImage(canvas,0,0)
	Canvas2Image.saveAsPNG(tempCanvas); 
}

//Set the marker color
function selectmarker(evt){
$("#markerHolder").children().css({backgroundPosition: "top left"})
$(evt.currentTarget).css({backgroundPosition: "top right"})
switch($(evt.currentTarget).attr("id")){
	case "marker_black":
	brushColor={r:0,g:0,b:0};
	break;
	case "marker_red":
	brushColor={r:255,g:0,b:0};
	break;
	case "marker_blue":
	brushColor={r:0,g:0,b:255};
	break;
	case "marker_green":
	brushColor={r:0,g:255,b:0};
	break;
	case "marker_orange":
	brushColor={r:255,g:152,b:0};
	break;
	case "marker_yellow":
	brushColor={r:255,g:255,b:0};
	break;
	case "marker_purple":
	brushColor={r:255,g:0,b:255};
	break;
	case "marker_grey":
	brushColor={r:158,g:158,b:158};
	break;
	case "marker_white":
	brushColor={r:255,g:255,b:255};
	break;
	}
	if($("#brushHolder").css("display")!="none"){
	$("#brushHolder").slideToggle();
	}
	$("#markerHolder").slideToggle();
	$(".color_box").css({backgroundColor:"rgb("+brushColor.r+","+brushColor.g+","+brushColor.b+")"})
}

//Set the brush size
function selectbrush(evt){
	$("#brushHolder").children().css({backgroundPosition: "top left"})
	$(evt.currentTarget).css({backgroundPosition: "top right"})
	currentCursor=$(evt.currentTarget).attr("id").split("brush_").join("cursor_")
	$("#canvas").css({cursor: "url(images/"+currentCursor+".cur) "+cursorPosition[currentCursor]+" "+cursorPosition[currentCursor]+", crosshair"})
	switch($(evt.currentTarget).attr("id")){
		case "brush_size_1":
		brushSize=2;
		break;
		case "brush_size_2":
		brushSize=5;
		break;
		case "brush_size_3":
		brushSize=10;
		break;
		case "brush_size_4":
		brushSize=15;
		break;
		case "brush_size_5":
		brushSize=19;
		break;
		case "brush_size_6":
		brushSize=24;
		break;
	}
	modBrushSize=brushSize* defaultZoomLevel
	$("#brushHolder").slideToggle();
	if($("#markerHolder").css("display")!="none"){
		$("#markerHolder").slideToggle();
	}
	$("#size_picker").css({background:"url(images/"+$(evt.currentTarget).attr("id")+".png) no-repeat top left"})
}

//Util to round a number. I use this on the pressure for increased performance, but I could probably leave it out...
function roundNumber(num, dec) {
	var result = Math.round(num*Math.pow(10,dec))/Math.pow(10,dec);
	return result;
	//return num;
}

//Wacom Plugin callback function. Not using this.	
function pluginloaded()
{
}
//canvas mousedown function.
function mousedown(evt){
	if(!dragging){
		lineDown=1
		var ev = evt || window.event;
		var mouseX = (ev.pageX?(ev.pageX) : (ev.clientX + document.body.scrollLeft))- canvasPos.x
		var mouseY = (ev.pageY?(ev.pageY) : (ev.clientY + document.body.scrollTop))- canvasPos.y
		curX = Math.floor((ev.pageX?ev.pageX : ev.clientX) - canvasPos.x)*(currentZoomLevel);
		curY = Math.floor((ev.pageY?ev.pageY : ev.clientY) - canvasPos.y)*(currentZoomLevel);
		startX = lastX = smoothedMouseX = lastSmoothedMouseX = curX;
		startY = lastY = smoothedMouseY = lastSmoothedMouseY = curY;


		if (penAPI && pressureOn)
        {
			penAPI.setFocus=true;
            pressure = roundNumber(penAPI.pressure,6)
			if(pressure==0){
			pressure=.1
			}	
        }
        else
        {
			pressure=1
        }
		lastRotation = Math.PI/2;
		lastMouseChangeVectorX = 0;
		lastMouseChangeVectorY = 0;
		if(showAll){
			showAll=false;
			zoomCanvasTo(lastX,lastY,currentZoomLevel,defaultZoomLevel);
		}else{
			mousemove(evt);
			drawing=true;
		}
	}else{
		$("#canvas").css({cursor: "url(images/cursor_hand_closed.cur) 9 9, crosshair"})
	}
}
//canvas mouseup function.
function mouseup(){
	if(!dragging){
		lineDown=0;
		drawing=false;
		updateNavigtor()
		commandStack.push({strokeEnd:true, uid:userID})
		replayStack.push({strokeEnd:true, uid:userID})
		userStack.push({strokeEnd:true, uid:userID})
		pressure=0
	}else{
		$("#canvas").css({cursor: "url(images/cursor_hand_open.cur) 9 9, crosshair"})
	}
}
//canvas mousemove function.
function mousemove(evt){
if(!dragging){
	if(drawing){
		// Non-IE browsers will use evt
        var ev = evt || window.event;
		curX = Math.floor((ev.pageX?ev.pageX : ev.clientX) - canvasPos.x)*(currentZoomLevel);
		curY = Math.floor((ev.pageY?ev.pageY : ev.clientY) - canvasPos.y)*(currentZoomLevel);
		
		mouseChangeVectorX = curX - lastX;
		mouseChangeVectorY = curY - lastY;
		if (mouseChangeVectorX*lastMouseChangeVectorX + mouseChangeVectorY*lastMouseChangeVectorY < 0) {
			debug("quick change")
				//boardBitmapData.draw(tipLayer);
			smoothedMouseX = lastSmoothedMouseX = lastX;
			smoothedMouseY = lastSmoothedMouseY = lastY;
			lastRotation += Math.PI;
		}	
		
		smoothedMouseX = smoothedMouseX + smoothingFactor*(curX - smoothedMouseX);
		smoothedMouseY = smoothedMouseY + smoothingFactor*(curY - smoothedMouseY);
		dx = smoothedMouseX - lastSmoothedMouseX;
		dy = smoothedMouseY - lastSmoothedMouseY;
		dist = Math.sqrt(dx*dx + dy*dy);
		if (dist != 0) {
			lineRotation = Math.PI/2 + Math.atan2(dy,dx);
		}
		else {
			lineRotation = 0;
		}

		
	
        var oldpressure = pressure;
        if (penAPI && pressureOn)
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
        }
		if(pressure<.2){
			pressure=.2
		}

		if (mouseChangeVectorX* lastMouseChangeVectorX + mouseChangeVectorY*lastMouseChangeVectorY < 0) {
			velocityChange=1
		}else{
			velocityChange=0
		}
		
		//get previous x/y if there are any for the current user. Don't trust this, beacuse with multiple users, you might not own the last object
		var psX=null;
		var psY=null;
		if(userStack[userStack.length - 1] &&userStack[userStack.length-1].uID==userID){
			(userStack[userStack.length-1].smX)? psX =userStack[userStack.length-1].smX: psX=null;
			(userStack[userStack.length-1].smY)? psY =userStack[userStack.length-1].smY: psY=null;
		}
		
//write the line object...yeesh, it's getting big!
		var lineObj={i:replayStack.length,p:roundNumber(pressure, 5),lp:roundNumber(oldpressure,5), bc:brushColor, bs:roundNumber(modBrushSize, rounddec), uID:userID, cf:canvasFactor, lvX:roundNumber(lastMouseChangeVectorX, rounddec), lvY:roundNumber(lastMouseChangeVectorY, rounddec), vX:roundNumber(mouseChangeVectorX, rounddec), vY:roundNumber(mouseChangeVectorY, rounddec),lR:roundNumber(lastRotation,rounddec),smX: roundNumber(smoothedMouseX,rounddec),smY: roundNumber(smoothedMouseY, rounddec),lsmX:roundNumber(lastSmoothedMouseX,rounddec),lsmY:roundNumber(lastSmoothedMouseY,rounddec),lvc:lastVelocityChange,ld:lineDown,s:smoothingOn, psX:psX,psY:psY}
		//push to command and replay stack
		socket.emit("drawClick", lineObj);
		
		//replayStack.push(lineObj)
		userStack.push(lineObj)
		lineDown=0;
		lastX = curX;
	    lastY = curY;
		lastSmoothedMouseX = smoothedMouseX;
		lastSmoothedMouseY = smoothedMouseY;
		lastRotation = lineRotation;
		lastMouseChangeVectorX = mouseChangeVectorX;
		lastMouseChangeVectorY = mouseChangeVectorY;
		lastVelocityChange=velocityChange
		}
	}
}

function drawSmoothLine(obj){
if(obj.lsmX){
debug("drawing line")
	var redrawMultiplier=(canvasFactor/obj.cf);
	canvasid="canvas"
	curctx=ctx
	if(obj.bc.r==0 && obj.bc.g==0 && obj.bc.b==0){
	//If the brush is black, set to source-over	
curctx.globalCompositeOperation = 'source-over';
	}else if(obj.bc.r==255 && obj.bc.g==255 && obj.bc.b==255){
	//If the brush is white, set to destination-out
curctx.globalCompositeOperation = 'destination-out';
	}else{
	//every other color set to destination-over
	curctx.globalCompositeOperation = 'destination-over';
	}

//curctx.globalCompositeOperation = 'darker';
if(obj.s){
debug("drawing smooth line")

	
	var dx = obj.smX - obj.lsmX;
	var dy = obj.smY - obj.lsmY;
	var dist = Math.sqrt(dx*dx + dy*dy);
	var lnR;
	if (dist != 0) {
		lnR = Math.PI/2 + Math.atan2(dy,dx);
	}
	else {
		lnR = 0;
	}
	lineThickness =(((obj.bs*redrawMultiplier) * obj.p)/2)
	lastThickness = (((obj.bs*redrawMultiplier) * obj.lp)/2)
	sin0 = Math.sin(obj.lR);
	cos0 = Math.cos(obj.lR);
	sin1 = Math.sin(lnR);
	cos1 = Math.cos(lnR);
	L0Sin0 = lastThickness*sin0;
	L0Cos0 = lastThickness*cos0;
	L1Sin1 = lineThickness*sin1;
	L1Cos1 = lineThickness*cos1;
	controlVecX = 0.33*dist*sin0;
	controlVecY = -0.33*dist*cos0;
	controlX1 = obj.lsmX + L0Cos0 + controlVecX;
	controlY1 = obj.lsmY + L0Sin0 + controlVecY;
	controlX2 = obj.lsmX - L0Cos0 + controlVecX;
	controlY2 = obj.lsmY - L0Sin0 + controlVecY;
	var lineW=(obj.bs*redrawMultiplier * obj.p)
	if(obj.ld){
		//brush stroke is starting, draw a straight line
		canto(canvasid).beginPath().moveTo(obj.lsmX*redrawMultiplier,obj.lsmY*redrawMultiplier).lineTo(obj.smX*redrawMultiplier,obj.smY*redrawMultiplier).stroke({lineWidth: lineW+1, lineCap:"none", strokeStyle: "rgba("+ obj.bc.r+", "+ obj.bc.g+", "+ obj.bc.b+", "+ brushAlpha+")"}).endPath();
	}else{
	//if (false) {
	if (obj.vX*obj.lvX + obj.vY*obj.lvY < 0 || obj.lvc) {	
		//quick change of velocity, draw a straight line
		canto(canvasid).beginPath().moveTo(obj.lsmX*redrawMultiplier,obj.lsmY*redrawMultiplier).lineTo(obj.smX*redrawMultiplier, obj.smY*redrawMultiplier).stroke({lineWidth: lineW+1, lineCap:"round", strokeStyle: "rgba("+ obj.bc.r+", "+ obj.bc.g+", "+ obj.bc.b+", "+ brushAlpha+")"}).endPath();
		
		canto(canvasid).beginPath().moveTo(obj.psX*redrawMultiplier,obj.psY*redrawMultiplier).lineTo(obj.lsmX*redrawMultiplier, obj.lsmY*redrawMultiplier).stroke({lineWidth: lineW+1, lineCap:"round", strokeStyle: "rgba("+ obj.bc.r+", "+ obj.bc.g+", "+ obj.bc.b+", "+ brushAlpha+")"}).endPath();
		
	}else{
		//draw a curved line
		canto(canvasid).beginPath().moveTo((obj.lsmX + L0Cos0)* redrawMultiplier, (obj.lsmY + L0Sin0)* redrawMultiplier).quadraticCurveTo(controlX1* redrawMultiplier,controlY1* redrawMultiplier,(obj.smX + L1Cos1)*redrawMultiplier, (obj.smY + L1Sin1)* redrawMultiplier).lineTo((obj.smX - L1Cos1)* redrawMultiplier, (obj.smY - L1Sin1)* redrawMultiplier).quadraticCurveTo((controlX2)* redrawMultiplier, (controlY2)* redrawMultiplier, (obj.lsmX - L0Cos0)* redrawMultiplier, (obj.lsmY - L0Sin0)* redrawMultiplier).lineTo((obj.lsmX + L0Cos0)* redrawMultiplier, (obj.lsmY + L0Sin0)* redrawMultiplier).fill({lineWidth: lineW, fillStyle: "rgba("+ obj.bc.r+", "+ obj.bc.g+", "+ obj.bc.b+", "+ brushAlpha+")"}).stroke({lineWidth:0, lineCap:"none", strokeStyle: "rgba("+ obj.bc.r+", "+ obj.bc.g+", "+ obj.bc.b+", "+ brushAlpha+")"}).endPath();

	}	
}
}else{
debug("drawing unsmooth line")
var lineW=(obj.bs*redrawMultiplier * obj.p)
	if(obj.ld){
		//brush stroke is starting, draw a straight line
		canto(canvasid).beginPath().moveTo(obj.lsmX*redrawMultiplier,obj.lsmY*redrawMultiplier).lineTo(obj.smX*redrawMultiplier,obj.smY*redrawMultiplier).stroke({lineWidth: lineW+1, lineCap:"none", strokeStyle: "rgba("+ obj.bc.r+", "+ obj.bc.g+", "+ obj.bc.b+", "+ brushAlpha+")"}).endPath();
	}else{
		canto(canvasid).beginPath().moveTo(obj.lsmX*redrawMultiplier,obj.lsmY*redrawMultiplier).lineTo(obj.smX*redrawMultiplier,obj.smY*redrawMultiplier).stroke({lineWidth: (obj.bs*redrawMultiplier * obj.p), lineCap:"round", strokeStyle: "rgba("+ obj.bc.r+", "+ obj.bc.g+", "+ obj.bc.b+", "+ brushAlpha+")"}).endPath();
		debug("drawing unsmooth line2")
	}
}
}
}



function updateNavigtor(){
	navctx.fillStyle="white";
	navctx.fillRect(0,0,canvas.width,canvas.height);
	navctx.drawImage(canvas,0,0,canvas.width*navSizePercent,canvas.height*navSizePercent)
	
}


function redraw2(){
	var tempstack=replayStack.slice(0);
	tempstack.forEach(drawSmoothLine)
	updateNavigtor()
}


function popstack(){
	if(commandStack.length>0){
			var currentCommand;
			for(i=0;i<speed;i++){
				currentCommand=commandStack.shift();
				if(currentCommand){
					if(currentCommand.lsmX){
						drawSmoothLine(currentCommand)
					}else if(currentCommand.strokeEnd){
						updateNavigtor()
					}
				}
			}
	}
}

function clearcanvas(){
	//ctx.clearRect ( 0 , 0 , canvas.width , canvas.height );
	canto("canvas").beginPath().clearRect(0,0,canvas.width,canvas.height,0,0).endPath()
	//navctx.clearRect ( 0 , 0 , canvasNav.width ,canvasNav.height );		
	canto("canvasNav").beginPath().clearRect(0,0,canvasNav.width,canvasNav.height,0,0).endPath()
}
function redrawcanvas(){
	commandStack=replayStack.slice(0)
	comandStack.push({updateNavigator:true})
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
