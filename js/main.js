//define global variables
var loggedin=false;
var mode;
var commandStack = [];
var userStack = [];
var gameList = [];
var friendList=[];
var userID;
var gameID;
var socket;
var currentGame;
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
var speed=10;
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
var defaultSmoothingFactor=.4
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



//debug function
function debug(message){
	if(window.console){
		console.log(message);
	}
}
function getWacomPlugin()
{
	return document.getElementById('wtPlugin');
}
function isPluginLoaded()
    	{
		var retVersion = "";
		var pluginVersion = getWacomPlugin().version;
		//alert("pluginVersion: [" + pluginVersion + "]");

		if ( pluginVersion != undefined )
		{
	       		retVersion = pluginVersion;
		}

		return retVersion;
}

function clearLoadedPluginFlag()
{
	debug("WARNING: could not load WacomIE.cab file.");
	loadedPlugin = 0;
}

//BEGIN Facebook Init
window.fbAsyncInit = function() {
    FB.init({
      appId      : '239015749524254',
      oauth		 : true,
      status     : true,
      cookie     : true,
      xfbml      : true
    });
	debug("facebook initialized")
	FB.getLoginStatus(fblogin,true);
	//FB.Event.subscribe('auth.login',fblogin);
	setupSocket();
	FB.Event.subscribe('auth.statusChange',fblogin);
	
};
function checkForWacom(){
	//BEGIN Check Wacom plugin	
	for(i=0;i<navigator.plugins.length;i++){
		if(navigator.plugins[i].name=="WacomTabletPlugin" && navigator.plugins[i].length>=1){
			pluginInstalled=true
			break;
		}
	}
	if(pluginInstalled){
		//$("body").append('<!--[if IE]><object id="wtPlugin" classid="CLSID:092dfa86-5807-5a94-bf3b-5a53ba9e5308"><param name="onload" value="pluginLoaded" /></object><![endif]--><!--[if !IE]> <--><embed id="wtPlugin" type="application/x-wacomtabletplugin" HIDDEN="TRUE" onLoad="pluginLoaded"></embed><!--> <![endif]-->');
	}
	//END Check Wacom plugin
}

function unloadMessage() {
            return "Leaving this page may end your game.";
        }

        function setConfirmUnload(enabled) {
           // window.onbeforeunload = enabled ? unloadMessage : null;
        }

// Load the SDK Asynchronously
$(document).ready(function(){
	$("#loginprogressbar").progressbar({value: 37}).show();
});

(function(d){
     var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement('script'); js.id = id; js.async = true;
     js.src = "//connect.facebook.net/en_US/all.js";
     ref.parentNode.insertBefore(js, ref);
}(document));

// Facebook login function

function fblogin(response) {
	//only call once
	if(!loggedin){
		$("#loginprogressbar").progressbar({value: 100}).show();
		debug("fblogin")
		if (response.status === 'connected') {
			loggedin=true
			debug("fblogin connected");
			$("#login_holder").hide();
			userID = response.authResponse.userID;
			fbAccessToken = response.authResponse.accessToken;
			FB.api('/me', mecallback);
		} else if (response.status === 'not_authorized') {
			$("#loginprogressbar").progressbar({value: 100}).hide();
			$("#splash_buttonholder").hide();
			$("#login_holder").show();
			debug("logged in to FB but not authorized")
		} else {
			$("#loginprogressbar").progressbar({value: 100}).hide();
			$("#splash_buttonholder").hide();
			$("#login_holder").show();
			debug("not logged into FB")
		}
	}
	
}

