/* eslint-disable */
var ctx;
var canvas;
var timer;

var csslolcode = "div.shopweapon{background:#000;color:white;border:1px solid #888;display:inline-block;width:110px;margin-left:5px;padding:2px;verticle-align:top}" +
	"div.shopweapon:hover{border:1px solid #fff}" +
	"div.newweapon{background:#000;color:white;border:1px solid #888;display:inline-block;width:110px;cursor:pointer;margin-left:5px;padding:2px;verticle-align:top}" +
	"div.newweapon:hover{background:#555;border:1px solid #fff}" +
	"div.newweaponred{background:#200;color:white;border:1px solid #b88;display:inline-block;width:110px;cursor:default;margin-left:5px;padding:2px;verticle-align:top}" +
	"div.repairbutton{background:#222;color:white;border:1px solid #888;display:block;cursor:pointer;padding-left:2px;margin-top:2px}" +
	"div.repairbutton:hover{background:#777;border:1px solid #fff}" +
	"div.repairbuttonred{background:#522;color:white;border:1px solid #b88;display:block;cursor:default;padding-left:2px;margin-top:2px}" +
	"div.health{padding:1px;margin:3px;display:inline-block;border:1px solid #444}" +
	"div.health div {display:none;cursor:pointer;margin-left:10px;color:#888;background:#222;border:1px solid #888;padding-left:2px;padding-right:2px}" +
	"div.health:hover div {display:inline}" +
	"div.health div:hover {background:#777;border:1px solid #fff;color:#fff}";

var width=1200;
var height=400;
var shoptimer=0;
var needupdate=false;
var fmouse=[width/2,height/2];
var mouse=[width/2,height/2];
var offset=[0,0];
addEventListener('load',boot,false);
addEventListener('keydown',keydown,true);
addEventListener('keyup',keyup,true);
var worldrect=new Rectangle(0,0,width,height);
var pos=0;
var enemyindex=1;
var player;
var enemies=[];
var incoming=[];
var miscJunk=[];
var incomingEnemies=[];
var friendBullets=[];
var enemyBullets=[];
var killMisc=[];
var killBullets=[];
var killEnemies=[];
var undraws=[];
var events=[];
var freezeenemies=false;
var modifier=0;
var speed=1;
var mov=[0,0,0,0];
var keyframe=360;
var kills=0;
var startMoney=150;
var money=startMoney;
var owid=0;
var owid2=0;
var owid3=0;
var shooting=false;
var scripted=false;
var boss=false;
var enemyscale=1;
var lockFPS=20;//20
var lives=3;
var beginLevel;
var timeSpent = 0;
var collisionMapX=[];
var collisionMapY=[];
var collisionMap=[];
var colXRes=50;
var colWid=Math.ceil(width/colXRes);
var colYRes=25;
var pressFunction='upgrade';
var classWeapons=[];
var gameover=false;
var formations=[];
Array.remove = function (array, from, to) {
	var rest = array.slice((to || from) + 1 || array.length);
	array.length = from < 0 ? array.length + from : from;
	return array.push.apply(array, rest);
};
Array.removeItem = function (array, item) {
	for (var i = 0, l = array.length;i < l;i++) {
		if (array[i] == item) {array.splice(i,1);break;}
	}
};
Array.findItem = function (array, item) {
	for (var i = 0, l = array.length;i < l;i++) {
		if (array[i] == item) {return i;}
	}
	return array.length;
};
Array.findByName = function (array, name) {
	for (var i = 0, l = array.length;i < l;i++) {
		if ((array[i] != null) && (array[i].name == name)) {return i;}
	}
	return -1;
};
var shop;
var meshes=new Array([[0,5],[-5,-5],[5,-5],[0,5]], //triangle
[[-60,2],[60,2],[60,-2],[-60,-2],[-60,2]], //wall
[[0,-13],[-12,-10],[-12,3],[-8,-5],[0,10],[8,-5],[12,3],[12,-10],[0,-13]], //eagle
[[0,10],[-3,-5],[-6,-5],[0,20],[6,-5],[3,-5],[0,10]], //zipper
[[-5,10],[5,10],[10,0],[5,-10],[-5,-10],[-10,0],[-5,10]]); //curve
var cutouts;
var currentUI=shipSelect;//shipSelect
var clickUI = nothing;
function runUI() {
	currentUI();
}
function boot() {
	var styleelement=document.createElement("style");
	styleelement["type"]="text/css";
	styleelement.innerHTML=csslolcode;
	document.getElementsByTagName("head")[0].appendChild(styleelement);

	var mouseevents="onmousemove='movedmouse(event)' onmousedown='mdown(event)' onmouseup='mup(event)'";
	var shopHeight=200;
	$("shooterdiv").innerHTML="<canvas id=\"shootercanvas\" width=\""+width+"\" height=\""+height+"\" style=\"cursor:crosshair;width:"+width+"px;height:"+height+"px\" onmousemove='movedmouse(event)' onmousedown='mdown(event)' onmouseup='mup(event)' onmouseover='mover(event)' onmouseout='mout(event)' style='display:'>Your browser doesn't support HTML5. Please use Google Chrome, Opera, Safari, Firefox, etc; IE won't work</canvas><div id='shopdiv' width=\""+width+"\" height=\""+shopHeight+"\" style=\"width:"+width+"px;height:"+shopHeight+"px;border-top:1px solid #fff;color:#fff\"></div><audio id='audio'></audio>";
	shop=$("shopdiv");
	canvas=$("shootercanvas");
	offset=findPos($("shootercanvas"));
	ctx=canvas.getContext("2d");
	ctx.fillStyle="black";
	paused=true;
	clearInterval(timer);
	runUI();

	cutouts=[];
	for (var i = 0, l = cutouts.length;i < l;i++)
		cutouts[i].mesh.scale(enemyscale);

	//default speed:3  value:5  health:5  resistance:2

	cutouts[0]=new Enemy(0,meshes[0]); //triangle

	cutouts[1]=new Enemy(0,meshes[1]); //wall sentient
	cutouts[1].health=50;
	cutouts[1].behavior=wallBehavior;
	cutouts[1].color=["blue",""];
	cutouts[1].props=new Array("#d00","#f77",true);
	cutouts[1].value=30;
	cutouts[1].resistance=50;
	cutouts[1].motion=newVectorDL(180,1);

	cutouts[2]=new Enemy(0,meshes[2]); //eagle
	cutouts[2].value=10;
	cutouts[2].resistance=10;
	cutouts[2].motion=newVectorDL(180,5);
	cutouts[2].health=25;
	cutouts[2].behavior=eagleBehavior;

	cutouts[3]=new Enemy(0,meshes[3]); //zipper
	cutouts[3].resistance=15;
	cutouts[3].behavior=zipperBehavior;

	cutouts[4]=new Enemy(0,meshes[4]); //curve
	cutouts[4].behavior=curveBehavior;
	cutouts[4].spawn=curveSpawn;
	cutouts[4].motion=newVectorDL(180,2);
	cutouts[4].value=2;
	cutouts[4].health=4;

	cutouts[5]=new Enemy(0,meshes[1]); //wall swarm
	cutouts[5].health=50;
	cutouts[5].color=["blue",""];
	cutouts[5].props=new Array("#d00","#f77",true);
	cutouts[5].value=30;
	cutouts[5].resistance=50;

	cutouts[6]=new Enemy(height/2,[[-50,-300],[-50,-50],[0,0],[50,-50],[50,-300],[-50,-300]]);
	cutouts[6].resistance=15;
	cutouts[6].health=1000;
	cutouts[6].value=1000;
	cutouts[6].motion=newVectorDL(180,0);
	cutouts[6].behavior=rockbossterBehavior;

	formations[0]=new Formation("90,3;0 0 45;0 40 25;0 40 65;0 80 5;0 80 85");
	formations[1]=new Formation("120,2;5 0 60;0 12 5;0 12 25;0 12 45;0 24 25;0 12 75;0 12 95;0 12 115;0 24 95");

	incomingEnemies=parseLevel("end=10000;0 m 0;0 f 0 150 2;25 f 0 150 2;50 f 0 150 2;150 m 0.2;750 m 0.5;2000 m 0;2250 e 6 200;2500 m 0.5;3000 m 1;5000 m 2;6000 m 3;7000 m 4;7000 e 6 200");
	/*incomingEnemies=new Array(
		0,new changeMod(0.2),
		0,formations[0],
		100,formations[1],
		500,new changeMod(0.5),
		1000,new changeMod(0.7),
		2000,new changeMod(0),
		2250,rockbosster.clone(height/2),
		2500,new changeMod(0.5),
		2300,esp(0,160),
		3000,new changeMod(1),
		5000,new changeMod(2),
		6000,new changeMod(3),
		7000,new changeMod(4),
		7000,rockbosster.clone(height/2)
	);*/
	beginLevel = (new Date()).getTime();
	document.body.style.userSelect="none";
	document.body.style.MozUserSelect="none";
	document.body.style.KhtmlUserSelect="none";
	document.body.onselectstart="return false;";
}
function parseLevel(script) {
	var lines=script.split(";");
	var event=[];
	var datas=[];
	for (var i = 0, l = lines.length;i < l;i++) {
		if (i == 0) {
			//store data in this or something
			sp=lines[i].split(",");
		}
		else {
			event.push(parseEvent(lines[i]));
		}
	}
	var sorted=event.sort(sortShips);
	var ef=[];
	ef.push(datas);
	for (var i = 0,l = sorted.length;i < l;i++) {
		ef.push(sorted[i][0]);
		ef.push(sorted[i][1]);
	}
	return ef;
}
function parseEvent(script) {
	var $=script.split(" ");
	switch ($[1]) {
		case 'm':{
			return [parseFloat($[0]),new changeMod(parseFloat($[2]))];
		}
		case 'e':{
			return [parseFloat($[0]),esp(parseInt($[2]),parseInt($[3]))];
		}
		case 'f':{
			return [parseFloat($[0]),fsp(parseInt($[2]),parseInt($[3]),parseInt($[4]))];
		}
	}
}
function esp(nomm,y) {
	return cutouts[nomm].clone(y);
}
function fsp(nomm,y,speed) {
	return formations[nomm].makeSpawner(y,speed);
}
function testFormation(script) {
	var tform=new Formation(script);
	tform.makeSpawner(height/2-50).start();
	return tform;
}
var last=0;
var fps=0;
var cfps = 0;
var fraps=[];
var popfrap=false;
var _paused;
__defineSetter__("paused", function (val) {
	if (_paused != val) {
		_paused = val;
		if (paused) {
			if (beginLevel) {
				timeSpent += (new Date()).getTime() - beginLevel;
				beginLevel = (new Date()).getTime();
				//console.log(paused + " " + timeSpent + " " + beginLevel);
			}
		} else {
			if (beginLevel) {
				beginLevel = (new Date()).getTime();
				//console.log(paused + " " + timeSpent + " " + beginLevel);
			}
		}
	}
});
__defineGetter__("paused", function () {
	return _paused;
});
paused = true;
var shipSelectStuff=false;
var shipMeshes=new Object();
var shipGuns=new Object();
function shipSelect() {
	if (shipSelectStuff==false) {
		shipSelectStuff=new Object();
		shipMeshes=new Object();
		shipGuns=new Object();
		shipFire=new Object();
		shipSelectStuff.mdown=false;
		shipSelectStuff.mesh=[[60,90],[100,85],[140,90],[140,163],[140,236],[100,231],[60,236],[60,163],[60,90]];
		shipSelectStuff.vectors=[];
		for (var i = 0,l = shipSelectStuff.mesh.length;i < l;i++) shipSelectStuff.vectors.push(newVectorDL(0,0));
		shipSelectStuff.color="rgb(255,0,0)";
		shipSelectStuff.fcolor="rgba(255,0,0,0.4)";
		shipSelectStuff.displayHeight=0;
		shipSelectStuff.incr=1;
		shipSelectStuff.turned=270;
		shipMeshes["rounded"]=[[-10,0],[0,20],[10,0],[0,-8],[-10,0]];
		shipMeshes["sprayer"]=[[-14,20],[-10,20],[-10,2],[0,4],[10,2],[10,20],[14,20],[14,-2],[-14,-2],[-14,20]];
		shipMeshes["tank"]=[[-20,28],[-5,35],[0,30],[5,35],[20,28],[20,-15],[15,-20],[-15,-20],[-20,-15],[-20,28]];
		shipMeshes["focus"]=[[0,40],[4,10],[2,0],[4,-10],[0,-5],[-4,-10],[-2,0],[-4,10],[0,40]];
		shipMeshes["ghost"]=[[-20,20],[20,20],[20,-20],[-20,-20],[-20,20]];
		shipMeshes["mastermind"]=[[-20,20],[20,20],[20,-20],[-20,-20],[-20,20]];
		shipMeshes["knight"]=[[-20,20],[20,20],[20,-20],[-20,-20],[-20,20]];
		//@gundat
		shipGuns["rounded"]=["rapid","rapid2","fan","laser","pulse"];
		shipGuns["sprayer"]=["shell","shell2","spray","orbit"];
		shipGuns["tank"]=["laser","shell"];
		shipGuns["focus"]=["laser","rapid"];
		shipGuns["ghost"]=["shell","rapid"];
		shipGuns["mastermind"]=["laser"];
		shipGuns["knight"]=["shell"];
	}
	for (var i = 0, l = undraws.length;i < l;i++) {
		undraws[i].undraw();
	}undraws=[];
	var m=[];
	var bmesh=[[-40,-10],[0,-15],[40,-10],[40,10],[0,5],[-40,10],[-40,-10]];
	m.push([new Mesh(bmesh,newVectorDL(90,1),100,100),"rounded"]);
	m.push([new Mesh(bmesh,newVectorDL(90,1),100,121),"sprayer"]);
	m.push([new Mesh(bmesh,newVectorDL(90,1),100,142),"tank"]);
	m.push([new Mesh(bmesh,newVectorDL(90,1),100,163),"focus"]);
	m.push([new Mesh(bmesh,newVectorDL(90,1),100,184),"ghost"]);
	m.push([new Mesh(bmesh,newVectorDL(90,1),100,205),"mastermind"]);
	m.push([new Mesh(bmesh,newVectorDL(90,1),100,226),"knight"]);
	var b=new Object();
	var selected="";
	for (var i = 0, l = m.length;i < l;i++) {b[m[i][1]]=buttonThing(m[i][0],m[i][1]);if (b[m[i][1]]) selected=m[i][1];}
	var drawingship=false;
	if (selected != "") {
		if (shipSelectStuff.displayHeight > 40) shipSelectStuff.incr=-1;
		if (shipSelectStuff.displayHeight < 0) shipSelectStuff.incr=1;
		shipSelectStuff.turned+=2;
		shipSelectStuff.turned%=360;
		var selship=new Mesh(shipMeshes[selected],newVectorDL(shipSelectStuff.turned,1),250,200-shipSelectStuff.displayHeight);
		shipSelectStuff.displayHeight+=shipSelectStuff.incr;
		selship.glow(20,1.05,[0,0,255]);
		drawingship=true;
		undraws.push(selship.rectangle);
	}else {
		shipSelectStuff.displayHeight=0;
		shipSelectStuff.turned=270;
	}

	for (var i = 0, l = shipSelectStuff.mesh.length;i < l;i++) {
		if (Math.random() < 0.01) shipSelectStuff.vectors[i]=newVectorDL(Math.random()*360,Math.random());
		shipSelectStuff.mesh[i][0]+=shipSelectStuff.vectors[i].dx;
		shipSelectStuff.mesh[i][1]+=shipSelectStuff.vectors[i].dy;
		if (shipSelectStuff.mesh[i][0] < 0) {shipSelectStuff.mesh[i][0]=0;shipSelectStuff.vectors[i].dx=-shipSelectStuff.vectors[i].dx;}
		if (shipSelectStuff.mesh[i][0] > width) {shipSelectStuff.mesh[i][0]=width;shipSelectStuff.vectors[i].dx=-shipSelectStuff.vectors[i].dx;}
		if (shipSelectStuff.mesh[i][1] < 0) {shipSelectStuff.mesh[i][1]=0;shipSelectStuff.vectors[i].dy=-shipSelectStuff.vectors[i].dy;}
		if (shipSelectStuff.mesh[i][1] > height) {shipSelectStuff.mesh[i][1]=height;shipSelectStuff.vectors[i].dy=-shipSelectStuff.vectors[i].dy;}
	}
	shipSelectStuff.mesh[shipSelectStuff.mesh.length-1]=shipSelectStuff.mesh[0];
	var effect=new Mesh(shipSelectStuff.mesh,newVectorDL(90,1),0,0);
	undraws.push(effect.rectangle);
	shipSelectStuff.fcolor="rgba(255,255,255,0.1)"
	/*if (effect.contains(mouse[0],mouse[1])) shipSelectStuff.fcolor="rgba(255,255,255,0.1)";
	else shipSelectStuff.fcolor="rgba(255,255,255,0.5)";
	if (drawingship != false) {
		if (selship.collides(effect)) shipSelectStuff.fcolor="rgba(255,255,255,0.1)";
	}*/
	effect.glow(30,1.005,[255,255,255],0.1);
	effect.draw(shipSelectStuff.fcolor,shipSelectStuff.fcolor);
	thing=new Mesh([[0,0],[20,0],[20,10],[0,10],[0,0]],newVectorDL(90,1),10,10);
	var tcolor="rgba(255,255,255,0.1)";
	if (thing.contains(mouse[0],mouse[1])) tcolor="rgba(255,255,255,0.5)";
	thing.draw(tcolor,tcolor);
	undraws.push(thing.rectangle);
	clicked=((shooting) && (!shipSelectStuff.mdown));
	if (clicked) {
		if (b[selected]) {
			classWeapons=shipGuns[selected];
			player=new Player(selected,shipMeshes[selected]);
			player.begin();
			beginGame();
		}
		if (thing.contains(mouse[0],mouse[1])) {
			beginLiveMesh();
		}
	}
	shipSelectStuff.mdown=shooting;
}
var liveMeshStuff=false;
function liveMesh(clicked) {
	if (liveMeshStuff == false) {
		liveMeshStuff = {};
		$("shopdiv").innerHTML="<input type='text' id='shopinput' onkeyup='liveMesh()' style='width:600px' value='[[0,0],[0,10]]' \> mesh<br />"+
		"<input type='text' id='angleinput' onkeyup='liveMesh()' value='0' \> angle<br />"+
		"<input type='text' id='shipmesh' onkeyup='liveMesh()' value='' \> ship"
	}
	try {
		var angle = parseInt($("angleinput").value) | 0;
		var tarray=eval($("shopinput").value);
		console.log(tarray);
		console.log($("shopinput").value);
		if (clicked) {
			var linevec = newVectorDist(+mouse[0] - 150,+mouse[1] - 150)
			linevec.setDirection(linevec.direction + 90 - angle);
			tarray.push([linevec.dx,linevec.dy]);
			$("shopinput").value = '';
			var sarray = [];
			for (var i = 0, l = tarray.length;i < l;i++) {
				sarray.push('[' + Math.floor(tarray[i][0]) + ',' + Math.floor(tarray[i][1]) + ']');
			}
			console.log(sarray);
			$('shopinput').value = '[' + sarray.join(',') + ']';
		}

		tmesh=new Mesh(tarray,newVectorDL(angle,1),150,150);
		for (var i = 0, l = undraws.length;i < l;i++) {
			undraws[i].undraw();
		}undraws=[];
		if ($("shipmesh").value != '' && typeof shipMeshes[$("shipmesh").value] != "undefined") {
			var selship=new Mesh(shipMeshes[$("shipmesh").value],newVectorDL(parseInt($("angleinput").value),1),150,150);
			selship.draw("blue","");
			undraws.push(selship.rectangle);
		}
		tmesh.draw("white","");
		undraws.push(tmesh.rectangle);
		dbg("");
	}catch (err) {
		dbg("err");
	}
}
function buttonThing(mesh,text) {
	var col="gray";
	var inbox=false;
	if (mesh.contains(mouse[0],mouse[1])) {
		col="white";
		inbox=true;
	}
	mesh.draw(col,"");
	undraws.push(mesh.rectangle);
	var wid=ctx.measureText(text).width;
	ctx.fillStyle="white";
	ctx.fillText(text,mesh.rectangle.x+mesh.rectangle.w/2-wid/2,mesh.rectangle.y+15);
	return inbox;
}
function beginGame() {
	enemies=[];
	friendBullets=[];
	events=[];
	money=startMoney;
	kills=0;
	pos=0;
	enemyindex=1;
	ctx.clearRect(0,0,width,height);
	shipSelectStuff=false;
	currentUI=frame;
	runUI();
	updateShop();

	for (var i = 0;i < histMax;i++) {
		histogram[i] = 0;
	}
}
function beginLiveMesh() {
	ctx.clearRect(0,0,width,height);
	shipSelectStuff=false;
	currentUI=nothing;
	clickUI = function() {
		liveMesh(true);
	}
	liveMesh();
}
function nothing() {}
function playerKilled() {
	player=new Player(player.name,shipMeshes[player.name]);
	player.begin();
	money-=2500;
	if (money < 0) {
		gameover=true;
	}
	else {
		for (var i = 0, l = enemies.length;i < l;i++) {
			enemies[i].shot(25,true);
		}
		needupdate=true;
	}
}
function gameOver() {
	enemies=[];
	friendBullets=[];
	events=[];
	money=startMoney;
	kills=0;
	pos=0;
	enemyindex=1;
	currentUI=shipSelect;
	$("shopdiv").innerHTML="";
	shipSelectStuff=false;
	gameover=false;
}
var frames = [];
var histogram = [];
var histGridSize = 5;
var histDecay = 0.98;
var histHit = 25;
var histMax = height / histGridSize;

