var socket;

var cubeLocation;


function connect() {

	socket = io();

	socket.on("connect", function() {
		$("#status").hide(0);
		writeLog("connected");
		prepareQuestionnaire();
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

//fill the questionnaire items with values
function prepareQuestionnaire(){

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

}

//check if all items are filled out appropriate and send the questionnaire to the server
//request voucher code 
function sendToServer(){

	var currentQuestionnaireResult = {};
	currentQuestionnaireResult.personName = "Sepp";
	
	socket.emit("questionnaireFilledOut", cubeLocation, currentQuestionnaireResult, function(answer) {
		
			$("#sendQuestionnaireBtn").hide(0);
			$("#questionnaireDiv").hide(0);
			$("#welcome").html("Danke für das Abschließen des Fragebogens! Deine Gutscheinnummer = " + answer);
			
			writeLog(answer);

		
	});
}






//##############################
//Utility Functions
//#############################


//logging with timestap
function writeLog(message) {
	console.log(new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds() + " " + message);
}