function mecallback(response) {
	$("#splash_buttonholder").show();
	$("#loginprogressbar").progressbar({value: 100}).hide();
	debug("me received!!");
	userObj={userID:userID,screenname:response.name,profilepic:'http://graph.facebook.com/'+userID+'/picture',token:fbAccessToken}
	addUser(userObj)
	debug("addUser complete")
	var myProfileHTML=''
	debug("forming sql query")
	var fqlquery=escape('SELECT uid, first_name, last_name FROM user WHERE uid IN (SELECT uid2 FROM friend WHERE uid1 = \''+ userID +'\') AND is_app_user=1');
	debug("making sql query")
	FB.api('/fql?q='+fqlquery, function(response){
		debug("sql responded")
			friendList=[];
			for(var i=0;i<response.data.length;i++){
				
			friendList.push({userID:String(response.data[i].uid),screenname:response.data[i].first_name+" "+response.data[i].last_name});
			}
			debug("response=")
			debug(response)
			debug("friendList=")
			debug(friendList);
	});
	//$('.profilepic').html('<img src="http://graph.facebook.com/'+userID+'/picture" />');
	//$('.profilename').html(response.name)
	//$('#profile').show();
	//set the user options, should be after getUser
	//$('#screen_name').val(response.name)
	//$('#sound_flip option[value="on"]').prop("selected","selected")
	//$('#sound_flip option[value="off"]').prop("selected","")
	//$('#sound_flip').slider('refresh');
}
//END Facebook Init


//BEGIN Image Preloader
//Image preload function
function preload(arrayOfImages) {
    $(arrayOfImages).each(function(){
		$('<img src="' + this + '" />')
    });
}
//Preload site images
preload(["images/wheelofdeathbg.png","images/cursor_size_1.cur","images/cursor_size_2.cur","images/cursor_size_3.cur","images/cursor_size_4.cur","images/cursor_size_5.cur","images/cursor_size_6.cur","images/cursor_hand.cur","images/cursor_size_6.cur"])
//END Image Preloader


//old copy command stack to clipboard, use to write to file.
/*
function copyToClipboard (arr) {
var returnStr='[';
for(i=0;i<arr.length;i++){
	returnStr+='{'
	for(prop in arr[i]){
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
}

*/
$(window).load(function(){
//firefox won't load the plugin correctly before window load.
	debug("getWacomPlugin().penAPI.isWacom  =")
	debug(getWacomPlugin().penAPI.isWacom)
var loadVersion = isPluginLoaded();
if ( loadVersion != "" )
{
	
	penAPI=getWacomPlugin().penAPI;
	debug("wacom info");
	debug(penAPI.isWacom)
	$("#pressure").show();
	pressureOn=true;
	$("#pressure").css({backgroundPosition:"top right"});
}
else
{
	debug("webplugin is NOT Loaded (or undiscoverable)");
	return;
}
})


$('#gameChooser').live('pageshow',function(event){
	debug("game chooser page shown")
})


$('#drawing').live('pagebeforeshow',function(event){
	resize();
});
$('#drawing').live('pageshow',function(event){
	resize();
});


//on mainmenu init
$('#mainmenu').live('pageinit',function(event){
	//set the default transitions to fade because mobile safari screws up canvas drawing if 3d transitions are applied.
	$.mobile.defaultDialogTransition="fade"
	$.mobile.defaultPageTransition="fade"
	
	splashScreenH=$(window).height()-30;
	splashScreenW=$(window).width()-30;
	splashH=700
	splashW=700
	$("#splash_content").css({marginTop:(splashScreenH/2-(splashH/2)),marginLeft:(splashScreenW/2-(splashW/2))})
});