function calcY() {
	var max = 0;
	var total = 0;
	for (var i = 0;i < histMax;i++) {
		if (histogram[i] > max) max = histogram[i];
		total += histogram[i];
	}
	for (var i = 0;i < histMax;i++) {
		if (Math.random() < histogram[i] / total) {
			return ((i * histGridSize) + Math.random() * histGridSize) / height;
		}
	}
	return Math.random();
}
function frame() {
	//var time=(new Date()).getTime();
	var time = Date.now();

	var cur = time - last;
	last = time;
	fps=1000/cur;
	fraps.unshift(fps);
	if (popfrap) fraps.pop();
	else if (fraps.length > 30) {popfrap=true;fraps.pop();}
	var afps=0;
	for (var i = 0, l = fraps.length;i < l;i++) afps+=fraps[i];
	afps/=fraps.length;
	afps=Math.ceil(afps);

	var progressTime = Math.floor((time - beginLevel + timeSpent) / 1000);
	shoptimer++;
	var shoptimed=50;
	if (shoptimer > shoptimed) {
		shoptimer=0;
		if (needupdate) {
			needupdate=false;
			updateShop();
		}
	}
	//var cur=(time.getMilliseconds()+time.getSeconds()*1000+time.getMinutes()*60000)-last;
	//last=time.getMilliseconds()+time.getSeconds()*1000+time.getMinutes()*60000;


	var killEvents=[];
	//if event's wait is -1, kill it (on event run, set to 0 if done); if it's 0, run it (anything else is skipped over)
	for (var i = 0, l = events.length;i < l;i++) {
		events[i].wait--;
		if (events[i].wait == 0) events[i].run();
		if (events[i].wait == -1) killEvents.push(events[i]);
	}
	for (var i = 0, l = killEvents.length;i < l;i++) {
		Array.removeItem(events,killEvents[i]);
	}


	player.mesh.undraw();
	for (var i = 0, l = player.weapons.length;i < l;i++) if (player.weapons[i] != null) player.weapons[i].mesh.undraw();
	for (var i = 0, l = friendBullets.length;i < l;i++) {
		friendBullets[i].mesh.undraw();
	}
	for (var i = 0, l = enemies.length;i < l;i++) {
		enemies[i].mesh.undraw();
	}
	for (var i = 0, l = miscJunk.length;i < l;i++) {
		miscJunk[i].mesh.undraw();
	}
	for (var i = 0, l = undraws.length;i < l;i++) {
		undraws[i].undraw();
	}undraws=[];

	for (var i = 0, l = killBullets.length;i < l;i++) {
		Array.removeItem(friendBullets,killBullets[i]);
	}killBullets=[];
	for (var i = 0, l = killEnemies.length;i < l;i++) {
		Array.removeItem(enemies,killEnemies[i]);
	}killEnemies=[];
	for (var i = 0, l = killMisc.length;i < l;i++) {
		Array.removeItem(miscJunk,killMisc[i]);
	}killMisc=[];
	ctx.fillStyle="white";
	fmouse=mouse;
	if (!_paused) {
		player.act();
		for (var i = 0, l = friendBullets.length;i < l;i++) {
			friendBullets[i].act();
		}
		collisionMap=[];
		for (var i = 0, l = enemies.length;i < l;i++) {
			enemies[i].act();
		}
		for (var i = 0, l = miscJunk.length;i < l;i++) {
			miscJunk[i].act();
		}
		var mpos=pos+speed;
		while (pos < mpos) {
			var tpos=pos;
			var posdif=Math.min(mpos-pos,1)
			pos+=posdif;
			if (Math.floor(tpos) < Math.floor(pos)) {
				if (enemyindex < incomingEnemies.length) while (pos >= incomingEnemies[enemyindex]) {events.push(incomingEnemies[++enemyindex]);enemyindex++;}
				if (!scripted) {
					//console.log(calcY());
					while (Math.random() < 0.1*modifier) events.push(esp(0,calcY()*(height-20)+10)); //triangle
					while (Math.random() < 0.05*modifier) events.push(esp(3,calcY()*(height-20)+10)); //homing
					while (Math.random() < 0.01*modifier) events.push(esp(2,calcY()*(height-20)+10)); //zipper
					while (Math.random() < 0.005*modifier) events.push(esp(1,calcY()*(height-200)+100)); //wall
					//while (Math.random() < 0.01*modifier) enemies.push(cutouts[4].clone(Math.random()*(height-20)+10))
					while (Math.random() < 0.005*modifier) events.push(new centiEvent(calcY()*(height-20)+10)); //centipede
				}
			}
		}
		if (gameover) gameOver();
	}else {
		drawText("Game Is Paused",width/2,height/2,"white");
		drawText("Mouse over game to continue",width/2,height/2+10,"white");
	}
	//player.mesh.glow(50,1.2,[0,255,255],0.5);
	player.draw();
	for (var i = 0, l = friendBullets.length;i < l;i++) {
		friendBullets[i].draw();
	}
	for (var i = 0, l = enemies.length;i < l;i++) {
		enemies[i].draw();
	}
	for (var i = 0, l = miscJunk.length;i < l;i++) {
		miscJunk[i].draw();
	}
	ctx.fillStyle="white";
	var minutes = Math.floor(progressTime / 60) + ":";
	var seconds = (progressTime % 60);
	if (seconds < 10) seconds = "0"+seconds;
	drawText("Time: " + minutes + seconds,width-20,10);
	drawText("Progress: "+Math.ceil(pos),width-20,20);
	drawText("Score: "+kills,width-20,30);
	drawText("$ "+money,width-20,40);
	drawText("e"+enemies.length+" b"+friendBullets.length+" p"+miscJunk.length+" v"+events.length+" "+afps+"fps",width-20,50);

	var linetoside = newVectorCoords(player.xc, player.yc, mouse[0], mouse[1]);
	var scale = (width - player.xc) / (mouse[0] - player.xc);
	linetoside.scale(scale);
	var hitat = [player.xc + linetoside.dx, player.yc + linetoside.dy];

	var histGrid = Math.floor(hitat[1] / histGridSize);

	for (var i = 0;i < histMax;i++) {
		if (histogram[i] > 0) histogram[i] *= histDecay;
	}
	if (histGrid >= 0 && histGrid < histMax) {
		histogram[histGrid] += histHit;

	}
	cfps = Date.now() - time;
	drawText((1000 / cfps).toFixed(2) +"fps",width-20,60);

	//visual histogram testing
	/*for (var i = 0;i < histMax;i++) {
		if (histogram[i] > 0) {
			var y = i * histGridSize + histGridSize / 2;
			ctx.beginPath();
			ctx.moveTo(hitat[0]-histogram[i], y);
			ctx.lineTo(hitat[0], y);
			ctx.strokeStyle="rgb(0,128,128)";
			ctx.stroke();

			undraws.push(new Rectangle(hitat[0]-histogram[i], y - 1, histogram[i], 3));
		}
	}*/


}
function updateShop() {
	var shop=$("shopdiv");
	shop.innerHTML="<div style='display:inline-block;padding:5px'>money: "+money+"</div><div class='health'>health: "+player.health+"<div onclick='repairShip()'>repair ship: requires $1000, and sets money to 0</div></div><div style='display:inline-block;padding:5px;padding-left:20px'>[Quick Key Function: "+pressFunction+"] (z, x, c to switch)</div><br />";
	var moar=copyArray(classWeapons);
	var newarray=[];
	var hasNull=false;
	for (var i=0,l = player.weapons.length;i<l;i++) {
		if (player.weapons[i] == null) {
			hasNull=true;
		}
		else {
			Array.removeItem(moar,player.weapons[i].name);
			newarray.push(player.weapons[i]);
			var repair='repairbutton';
			if (money < repairWeaponCost(player.weapons[i].name)) repair+='red';
			var upgrade='repairbutton';
			if (money < weaponcosts[player.weapons[i].name][player.weapons[i].level+1]) upgrade+='red';
			var reload='repairbutton';
			if (money < reloadWeaponCost(player.weapons[i].name)) reload+='red';

			shop.innerHTML+="<div class='shopweapon'>"+player.weapons[i].name+" (lvl "+(player.weapons[i].level+1)+") ["+(i+1)+"]<br />"+
			"<div class='"+repair+"' onclick=\"repairWeapon('"+player.weapons[i].name+"')\">health: "+(parseInt((player.weapons[i].health/weaponhealth[player.weapons[i].name][player.weapons[i].level])*10000)/100)+"%</div>"+
			"<div class='"+upgrade+"' onclick=\"upgradeWeapon('"+player.weapons[i].name+"')\">upgrade: "+weaponcosts[player.weapons[i].name][player.weapons[i].level+1]+"</div>"+
			"<div class='"+reload+"' onclick=\"reloadWeapon('"+player.weapons[i].name+"')\">ammo: "+player.weapons[i].ammo+"/"+player.weapons[i].maxAmmo+"</div></div>";
		}
	}
	for (var i = 0, l = moar.length;i < l;i++) {
		var buycost='newweapon';
		if (money <= weaponcosts[moar[i]][0]) buycost+='red';
		shop.innerHTML+="<div class='"+buycost+"' onclick=\"buyWeapon('"+moar[i]+"')\">"+moar[i]+"<br />(not owned)<br />purchase: "+weaponcosts[moar[i]][0]+"</div>";
	}
	if (hasNull) player.weapon=newarray;
}
function repairShip() {
	if (money >= 1000) {
		money=0;
		player.health=player.maxHealth;
		updateShop();
	}
	runUI();
}
function drawText(text,x,y,color) {
	if (color != null) ctx.fillStyle=color;
	var wid=ctx.measureText(text).width;
	ctx.fillText(text,x-wid,y);
	undraws.push(new Rectangle(x-wid,y-8,wid,12));
}
function mover(e) {
	paused=false;
	clearInterval(timer);
	timer=setInterval(runUI,lockFPS);
}
function mout(e) {
	paused=true;
	clearInterval(timer);
	runUI();
}
function loadLevel(lvl) {
	/*if (window.XMLHttpRequest) {
		xhttp=new XMLHttpRequest();
	}
	else {
		xhttp=new ActiveXObject("Microsoft.XMLHTTP");
	}
	xhttp.open("GET","url",false);
	xhttp.send("");
	xmlDoc=xhttp.responseXML;*/
	xmlDoc="";
	var x=xmlDoc.getElementsByTagName("e");
	for (var i = 0, l = x.length;i < l;i++) {
		if (x[i].childNodes != undefined) {
			var name=x[i].getElementsByTagName("name")[0].childNodes[0].nodeValue;
		}
	}
}
var keytest=false;
function keydown(e) {
	switch(e.keyCode) {
		case 87:
			mov[0]=-1;break; //w
		case 65:
			mov[1]=-1;break; //a
		case 83:
			mov[2]=1;break; //s
		case 68:
			mov[3]=1;break; //d
		case 192:
			money+=1000;needupdate=true;break;
		default:break;
	}
}
function keyup(e) {
	switch(e.keyCode) {
		case 87:
			mov[0]=0;break; //w
		case 65:
			mov[1]=0;break; //a
		case 83:
			mov[2]=0;break; //s
		case 68:
			mov[3]=0;break; //d
		case 48:
			repairShip();break;
		case 49:
			upgradeWeaponSlot(0);break;
		case 50:
			upgradeWeaponSlot(1);break;
		case 51:
			upgradeWeaponSlot(2);break;
		case 52:
			upgradeWeaponSlot(3);break;
		case 53:
			upgradeWeaponSlot(4);break;
		case 54:
			upgradeWeaponSlot(5);break;
		case 55:
			upgradeWeaponSlot(6);break;
		case 56:
			upgradeWeaponSlot(7);break;
		case 57:
			upgradeWeaponSlot(8);break;
		case 58:
			upgradeWeaponSlot(9);break;
		case 70: //f
			freezeenemies=!freezeenemies;break;
		case 84:
			keytest=!keytest;dbg("");break;
		case 90:
			pressFunction='upgrade';updateShop();needupdate=false;break;
		case 88:
			pressFunction='repair';updateShop();needupdate=false;break;
		case 67:
			pressFunction='reload';updateShop();needupdate=false;break;
		default:
			if (keytest) dbg(e.keyCode);
			break;
	}
}
var weaponcosts=new Object();
//@gundat
weaponcosts["rapid"]=[25,50,100,500,500,500,500,500,500,500,null];
weaponcosts["rapid2"]=[25,50,100,500,500,500,500,500,500,500,null];
weaponcosts["fan"]=[25,50,100,500,500,500,500,500,500,500,null];
weaponcosts["pulse"]=[25,50,100,500,500,500,500,500,500,500,null];
weaponcosts["spray"]=[25,50,100,500,500,500,500,500,500,500,null];
weaponcosts["laser"]=[25,50,100,500,500,500,500,500,500,500,null];
weaponcosts["orbit"]=[25,50,100,500,500,500,500,500,500,500,null];
weaponcosts["shell"]=[25,50,100,500,500,500,500,500,500,500,null];
weaponcosts["shell2"]=[25,50,100,500,500,500,500,500,500,500,null];
var weaponhealth=new Object();
weaponhealth["rapid"]=[5,10,20,25,35,50,75,100,120,150];
weaponhealth["rapid2"]=[5,10,20,25,35,50,75,100,120,150];
weaponhealth["fan"]=[5,10,20,25,35,50,75,100,120,150];
weaponhealth["pulse"]=[5,10,20,25,35,50,75,100,120,150];
weaponhealth["spray"]=[5,10,20,25,35,50,75,100,120,150];
weaponhealth["laser"]=[3,5,7,10,15,20,30,40,50,75];
weaponhealth["orbit"]=[3,5,7,10,15,20,30,40,50,75];
weaponhealth["shell"]=[25,25,50,50,100,100,150,150,200,250];
weaponhealth["shell2"]=[25,25,50,50,100,100,150,150,200,250];
var weaponreload=new Object();
weaponreload["rapid"]=0;
weaponreload["rapid2"]=0;
weaponreload["fan"]=0;
weaponreload["pulse"]=10;
weaponreload["spray"]=0;
weaponreload["laser"]=10;
weaponreload["orbit"]=0;
weaponreload["shell"]=5;
weaponreload["shell2"]=5;


