function debug(message){
	if(window.console){
		console.log(message);
	}
}
(function ($) {
	var WheelOfDeath = function (opt) {
	var titleText,
		height,
		width,
		bgColor,
		bgURL,
		randomNum,
		visible,
		spinning,
		wheelItems,
		wheel,
		spinner,
		wheelHTML ='<div class="wod_holder"><div class="wod_title"></div><div class="wod_bg"></div><canvas id="wod_spinner" width="350" height="200"></canvas></div>',
		defaults = {
			onSelect: function () {},
			titleText: "Wheel Of Death",
			height:200,
			width:350,
			bgColor:"ff0000",
			onSpinComplete: function () {},
			wheelItems:["item 1", "item 2", "item 3"]
		},
		generateRandomNum = function(){
			randomNum = parseInt((wheelItems.length-1)*Math.random())
		},
		mySetOptions = function (opt) {
			if (opt) {
				(typeof opt.titleText == "string")?titleText=opt.title : titleText=defaults.titleText;
				opt.height?height=opt.height : height=defaults.height;
				opt.width?width=opt.width : width=defaults.width;
				opt.bgColor?bgColor=opt.bgColor : bgColor=defaults.bgColor;
				opt.bgURL?bgURL=opt.bgURL : bgURL=defaults.bgURL;
				opt.wheelItems?wheelItems=opt.wheelItems : wheelItems = defaults.wheelItems;
			}
		},
		select = function(selection){
			$(wheel).data("wheel").onSelect(selection);
		},
		animateWheel = function(index){
			var tempNum=index;
			var spinCount=0
			var spinInterval
			var alterInterval;
			alterInterval=1
			spinInterval=setInterval(function(){
				if(alterInterval%2){
					drawWheelMidway(tempNum)
				}else{
					(tempNum==wheelItems.length-1)?tempNum=0:tempNum++;
					spinCount++;
					drawWheel(tempNum)
					if(spinCount>=50){
						clearInterval(spinInterval);
						select(wheelItems[tempNum])
						
					}
				}
				alterInterval++;
			},30)
			
		}
		drawWheel = function (index){
			var ctx=spinner.getContext("2d");
			ctx.clearRect(0,0,1000,1000)
			var randplus1;
			var randminus1
			((index+1)<wheelItems.length-1)? randplus1= index+1:randplus1=0;
			((index-1)>=0)? randminus1= index-1 : randminus1=wheelItems.length-1;
			//alert("wheelItems[index]="+wheelItems[index]+" wheelItems[randplus1]"+wheelItems[randplus1]+" wheelItems[randminus1]"+wheelItems[randminus1])
			var spacing=170
			drawText(wheelItems[index],0,1)
			drawText(wheelItems[randplus1],spacing,.5)
			drawText(wheelItems[randminus1],40,.5)
		},
		drawWheelMidway = function (index){
			var ctx=spinner.getContext("2d");
			ctx.clearRect(0,0,1000,1000)
			var randplus1;
			var randminus1
			((index+1)<wheelItems.length-1)? randplus1= index+1:randplus1=0;
			((index-1)>=0)? randminus1= index-1 : randminus1=wheelItems.length-1;
			//alert("wheelItems[index]="+wheelItems[index]+" wheelItems[randplus1]"+wheelItems[randplus1]+" wheelItems[randminus1]"+wheelItems[randminus1])
			var spacing=100
			drawText(wheelItems[index],10,.75)
			drawText(wheelItems[randplus1],60,.75)
		},
		drawText = function(text,offsetY,squash){
			var ctx=spinner.getContext("2d");
			ctx.setTransform (1, 0, 0, squash, 0, 0);
			ctx.textBaseline="middle"
			ctx.font = "16pt Arial";
			ctx.fillStyle="black";
			var stringMeasurements=ctx.measureText(String(text));
			var stringW;
			(stringMeasurements.width<210)? stringW =stringMeasurements.width:stringW=210;
			ctx.fillText(text, (spinner.width/2)-(stringW/2), (spinner.height/2)+5+offsetY,210); 
		};
		
		
	return {
			init: function (opt) {
				opt = $.extend({}, defaults, opt||{});
				wheel=this;
				var options = $.extend({}, opt);
				options.fields = $(wheel).bind('select', select)
				mySetOptions(opt);
				$(wheel).append(wheelHTML)
				generateRandomNum();
				spinner = document.getElementById('wod_spinner');
				drawWheel(randomNum)
				$(wheel).data('wheel', options);
				return this;
			},
			spin: function() {
				animateWheel(randomNum)
				generateRandomNum();
				
			},
			setOptions: function(opt) {
				mySetOptions(opt);
			}
		};
	}();
	$.fn.extend({
		WheelOfDeath: WheelOfDeath.init,
		spin: WheelOfDeath.spin,
		setOptions: WheelOfDeath.setOptions
	});
})(jQuery)