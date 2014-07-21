function connect() {

	//get the query parameters to determine to which cubeLocation this page call belongs to
	var query_string = {};
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split("=");
		// If first entry with this name
		if (typeof query_string[pair[0]] === "undefined") {
			query_string[pair[0]] = pair[1];
			// If second entry with this name
		} else if (typeof query_string[pair[0]] === "string") {
			var arr = [query_string[pair[0]], pair[1]];
			query_string[pair[0]] = arr;
			// If third or later entry with this name
		} else {
			query_string[pair[0]].push(pair[1]);
		}
	}
	cubeLocation = query_string.location;

	if (cubeLocation == "rechbauer") {
		window.location.replace("https://www.facebook.com/pages/Filmzentrum-im-Rechbauerkino/117408941013");
	}
}