function buyWeapon(name) {
	var select=player.weapons.length;
	if (money > weaponcosts[name][0]) {
		player.weapons[select]=eval("new "+name+"Blaster()");
		money-=weaponcosts[name][0];
	}
	player.weapons[select].fire();
	runUI();
	updateShop();
}
function repairWeapon(name) {
	var select=Array.findByName(player.weapons,name);
	if (player.weapons[select] != null) {
		var lvl=player.weapons[select].level;
		var price=repairWeaponCost(name);
		if (money > price) {
			player.weapons[select].health=weaponhealth[name][lvl];
			money-=price;
		}
	}
	runUI();
	updateShop();
}
function repairWeaponCost(name) {
	var select=Array.findByName(player.weapons,name);
	var lvl=player.weapons[select].level;
	return Math.ceil((weaponhealth[name][lvl]-player.weapons[select].health)*3);
}
function reloadWeapon(name) {
	var select=Array.findByName(player.weapons,name);
	if (player.weapons[select] != null) {
		var lvl=player.weapons[select].level;
		var price=reloadWeaponCost(name);
		if (money > price) {
			player.weapons[select].ammo=player.weapons[select].maxAmmo;
			money-=price;
		}
	}
	runUI();
	updateShop();
}
function reloadWeaponCost(name) {
	var select=Array.findByName(player.weapons,name);
	var lvl=player.weapons[select].level;
	return Math.ceil((player.weapons[select].maxAmmo-player.weapons[select].ammo)*weaponreload[name]);
}
function upgradeWeaponSlot(num) {
	if (player.weapons[num] != undefined) {
		if (pressFunction == 'upgrade') upgradeWeapon(player.weapons[num].name);
		if (pressFunction == 'repair') repairWeapon(player.weapons[num].name);
		if (pressFunction == 'reload') reloadWeapon(player.weapons[num].name);
	}
}
var weaponMeshes=new Object();
weaponMeshes["rapid"]=[[[-9,15],[-3,30],[-3,25],[-9,15]],
	null,
	[[-14,5],[-3,30],[-3,25],[-14,5]],
	null,
	[[-17,2],[-3,30],[-3,25],[-9,2],[-17,2]],
	null,
	[[-18,0],[-3,30],[-3,25],[-13,0],[-6,0],[-6,-8],[-18,0]]];