//on drawing page init
$('#drawing').live('pageinit',function(event){
	debug("document ready")
	$("#pressure").hide();
	//Broswer specific actions
	if((navigator.userAgent.match(/chrome/i))){
		canvasFactor=2
		$(window).bind('resize',resize)
	}else if(navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPod/i)){
		navSize=.05
		$("#buttonHolder").hide();
		$(".marker").css({marginTop:-15})
		canvasFactor=1
		$(window).bind('orientationchange',resize)
	}else if(navigator.userAgent.match(/iPad/i)){
		canvasFactor=1
		$(window).bind('orientationchange',resize)
	}else if(navigator.userAgent.match(/firefox/i)){
		canvasFactor=2
		$(window).bind('resize',resize)
	}else if(navigator.userAgent.match(/safari/i)){
		canvasFactor=1
		$(window).bind('resize',resize)
	}
	$.mobile.orientationChangeEnabled=false;
	
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
	ctx = canvas.getContext("2d");
 	navctx= canvasNav.getContext("2d");
 	
 	
 	debug("drawing page initiated")
	//Load Wheel of Death
	//loadWheelofDeath()
	//set the default brush and marker buttons to selected state
	$("#brush_size_2").css({backgroundPosition: "top right"})
	$("#marker_black").css({backgroundPosition: "top right"})
	//set global var for canvas and nav context
	
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
		$.mobile.changePage($("#wheel"))
		$("#wheelofdeath").spin();
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
	$('#canvas').live('vmousedown',mousedown).live('vmouseup', mouseup).live('vmousemove', mousemove);
	$("#markerHolder").hide();
	$("#brushHolder").hide();
	
	debug("drawing page shown")
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
	modBrushSize=(brushSize*defaultZoomLevel)*(canvasFactor/2)
	if(canvasRatio>screenRatio){
		showAllZoomLevel=(canvas.width/screenW)
	}else{
		showAllZoomLevel=(canvas.height/screenH)
	}
	//set the currentZoomLevel to the default
	currentZoomLevel= defaultZoomLevel
	//First call to resize

		
})

function loadWheelofDeath(){
$.ajax({
		  url: 'json/wheelofdeath.json',
		  dataType: 'json',
		  success: function(data){
			$("#wheelofdeath").WheelOfDeath({wheelItems:data.wheelofdeath.items, onSelect: function(sel){
				//HIDE WHEEL	
				//$("#wheelofdeath").delay(2000).animate({top:-300},function(){$(".blackBG").hide();});}
				//currentPage
				}
			});
		  }
	});
}





function setupSocket(){
debug("setting up socket io stuff")
//set the socket
	try{
	socket = io.connect('http://ec2-50-19-184-210.compute-1.amazonaws.com:4000');
	}catch(e){
		debug("socket io not running")
	}
	//set the UserID
	socket.emit("setUser",{userID:userID})
	socket.on('connection', function(){
        debug('socket connected');
    });
	socket.on('error', function(data){
        debug(data.error);
    });
	socket.on('loggedIn', function(data){
        debug("logged in")
		debug(data);
    });
	socket.on('gameJoined', function(data){
        debug("game joined")
		debug(data);
    });
	socket.on('checkGame', function(data){
		var gameListHtml='';
		for(var i=0;i<friendList.length;i++){
			debug("array index="+data.players.indexOf(friendList[i].userID))
			if(data.players.indexOf(friendList[i].userID)!=-1){
				gameListHtml+='<a onclick=\'new function(){joinGame("'+data.gameID+'")};\'>Join '+friendList[i].screenname+'\'s game</a>'
			}
		}
		$("#gamesList").html(gameListHtml)
    });
	socket.on('gameleft', function(data){
        debug("game left")
		debug(data);
    });
	socket.on('gameCreated', function(data){
     	debug("game created")
		debug(data);
		joinGame(data.gameID);
    });
	socket.on('gotUsers', function(data){
     	debug("got users")
		debug(data);
    });
	socket.on('gotGames', function(data){
		gameList=[];
		var gameListHtml='';
		for(var i=0;i<data.length;i++){
			for(var j=0;j<friendList.length;j++){
				if(data[i].players.indexOf(friendList[j].userID)!=-1){
					gameList.push(data[i])
					gameListHtml+='<a onclick=\'new function(){joinGame("'+data[i].gameID+'")};\'>Join '+friendList[j].screenname+'\'s game</a>'
				}
				if(data[i].players.indexOf(userID)!=-1){
					joinGame(data[i].gameID);
				}
			}
		}
		$("#gamesList").html(gameListHtml)
    });
	socket.on('gameJoined', function(data){
     	debug("game joined")
		debug(data);
		currentGame=data.gameID;
		startGame();
    });
	socket.on('userSet', function(data) {
 
    });
	socket.on('gotGames', function(data) {
    	debug("current games");
		debug(data);
    });
	socket.on('gameCreated', function(data) {
    	debug("game created");
		debug(data);
    });
	socket.on('gameConnected', function(data) {
    	debug("connected to game");
		debug(data);
    });
	socket.on('draw', function(data) {
    	commandStack.push(data);
 		replayStack.push(data);
    });
}

