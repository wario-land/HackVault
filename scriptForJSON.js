var json;

function main() {
	initializeAjax();
}

function initializeAjax() {
	var xhr = new XMLHttpRequest();
	xhr.overrideMimeType("application/json");
	xhr.open('GET', 'romhacks.json', true);

	xhr.onload = function(e) {
	if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
		json=JSON.parse(xhr.response);
		console.log(json);
		loadJSON();
		}
	};
	xhr.send();
}

function loadJSON() {
	var list=document.getElementById("list");
	var data = json;
	var html = '';
	for(let i=0;i<data.length;i++) {
		var divHack=document.createElement('div');
			divHack.className="hack";

			var divTitle=document.createElement('div');
			divTitle.className="row";
			divTitle.innerHTML='<div class="col"><strong>'+data[i]["name"]+'</strong></div>';
			divHack.appendChild(divTitle);

			//TODO

			var divTags=document.createElement('div');
			divTags.className="row";
			divTags.innerHTML='<div class="col">Tags: '+data[i]["tags"]+'</div>';
			divHack.appendChild(divTags);

		list.appendChild(divHack);
	}
}