weaponMeshes["rapid2"]=[[[9,15],[3,30],[3,25],[9,15]],
	null,
	[[14,5],[3,30],[3,25],[14,5]],
	null,
	[[17,2],[3,30],[3,25],[9,2],[17,2]],
	null,
	[[18,0],[3,30],[3,25],[13,0],[6,0],[6,-8],[18,0]]];
weaponMeshes["fan"]=[[[0,0],[5,-10],[-5,-10],[0,0],[0,-10]]];
weaponMeshes["pulse"]=[[[-5,5],[0,30],[5,5],[0,1],[-5,5]]];
weaponMeshes["orbit"]=[[[0,-2.5 + 50],[5,2.5 + 50],[0,7.5 + 50],[-5,2.5 + 50],[0,-2.5 + 50]]];
function upgradeWeapon(name) {
	var select=Array.findByName(player.weapons,name);
	var lvl=player.weapons[select].level;
	var price=weaponcosts[name][lvl+1];
	if ((price != null) && (money >= price)) {
		money-=price;
		player.weapons[select].health+=weaponhealth[name][lvl+1]-weaponhealth[name][lvl];
		player.weapons[select].level++;
		var nmesh=false;
		var meshes;
		//@gundat
		if (name=="rapid") {
			meshes=weaponMeshes["rapid"];
			player.weapons[select].rate/=1.1;
			player.weapons[select].damage+=0.3;
			nmesh=true;
			if (lvl>=2) player.weapons[select].speed*=1.2;
		}
		if (name=="rapid2") {
			meshes=weaponMeshes["rapid2"];
			player.weapons[select].rate/=1.1;
			player.weapons[select].damage+=0.3;
			nmesh=true;
			if (lvl>=2) player.weapons[select].speed*=1.2;
		}
		if (name=="fan") {
			player.weapons[select].rate/=1.1;
			player.weapons[select].turn/=1;
			player.weapons[select].damage+=0.3;
		}
		if (name=="pulse") {
			player.weapons[select].clipMaxAmmo+=3;
			player.weapons[select].cooldown-=3;
			player.weapons[select].damage+=0.3;
		}
		if (name=="spray") {
			//if (lvl > 2) player.weapons[select].rate/=1.1;
			player.weapons[select].guns=[];
			for (var i=0,l = player.weapons[select].level*2+7;i<l;i++) player.weapons[select].guns.push(0);
		}
		if (name=="laser") {
			player.weapons[select].penetration+=22;
		}
		if (name=="orbit") {
			player.weapons[select].penetration+=22;
		}
		if (name=="shell") {
			//this.guns=new Array(0,-1,0,-10,0,0,0);
			//this.mesh=new Mesh([[8,22],[12,26],[13,24],[17,25],[16,15],[8,15],[8,22]],player.facing,player.xc,player.yc);

			var guns=[null,
			[0,-1,0,-10,0,-20,0,0,0],
			null,
			null,
			[0,5,0,-1,0,-10,0,-20,0,0,0],
			null,
			null,
			null,
			[0,5,0,-1,0,-10,0,-20,0,-90,0,0,130,0,0,0]];
			meshes=[null,
			[[8,18],[12,26],[13,24],[16,25],[16,21],[19,21],[16,13],[16,9],[8,11],[8,18]],
			null,
			null,
			[[8,18],[7,24],[9,22],[12,26],[13,24],[16,25],[16,21],[19,21],[16,13],[16,5],[8,9],[8,18]],
			null,
			[[8,14],[4,26],[9,22],[12,29],[15,24],[19,25],[18,18],[21,18],[18,10],[18,-4],[8,5],[8,14]],
			null,
			[[8,14],[4,26],[9,22],[12,29],[15,24],[19,25],[18,18],[21,18],[18,10],[20,7],[18,4],[18,-8],[10,-12],[12,-4],[8,5],[8,14]]];
			if (guns[lvl] != null) player.weapons[select].guns=guns[lvl];
			player.weapons[select].rate/=1.03;
			//player.weapons[select].armor-=0.09;
			nmesh=true;
		}
		if (name=="shell2") {
			//[[-4,0],[4,0],[6,-2],[4,-4],[-4,-4],[-6,-2],[-4,0]]
			var guns=[null,
			[0,1,0,10,0,20,0,0,0],
			null,
			null,
			[0,-5,0,1,0,10,0,20,0,0,0],
			null,
			null,
			null,
			[0,-5,0,1,0,10,0,20,0,90,0,0,-130,0,0,0]];
			meshes=[null,
			[[-8,18],[-12,26],[-13,24],[-16,25],[-16,21],[-19,21],[-16,13],[-16,9],[-8,11],[-8,18]],
			null,
			null,
			[[-8,18],[-7,24],[-9,22],[-12,26],[-13,24],[-16,25],[-16,21],[-19,21],[-16,13],[-16,5],[-8,9],[-8,18]],
			null,
			[[-8,14],[-4,26],[-9,22],[-12,29],[-15,24],[-19,25],[-18,18],[-21,18],[-18,10],[-18,-4],[-8,5],[-8,14]],
			null,
			[[-8,14],[-4,26],[-9,22],[-12,29],[-15,24],[-19,25],[-18,18],[-21,18],[-18,10],[-20,7],[-18,4],[-18,-8],[-10,-12],[-12,-4],[-8,5],[-8,14]]];
			if (guns[lvl] != null) player.weapons[select].guns=guns[lvl];
			player.weapons[select].rate/=1.03;
			//player.weapons[select].armor-=0.09;
			nmesh=true;
		}

		if (nmesh) if (meshes[lvl] != null) player.weapons[select].swapMesh(meshes[lvl]);
	}
	runUI();
	updateShop();
}
function movedmouse(e) {
	mouse=[e.clientX-offset[0]+window.pageXOffset,e.clientY-offset[1]+window.pageYOffset];
}
function clicked(e) {

}
function mdown(e) {
	shooting=true;
	clickUI();
}
function mup(e) {
	shooting=false;
}

//Rectangle object
function Rectangle(sx,sy,sw,sh) {
	this.x=sx;
	this.y=sy;
	this.w=sw;
	this.h=sh;
	this.reset=rectangleReset;
	this.contains=rectangleContains;
	this.collides=rectangleCollide;
	this.containsRect=rectangleContainsRect;
	this.xDist=rectangleXDist;
	this.yDist=rectangleYDist;
	this.draw=rectangleDraw;
	this.undraw=rectangleUndraw;
	this.copy=rectangleCopy;
}
function rectangleXDist(rect) {
	return Math.abs(this.x+this.w/2-rect.x+rect.w/2)-(this.w+rect.w)/2;
}
function rectangleYDist(rect) {
	return Math.abs(this.y+this.h/2-rect.y+rect.h/2)-(this.h+rect.h)/2;
}
function rectangleReset(sx,sy,sw,sh) {
	this.x=sx;
	this.y=sy;
	this.w=sw;
	this.h=sh;
}
function rectangleCollide(rect) {
	if ((this.y+this.h < rect.y) || (this.y > rect.y+rect.h) || (this.x+this.w < rect.x) || (this.x > rect.x+rect.w)) return false;
	return true;
}
function rectangleContains(x,y) {
	if ((x > this.x) && (x < this.x+this.w) && (y > this.y) && (y < this.y+this.h)) return true;
	return false;
}
function rectangleContainsRect(rect) {
	if ((rect.x < this.x) && (rect.x+rect.w > this.x+this.w) && (rect.y < this.y) && (rect.y+rect.h > this.y+this.h)) return true;
	return false;
}
function rectangleDraw() {
	ctx.fillRect(this.x,this.y,this.w,this.h);
}
function rectangleUndraw() {
	ctx.clearRect(this.x,this.y,this.w,this.h);
}
function rectangleCopy() {
	return new Rectangle(this.x,this.y,this.w,this.h);
}

//Line object
function Line(x1,y1,x2,y2) {
	this.x1=x1;
	this.y1=y1;
	this.x2=x2;
	this.y2=y2;
}

