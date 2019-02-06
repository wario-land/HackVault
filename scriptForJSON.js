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
	    divHack.className="hack";
	    
	    var divTitle=document.createElement('div');
	    divTitle.className="row";
	    divTitle.innerHTML='<div class="col"><strong>'+data[i]["name"]+'</strong></div>';
	    divHack.appendChild(divTitle);
	    
	    //TODO
	    /*var divCarousel=document.createElement('div');
	    divCarousel.clasName="row";
	    divCarousel.innerHTML='<div class="col-sm-3"><div id="carouselExampleControls" class="carousel slide" data-ride="carousel"><div class="carousel-inner">
                      <div class="carousel-item active">
                        <img
                          src="./images/versusKleyman.png"
                          class="d-block w-100"
                          alt="versusKleyman"
                        />
                      </div>
                      <div class="carousel-item">
                        <img
                          src="./images/versusKleymanBossFight.png"
                          class="d-block w-100"
                          alt="versusKleymanBossFight"
                        />
                      </div>
                    </div>
                    <a
                      class="carousel-control-prev"
                      href="#carouselExampleControls"
                      role="button"
                      data-slide="prev"
                    >
                      <span
                        class="carousel-control-prev-icon"
                        aria-hidden="true"
                      ></span>
                      <span class="sr-only">Previous</span>
                    </a>
                    <a
                      class="carousel-control-next"
                      href="#carouselExampleControls"
                      role="button"
                      data-slide="next"
                    >
                      <span
                        class="carousel-control-next-icon"
                        aria-hidden="true"
                      ></span>
                      <span class="sr-only">Next</span>
                    </a>
                  </div>
</div>';
	    divHack.appendChild(divCarousel);*/
	    
	    var divTags=document.createElement('div');
	    divTags.className="row";
	    divTags.innerHTML='<div class="col">Tags: '+data[i]["tags"]+'</div>';
	    divHack.appendChild(divTags);
	    
	    list.appendChild(divHack);
	}
}
