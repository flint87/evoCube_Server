var mySocket;

var cubeLocation;


function connect() {

	socket = io();

	socket.on("connect", function() {
		$("#status").hide(0);
		writeLog("connected");
		prepareQuestionnaire();
		mySocket = socket;
	});
	socket.on("disconnect", function() {
		$("#status").html("Internetverbindung unterbrochen");
		$("#status").show(0);
		//$("#status").html("Disconnected from Server");
		writeLog("Disconnect detected");
		$("#movieControls").hide(0);
		$("#initElements").show(0);
		initState = "noRemoteConnection";
	});
	socket.on("reconnecting", function(nextRetry) {
		$("#status").html("Internetverbindung unterbrochen");
		writeLog("Reconnect detected");
		$("#movieControls").hide(0);
		$("#initElements").show(0);
	});

	socket.on("reconnect_failed", function() {
		$("#status").html("Reconnect failed");
	});


}

//check if all items are filled out appropriate and send the questionnaire to the server
//request voucher code 
function sendToServer() {

	var currentQuestionnaireResult = {};
	currentQuestionnaireResult.personName = "Sepp";

	document.cookie = "questionnaire=yes; expires=Thu, 18 Dec 2030 12:00:00 GMT; path=/";
	document.cookie = "questionnaireDate="+ getTimeStamp() + "; expires=Thu, 18 Dec 2030 12:00:00 GMT; path=/";

	socket.emit("questionnaireFilledOut", cubeLocation, currentQuestionnaireResult, function(answer) {

		writeLog(answer);
		$("#sendQuestionnaireBtn").hide(0);
		$("#questionnaireDiv").hide(0);
		$("#welcome").html("Danke für das Abschließen des Fragebogens! Deine Gutscheinnummer = " + answer + ". Dein Gutschein ist nur heute am " + getTimeStamp() + " gültig.");

		
		document.cookie = "voucherNumber=" + answer + "; expires=Thu, 18 Dec 2030 12:00:00 GMT; path=/";


	});
}

//fill the questionnaire items with values
function prepareQuestionnaire() {

	//check if that client has already filled out a questionnaire before
	if (getCookie("questionnaire") == "yes") {

		$("#welcome").html("Du hast den Fragebogen bereits einmal am " + getCookie("questionnaireDate") + " ausgefüllt. Danke! Deine Gutscheinnummer war " + getCookie("voucherNumber"));
	} else {

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

		for (var u = 13; u < 100; u++) {
			$("#ageSelect").append("<option>" + u + "</option>");
		}
		$("#ageSelect").trigger('create');


		$("#sendQuestionnaireBtn").show(0);
		$("#questionnaireDiv").show(0);
	}

	$("#welcome").show(0);


}



//##############################
//Utility Functions
//#############################

//extracts the cookie content from the given cookie name
function getCookie(cname) {
	var name = cname + "=";
	var ca = document.cookie.split(';');
	for (var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') c = c.substring(1);
		if (c.indexOf(name) != -1) return c.substring(name.length, c.length);
	}
	return "";
}

//create a timestamp 
function getTimeStamp() {
	var year = new Date().getFullYear();
	var month = new Date().getMonth() + 1;
	month = (month < 10 ? "0" : "") + month;
	var day = new Date().getDate();
	day = (day < 10 ? "0" : "") + day;
	return day + "." + month + "." + year;
}


//browser side logging with timestap
function writeLog(message) {
	console.log(new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds() + " " + message);
}