//Mesh object
function Mesh(distarray,vectFacing,x,y) {
	this.points=distarray;
	this.mesh=new Array();
	this.pos=[x,y];
	this.facingy=vectFacing;
	this.facingx=newVectorDL((vectFacing.direction+90)%360,1);
	this.rectangle=new Rectangle(0,0,0,0);
	this.draw=meshDraw;
	this.drawClear=meshDrawClear;
	this.undraw=meshUndraw;
	this.update=meshUpdate;
	this.move=meshMove;
	this.rotate=meshRotate;
	this.scale=meshScale;
	this.contains=meshContains;
	this.collides=meshCollides;
	this.realMesh=meshRealMesh;
	this.skips=[];
	this.glow=meshGlow;
	this.update();
	this.copy=meshCopy;
	this.lineize=meshLineize;
}
function meshMove(x,y) {
	var dx=x-this.pos[0];
	var dy=y-this.pos[1];
	this.pos=[x,y];
	this.rectangle.x+=dx;
	this.rectangle.y+=dy;
}
function meshRotate(rotation) {
	if (rotation.direction != this.facingy.direction) {
		this.facingy=newVectorDL((rotation.direction)%360,1);
		//this.facingx=newVectorDL((rotation.direction+90)%360,1);
		this.update();
	}
}
function rotateMesh(mesh,rotation) {
	if (rotation != mesh.facingy.direction) {
		mesh.facingy=newVectorDL((rotation)%360,1);
		//this.facingx=newVectorDL((rotation.direction+90)%360,1);
		mesh.update();
	}
}
function meshUpdate() {
	this.facingx.setLength(1);
	this.facingy.setLength(1);
	var x=this.pos[0];
	var mx=this.pos[0];
	var y=this.pos[1];
	var my=this.pos[1];
	var coord=[0,0];
	var coss = Math.cos(toRadians(this.facingy.direction-90));
	var sinn = Math.sin(toRadians(this.facingy.direction-90));
	for (var i = 0, l = this.points.length;i < l;i++) {
		var coord=[this.pos[0]+this.points[i][0]*coss - this.points[i][1]*sinn,
		           this.pos[1]+this.points[i][1]*coss + this.points[i][0]*sinn]
		if (coord[0] < x) x=coord[0];
		if (coord[0] > mx) mx=coord[0];
		if (coord[1] < y) y=coord[1];
		if (coord[1] > my) my=coord[1];
		this.mesh[i]=[coord[0]-this.pos[0],coord[1]-this.pos[1]];
	}
	this.rectangle.reset(Math.floor(x)-1,Math.floor(y)-1,Math.ceil(mx-x)+3,Math.ceil(my-y)+3);
}
function meshContains(x,y) {
	if (this.rectangle.contains(x,y)) {
		var tmesh=[];
		for (var i = 0, l = this.mesh.length;i < l;i++) {
			tmesh[i]=[this.mesh[i][0]+this.pos[0],this.mesh[i][1]+this.pos[1]];
		}
		if (polyContains(tmesh,x,y)) {return true;}
	}
	return false;
}
function meshCollides(mesh2) {
	if (this.rectangle.collides(mesh2.rectangle)) {
		var tmesh=[];
		var tmesh2=[];
		for (var i = 0, l = this.mesh.length;i < l;i++) {
			tmesh[i]=[this.mesh[i][0]+this.pos[0],this.mesh[i][1]+this.pos[1]];
		}
		for (var i = 0, l = mesh2.mesh.length;i < l;i++) {
			tmesh2[i]=[mesh2.mesh[i][0]+mesh2.pos[0],mesh2.mesh[i][1]+mesh2.pos[1]];
		}
		if (polyCollides(tmesh,tmesh2)) {
			return true;
		}
	}
	return false;
}
function meshScale(ratio) {
	for (var i = 0, l = this.points.length;i < l;i++) {
		this.points[i][0]*=ratio;
		this.points[i][1]*=ratio;
	}
	this.update();
}
function meshDraw(strokeStyle,fillStyle) {
	ctx.beginPath();
	ctx.moveTo(this.mesh[0][0]+this.pos[0],this.mesh[0][1]+this.pos[1],3,3);
	for (var i = 0, l = this.mesh.length;i < l;i++) {
		ctx.lineTo(this.mesh[i][0]+this.pos[0],this.mesh[i][1]+this.pos[1],3,3);
	}
	if (fillStyle!="") {
		ctx.fillStyle=fillStyle;
		ctx.fill();
	}
	if (strokeStyle!="") {
		ctx.strokeStyle=strokeStyle;
		ctx.stroke();
	}
}
function meshDrawClear(strokeStyle,fillStyle) {
	ctx.beginPath();
	ctx.moveTo(this.mesh[0][0]+this.pos[0],this.mesh[0][1]+this.pos[1],3,3);
	for (var i = 0, l = this.mesh.length;i < l;i++) {
		if (this.skips[i]==false) ctx.lineTo(this.mesh[i][0]+this.pos[0],this.mesh[i][1]+this.pos[1],3,3);
		else ctx.moveTo(this.mesh[i][0]+this.pos[0],this.mesh[i][1]+this.pos[1],3,3);
	}
	if (fillStyle!="") {
		ctx.fillStyle=fillStyle;
		ctx.fill();
	}
	if (strokeStyle!="") {
		ctx.strokeStyle=strokeStyle;
		ctx.stroke();
	}
}
function meshUndraw() {
	ctx.clearRect(this.rectangle.x,this.rectangle.y,this.rectangle.w,this.rectangle.h);
}
function meshRealMesh() {
	var tmesh=[];
	for (var i = 0, l = this.mesh.length;i < l;i++) tmesh[i]=[[this.mesh[i][0]+this.pos[0]],[this.mesh[i][1]+this.pos[1]]];
	return tmesh;
}
function meshGlow(size,step,color,start) { //color is [r,g,b]
	var glow=1;
	if (start == null) start=1;
	var tmesh=this.copy();
	var sw=tmesh.rectangle.w;
	while (tmesh.rectangle.w-sw<size) {
		tmesh.scale(step);
		glow=start-((tmesh.rectangle.w-sw)/size)*start;
		tmesh.draw("rgba("+color[0]+","+color[1]+","+color[2]+","+glow+")","");
	}
	undraws.push(tmesh.rectangle);
}
function meshLineize() {
	var lines=[];
	var len=this.points.length;
	for (var i=1;i < len;i++) {
		lines.push(new Mesh(copyMesh([this.points[i-1],this.points[i]]),this.facingy.copy(),this.pos[0],this.pos[1]));
	}
	return lines;
}
function meshCopy() {
	var newMesh=new Mesh(copyMesh(this.points),this.facingy.copy(),this.pos[0],this.pos[1]);
	newMesh.skips=copyArray(this.skips);
	newMesh.update();
	return newMesh;
}
function copyMesh(meshArray) {
	var nmesh=[];
	for (var i = 0, l = meshArray.length;i < l;i++) nmesh.push([meshArray[i][0],meshArray[i][1]]);
	return nmesh;
}
function copyArray(array) {
	var nray=[];
	for (var i = 0, l = array.length;i < l;i++) nray.push(array[i]);
	return nray;
}
function explodeMesh(character,myrgb) {
	meshes=character.mesh.lineize();
	//miscJunk.push(new Enemy(50),[[10,0],[5,10]]);
	var rgb=[233,0,0];
	if (myrgb != null) rgb=myrgb;
	for (var i = 0, l = meshes.length;i < l;i++) {
		mot=character.motion.copy();
		mot.setDirection(mot.direction+=Math.random()*40-20);
		mot.scale(Math.random()*0.8+0.8);
		miscJunk.push(new Debris(character.xc,character.yc,mot,meshes[i],character.mesh.facingy.direction,rgb));
	}
}
/*
ex
button2=new Mesh(genMesh([
	" .---. ",
	"|     |",
	" .---. "],10,10),newVectorDL(90,1),400,100);
*/
function genMesh(rowArray,wid,hei) {
	var point=[0,0];
	var lpoint=[0,0];
	var cur=0;
	var total=0;
	var f=false;
	for (var y1=0, l = rowArray.length;y1 < l;y1++) {
		for (var x1=0, l2 = rowArray[0].length;x1 < l2;x1++) {
			if (".|-/\\".indexOf(rowArray[y1][x1]) >= 0) {
				if (!f) {f=!f;point=[x1,y1];lpoint=[x1,y1];}
				total++;
			}
		}
	}
	while (cur < total) {
		var options=genOptions(rowArray,point);
		cur++;
	}
}
function genOptions(rows,point) {
	type=rows[point[0],point[1]];
	if (type == ".") {
	}
	else if (type == "|") {
	}
	else if (type == "-") {
	}
}

//Player object
function Player(myname,mymesh) {
	this.xc=30;
	this.yc=height/2;
	this.color=["blue",""];
	this.facing=newVectorDL(180,1);
	this.motion=newVectorDL(90,0);
	this.weapons=[];
	this.mesh=new Mesh(mymesh,this.facing,this.xc,this.yc);
	this.begin=playerBegin;
	this.draw=playerDraw;
	this.act=playerAct;
	this.blink=0;
	this.health=15;
	this.maxHealth=15;
	this.cooldown=0;
	this.rate=10;
	this.speed=5;
	this.hit=playerHit;
	this.fire=playerFire;
	this.name=myname;
}
function playerAct() {
	this.facing=newVectorCoords(this.xc,this.yc,mouse[0],mouse[1]);
	var tv=newVectorDist(mov[1]+mov[3],mov[0]+mov[2]);
	if (tv.length > 1) tv.setLength(1);
	this.motion.add(tv);
	this.motion.scale(0.95);
	this.xc+=this.motion.dx;
	this.yc+=this.motion.dy;
	this.mesh.move(this.xc,this.yc);
	if (this.mesh.rectangle.x < 0) {this.xc-=this.mesh.rectangle.x;this.mesh.move(this.xc,this.yc);this.motion.dx=0;this.motion.updatePolar();}
	if (this.mesh.rectangle.y < 0) {this.yc-=this.mesh.rectangle.y;this.mesh.move(this.xc,this.yc);this.motion.dy=0;this.motion.updatePolar();}
	else if (this.mesh.rectangle.y+this.mesh.rectangle.h > height) {this.yc-=this.mesh.rectangle.y+this.mesh.rectangle.h-height;this.mesh.move(this.xc,this.yc);this.motion.dy=0;this.motion.updatePolar();}
	speed=1;
	if (this.xc < 40) {
		this.xc+=1;
		//speed=0.5+(this.xc-40)/(width-40)*10
		//if (speed < 0) speed=0;
		this.mesh.move(this.xc,this.yc);
	}
	if (this.xc > 40) {
		this.xc*=0.98;
		//speed=Math.max(0.5+(this.xc-40)/(width-40)*10,1.5);
		this.mesh.move(this.xc,this.yc);
	}

	this.mesh.rotate(this.facing);
	var weaponNum=0;
	for (var i = 0,l = this.weapons.length;i < l;i++) if (this.weapons[i] != null) {
		weaponNum++;
		if (this.weapons[i].cooldown > 0) this.weapons[i].cooldown--;
		this.weapons[i].mesh.move(this.xc,this.yc);
		this.weapons[i].mesh.rotate(this.facing);
		this.weapons[i].fire();
	}
	if (weaponNum==0) {
		if (this.cooldown > 0) this.cooldown--;
		if (shooting) {
			while (this.cooldown < 1) {
				this.fire();
			}
		}
	}
	if (this.blink-- > 0) {
		this.color=["#77f",""];
		if (this.health>0) drawText(Math.ceil(this.health),this.mesh.rectangle.x+this.mesh.rectangle.w,this.mesh.rectangle.y-5,"white");
	}else this.color=["#00f",""];
}
function playerHit(damage) {
	this.health-=damage;
	this.blink=10;
	if (this.health <= 0) {
		playerKilled();
	}
	needupdate=true;
}
function playerBegin() {
	this.weapons=[];
}
function playerDraw() {
	this.mesh.draw(this.color[0],this.color[1]);
	for (var i = 0,l = this.weapons.length;i < l;i++) if (this.weapons[i] != null) this.weapons[i].draw();
}
function playerFire() {
	if (this.name == "rounded") {
		var mot=player.facing.copy();
		mot.direction+=Math.random()*1/this.rate*3-1/this.rate*3/2;
		mot.setLength(this.speed);
		fireFrom(this.mesh.mesh[1][0]+this.xc,this.mesh.mesh[1][1]+this.yc,mot);
		this.cooldown+=this.rate;
	}
	else if (this.name == "sprayer") {
		var mot=player.facing.copy();
		mot.direction+=Math.random()*1/this.rate*3-1/this.rate*3/2;
		mot.setLength(this.speed);
		fireFrom(this.mesh.mesh[3][0]+this.xc,this.mesh.mesh[3][1]+this.yc,mot);
		this.cooldown+=this.rate;
	}
	else if (this.name == "tank") {
		var mot=player.facing.copy();
		mot.direction+=Math.random()*1/this.rate*3-1/this.rate*3/2;
		mot.setLength(this.speed);
		fireFrom(this.mesh.mesh[2][0]+this.xc,this.mesh.mesh[2][1]+this.yc,mot);
		this.cooldown+=this.rate;
	}
	else if (this.name == "focus") {
		var mot=player.facing.copy();
		mot.direction+=Math.random()*1/this.rate*3-1/this.rate*3/2;
		mot.setLength(this.speed);
		fireFrom(this.mesh.mesh[0][0]+this.xc,this.mesh.mesh[0][1]+this.yc,mot);
		this.cooldown+=this.rate;
	}
	else {
		var mot=player.facing.copy();
		mot.direction+=Math.random()*1/this.rate*3-1/this.rate*3/2;
		mot.setLength(this.speed);
		fireFrom(this.mesh.mesh[1][0]+this.xc,this.mesh.mesh[1][1]+this.yc,mot);
		this.cooldown+=this.rate;
	}
}

