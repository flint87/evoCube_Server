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

	currentQuestionnaireResult.sex = $("#sexSelect option:selected").text();
	currentQuestionnaireResult.age = $("#ageSelect option:selected").text();

	currentQuestionnaireResult.q2 = {};
	currentQuestionnaireResult.q2.question = $("#question2 #question").attr("name");
	currentQuestionnaireResult.q2.answer = $("#question2 input[type='radio']:checked").val();

	currentQuestionnaireResult.q3 = {};
	currentQuestionnaireResult.q3.question = $("#question3 #question").attr("name");
	currentQuestionnaireResult.q3.answer = $("#question3 input[type='radio']:checked").val();

	currentQuestionnaireResult.q4 = {};
	currentQuestionnaireResult.q4.question = $("#question4 #question").attr("name");
	currentQuestionnaireResult.q4.answer = $("#question4 input[type='radio']:checked").val();

	currentQuestionnaireResult.q5 = {};
	currentQuestionnaireResult.q5.question = $("#question5 #question").attr("name");
	currentQuestionnaireResult.q5.answer = $("#question5 input[type='radio']:checked").val();

	currentQuestionnaireResult.q6 = {};
	currentQuestionnaireResult.q6.question = $("#question6 #question").attr("name");
	currentQuestionnaireResult.q6.answer = $("#question6 input[type='radio']:checked").val();

	currentQuestionnaireResult.q7 = {};
	currentQuestionnaireResult.q7.question = $("#question7 #question").attr("name");
	currentQuestionnaireResult.q7.answer = $("#question7 input[type='radio']:checked").val();

	currentQuestionnaireResult.q8 = {};
	currentQuestionnaireResult.q8.question = $("#question8 #question").attr("name");
	currentQuestionnaireResult.q8.answer = $("#question8 input[type='radio']:checked").val();

	currentQuestionnaireResult.q9 = {};
	currentQuestionnaireResult.q9.question = $("#question9 #question").attr("name");
	currentQuestionnaireResult.q9.answer = [];
	$('#question9 input[type="checkbox"]').each(function() {
		if ($(this).is(':checked')) currentQuestionnaireResult.q9.answer.push($(this).val());
	});

	currentQuestionnaireResult.q10 = {};
	currentQuestionnaireResult.q10.question = $("#question10 #question").attr("name");
	currentQuestionnaireResult.q10.answer = [];
	$('#question10 input[type="checkbox"]').each(function() {
		if ($(this).is(':checked')) currentQuestionnaireResult.q10.answer.push($(this).val());
	});

	currentQuestionnaireResult.q11 = {};
	currentQuestionnaireResult.q11.question = $("#question11 #question").attr("name");
	currentQuestionnaireResult.q11.answer = $("#question11 input[type='radio']:checked").val();

	currentQuestionnaireResult.q12 = {};
	currentQuestionnaireResult.q12.question = $("#question12 #question").attr("name");
	currentQuestionnaireResult.q12.answer = $("#question12 input[type='radio']:checked").val();

	currentQuestionnaireResult.q13 = {};
	currentQuestionnaireResult.q13.question = $("#question13 #question").attr("name");
	currentQuestionnaireResult.q13.answer = $("#question13 input[type='radio']:checked").val();

	currentQuestionnaireResult.q14 = {};
	currentQuestionnaireResult.q14.question = $("#question14 #question").attr("name");
	currentQuestionnaireResult.q14.answer = $("#question14 input[type='radio']:checked").val();

	currentQuestionnaireResult.q15 = {};
	currentQuestionnaireResult.q15.question = $("#question15 #question").attr("name");
	currentQuestionnaireResult.q15.answer = [];
	$('#question15 input[type="checkbox"]').each(function() {
		if ($(this).is(':checked')) currentQuestionnaireResult.q15.answer.push($(this).val());
	});

	currentQuestionnaireResult.q16 = {};
	currentQuestionnaireResult.q16.question = $("#question16 #question").attr("name");
	currentQuestionnaireResult.q16.answer = $("#question16 input[type='radio']:checked").val();

	currentQuestionnaireResult.q17 = {};
	currentQuestionnaireResult.q17.question = $("#question17 #question").attr("name");
	currentQuestionnaireResult.q17.answer = $("#question17 input[type='text']").val();

	//writeLog(JSON.stringify(currentQuestionnaireResult));

	document.cookie = "questionnaire=yes; expires=Thu, 18 Dec 2030 12:00:00 GMT; path=/";
	document.cookie = "questionnaireDate=" + getTimeStamp() + "; expires=Thu, 18 Dec 2030 12:00:00 GMT; path=/";

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
	if (getCookie("questionnaire") == "yesKRAWUZIKAPUZI") {

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