function genSphereMapPartURL(panoId, pX, pY) {
  return "https://mapsv0.bdimg.com/?qt=pdata&sid=" +
    panoId +
    "&pos=" +
    pY +
    "_" +
    pX +
    "&z=4&udt=20200328&quality=100";
}
function getURLsForPanoId(panoId) {
  //panoId, ex: 09005700121708201217124992S
  var urlArray = [], x = 0, y = 0;
  for (y = 0; y < 4; y++) {
    for (x = 0; x < 8; x++) {
      urlArray.push(genSphereMapPartURL(panoId, x, y));
    }
  }
  return urlArray;
}

function loadImage(src) {
  return new Promise(function(resolve, reject) {
    var img = new Image();
    img.onerror = reject;
    img.onload = function(){
      resolve(img);
    }
    img.src = src;
  });
}

function removeAllChildren(elem) {
  if(!elem){
    return elem;
  }
  while (elem.lastChild) {
    elem.removeChild(elem.lastChild);
  }
  return elem;
}
function drawImagesToCanvas(images) {
  var parent = removeAllChildren(document.getElementById("imgContainer"));
  var canvas = document.createElement("canvas");
  var x = 0, y = 0, ctx;
  parent.appendChild(canvas);
  canvas.width = 4096;
  canvas.height = 2048;
  ctx = canvas.getContext("2d");
  for (y = 0; y < 4; y++) {
    for (x = 0; x < 8; x++) {
      ctx.drawImage(images[x+(y*8)], x * 512, y * 512);
    }
  }
}
function drawPanoIDAsync(panoId) {
  var urls = getURLsForPanoId(panoId);
  return Promise.all(urls.map(function(url){
    return loadImage(url);
  }))
  .then(function(images){
    drawImagesToCanvas(images);
    return true;
  })
}
function setHint(hintText, color = "#000", useHTML) {
  var hintElem = document.getElementById("hint");
  var hintStr = hintText + "";

  if (typeof hintStr!=='string' || hintStr.length === 0) {
    hintElem.style.display = "none";
  } else {
    hintElem.style.display = "block";
    if (useHTML) {
      hintElem.innerHTML = hintText;
    } else {
      hintElem.innerText = hintText;
    }
    hintElem.style.color = color || "#000";
  }
}
function resetStartHint() {


  /*
  var exampleURL =
    "https://ditu.baidu.com/search/%E5%BB%B6%E5%AE%89%E9%A5%AD%E5%BA%97/@13520342.38,3639957.53,21z,87t,-83.28h?querytype=s&da_src=shareurl&wd=%E5%BB%B6%E5%AE%89%E9%A5%AD%E5%BA%97&c=2912&src=0&wd2=%E4%B8%8A%E6%B5%B7%E5%B8%82%E9%9D%99%E5%AE%89%E5%8C%BA&pn=0&sug=1&l=12&b=(12656970.55,2498624.71;12762442.55,2559296.71)&from=webmap&biz_forward=%7B%22scaler%22:2,%22styles%22:%22pl%22%7D&sug_forward=50fb64ffeef21a44e8f853e4&device_ratio=2#panoid=09000300121709051326379916A&panotype=street&heading=159.77&pitch=20.55&l=21&tn=B_NORMAL_MAP&sc=0&newmap=1&shareurl=1&pid=09000300121709051326379916A";
  var exampleURLBold =
    "https://ditu.baidu.com/search/%E5%BB%B6%E5%AE%89%E9%A5%AD%E5%BA%97/@13520342.38,3639957.53,21z,87t,-83.28h?querytype=s&da_src=shareurl&wd=%E5%BB%B6%E5%AE%89%E9%A5%AD%E5%BA%97&c=2912&src=0&wd2=%E4%B8%8A%E6%B5%B7%E5%B8%82%E9%9D%99%E5%AE%89%E5%8C%BA&pn=0&sug=1&l=12&b=(12656970.55,2498624.71;12762442.55,2559296.71)&from=webmap&biz_forward=%7B%22scaler%22:2,%22styles%22:%22pl%22%7D&sug_forward=50fb64ffeef21a44e8f853e4&device_ratio=2#panoid=<b>09000300121709051326379916A</b>&panotype=street&heading=159.77&pitch=20.55&l=21&tn=B_NORMAL_MAP&sc=0&newmap=1&shareurl=1&pid=09000300121709051326379916A";

  var startHint = 
    "To get started, open to your desired location in baidu maps street view, and then copy the 'panoid' from the url. \n\nExample: if your url is <a target='_blank' rel='noopener noreferrer' href='" +
    exampleURL +
    "'>" +
    exampleURLBold +
    "</a>, then your pano id is <b>09000300121709051326379916A</b>";
  */

  var startHint = "To get started, open your desired location in baidu maps street view, then copy and paste the url into input box above, and then click 'Generate Spheremap'."

  setHint(startHint, "#000", true);
}
function runSphereMapGenUI() {
  var btn = document.getElementById("panoIdRun");
  const panoIdValue = document.getElementById("panoIdInput").value.trim();
  if(panoIdValue.length<4){
    btn.disabled = true;
    setHint("Invalid Baidu Maps URL!", "#e22");
    setTimeout(function(){
      btn.disabled = false;
      resetStartHint();
    },2000);
    return;
  }
  btn.disabled = true;
  btn.innerText = "Loading...";
  setHint("Loading...");
  window.badiuMapURLTools.getPanoIdFromBadiuURLAsync(panoIdValue)
  .then(function(panoId){
    return drawPanoIDAsync(panoId);
  })
  .then(function(){
    btn.innerText = "Generate Spheremap";
    btn.disabled = false;
    setHint(
      "To download your sphere map, right click on the canvas and click 'Save Image As...'"
    );
  })
  .catch(function(error){
    btn.innerText = "Generate Spheremap";
    btn.disabled = false;
    console.error(error);
    setHint(
      "ERROR: "+(error&&error.message)?(error.message):("Network Error or Invalid Pano ID!"),
      "#e22",
      false
    );
  })

}
function initMainBD() {
  resetStartHint();

  document.getElementById("panoIdRun")
    .addEventListener("click", runSphereMapGenUI, false);
}

initMainBD();