//@gundat
function rapidBlaster() {
	this.name="rapid";
	this.ammo=1;
	this.maxAmmo=1;
	this.cooldown=0;
	this.speed=15;
	this.rate=6;
	this.fire=rapidFire;
	this.color=["#55f",""];
	this.damage=1;
	this.draw=drawIt;
	this.health=weaponhealth[this.name][0];
	this.level=0;
	this.hit=weaponHit;
	this.blink=0;
	this.armor=1;
	this.mesh=new Mesh(weaponMeshes[this.name][0],player.facing,player.xc,player.yc);
	this.swapMesh=swapMesh;
}
function rapid2Blaster() {
	this.name="rapid2";
	this.ammo=1;
	this.maxAmmo=1;
	this.cooldown=0;
	this.speed=15;
	this.rate=6;
	this.fire=rapidFire;
	this.color=["#55f",""];
	this.damage=1;
	this.draw=drawIt;
	this.health=weaponhealth[this.name][0];
	this.level=0;
	this.hit=weaponHit;
	this.blink=0;
	this.armor=1;
	this.mesh=new Mesh(weaponMeshes[this.name][0],player.facing,player.xc,player.yc);
	this.swapMesh=swapMesh;
}
function rapidFire() {
	if (this.blink-- > 0) {
		this.color=["#aaf",""];
		if (this.health>0) drawText(Math.ceil(this.health),this.mesh.rectangle.x+this.mesh.rectangle.w,this.mesh.rectangle.y-5,"white");
	}else this.color=["#55f",""];
	if (shooting) {
		while (this.cooldown < 1) {
			var mot=player.facing.copy();
			var spray=1/this.rate*this.damage;
			mot.direction+=Math.random()*spray-spray/2;
			mot.setLength(this.speed*4/5+this.speed/5*Math.random());
			var bullet=fireFrom(this.mesh.mesh[1][0]+player.xc,this.mesh.mesh[1][1]+player.yc,mot);
			if (this.damage > 1) bullet.damage=this.damage;
			this.cooldown+=this.rate;
		}
	}
}
function sprayBlaster() {
	this.name="spray";
	this.ammo=1;
	this.maxAmmo=1;
	this.cooldown=0;
	this.speed=20;
	this.rate=30;
	this.fire=sprayFire;
	this.damage=1;
	this.color=["#55f",""]
	this.draw=drawItClear;
	this.health=weaponhealth[this.name][0];
	this.level=0;
	this.hit=weaponHit;
	this.blink=0;
	this.armor=1;
	this.mesh=new Mesh([[0,0]],player.facing,player.xc,player.yc);
	this.swapMesh=swapMesh;
	this.guns=new Array(0,0,0,0,0,0,0);
}
function sprayFire() {
	if (this.blink-- > 0) {
		this.color=["#aaf",""];
		if (this.health>0) drawText(Math.ceil(this.health),this.mesh.rectangle.x+this.mesh.rectangle.w,this.mesh.rectangle.y-5,"white");
	}else this.color=["#55f",""];
	var center=[0,-15];
	var newmesh=[];
	var skips=[];
	newmesh.push([0,-17]);
	skips.push(false);
	newmesh.push(center);
	skips.push(false);
	for (var i = 0,l = this.guns.length;i < l;i++) {
		if (this.guns[i]>0)this.guns[i]--;
		newmesh.push(center);
		skips.push(true);
		var tv=newVectorDL(i/this.guns.length*140+25,Math.max((1-(this.guns[i])/this.rate)*15,0));
		newmesh.push([center[0]+tv.dx,center[1]+tv.dy]);
		skips.push(false);
	}
	this.swapMesh(newmesh);
	this.mesh.skips=skips;
	if (shooting) {
		for (var i = 0,l = this.guns.length;i < l;i++) {
			if (this.guns[i]<=0) {
				var mot=player.facing.copy();
				mot.direction+=(i)/this.guns.length*140-70;
				mot.setLength(this.speed);
				var x=this.mesh.mesh[i*2+3][0]+player.xc;
				var y=this.mesh.mesh[i*2+3][1]+player.yc;
				var bull=new Bullet(x,y,mot);
				bull.confined=false;
				//bull.mesh=new Mesh(bulletMeshes[1],mot,x,y);
				bull.influence=newVectorDL(player.facing.direction,3);
				bull.act=curveAct;
				bull.color=["","#777"];
				bull.damage=this.damage;
				fireBullet(bull);
				this.guns[i]+=Math.floor(Math.random()*this.rate)+3;
			}
		}
	}
	//dbg(this.rate+" "+this.guns.length+" "+this.guns.length/this.rate); //dpf data
}
function laserBlaster() {
	this.name="laser";
	this.shots=0;
	this.ammo=25;
	this.maxAmmo=25;
	this.cooldown=0;
	this.speed=15;
	this.rate=1;
	this.penetration=2;
	this.fire=laserFire;
	this.color=["#55f",""]
	this.draw=drawIt;
	this.health=weaponhealth[this.name][0];
	this.level=0;
	this.hit=weaponHit;
	this.blink=0;
	this.damage=1;
	this.armor=1;
	this.mesh=new Mesh([[0,10],[0,20]],player.facing,player.xc,player.yc);
	this.swapMesh=swapMesh;
}
function laserFire() {
	if (this.blink-- > 0) {
		this.color=["#aaf",""];
		if (this.health>0) drawText(Math.ceil(this.health),this.mesh.rectangle.x+this.mesh.rectangle.w,this.mesh.rectangle.y-5,"white");
	}else this.color=["#55f",""];
	if (shooting) {
		if (this.shots<=0) {
			if (this.ammo>0) {
				this.ammo--;
				this.shots=30;
				needupdate=true;
				//updateShop();
			}
		}
		if (this.shots > 0) {
			var mot=player.facing.copy();
			mot.setLength(10000);
			var bull=new Bullet(this.mesh.mesh[1][0]+player.xc,this.mesh.mesh[1][1]+player.yc,mot);
			bull.mesh=new Mesh([[0,-10],[0,0]],mot.copy(),this.mesh.mesh[1][0]+player.xc,this.mesh.mesh[1][1]+player.yc);
			bull.act=laserAct;
			bull.color=["rgb("+(255-(30-this.shots)*5)+",0,0)",""];
			bull.penetrate=this.penetration;
			bull.damage=this.damage;
			fireBullet(bull);
			this.shots--;
		}
	}
}
function shellBlaster() {
	this.name="shell";
	this.ammo=1;
	this.maxAmmo=1;
	this.cooldown=0;
	this.speed=15;
	this.rate=6;
	this.fire=shellFire;
	this.color=["#55f",""];
	this.damage=1;
	this.draw=drawIt;
	this.health=weaponhealth[this.name][0];
	this.level=0;
	this.hit=shellHit;
	this.blink=0;
	this.armor=1;
	this.guns=new Array(0,-1,0,-10,0,0,0);
	this.mesh=new Mesh([[8,22],[12,26],[13,24],[17,25],[16,15],[8,15],[8,22]],player.facing,player.xc,player.yc);
	this.swapMesh=swapMesh;
}
function shell2Blaster() {
	this.name="shell2";
	this.ammo=1;
	this.maxAmmo=1;
	this.cooldown=0;
	this.speed=15;
	this.rate=6;
	this.fire=shellFire;
	this.color=["#55f",""];
	this.damage=1;
	this.draw=drawIt;
	this.health=weaponhealth[this.name][0];
	this.level=0;
	this.hit=shellHit;
	this.blink=0;
	this.armor=1;
	this.guns=new Array(0,1,0,10,0,0,0);
	this.mesh=new Mesh([[-8,22],[-12,26],[-13,24],[-17,25],[-16,15],[-8,15],[-8,22]],player.facing,player.xc,player.yc);
	this.swapMesh=swapMesh;
}
function shellFire() {
	if (this.blink-- > 0) {
		this.color=["#aaf",""];
		if (this.health>0) drawText(Math.ceil(this.health),this.mesh.rectangle.x+this.mesh.rectangle.w,this.mesh.rectangle.y-5,"white");
	}else this.color=["#55f",""];
	if (shooting) {
		while (this.cooldown < 1) {
			for (var i = 0,l = this.guns.length;i < l;i++) {
				if (this.guns[i] != 0) {
						var mot=player.facing.copy();
						var spray=1/this.rate*this.damage;
						mot.direction+=this.guns[i];
						mot.setLength(this.speed*4/5+this.speed/5*Math.random());
						var bullet=fireFrom(this.mesh.mesh[i][0]+player.xc,this.mesh.mesh[i][1]+player.yc,mot);
						if (this.damage != 1) bullet.damage=this.damage;
				}
			}
			this.cooldown+=this.rate;
		}
		//dbg(this.rate+" "+this.damage+" "+this.damage/this.rate); //dpf data
	}
}

function fanBlaster() {
	this.name="fan";
	this.ammo=1;
	this.maxAmmo=1;
	this.cooldown=0;
	this.speed=10;
	this.rate=3;
	this.ang=0;
	this.direction=1;
	this.turn=5;
	this.fire=fanFire;
	this.color=["#55f",""];
	this.damage=1;
	this.draw=drawIt;
	this.health=weaponhealth[this.name][0];
	this.level=0;
	this.hit=weaponHit;
	this.blink=0;
	this.armor=1;
	this.mesh=new Mesh(weaponMeshes[this.name][0],player.facing,player.xc,player.yc);
	this.swapMesh=swapMesh;
}
function fanFire() {
	if (this.blink-- > 0) {
		this.color=["#aaf",""];
		if (this.health>0) drawText(Math.ceil(this.health),this.mesh.rectangle.x+this.mesh.rectangle.w,this.mesh.rectangle.y-5,"white");
	}else this.color=["#55f",""];
	if (shooting) {
		while (this.cooldown < 1) {
			var mot=player.facing.copy();
			var spray=60;
			mot.direction+=this.ang;
			this.ang+=this.direction*this.turn;
			if (Math.abs(this.ang) > spray) {
				this.ang = spray*this.direction;
				this.direction*=-1;
			}
			mot.setLength(this.speed);
			var bullet=fireFrom(this.mesh.mesh[0][0]+player.xc,this.mesh.mesh[0][1]+player.yc,mot);
			if (this.damage != 1) bullet.damage=this.damage;
			this.cooldown+=this.rate;
		}
		var tmot=newVectorDL(this.ang-90,10);
		this.mesh.points[4]=[tmot.dx,tmot.dy];
		this.mesh.update();
		//dbg(this.rate+" "+this.damage+" "+this.damage/this.rate); //dpf data
	}
}

