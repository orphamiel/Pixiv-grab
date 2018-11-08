function notifyExtension(current_doc) {
	return function(e) {
		//start downloading illusts if any
		var illusts = current_doc.documentElement.innerHTML.split("illust_id=");
		var i;
		var downloaded_illusts = [];
		for (i=0; i<illusts.length; i++){
			if(i!==0){
				var illust_id = illusts[i].split('"')[0];
				if(!downloaded_illusts.includes(illust_id)){
					downloaded_illusts.push(illust_id);
					browser.runtime.sendMessage({id:illust_id, type:"illust"});
				}
			}
		}
		//start downloading sketches if any
		var sketches = current_doc.documentElement.innerHTML.split("http://sketch.pixiv.net/items/");
		var j;
		var downloaded_sketches = [];
		for (j=0; j<sketches.length; j++){
			if(j!==0){
				var sketch_id = sketches[j].split("?")[0];
				if(!downloaded_sketches.includes(sketch_id)){
					downloaded_sketches.push(sketch_id);
					browser.runtime.sendMessage({id:sketch_id, type:"sketch"});
				}
			}
		}
	}
}

//can inject into root for users or wrapper for tags instead of just using html
var rootDiv = document.getElementsByTagName("html")[0];
var topRoot = document.getElementsByClassName("gdzJXyP")[0];
var start_button = document.createElement('button');
start_button.textContent = "Download all";
start_button.addEventListener("click", notifyExtension(document));
rootDiv.insertBefore(start_button, rootDiv.firstChild);
