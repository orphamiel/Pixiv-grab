browser.runtime.onMessage.addListener(on_notify);

function on_notify(items){
	if(items['type']==="illust"){
		download_illust(items['id']);
	}
	else if(items['type']==="sketch"){
		download_sketches(items['id']);
	}
}

function download_sketches(sketch_id){
	var ref = "https://sketch.pixiv.net/items/" + sketch_id;
	$.ajax({
		url: ref,
		type: "GET",
		xhrFields: {
			withCredentials: true
		},
		success: function(result){
			var url = result.split('"original":')[1].split('"url":"')[1].split('"')[0].replace(/\\u002F/g, "/");
			start_download(url, "");
		},
		error:function(error){
			console.log(`Error ${error}`);
		}
	})
}

function download_original(full, ref, name){
	//remove extra backslashes from link
	var to_down = full.replace(/\\/g, '');	
	browser.webRequest.onBeforeSendHeaders.addListener(
		rewriteUserAgentHeaderAsync(ref),
		{urls: [to_down]},
		["blocking", "requestHeaders"]
	);
	
	//run a get request with ajax to ensure that the referer is set
	$.ajax({
		url: to_down,
		type: "GET",
		xhrFields: {
			withCredentials: true
		},
		success: function(result){
			start_download(to_down, name);
		},
		error:function(error){
			console.log(`Error ${error}`);
		}
	})
}

function onStartedDownload(id) {
	console.log(`Started downloading: ${id}`);
}

function onFailed(error) {
	console.log(`Download failed: ${error}`);
}

function start_download(to_down, name){
	//get filename to save as
	var final_name;
	var path_items = to_down.split("/");
	if (name!==""){
		final_name = name + "-" + path_items[path_items.length-1];
	}
	else{
		final_name = path_items[path_items.length-1];
	}
	var downloading = browser.downloads.download({
		url : to_down,
		filename : final_name,
		conflictAction : 'uniquify'
	});
	downloading.then(onStartedDownload, onFailed);
}

function rewriteUserAgentHeaderAsync(ref) {
	return function(e) {
		var set = false;
		for (var header of e.requestHeaders) {
			if (header.name.toLowerCase() === "referer") {
				set = true;
				header.value = ref;
			}
		}
		if (!set){
			e.requestHeaders.push( { name : "referer" , value : ref } );
		}	
		return {requestHeaders: e.requestHeaders};
	}
}

function download_illust(illust_id){
	var ref = "https://www.pixiv.net/member_illust.php?mode=medium&illust_id=" + illust_id;
	$.ajax({
		url: ref,
		type: "GET",
		xhrFields: {
			withCredentials: true
		},
		success: function(result){
			if(result.indexOf('original') > -1){
				// forcing method
				//get number of pages so we can check if its a manga
				var pages = result.split('"illustId":"' + illust_id)[2].split("}")[0].split('"pageCount":')[1].split(",")[0];
				if(pages>1){
					//fetch mangas over 1 page again
					ref = "https://www.pixiv.net/member_illust.php?mode=manga&illust_id=" + illust_id;
					$.ajax({
						url: ref,
						type: "GET",
						xhrFields: {
							withCredentials: true
						},
						success: function(result){
							var url = result.split('data-src="')[1].split('"')[0];
							//remove invalid characters after too
							var name = result.split("title")[1].split("「")[1].split("」")[0].replace(/[/\\?%*:|"<>]/g, '-');
							download_original(url, ref, name);
						},
						error: function(error){
							console.log(`Error ${error}`);
						}
					})
				}
				else{
					//get original url of image - non manga
					var start_url = result.slice(result.indexOf("original")+11);
					var full_url = start_url.slice(0, start_url.indexOf("}")-1);
					//use title as filename
					var name = result.split("title")[1].split("「")[1].split("」")[0].replace(/[/\\?%*:|"<>]/g, '-');;
					download_original(full_url, ref, name);
				}
			}
		},
		error:function(error){
			console.log(`Error ${error}`);
		}
	})
}