function startGame(){
	mode="play"
	//Add mouse events to the canvas
	
	//set the cursor to the #2 brush
	$("#canvas").css({cursor: "url(images/"+currentCursor+".cur) "+cursorPosition[currentCursor]+" "+cursorPosition[currentCursor]+", crosshair"})
	//show the page and slide the brush and marker menus	
}
function watchGame(){
	mode="watch"
	$.mobile.changePage($("#drawing"));
}
function practiceGame(){
	mode="play"
	$.mobile.changePage($("#drawing"));
}

function loadWatchGames(){
	$.mobile.changePage($("#gameChooser"));
}

function getAllGames(){
	socket.emit("getAllGames");
}
function addUser(userObj){
	socket.emit("addUser",userObj);
	debug("adding user!!")
}
function deleteUsers(){
	socket.emit("deleteUsers")
}
function deleteGames(){
	socket.emit("deleteGames")
}
function newGame(){
	debug("friendList=")
	debug(friendList)
	if(friendList.length>0){
	var friendListHTML='<ul id="friendList" data-role="listview" data-theme="c">';
	friendList.forEach(function(friend){
		friendListHTML+='<li><a href="#"><img src="http://graph.facebook.com/'+friend.userID+'/picture?type=square" />'+friend.screenname+'</a></li>'
	})
	friendListHTML+='</ul>'
	$("#friendCollapsable p").html(friendListHTML);
	$.mobile.changePage($("#gameChooser"));
	try{
	$('#gameChooser').trigger( "create" );
	}catch(e){
		debug("!e")
		debug(e)
	}
	}
	//createGame()
}
function createGame(){
	gameID=String(Math.round((Math.random()*1000000)))
	socket.emit("createGame",{gameID:gameID,players:[userID]})
}
function joinGame(gameID){
	socket.emit("joinGame",{gameID:gameID, userID:userID})
}
function leaveGame(){
	socket.emit("leaveGame",{gameID:currentGame, userID:userID})
}
function getUsers(){
	debug("getting users")
	socket.emit("getUsers")
}
function connectToGame(gameID){
	socket.emit("connectGame",{userID:userID,gameID:gameID})
}