function pulseBlaster() {
	this.name="pulse";
	this.ammo=25;
	this.clipAmmo=15;
	this.clipMaxAmmo=15;
	this.maxAmmo=25;
	this.cooldown=0;
	this.speed=15;
	this.rate=45;
	this.fire=pulseFire;
	this.color=["#55f",""];
	this.damage=4;
	this.draw=drawIt;
	this.health=weaponhealth[this.name][0];
	this.level=0;
	this.hit=weaponHit;
	this.blink=0;
	this.armor=1;
	this.mesh=new Mesh(weaponMeshes[this.name][0],player.facing,player.xc,player.yc);
	this.swapMesh=swapMesh;
}
function pulseFire() {
	if (this.blink-- > 0) {
		this.color=["#aaf",""];
		if (this.health>0) drawText(Math.ceil(this.health),this.mesh.rectangle.x+this.mesh.rectangle.w,this.mesh.rectangle.y-5,"white");
	}else this.color=["#55f",""];
	if (shooting) {
		if (this.clipAmmo > 0) {
			while (this.cooldown <= 1) {
				this.clipAmmo-=1;
				//var mot=newVectorCoords(x1,y1,x2,y2)
				var mot=player.facing.copy();
				var spray=10;
				mot.direction+=Math.random()*spray-spray/2;
				//mot.setLength(this.speed*4/5+this.speed/5*Math.random());
				mot.setLength(this.speed);
				var bullet=fireFrom(this.mesh.mesh[1][0]+player.xc,this.mesh.mesh[1][1]+player.yc,mot);
				if (this.damage > 1) bullet.damage=this.damage;
				this.cooldown+=1;
			}
		}else if (this.ammo > 0) {
			this.ammo--;
			this.clipAmmo=this.clipMaxAmmo;
			this.cooldown+=this.rate;
			needupdate=true;
		}
		//dbg(this.rate+" "+this.damage+" "+this.damage/this.rate); //dpf data
	}
	if (this.cooldown < 3) this.mesh.points[1][1]=25*(this.clipAmmo/this.clipMaxAmmo)+5;
	else this.mesh.points[1][1]=25*(1-this.cooldown/this.rate)+10;
	this.mesh.update();
}

function orbitBlaster() {
	this.name="orbit";
	this.ammo=1;
	this.maxAmmo=1;
	this.cooldown=0;
	this.speed=15;
	this.rate=6;
	this.fire=orbitFire;
	this.color=["#55f",""];
	this.damage=1;
	this.draw=drawIt;
	this.health=weaponhealth[this.name][0];
	this.level=0;
	this.hit=weaponHit;
	this.blink=0;
	this.armor=1;
	this.mesh=new Mesh(weaponMeshes[this.name][0],player.facing,player.xc,player.yc);
	this.swapMesh=swapMesh;
	this.rotated = 0;
	this.rotateSpeed = 6;
}
function orbitFire() {
	if (this.blink-- > 0) {
		this.color=["#aaf",""];
		if (this.health>0) drawText(Math.ceil(this.health),this.mesh.rectangle.x+this.mesh.rectangle.w,this.mesh.rectangle.y-5,"white");
	}else this.color=["#55f",""];
	rotateMesh(this.mesh, this.rotated += this.rotateSpeed);
	if (shooting) {
		while (this.cooldown < 1) {
			var mot=player.facing.copy();
			var spray=1/this.rate*this.damage;
			mot.direction+=Math.random()*spray-spray/2;
			mot.setLength(this.speed*4/5+this.speed/5*Math.random());
			var bullet=fireFrom(this.mesh.mesh[2][0]+player.xc,this.mesh.mesh[2][1]+player.yc,mot);
			if (this.damage > 1) bullet.damage=this.damage;
			this.cooldown+=this.rate;
		}
	}
	//this.mesh.rotate(1);
}

function weaponHit(damage,enemy) {
	this.health-=damage*this.armor;
	if (this.health<=0) player.weapons[Array.findItem(player.weapons,this)]=null;
	this.blink=10;
	needupdate=true;
	return 1;
	//updateShop();
}
function shellHit(damage,enemy) {
	console.log(this);
	console.log(enemy);

	if (enemy) var dmg = Math.min(enemy.health,this.health / this.armor);
	else var dmg = 1;
	this.health-=dmg*damage*this.armor;
	if (this.health<=0) player.weapons[Array.findItem(player.weapons,this)]=null;
	this.blink=10;
	needupdate=true;
	return dmg;
}
function powerBlaster() {
	this.name="power";
	this.ammo=1;
	this.maxAmmo=1;
	this.cooldown=0;
	this.speed=15;
	this.rate=6;
	this.fire=powerFire;
	this.color=["#55f",""]
	this.draw=drawIt;
	this.health=25;
	this.level=0;
	this.hit=weaponHit;
	this.blink=0;
	this.mesh=new Mesh([[-3,15],[0,25],[3,15]],player.facing,player.xc,player.yc);
	this.swapMesh=swapMesh;
}
function powerFire() {
	if (this.blink-- > 0) {
		this.color=["#aaf",""];
	}else this.color=["#55f",""];
	if (shooting) {
		while (this.cooldown < 1) {
			var mot=player.facing.copy();
			mot.direction+=Math.random()*1/this.rate*3-1/this.rate*3/2;
			mot.setLength(this.speed);
			fireFrom(this.mesh.mesh[1][0]+player.xc,this.mesh.mesh[1][1]+player.yc,mot);
			this.cooldown+=this.rate;
		}
	}
}
function swapMesh(mesh) {
	this.mesh=new Mesh(mesh,player.facing,player.xc,player.yc);
}
function drawIt() {
	this.mesh.draw(this.color[0],this.color[1]);
}
function drawItClear() {
	this.mesh.drawClear(this.color[0],this.color[1]);
}
function fireFrom(x,y,motion) {
	var bull=new Bullet(x,y,motion);
	friendBullets.push(bull);
	bull.draw();
	undraws.push(bull.mesh.rectangle.copy());
	return bull;
}
function fireBullet(bull) {
	friendBullets.push(bull);
	bull.draw();
	undraws.push(bull.mesh.rectangle.copy());
}

//friendlybullet object
var bulletMeshes=new Array([[0,0],[-1.6,-6],[1.6,-6],[0,0]],[[0,0],[0,-15]])
function Bullet(x,y,motion) {
	this.xc=x;
	this.yc=y;
	this.motion=motion;
	this.color=["","white"];
	this.mesh=new Mesh(bulletMeshes[0],this.motion.copy(),this.xc,this.yc);
	this.draw=bulletDraw;
	this.act=bulletAct;
	this.dying=0;
	this.die=bulletDie;
	this.killplayer=false;
	this.lastReflect=null;
	this.move=bulletMove;
	this.swapMesh=swapMesh;
	this.damage=1;
	this.confined=true;
	this.path=[[0,0],[0,0]];
}
function bulletAct() {
	this.move();
}
function bulletMove() {
	var k=false;
	//var tmotion=this.motion.copy();
	//tmotion.scale(0.2);
	//this.path=[[this.xc-tmotion.dx,this.yc-tmotion.dy],[this.xc+this.motion.dx+tmotion.dx,this.yc+this.motion.dy+tmotion.dy]];
	this.path=[[this.xc-this.motion.dx,this.yc-this.motion.dy],[this.xc+this.motion.dx+this.motion.dx,this.yc+this.motion.dy+this.motion.dy]];
	var cols=null;
	var closest=null;
	var dist=this.motion.length+100;
	if (this.killplayer) {
		for (var i = 0,l = player.weapons.length;i < l;i++) if ((player.weapons[i] != null) && ((cols=pathCollisions(this.path,player.weapons[i].mesh))!=null)) {
			var d=0;
			for (var i2 = 0,l2 = cols.length;i2 < l2;i2++) if (d=distance(this.xc,this.yc,cols[i2][0],cols[i2][1]) < dist) {dist=d;closest=player.weapons[i];}
		}
		if (closest != null) {
			closest.hit(this.damage);
			this.die();
		}else {
			if (pathCollisions(this.path,player.mesh) != null) {
				player.hit(this.damage);
				this.die();
			}
		}
	}
	var xmin=parseInt(Math.min(this.path[0][0],this.path[1][0])/colXRes);
	var xmax=parseInt(Math.max(this.path[0][0],this.path[1][0])/colXRes);
	var ymin=parseInt(Math.min(this.path[0][1],this.path[1][1])/colYRes);
	var ymax=parseInt(Math.max(this.path[0][1],this.path[1][1])/colYRes);
	var hit=false;
	for (var x = xmin;x<=xmax;x++) {
		for (var y = ymin;y<=ymax;y++) {
			hit=collisionMap[x+y*colWid];
			if (hit) break;
		}
		if (hit) break;
	}
	//if (collisionMap[parseInt(this.xc/colXRes)+parseInt(this.yc/colYRes)*colWid]==true) {
	if (hit) {
		if (closest == null) {
			for (var i = 0, l = enemies.length;i < l;i++) {
				if ((cols=pathCollisions(this.path,enemies[i].mesh)) != null) {
					var d=0;
					for (var i2 = 0, l2 = cols.length;i2 < l2;i2++) if ((d=distance(this.xc,this.yc,cols[i2][0],cols[i2][1])) < dist) {dist=d;closest=enemies[i];this.path[1][0]=cols[i2][0];this.path[1][1]=cols[i2][1];}
				}
			}
			if (closest != null) {
				if (closest.health>0) {
					//if ((closest.resistance >= 100) && (closest != this.lastReflect)) {
						/*closest.shot(this.damage);
						this.motion.dx=-this.motion.dx;
						this.motion.updatePolar();
						var tmotion=this.motion.copy();
						tmotion.scale(3/tmotion.length);
						this.mesh.rotate(tmotion.copy());
						this.killplayer=true;
						if (closest.mesh.contains(this.xc,this.yc)) {
							this.lastReflect=closest;
						}*/
					//}else {
						this.die();
						closest.shot(this.damage);
					//}
				}
			}
		}
	}
	if (closest == null) {
		//this.path[1][0]-=tmotion.dx;
		//this.path[1][1]-=tmotion.dy;
		this.path[1][0]-=this.motion.dx;
		this.path[1][1]-=this.motion.dy;
	}
	this.xc=this.path[1][0];
	this.yc=this.path[1][1];
	this.mesh.move(this.xc,this.yc);
	if (!worldrect.contains(this.xc,this.yc)) {
		if (this.confined) this.die();
		else {
			if (this.xc > width) this.dying+=100;
			this.dying++;
			if (this.dying > 50) this.die();
		}
	}
}
function bulletDie() {
	killBullets.push(this);
}
function bulletDraw() {
	this.mesh.draw(this.color[0],this.color[1]);
}

function curveAct() {
	var len=this.motion.length;
	this.motion.add(this.influence);
	this.motion.setLength(len);
	this.mesh.rotate(this.motion.copy());
	this.move();
}

function laserAct() { //work on
	var tp=this.penetrate;
	var k=false;
	var tmotion=this.motion.copy();
	tmotion.scale(3/tmotion.length);
	var killplayer=false;
	for (var a = 0, l = this.motion.length;a < l;a++) {
		if (a>this.motion.length) {a=this.motion.length;}
		this.xc+=tmotion.dx;
		this.yc+=tmotion.dy;
		if (a%3==0) {
			this.mesh.move(this.xc,this.yc);
			this.draw();
			undraws.push(this.mesh.rectangle.copy());
		}
		if (killplayer) {
			var wcollide=false;
			for (var i = 0, l = player.weapons.length;i < l;i++) if ((player.weapons[i] != null) && (player.weapons[i].mesh.contains(this.xc,this.yc))) {
				player.weapons[i].hit(this.damage);
				this.die();
				this.mesh.move(this.xc,this.yc);
				this.draw();
				undraws.push(this.mesh.rectangle.copy());
				k=true;
				wcollide=true;
				break;
			}
			if ((!wcollide) && (player.mesh.contains(this.xc,this.yc))) {
				player.hit(this.damage);
				this.die();
				this.mesh.move(this.xc,this.yc);
				this.draw();
				undraws.push(this.mesh.rectangle.copy());
				k=true;
				break;
			}
		}
		//if ((collisionMapX[parseInt(this.xc/colXRes)]==true) && (collisionMapY[parseInt(this.yc/colYRes)]==true)) {
		if (collisionMap[parseInt(this.xc/colXRes)+parseInt(this.yc/colYRes)*colWid]==true) {
			for (var i = 0, l = enemies.length;i < l;i++) {
				if (enemies[i].mesh.contains(this.xc,this.yc)) {
					if (enemies[i].health>0) {
						if (((enemies[i].resistance>=tp*1.25) && (enemies[i].resistance>=20)) && (enemies[i] != this.lastReflect)) {
							enemies[i].shot(this.damage/3);
							this.motion.dx=-this.motion.dx;
							this.motion.updatePolar();
							tmotion=this.motion.copy();
							tmotion.scale(3/tmotion.length);
							this.mesh.rotate(tmotion.copy());
							killplayer=true;
							this.penetrate-=1;
							if (enemies[i].mesh.contains(this.xc,this.yc)) {
								this.lastReflect=enemies[i];
							}
							break;
						}else {
							this.penetrate-=enemies[i].resistance;
							enemies[i].shot(this.damage);
							if (this.penetrate < 1) {
								this.die();
								this.mesh.move(this.xc,this.yc);
								k=true;
								break;
							}
						}
					}
				}
			}
		}
		if (!worldrect.contains(this.xc,this.yc)) {k=true;this.die();}
		if (k) break;
	}
	if (!worldrect.contains(this.xc,this.yc)) {k=true;this.die();}
	this.mesh.move(this.xc,this.yc);
}

