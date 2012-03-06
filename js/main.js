function debug(message){
	if(window.console){
		console.log(message)
	}
}
var restorePoints = [];
var pluginLoaded=false;
var brushColor={r:0,g:0,b:0}
var brushAlpha=1
var brushStroke;
var canvas;
var background;
var currentLayer;
var layer0;
var currentLayerNum=0
var canvasLayer;
var drawing=false;
var screenW;
var screenH;
var canvasPos = {x:0.0, y:0.0};
var lastX = 0.0;
var lastY = 0.0;

    function plugin()
    {
        return document.getElementById('wtPlugin');
    }
      
    function findPos(obj) 
    {
        var curleft = curtop = 0;
        if (obj.offsetParent) 
        {
            curleft = obj.offsetLeft
            curtop = obj.offsetTop
            while (obj = obj.offsetParent) 
            {
                curleft += obj.offsetLeft
                curtop += obj.offsetTop
            }
        }
        return {x:curleft, y:curtop};
    }
      
    $(document).ready(function(){

 	screenW=$(document).width()
 	screenH=$(document).height()-30
	$('#colorSelectorHolder').ColorPicker({
			color:"#000000",
			onChange:function(hsv,hex,rgb){
			$('#colorSelector2 div').css('backgroundColor', '#' + hex);
				brushColor=rgb
			}
		});
		$("#undobutton").click(function(){
			undo();
		});

	/*	
		canvasPos = findPos(canvas);
		canvas.style.cursor = 'pointer';
	*/
	canvasPos.x=$("#canvasHolder").offset().left
	canvasPos.y=$("#canvasHolder").offset().top
	canvas = new Kinetic.Stage("canvasHolder", screenW, screenH);
background = new Kinetic.Layer();	
layer0= new Kinetic.Layer();


	backgroundCanvas = new Kinetic.Shape(function(){
		var context = this.getContext();
            context.beginPath();
            context.moveTo(0,0)
			context.lineTo(screenW,0)
			context.lineTo(screenW,screenH)
			context.lineTo(0,screenH)
			context.lineTo(0,0)
            context.fillStyle = "white";
            context.fill();
            context.stroke();
	}) 
 
	background.add(backgroundCanvas)
	canvas.add(background);
canvas.add(layer0);		
	
savestroke()
		background.on("mousedown touchstart", mousedown);
		background.on("mouseup touchend", mouseup);
		background.on("mousemove touchmove", mousemove);


		//$("#canvas").mousedown(mousedown).mouseup(mouseup);


	});
    function pluginLoaded()
    {
		pluginLoaded=true;
		debug("PluginLoaded");
    }
	function mousedown(evt){
		//layer = new Kinetic.Layer("layer"+currentLayerNum);
		//canvas.add(layer);
		//currentLayer=layer;	
		currentLayer=layer0;	
		var ev = evt || window.event;
		lastX = (ev.pageX?ev.pageX : ev.clientX + document.body.scrollLeft) - canvasPos.x;
		lastY = (ev.pageY?ev.pageY : ev.clientY + document.body.scrollTop ) - canvasPos.y;
		mousemove(evt);
		drawing=true;
	}
	function mouseup(){
	debug("mouseup")
		drawing=false;
		//savestroke(currentLayerNum)
	}
	function mousemove(evt){
		if(drawing){
			debug("mousemove")
			// Non-IE browsers will use evt
	        var ev = evt || window.event;
			curX = (ev.pageX?ev.pageX : ev.clientX + document.body.scrollLeft) - canvasPos.x;
			curY = (ev.pageY?ev.pageY : ev.clientY + document.body.scrollTop ) - canvasPos.y;
			var penAPI = plugin().penAPI;
	        //var canvas = document.getElementById('canvas');
	        var pressure;
	        var isEraser;
			var pointerType;
	        if (penAPI)
	        {
				penAPI.setFocus=true;
	            pressure = penAPI.pressure;
	            isEraser = penAPI.isEraser;
	            
	        }
	        else
	        {
				//add some speed pressure 
				speedX=Math.abs(curX-lastX);
				speedY=Math.abs(curY-lastY);
				speed=Math.sqrt((speedX* speedX)+(speedY* speedY))
				if((speed>20)){
						pressure=3/(2+(speed/20))
				}else{
				pressure=1
				}
	            //pressure = 1.0;
	            isEraser = false;
	        }
	       
			
	    
			ctx=currentLayer.getContext();
				ctx.beginPath();
			    ctx.moveTo(lastX, lastY);
			    ctx.lineTo(curX, curY);
			    
			    ctx.lineCap = 'round';
			    if (isEraser == true) 
			    {
					debug("eraser")
			        ctx.lineWidth = 25.0 * pressure;
			        ctx.strokeStyle = "rgba(255, 255, 255, 1.0)";
			    }
			    else 
			    {
			        ctx.lineWidth = 10.0 * pressure;
			        ctx.strokeStyle = "rgba("+ brushColor.r+", "+ brushColor.g+", "+ brushColor.b+", "+ brushAlpha+")";
			    }
			    ctx.stroke();

		lastX = curX;
        lastY = curY;
			
		}
	}
	function savestroke(stroke) {
		restorePoints.push("layer"+currentLayerNum)
		currentLayerNum++;
		debug(restorePoints);
	}

	function undo() {
		var lastUndo=(currentLayerNum-1)
		if(lastUndo>0){
			debug("undo")
			debug(restorePoints)
	   		canvas.children[(currentLayerNum-1)].clear()
			restorePoints.pop()
		}
	}
	function redo() {
		
	}
