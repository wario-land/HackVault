var markdown;

function main() {
	window.addEventListener("hashchange", hashChange);
	hashChange();
}

function hashChange() {
	var hash=window.location.hash;
	var hashId=hash.replace("#","");

	if (hashId != "") {
		initializeAjax(hashId);

	} else {
		resetPage();
	}
}

function initializeAjax(markdownFile) {
	var xhr = new XMLHttpRequest();
	xhr.overrideMimeType("text/markdown; charset=UTF-8");
	if (markdownFile.includes(".mmd")) {
		xhr.open('GET', "PCG/"+markdownFile, true);
	} else {
		xhr.open('GET', "tutorials/"+markdownFile, true);
	}

	xhr.onload = function(e) {
		if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
			markdown=xhr.response;

			// we want to modify the markdown things here
			// to replace the img file links to fit the runtime path
			// the string contents of the md file is saved in markdown, just replace substr in it
			// TODO

			initializeMarkdown();
		}
	};
	xhr.send();
}

function initializeMarkdown() {

	// the old code which used showdown.js to render markdown on webpages
	// var converter = new showdown.Converter();
	// html=converter.makeHtml(markdown);
	// document.getElementById("blog-post").innerHTML = html;

	//Applying markdown -> html
	const el = document.getElementById("blog-post");
	if (el) {
		const options = {
			htmlTags: true
		};
		const html = window.render(markdown, options);
		el.innerHTML = html;
	}

	//Post-processing html (the goal is to keep markdown format and adapt it to fit)

	//Images (adding class img-fluid)
	var images=document.getElementsByTagName("img");
	for (let i=0;i<images.length;i++) {
		images[i].setAttribute("class","img-fluid");
	}

}

function resetPage() {
	document.getElementById("blog-post").innerHTML="";
}