// Function to resize all the page elements based on screen height and width
function resize(evt){
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
	defaultZoomLevel= roundNumber((defaultZoomLevel/2),2)
	modBrushSize=(brushSize*defaultZoomLevel)*(canvasFactor/2)
	if(canvasRatio>screenRatio){
		showAllZoomLevel=(canvas.width/screenW)
	}else{
		showAllZoomLevel=(canvas.height/screenH)
	}
	$("#buttonHolder").css({marginTop:(screenH+60)+"px", marginLeft:"10px"});
	//$("#markerHolder").css({marginTop:(-($("#markerHolder").height()))});
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
		$("#buttonHolder").css({marginTop:(screenH+10)+"px"}).clearQueue().show();
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
	modBrushSize=(brushSize*defaultZoomLevel)*(canvasFactor/2)
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


//canvas mousedown function.
function mousedown(evt){
	setConfirmUnload(true);
evt.preventDefault();
	if(!dragging){
		lineDown=1
		var ev = evt || window.event;
		var mouseX = (ev.pageX?(ev.pageX) : (ev.clientX + document.body.scrollLeft))- canvasPos.x
		var mouseY = (ev.pageY?(ev.pageY) : (ev.clientY + document.body.scrollTop))- canvasPos.y
		curX = Math.floor((ev.pageX?ev.pageX : ev.clientX) - canvasPos.x)*(currentZoomLevel);
		curY = Math.floor((ev.pageY?ev.pageY : ev.clientY) - canvasPos.y)*(currentZoomLevel);
		startX = lastX = smoothedMouseX = lastSmoothedMouseX = curX;
		startY = lastY = smoothedMouseY = lastSmoothedMouseY = curY;
		if (isPluginLoaded() && pressureOn)
        {	
			pressure = getWacomPlugin() ? roundNumber(getWacomPlugin().penAPI.pressure,6) : 1.0;
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
function mouseup(evt){
evt.preventDefault();
	if(!dragging){
		lineDown=0;
		drawing=false;
		updateNavigtor()
		socket.emit("drawClick", {strokeEnd:true, uid:userID});
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
evt.preventDefault();
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
		if(smoothingOn){
		smoothedMouseX = smoothedMouseX + smoothingFactor*(curX - smoothedMouseX);
		smoothedMouseY = smoothedMouseY + smoothingFactor*(curY - smoothedMouseY);
		}else{
			smoothedMouseX=curX;
			smoothedMouseY=curY;
		}
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
        if (isPluginLoaded() && pressureOn)
        {
        	
        	pressure = getWacomPlugin() ? roundNumber(getWacomPlugin().penAPI.pressure,6) : 1.0;
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
		
		//get previous x/y if there are any for the current user off the userStack.
		var psX="";
		var psY="";
		if(userStack[userStack.length - 1] &&userStack[userStack.length-1].uID==userID){
			(userStack[userStack.length-1].smX)? psX =userStack[userStack.length-1].smX: psX=null;
			(userStack[userStack.length-1].smY)? psY =userStack[userStack.length-1].smY: psY=null;
		}
		
		//write the line object.
		var lineObj={
			p:roundNumber(pressure, 5),
			lp:roundNumber(oldpressure,5),
			bc:brushColor,
			bs:roundNumber(modBrushSize, rounddec),
			uID:userID,
			cf:canvasFactor,
			lvX:roundNumber(lastMouseChangeVectorX, rounddec),
			lvY:roundNumber(lastMouseChangeVectorY, rounddec),
			vX:roundNumber(mouseChangeVectorX, rounddec),
			vY:roundNumber(mouseChangeVectorY, rounddec),
			lR:roundNumber(lastRotation,rounddec),
			smX: roundNumber(smoothedMouseX,rounddec),
			smY: roundNumber(smoothedMouseY, rounddec),
			lsmX:roundNumber(lastSmoothedMouseX,rounddec),
			lsmY:roundNumber(lastSmoothedMouseY,rounddec),
			lvc:lastVelocityChange,
			ld:lineDown,
			s:smoothingOn,
			psX:psX,
			psY:psY
			}
		//push to command and replay stack
		if(mode=="play"){
			socket.emit("drawClick", lineObj);
		}
		//push your strokes directly to the stack
		commandStack.push(lineObj)
		replayStack.push(lineObj)
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
	var redrawMultiplier=(canvasFactor/parseFloat(obj.cf));
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
if(parseFloat(obj.s)){
	var dx = parseFloat(obj.smX) - parseFloat(obj.lsmX);
	var dy = parseFloat(obj.smY) - parseFloat(obj.lsmY);
	var dist = Math.sqrt(dx*dx + dy*dy);
	var lnR;
	if (dist != 0) {
		lnR = Math.PI/2 + Math.atan2(dy,dx);
	}
	else {
		lnR = 0;
	}
	lineThickness =((parseFloat(obj.bs)/2) * parseFloat(obj.p))
	lastThickness = ((parseFloat(obj.bs)/2) * parseFloat(obj.lp))
	sin0 = Math.sin(parseFloat(obj.lR));
	cos0 = Math.cos(parseFloat(obj.lR));
	sin1 = Math.sin(parseFloat(lnR));
	cos1 = Math.cos(parseFloat(lnR));
	L0Sin0 = lastThickness*sin0;
	L0Cos0 = lastThickness*cos0;
	L1Sin1 = lineThickness*sin1;
	L1Cos1 = lineThickness*cos1;
	controlVecX = 0.33*dist*sin0;
	controlVecY = -0.33*dist*cos0;
	controlX = parseFloat(obj.lsmX) + controlVecX;
	controlY = parseFloat(obj.lsmY) + controlVecY;
	//controlX1 = obj.lsmX + L0Cos0 + controlVecX;
	//controlY1 = obj.lsmY + L0Sin0 + controlVecY;
	//controlX2 = obj.lsmX - L0Cos0 + controlVecX;
	//controlY2 = obj.lsmY - L0Sin0 + controlVecY;
	var lineW=(parseFloat(obj.bs)*redrawMultiplier * parseFloat(obj.p))
	var lsmX=parseFloat(obj.lsmX)
	var lsmY=parseFloat(obj.lsmY)
	var smX=parseFloat(obj.smX)
	var smY=parseFloat(obj.smY)
	
	if(parseFloat(obj.ld)){
		//brush stroke is starting, draw a straight line
canto(canvasid).beginPath().moveTo(lsmX*redrawMultiplier,lsmY*redrawMultiplier).lineTo(smX*redrawMultiplier,smY*redrawMultiplier).stroke({lineWidth: lineW, lineCap:"round", strokeStyle: "rgba("+ obj.bc.r+", "+ obj.bc.g+", "+ obj.bc.b+", "+ brushAlpha+")"}).closePath();
	}else{
	//if (false) {
		if (parseFloat(obj.vX)*parseFloat(obj.lvX) + parseFloat(obj.vY)*parseFloat(obj.lvY) < 0 || parseInt(obj.lvc)) {	
			//quick change of velocity, draw a straight line
			canto(canvasid).beginPath().moveTo(lsmX*redrawMultiplier,lsmY*redrawMultiplier).lineTo(smX*redrawMultiplier, obj.smY*redrawMultiplier).stroke({lineWidth: lineW, lineCap:"round", strokeStyle: "rgba("+ obj.bc.r+", "+ obj.bc.g+", "+ obj.bc.b+", "+ brushAlpha+")"}).closePath();
			
			canto(canvasid).beginPath().moveTo(parseFloat(obj.psX)*redrawMultiplier,parseFloat(obj.psY)*redrawMultiplier).lineTo(lsmX*redrawMultiplier, lsmY*redrawMultiplier).stroke({lineWidth: lineW, lineCap:"round", strokeStyle: "rgba("+ obj.bc.r+", "+ obj.bc.g+", "+ obj.bc.b+", "+ brushAlpha+")"}).closePath();
			
		}else{
			canto(canvasid).beginPath().moveTo((lsmX)* redrawMultiplier, (lsmY)* redrawMultiplier).quadraticCurveTo(controlX* redrawMultiplier,controlY* redrawMultiplier,(smX )*redrawMultiplier, (obj.smY)* redrawMultiplier).stroke({lineWidth:lineW, lineCap:"round", strokeStyle: "rgba("+ obj.bc.r+", "+ obj.bc.g+", "+ obj.bc.b+", "+ brushAlpha+")"}).closePath()
			/*
			if(dist>15){
			//draw a curved line with stroke
			
			ctx.lineWidth=roundNumber(lineW,2);
			ctx.strokeStyle="rgba("+ obj.bc.r+", "+ obj.bc.g+", "+ obj.bc.b+", "+ brushAlpha+")";
			ctx.lineCap="round";
			ctx.beginPath();
			ctx.moveTo((lsmX)* redrawMultiplier, (lsmY)* redrawMultiplier)
			ctx.quadraticCurveTo(roundNumber((controlX* redrawMultiplier),0),roundNumber((controlY* redrawMultiplier),0),roundNumber((smX*redrawMultiplier),0),roundNumber((smY*redrawMultiplier),0));
			ctx.stroke();
			//ctx.closePath();
			
			debug("ctx.beginPath();");
			debug("ctx.moveTo("+((lsmX)* redrawMultiplier)+","+((lsmY)* redrawMultiplier)+");")
			debug("ctx.quadraticCurveTo("+(controlX* redrawMultiplier)+","+(controlY* redrawMultiplier)+","+((smX )*redrawMultiplier)+","+ ((obj.smY)* redrawMultiplier)+");")
			debug("ctx.lineWidth="+lineW+";");
			debug('ctx.strokeStyle="black";')
			debug('ctx.lineCap="round";');
			debug('ctx.stroke();');
			debug('ctx.closePath();');
			
			}else{
				
			ctx.lineCap="round";
			ctx.lineWidth=lineW;
			ctx.strokeStyle="blue";
			ctx.beginPath();
			ctx.moveTo((lsmX)* redrawMultiplier, (lsmY)* redrawMultiplier)
			ctx.lineTo(parseFloat(obj.smX)*redrawMultiplier,parseFloat(obj.smY)*redrawMultiplier)
			ctx.stroke();
			ctx.closePath()
			
			*/
			
			
			
			//canto(canvasid).beginPath().moveTo(parseFloat(obj.lsmX)*redrawMultiplier,parseFloat(obj.lsmY)*redrawMultiplier).lineTo(parseFloat(obj.smX)*redrawMultiplier,parseFloat(obj.smY)*redrawMultiplier).stroke({lineWidth: (parseFloat(obj.bs)*redrawMultiplier * parseFloat(obj.p)), lineCap:"round", strokeStyle: "rgba("+ obj.bc.r+", "+ obj.bc.g+", "+ obj.bc.b+", "+ brushAlpha+")"}).closePath();
			//}
		
	//just in case I can't figure out the overlapping...
	//.stroke({lineWidth:0, lineCap:"none", strokeStyle: "rgba("+ obj.bc.r+", "+ obj.bc.g+", "+ obj.bc.b+", "+ brushAlpha+")"})
	
		}
	}	
}else{
var lineW=(parseFloat(obj.bs)*redrawMultiplier * parseFloat(obj.p))
canto(canvasid).beginPath().moveTo(parseFloat(obj.lsmX)*redrawMultiplier,parseFloat(obj.lsmY)*redrawMultiplier).lineTo(parseFloat(obj.smX)*redrawMultiplier,parseFloat(obj.smY)*redrawMultiplier).stroke({lineWidth: (parseFloat(obj.bs)*redrawMultiplier * parseFloat(obj.p)), lineCap:"round", strokeStyle: "rgba("+ obj.bc.r+", "+ obj.bc.g+", "+ obj.bc.b+", "+ brushAlpha+")"}).closePath();
}
}
}



function updateNavigtor(){
	navctx.fillStyle="white";
	navctx.fillRect(0,0,canvas.width,canvas.height);
	navctx.drawImage(canvas,0,0,canvas.width*navSizePercent,canvas.height*navSizePercent)
	
}


function redraw2(){
	debug("redrawing")
	$("#redrawprogressbar").progressbar({value: 100}).show().css({left:(screenW/2-100)});
	$.ajax({
		url: 'json/testopponent2.json',
		dataType: 'json',
		success: function(data){
			debug("json loaded");
			var opponentActions=data["gameData"];
			/*
			for(var i=0;i<opponentActions.length;i++){
				commandStack.push(opponentActions[i])
			}
			*/
			opponentActions.forEach(drawSmoothLine);
			updateNavigtor();
			$("#redrawprogressbar").progressbar({value: 100}).hide();
		} 
	});
	
	
	/*
	var tempstack=replayStack.slice(0);
	var tslength=tempstack.length;
	var tempCanvas = document.createElement('canvas');
	tempCanvas.setAttribute("id", "tempcanvas");
	tempCanvas.height=canvas.height;
	tempCanvas.width=canvas.width;
	
	//debug("tslength="+tslength)
	tempstack.forEach(function(obj, ind, arr){	
		drawSmoothLine(obj);
		//var tspercent=ind/tslength
		//debug("tspercent="+tspercent)
		//$("#redrawprogressbar").progressbar({value: tspercent})
	})
	var tempctx=tempCanvas.getContext("2d");
	ctx.drawImage(tempCanvas,0,0)
	*/
	
	//$("#redrawprogressbar").progressbar({value: 100}).show();
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
	debug("clearing canvas")
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