//Debris object
function Debris(x,y,motion,mesh,rotation,rgb) {
	this.xc=x;
	this.yc=y;
	this.motion=motion;
	this.rgb=rgb;
	this.opacity=0.9;
	this.color=["rgba("+this.rgb[0]+","+this.rgb[1]+","+this.rgb[2]+","+this.opacity+")",""];
	this.mesh=mesh;
	this.draw=debrisDraw;
	this.act=debrisAct;
	this.die=debrisDie;
	this.move=debrisMove;
	this.swapMesh=swapMesh;
	this.rotated=rotation;
	this.rotate=Math.random()*5-2.5;
	this.path=[[0,0],[0,0]];
}
function debrisAct() {
	rotateMesh(this.mesh,this.rotated+=this.rotate);
	this.opacity-=0.02;
	this.color=["rgba("+this.rgb[0]+","+this.rgb[1]+","+this.rgb[2]+","+this.opacity+")",""];
	if (this.opacity < 0.1) this.die();
	else this.move();
}
function debrisMove() {
	//this.path=[[this.xc-this.motion.dx,this.yc-this.motion.dy],[this.xc+this.motion.dx+this.motion.dx,this.yc+this.motion.dy+this.motion.dy]];
	//this.xc=this.path[1][0];
	//this.yc=this.path[1][1];
	this.xc+=this.motion.dx-speed;
	this.yc+=this.motion.dy;
	this.mesh.move(this.xc,this.yc);
	if (!worldrect.contains(this.xc,this.yc)) {
		this.die();
	}
}
function debrisDie() {
	killMisc.push(this);
}
function debrisDraw() {
	this.mesh.draw(this.color[0],this.color[1]);
}

//Formation object
function Formation(script) {
	this.shipArray=parseFormation(script);
	this.height=this.shipArray[0][0];
	this.length=this.shipArray[this.shipArray.length-2];
	this.speed=this.shipArray[0][1];
	this.makeSpawner=formationMakeSpawner;
	this.wait=1;
	this.run=formationRun;
}
function formationRun() {
	this.makeSpawner(Math.random()*(height-this.height),2).start();
}
function formationMakeSpawner(y,speed) {
	if (speed==null) return new Spawner(y,this.length,this.speed,this.shipArray);
	else return new Spawner(y,this.length,speed,this.shipArray);
}
function sortShips(a,b) {
	return a[0] - b[0];
}
function parseFormation(script) {
	var lines=script.split(";");
	var ships=[];
	var datas;
	for (var i = 0, l = lines.length;i < l;i++) {
		if (i == 0) {
			sp=lines[i].split(",");
			datas=[parseInt(sp[0]),parseInt(sp[1])];
		}
		else {
			var $=lines[i].split(" ");
			var num=parseInt($[0]);
			var posx=parseInt($[1]);
			var posy=parseInt($[2]);
			ships.push([posx,num,posy]);
		}
	}
	var shipssorted=ships.sort(sortShips);
	var shipsfinal=[];
	shipsfinal.push(datas);
	for (var i = 0, l = shipssorted.length;i < l;i++) {
		shipsfinal.push(shipssorted[i][0]);
		shipsfinal.push([shipssorted[i][1],shipssorted[i][2]]);
	}
	return shipsfinal;
}

//Spawner event object
function Spawner(y,length,speed,ships) {
	this.run=spawnerRun;
	this.yc=y;
	this.length=length;
	this.ships=ships;
	this.speed=speed;
	this.spos=1;
	this.pos=0;
	this.wait=1;
	this.start=spawnerStart;
}
function spawnerRun() {
	this.pos+=speed+this.speed;
	while (this.pos >= this.ships[this.spos]) {
		var ship=esp(this.ships[++this.spos][0],this.ships[this.spos++][1]+this.yc);
		ship.motion=newVectorDL(180,this.speed);
		events.push(ship);
	}
	if (this.pos <= this.length) this.wait=1;
}
function spawnerStart() {
	events.push(this);
}

//Enemy object
function Enemy(myPos,mesh) {
	this.xc=width+10;
	this.yc=myPos;
	this.lpos=[this.xc,this.yc];
	this.resistance=2;
	this.entered=false;
	this.facing=newVectorDL(180,1);
	this.motion=newVectorDL(180,3);
	this.color=["#d00",""];
	this.health=5;
	this.value=5;
	this.blink=0;
	this.mesh=new Mesh(mesh,this.facing,this.xc,this.yc);
	this.behavior=defaultBehavior;
	this.draw=enemyDraw;
	this.act=enemyAct;
	this.die=enemyDie;
	this.shot=enemyShot;
	this.clone=enemyClone;
	this.run=enemyRun;
	this.spawn=enemySpawn;
	this.wait=1;
}
function enemyAct() {
	this.behavior();
	this.lpos=[this.xc,this.yc];
	if (!freezeenemies) {
	this.xc-=speed;
	this.xc+=this.motion.dx;
	this.yc+=this.motion.dy;
	this.mesh.move(this.xc,this.yc);
	}
	var xmin=parseInt(this.mesh.rectangle.x/colXRes);
	var xmax=parseInt((this.mesh.rectangle.x+this.mesh.rectangle.w)/colXRes+0.5);
	var ymin=parseInt(this.mesh.rectangle.y/colYRes);
	var ymax=parseInt((this.mesh.rectangle.y+this.mesh.rectangle.h)/colYRes+0.5);
	for (var x = xmin;x<=xmax;x++) {
		for (var y = ymin;y<=ymax;y++) {
			collisionMap[x+y*colWid]=true;
		}
	}
	//for (var i = xmin;i<=xmax;i++) collisionMapX[i]=true;
	//for (var i = ymin;i<=ymax;i++) collisionMapY[i]=true;

	//collisionMapX[parseInt(this.xc/colXRes)]=true;
	//collisionMapY[parseInt(this.yc/colYRes)]=true;
	this.props=new Array("#d00","#f77");
	var wcollide=false;
	for (var i = 0, l = player.weapons.length;i < l;i++) if ((player.weapons[i] != null) && (player.weapons[i].mesh.collides(this.mesh))) {
		this.blink=5;this.health-=player.weapons[i].hit(1,this);
		wcollide=true;
		if (this.health <= 0) {this.die();}
		break;
	}
	if ((!wcollide) && (player.mesh.collides(this.mesh))) {
		this.blink=5;this.health--;player.hit(1);
		if (this.health <= 0) {this.die();}
	}
	if (!worldrect.collides(this.mesh.rectangle)) {if (this.entered) this.die();}
	else if (!this.entered) this.entered=true;
	if (this.blink-- > 0) {this.color=[this.props[1],""];if (this.health>0) drawText(Math.ceil(this.health),this.mesh.rectangle.x+this.mesh.rectangle.w,this.mesh.rectangle.y-5,"white");}
	else this.color=[this.props[0],""];
}
function enemyShot(damage,notbyplayer) {
	this.health-=damage;
	this.blink=10;
	if (this.health <= 0) {
		this.die();
		if (notbyplayer != true) {kills++;money+=this.value;needupdate=true;}
	}
}
function enemyDraw() {
	//this.mesh.glow(50,1.2,[255,0,0],0.25);
	this.mesh.draw(this.color[0],this.color[1]);
}
function enemyDie() {
	killEnemies.push(this);
	explodeMesh(this);
}
function enemySpawn() {
}
function enemyClone(y) {
	var newEnemy=new Enemy(y,this.mesh.points);
	newEnemy.behavior=this.behavior;
	newEnemy.health=this.health;
	newEnemy.color=this.color;
	newEnemy.facing=this.facing.copy();
	newEnemy.motion=this.motion.copy();
	newEnemy.props=this.props;
	newEnemy.value=this.value;
	newEnemy.resistance=this.resistance;
	newEnemy.run=this.run;
	newEnemy.spawn=this.spawn;
	newEnemy.spawn();
	return newEnemy;
}
function enemyRun() {
	enemies.push(this);
}
function defaultBehavior() {
}
function wallBehavior() {
	var influence=newVectorDL(0,0);
	if (player.yc < this.yc) influence=newVectorDL(270,0.1);
	else if (player.yc > this.yc) influence=newVectorDL(90,0.1);
	var len=this.motion.length;
	this.motion.add(influence);
	this.motion.setLength(len);

	influence=newVectorDL(180,0.1);
	var len=this.motion.length;
	this.motion.add(influence);
	this.motion.setLength(len);
}
function eagleBehavior() {
	var influence=newVectorCoords(this.xc,this.yc,player.xc,player.yc);
	influence.setLength(0.2);
	var len=this.motion.length;
	this.motion.add(influence);
	this.motion.setLength(len);
	influence=newVectorDL(180,0.1);
	var len=this.motion.length;
	this.motion.add(influence);
	this.motion.setLength(len);
	this.mesh.rotate(this.motion.copy());
}
function zipperBehavior() {
	this.motion.scale(1.01);
}
function curveSpawn() {
	//this.swip=Math.floor(Math.random()*2);
	this.offset=this.yc;
}
function curveBehavior() {

	var posx=15+Math.cos(toRadians((this.offset+this.xc)/(width/4)*90))*((height-30)/2)+(height-30)/2;
//	if (this.swip==0) var p=15+Math.cos(toRadians(this.xc/(width/4)*90))*((height-30)/2)+(height-30)/2;
//	else if (this.swip==1) var p=15+Math.sin(toRadians(this.xc/(width/4)*90))*((height-30)/2)+(height-30)/2;
	//this.motion=newVectorCoords(this.lpos[0],this.lpos[1],this.xc,posx);
	this.yc=posx;
}
function centiEvent(height) {
	this.wait=1;
	this.delay=3;
	this.height=height;
	this.count=2;
	while (Math.random() < 0.8) this.count++;
	this.run=centiRun;
}
function centiRun() {
	this.count--;
	if (this.count > 0) this.wait=this.delay;
	enemies.push(cutouts[4].clone(this.height));
}
function rockbossterBehavior() {
	if (this.xc < width/2) this.motion=newVectorDL(0,3);
	if (this.xc > width*0.75) this.motion=newVectorDL(180,3);
	if (this.delay==null) this.delay=0;

	if (Math.random() < 0.2) {
		var x=this.mesh.mesh[2][0]+this.xc-10;
		var y=this.mesh.mesh[2][1]+this.yc;
		var mot=newVectorCoords(x,y,player.xc,player.yc);
		mot.setLength(3);
		var bull=new Bullet(x,y,mot);
		bull.killplayer=true;
		fireBullet(bull);
	}
}

function changeMod(mod) {
	this.mod=mod;
	this.run=cModRun;
	this.wait=1;
}
function cModRun() {
	modifier=this.mod;
}

function findPos(obj) { //http://www.quirksmode.org/js/findpos.html thanks for awesome script
	var curleft = curtop = 0;
	if (obj.offsetParent) {
		do {
			curleft += obj.offsetLeft;
			curtop += obj.offsetTop;
		} while (obj = obj.offsetParent);
	}
	return [curleft,curtop];
}
function dbg(t){$("debug").innerHTML=t;}
function dbgp(t){$("debug").innerHTML+=t;}
function $(id) {return document.getElementById(id);}
