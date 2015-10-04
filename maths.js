/* eslint-disable */
function distance(x1, y1, x2, y2) {
	return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}
function segInt(p1, p2, p3, p4) {
	return segIntersection(p1[0],p1[1],p2[0],p2[1],p3[0],p3[1],p4[0],p4[1]);
}
function pathCollisions(path,mesh) {
	var tmesh=[];
	//for (var i in mesh.mesh) {
	for (var i = 0, l = mesh.mesh.length;i < l;i++) {
		tmesh[i]=[mesh.mesh[i][0]+mesh.pos[0],mesh.mesh[i][1]+mesh.pos[1]];
	}
	var collisions=new Array();
	//for (var i=0;i < tmesh.length - 1;i++) {
	for (var i = 0, l = tmesh.length - 1;i < l;i++) {
		var cur=segIntersection(path[0][0],path[0][1],path[1][0],path[1][1],tmesh[i][0],tmesh[i][1],tmesh[i+1][0],tmesh[i+1][1]);
		if (cur != null) collisions.push(cur);
	}
	if (collisions[0] != null) return collisions;
	return null;
}
/**
Originally coded in Java by Ryan Alexander
*/
// Line Segment Intersection

function segIntersection(x1, y1, x2, y2, x3, y3, x4, y4)
{
  var bx = x2 - x1;
  var by = y2 - y1;
  var dx = x4 - x3;
  var dy = y4 - y3;
  var b_dot_d_perp = bx * dy - by * dx;
  if(b_dot_d_perp == 0) {
    return null;
  }
  var cx = x3 - x1;
  var cy = y3 - y1;
  var t = (cx * dy - cy * dx) / b_dot_d_perp;
  if(t < 0 || t > 1) {
    return null;
  }
  var u = (cx * by - cy * bx) / b_dot_d_perp;
  if(u < 0 || u > 1) {
    return null;
  }
  return [x1+t*bx, y1+t*by];
}

function polyContains(poly,x,y) {
	var farleft=poly[0][0];
	var fartop=poly[0][1];
	for (var i=1, l = poly.length;i < l;i++) {
		if (poly[i][0] < farleft) farleft=poly[i][0];
		if (poly[i][1] < fartop) fartop=poly[i][1];
	}
	var col=0;
	for (var i=0, l = poly.length - 1;i < l;i++) {
		if (segIntersection(farleft,fartop,x,y, poly[i][0],poly[i][1],poly[i+1][0],poly[i+1][1]) != null) col++;
	}
	if (col%2==0) return false;
	return true;
}

function polyCollides(poly,poly2) {
	for (var i=0, l = poly.length-1;i<l;i++) {
		for (var i2=0, l2 = poly2.length-1;i2<l2;i2++) {
			if (segIntersection(poly[i][0],poly[i][1],poly[i+1][0],poly[i+1][1],poly2[i2][0],poly2[i2][1],poly2[i2+1][0],poly2[i2+1][1]) != null) return true;
		}
	}
	if (polyContains(poly2,poly[0][0],poly[0][1])) return true;
	if (polyContains(poly,poly2[0][0],poly2[0][1])) return true;
	return false;
}
/**
Originally coded in Java by Ryan Alexander
*/
// Infinite Line Intersection
function lineIntersection(x1, y1, x2, y2, x3, y3, x4, y4)
{
  var bx = x2 - x1;
  var by = y2 - y1;
  var dx = x4 - x3;
  var dy = y4 - y3;
  var b_dot_d_perp = bx*dy - by*dx;
  if(b_dot_d_perp == 0) {
    return null;
  }
  var cx = x3-x1;
  var cy = y3-y1;
  var t = (cx*dy - cy*dx) / b_dot_d_perp;

  return [x1+t*bx, y1+t*by];
}