/*	TOO MUCH MEMORY!!
function savestroke() {
	// Get the current canvas drawing as a base64 encoded value
	var imgSrc = canvas.toDataURL(addedcallback);
	// and store this value as a 'restoration point', to which we can later revert
	
	
}
function addedcallback(e){
	debug("added")
	restorePoints.push(e);
}
function undo() {
	
	// If we have some restore points
	debug(restorePoints)
	if (restorePoints.length > 0) {
		
		// Create a new Image object
		var oImg = new Image();
		// When the image object is fully loaded in the memory...
		oImg.onload = function() {
			// Get the canvas context
			var canvasContext = layer0.getContext("2d");
			canvasContext.drawImage(oImg, 0, 0);
		}
		// The source of the image, is the last restoration point
		oImg.src = restorePoints.pop();
	}
}
*/
/*

	function mousedown(evt)
	    {
	        // Non-IE browsers will use evt
	        var ev = evt || window.event;
	
	        //var canvas = document.getElementById('canvas');
	        canvas.onmousemove=mousedrag;
	        
		lastX = (ev.pageX?ev.pageX : ev.clientX + document.body.scrollLeft)
			- canvasPos.x;
		lastY = (ev.pageY?ev.pageY : ev.clientY + document.body.scrollTop )
			- canvasPos.y;
	        
	        // Register click immediately
	        mousedrag(evt);
	
	    }
	function mouseup()
	    {
	            var canvas = document.getElementById('canvas');
	            canvas.onmousemove=null;
	    }
    
      
    function mousedrag(evt)
    {
        // Non-IE browsers will use evt
        var ev = evt || window.event;

        var penAPI = plugin().penAPI;
        var canvas = document.getElementById('canvas');
        var pressure;
        var isEraser;
		var pointerType;

        if (penAPI)
        {
			penAPI.setFocus=true;
            pressure = penAPI.pressure;
            isEraser = penAPI.isEraser;
        }
        else
        {
            pressure = 1.0;
            isEraser = false;
        }
        
	curX = (ev.pageX?ev.pageX : ev.clientX + document.body.scrollLeft)
		- canvasPos.x;
	curY = (ev.pageY?ev.pageY : ev.clientY + document.body.scrollTop )
		- canvasPos.y;

        if (canvas.getContext) 
        {
            var ctx = canvas.getContext("2d");
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(curX, curY);
            
            ctx.lineCap = 'round';
            if (isEraser == true) 
            {
				debug("eraser")
                ctx.lineWidth = 25.0 * pressure;
                ctx.strokeStyle = "rgba(255, 255, 255, 1.0)";
            }
            else 
            {
                ctx.lineWidth = 10.0 * pressure;
                //ctx.strokeStyle = "rgba(0, 0, 200, 1.0)";

                ctx.strokeStyle = "rgba("+ brushColor.r+", "+ brushColor.g+", "+ brushColor.b+", "+ brushAlpha+")";
            }
            ctx.stroke();
        }
        
        lastX = curX;
        lastY = curY;
    }
*/