window.badiuMapURLTools = (function(){
  
var jsonpUniqueCounter = Math.floor(Date.now()/1000);
function makeJsonpCallback(src, callback, forceId, currentErrorCount){
	var errorCt = typeof currentErrorCount ==='number' ? currentErrorCount : 0;
	var id=forceId?forceId:"jSoNP_CbCB_"+(Date.now().toString(36))+"_"+(jsonpUniqueCounter++);
  
  if(forceId && window[id]){
		return setTimeout(function(){makeJsonpCallback(src,callback,forceId)},250);
  }
  
	var scriptElement = document.createElement("script");
	scriptElement.onerror=function(error){
		if(errorCt>=4) {
      callback(error || new Error("Error Loading Script!"));
    }else{
      setTimeout(function(){ 
        makeJsonpCallback(src, callback, forceId, errorCt+1);
      }, 500);
    }
	};
	window[id] = function(response){
    delete window[id];
    scriptElement.parentElement.removeChild(scriptElement);
    callback(null, response);
  };
	scriptElement.src = src+encodeURIComponent(id);
	document.body.appendChild(scriptElement);
}
function makeJsonpPromise(src, forceId) {
  return new Promise(function(resolve, reject){
    makeJsonpCallback(src, function(error, response){
      if(error){
        reject(error);
      }else{
        resolve(response);
      }
    }, forceId);
  });
}
function getCoordinatesFromBaiduMapURL(url) {
  var atInd = url.indexOf("@");
  if(atInd===-1){
    return null;
  }
  var qMarkInd = url.indexOf("?");
  if(qMarkInd===-1){
    qMarkInd = url.length;
  }
  var parts = url.substring(atInd+1, qMarkInd);
  var splitThat = parts.split(",");
  var zValue = splitThat.filter(function(part){
    if(part.indexOf("z")!==-1){
      return true;
    }
  })[0]||"19z";
  var x = parseFloat(splitThat[0]);
  var y = parseFloat(splitThat[1]);
  var z = parseFloat(zValue.replace(/[^0-9|\-|\.]/g,""));
  if(isNaN(x)||isNaN(y)||isNaN(z)){
    return null;
  }

  return {
    x: x,
    y: y,
    z: z,
  }
}
function panoIdLookupBaidu(x, y, z) {
  var url = "https://mapsv0.bdimg.com/?qt=qsdata&x="+
    encodeURIComponent(x+"")+
    "&y="+encodeURIComponent(y+"")+
    "&l="+encodeURIComponent(z+"")+
    "&action=0&mode=day&t="+encodeURIComponent(Date.now()+"")+"&fn=";
  return makeJsonpPromise(url)
  .then(function(result){
    if(typeof result!=='object'||!result||!result.content||!result.content.id){
      throw new Error("Invalid response from baidu when fetching the pano id!");
    }
    return result.content.id;
  })
}
function getPanoIdFromBadiuURLAsync(url){
  if(url.indexOf("://")===-1&&url.length>20&&url.length<35&&!(/[^A-Z|0-9]/.test(url))){
    return Promise.resolve(url);
  }

  var basicPanoId = getPanoIdFromBaiduURLBasic(url);
  if(basicPanoId) {
    return Promise.resolve(basicPanoId);
  }
  var coords = getCoordinatesFromBaiduMapURL(url);
  if(!coords){
    return Promise.reject(new Error("Error parsing coordinates from URL!")); 
  }
  return panoIdLookupBaidu(coords.x, coords.y, coords.z);
}
function getPanoIdFromBaiduURLBasic(url){
  var panoIdInd = url.indexOf("panoid=");
  if(panoIdInd===-1){
    return null;
  }
  var andAfterPano = url.indexOf("&", panoIdInd);
  var tmp = "";
  if(andAfterPano===-1) {
    tmp = url.substring(panoIdInd+7);
  }else{
    tmp = url.substring(panoIdInd+7, andAfterPano);
  }
  if(tmp.length>20&&tmp.length<35&&!(/[^A-Z|0-9]/.test(tmp))){
    return tmp;
  }else{
    return null;
  }
}
return {
  getPanoIdFromBadiuURLAsync: getPanoIdFromBadiuURLAsync,
}
})();
