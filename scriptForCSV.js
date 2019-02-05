var csv;

function main() {
	initializeAjax();
}

function initializeAjax() {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', 'romhacks.csv', true);
	xhr.responseType = 'text';

	xhr.onload = function(e) {
	if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
		csv=xhr.response;
		loadCSV();
		}
	};
	xhr.send();
}

function loadCSV() {
	var list=document.getElementById("list");
	var data = $.csv.toArrays(csv);
	var html = '';
	for(let i=1;i<data.length;i++) {
		var divHack=document.createElement('div');
			divHack.className="hack";
			
			var divTitle=document.createElement('div');
			divTitle.className="row";
			divTitle.innerHTML='<div class="col"><strong>'+data[i][0]+'</strong></div>';
			divHack.appendChild(divTitle);
			
			//TODO
			
			var divTags=document.createElement('div');
			divTags.className="row";
			divTags.innerHTML='<div class="col">Tags: '+data[i][7]+'</div>';
			divHack.appendChild(divTags);
			
		list.appendChild(divHack);
	}
}

/*var contents = db.exec("SELECT name, id FROM resto");
// contents is now [{columns:['col1','col2',...], values:[[first row], [second row], ...]}]
var table=contents[0]['values'];

var ul=document.createElement('ul');
var li;
for (i = 0; i < table.length; i++) {
var li=document.createElement('li');
li.innerHTML=table[i][0];
li.onclick=loadAvisFromId(table[i][1]);
ul.appendChild(li);
}
document.getElementById("navbar").appendChild(ul);*/	
