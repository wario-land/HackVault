var markdown;

function main() {
	var hash=window.location.hash;
	var hashId=hash.replace("#","");

	//If the markdown come from jekyll
	var fromJekyll=false;
	if (hashId.search("[0-9]{4}-[0-9]{2}-[0-9]{2}(.*)") != -1) {
		fromJekyll=true;
	}

	if (hashId != "") {
		initializeAjax(hashId,fromJekyll);
	}
}

function initializeAjax(markdownFile,fromJekyll) {
	var xhr = new XMLHttpRequest();
	xhr.overrideMimeType("text/markdown; charset=UTF-8");
	xhr.open('GET', "tutorials/"+markdownFile, true);

	xhr.onload = function(e) {
		if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
			markdown=xhr.response;
			initializeMarkdown(fromJekyll);
		}
	};
	xhr.send();
}

//True if the markdown come from jekyll
function initializeMarkdown(fromJekyll) {

	//Specific to jekyll
	var title;
	var author;

	if (fromJekyll) {
		var result;

		//Extracting stuff specific to jekyll 

		/*result=markdown.match("layout: (.*)");
		var layout=result[1];*/

		result=markdown.match("title: \"(.*)\"");
		title=result[1];

		/*result=markdown.match("author: (.*)");
		author=result[1];*/

		/*result=markdown.match("categories: (.*)");
		var categories=result[1];*/

		markdown=markdown.replace("---","");
		markdown=markdown.replace(/layout: (.*)/,"");
		markdown=markdown.replace(/title: \"(.*)\"/,"#"+title);
		markdown=markdown.replace(/author: (.*)/,"");
		markdown=markdown.replace(/categories: (.*)/,"");
		markdown=markdown.replace("---","");

	}

	var converter = new showdown.Converter();
	html=converter.makeHtml(markdown);
	
	//Applying markdown -> html
	document.getElementById("blog-post").innerHTML=html;	
	
	//Post-processing html (the goal is to keep jekyll markdown format and adapt it to fit)

	//Images (removing the extra / <jekyll> and adding class img-fluid)
	var images=document.getElementsByTagName("img");
	for (let i=0;i<images.length;i++) {
		if (fromJekyll) {
			var oldsrc=images[i].src;
			var newsrc=oldsrc.replace("file:///","tutorials/");
			images[i].src=newsrc;
		}
		images[i].setAttribute("class","img-fluid");
	}

	//Audio files (removing the extra / <jekyll>)
	if (fromJekyll) {
		var audios=document.getElementsByTagName("source");
		for (let i=0;i<audios.length;i++) {
			var oldsrc=audios[i].src;
			var newsrc=oldsrc.replace("file:///","tutorials/");
			audios[i].src=newsrc;
		}
	}
}