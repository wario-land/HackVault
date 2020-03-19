var markdown;

function main() {
	var hash=window.location.hash;
	var hashId=hash.replace("#","");

	if (hashId != "") {
		initializeAjax(hashId);
	}
}

function initializeAjax(markdownFile) {
	var xhr = new XMLHttpRequest();
	xhr.overrideMimeType("text/markdown; charset=UTF-8");
	xhr.open('GET', "tutorials/"+markdownFile, true);

	xhr.onload = function(e) {
		if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
			markdown=xhr.response;
			initializeMarkdown();
		}
	};
	xhr.send();
}

function initializeMarkdown() {

	var converter = new showdown.Converter();
	html=converter.makeHtml(markdown);
	
	//Applying markdown -> html
	document.getElementById("blog-post").innerHTML=html;	
	
	//Post-processing html (the goal is to keep markdown format and adapt it to fit)

	//Images (adding class img-fluid)
	var images=document.getElementsByTagName("img");
	for (let i=0;i<images.length;i++) {
		images[i].setAttribute("class","img-fluid");
	}

}
