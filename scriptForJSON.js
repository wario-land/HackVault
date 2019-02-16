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
		//console.log(json);
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
			divHack.className="hack shadow-sm p-3 mb-3 bg-white rounded";
			
			var divTitle=document.createElement('div');
			divTitle.className="row";
			divTitle.innerHTML='<div class="col"><strong>'+data[i]["name"]+'</strong></div>';
			divHack.appendChild(divTitle);
			
			var divCentral=document.createElement('div');
			divCentral.className="row";
				var divCarousel=document.createElement('div');
				divCarousel.className="col-sm-3";
					var divCarouselControls=document.createElement('div');
					divCarouselControls.setAttribute("id","carouselExampleControls-i"+i);
					divCarouselControls.className="carousel slide";
					divCarouselControls.setAttribute("data-ride","carousel");
						var divCarouselInner=document.createElement('div');
						divCarouselInner.className="carousel-inner";
						for (let j=0; j<data[i]["images"].length;j++) {
							var divItemI=document.createElement('div');
							if (j==0) {
								divItemI.className="carousel-item active";
							} else {
								divItemI.className="carousel-item";
							}
							divItemI.innerHTML='<img src="./images/'+data[i]["images"][j]+'" class="d-block w-100" alt="'+data[i]["images"][j]+'"/>'						
							divCarouselInner.appendChild(divItemI);
						}
						
						divCarouselControls.appendChild(divCarouselInner);
						divCarouselControls.innerHTML+='<a class="carousel-control-prev" href="#carouselExampleControls-i'+i+'" role="button" data-slide="prev"> <span class="carousel-control-prev-icon" aria-hidden="true" > </span> <span class="sr-only">Previous</span> </a> <a class="carousel-control-next" href="#carouselExampleControls-i'+i+'" role="button" data-slide="next" > <span class="carousel-control-next-icon" aria-hidden="true" ></span> <span class="sr-only">Next</span> </a>';
					
					divCarousel.appendChild(divCarouselControls);
	
				divCentral.appendChild(divCarousel);
			
				var divDescription=document.createElement('div');
				divDescription.className="col-sm-5";
				divDescription.innerHTML=""//"Hack Description:";
				divDescription.innerHTML+='<p> Creator: '+data[i]["creator"]+' <br />Date Submitted: '+data[i]["date"];
				divDescription.innerHTML+='Difficulty: <span class="badge badge-pill badge-primary badge-'+(data[i]["difficulty"].toLowerCase())+'">'+data[i]["difficulty"]+'</span></p>';
				divDescription.innerHTML+='<p>'+data[i]["description"]+'</p>';
				divCentral.appendChild(divDescription);
				
				var divDownload=document.createElement('div');
				divDownload.className="col-sm-4";
				divDownload.innerHTML="Progress:";
					var divProgress=document.createElement('div');
					divProgress.setAttribute('style',"height: 20px;");
					divProgress.className="progress";
					divProgress.innerHTML='<div class="progress-bar bg-info" role="progressbar" style="width: '+data[i]["progress"]+'%" aria-valuenow="'+data[i]["progress"]+'" aria-valuemin="0" aria-valuemax="100">'+data[i]["progress"]+'%</div>';
					divDownload.appendChild(divProgress);
					
					divDownload.innerHTML+="<p>Rating: "+data[i]["rating"]+"/5</p>";
					
					var aDownload=document.createElement('a');
					aDownload.setAttribute("id","btn-download");
					aDownload.className="btn btn-primary float-right btn-lg";
					aDownload.setAttribute("href","./Hacks/"+data[i]["filename"]);
					aDownload.setAttribute("role","button");
					aDownload.innerHTML="Download";
					divDownload.appendChild(aDownload);
					
				
				divCentral.appendChild(divDownload);
			
			
			divHack.appendChild(divCentral);
			//TODO
			
			var divTags=document.createElement('div');
			divTags.className="row";
			divTags.innerHTML='<div class="col">Tags: '+data[i]["tags"]+'</div>';
			divHack.appendChild(divTags);
			
		list.appendChild(divHack);
	}
}
