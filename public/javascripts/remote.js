var socket;
var initState = "noRemoteConnection";
var trailers;
//set the time when a remote connection should be closed automatically. 10 minutes at the moment.
var disconnectTimeout = 600000;
var myDisconnectTimer;

//enable or disable socket.io debug messages on the client
//localStorage.setItem('debug', "*");
localStorage.setItem('debug', "");


var allGenres = [];
var allYears = [];
var allOV = [];
var allCountries = [];
var allMoods = [];
var cubeLocation;
var firstConnect = true;



function connect() {

	showLoader();

	var myCodeTimer;

	$("#infoBtn").html("&nbsp;");

	socket = io();
	//socket = io("http://178.77.68.72:3000", {"reconnect": false});

	//hide the movie control items at startup
	//$("#movieControls").hide(1);

	socket.on("connect", function() {
		//$("#status").html("Verbindung hergestellt");
		$("#status").hide(0);
		registerToServer();
		writeLog("connected");
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
		$("#status").show(0);
		//$("#status").html("Reconnecting in " + nextRetry + " milliseconds");
		writeLog("Reconnect detected");
		$("#movieControls").hide(0);
		$("#initElements").show(0);
		initState = "noRemoteConnection";
	});

	//server revokes remote client rights
	socket.on("byebyeRemote", function() {
		$("#feedback").html("Bevor du den Trailer am Fernseher ansehen kannst, tippe hier, um eine Verbindung herzustellen.");
		$("#initElements").show(0);
		$("#movieControls").hide(0);
	});

	socket.on("reconnect_failed", function() {
		$("#status").html("Reconnect failed");
	});

	$("#volume").bind("slidestop", function(event, ui) {
		writeLog($("#volume").val());
		socket.emit("remoteVolumeChange", $("#volume").val() * 2);
	});

	socket.on("sendPlayList", function() {


	});

}

//notify server that this is a new remote client
function registerToServer() {

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

	socket.emit("clientRegister", cubeLocation, function() {
		writeLog("Client successfully registered to Server at location " + cubeLocation);

		if (firstConnect) {

			//load the movie list from the server
			//$.ajaxSetup({ scriptCharset: "utf-8" , contentType: "application/json; charset=utf-8"});
			$.get("/data/" + cubeLocation + ".json", function(data) {
				writeLog("File loaded successfully");
				trailers = data;


				//get all possible values which are needed for the personalization
				for (var v = 0; v < trailers.length; v++) {
					for (var x = 0; x < trailers[v].genre.length; x++) {
						allGenres.push(trailers[v].genre[x]);
					}
					allYears.push(trailers[v].year);
					allOV.push(trailers[v].ov);

					for (var p = 0; p < trailers[v].country.length; p++) {
						allCountries.push(trailers[v].country[p]);
					}

					for (var w = 0; w < trailers[v].country.length; w++) {
						allMoods.push(trailers[v].mood[w]);
					}

				}

				allGenres = getUniques(allGenres);
				allYears = getUniques(allYears);
				allOV = getUniques(allOV);
				allCountries = getUniques(allCountries);
				allMoods = getUniques(allMoods);

				allGenres.sort();
				allYears.sort();
				allOV.sort();
				allCountries.sort();
				allMoods.sort();

				//create dynamically all personalization content based on movie list			
				for (v = 0; v < allYears.length; v++) {
					$("#yearLegend").append("<input type=\"checkbox\"  name=\"" + allYears[v] + "\" id=\"years" + v + "\" class=\"pers year\"></input> <label for=\"years" + v + "\">  " + allYears[v] + "</label>");
				}
				$("#yearControlGroup").trigger('create');
				for (v = 0; v < allGenres.length; v++) {
					$("#genreLegend").append("<input type=\"checkbox\"  name=\"" + allGenres[v] + "\" id=\"genres" + v + "\" class=\"pers genre\"></input> <label for=\"genres" + v + "\">  " + allGenres[v] + "</label>");
				}
				$("#genreControlGroup").trigger('create');
				for (v = 0; v < allCountries.length; v++) {
					$("#countryLegend").append("<input type=\"checkbox\"  name=\"" + allCountries[v] + "\" id=\"country" + v + "\" class=\"pers country\"></input> <label for=\"country" + v + "\">  " + allCountries[v] + "</label>");
				}
				$("#countryControlGroup").trigger('create');
				for (v = 0; v < allOV.length; v++) {
					$("#ovLegend").append("<input type=\"checkbox\"  name=\"" + allOV[v] + "\" id=\"ov" + v + "\" class=\"pers ov\"></input> <label for=\"ov" + v + "\">  " + allOV[v] + "</label>");
				}
				$("#ovControlGroup").trigger('create');
				for (v = 0; v < allMoods.length; v++) {
					$("#moodLegend").append("<input type=\"checkbox\"  name=\"" + allMoods[v] + "\" id=\"mood" + v + "\" class=\"pers mood\"></input> <label for=\"mood" + v + "\">  " + allMoods[v] + "</label>");
				}
				$("#moodControlGroup").trigger('create');

				//add change listeners to the radio buttons for the personalization items
				$(".persGroupRadio").change(function() {
					//writeLog($(this).attr("for"));
					$("#genreDiv").hide(0);
					$("#countryDiv").hide(0);
					$("#ovDiv").hide(0);
					$("#yearDiv").hide(0);
					$("#moodDiv").hide(0);
					$("#" + $(this).attr("for")).show(0);
				});

				//add on change function to all check boxes in personalization content
				//update results after every change
				$('.pers').click(function() {
					showLoader();
					writeLog("Change triggered on " + $(this).attr("name") + " checked: " + $(this).is(':checked'));
					//update the searchfield
					if ($(this).is(':checked')) {
						$("#searchWords").controlgroup("container").append("<a id=\"" + $(this).attr("name") + "\" href=\"#\" class=\"ui-btn ui-corner-all ui-icon-delete ui-btn-icon-right \" >" + $(this).attr("name") + " </a>");
						$("#searchWords").enhanceWithin().controlgroup("refresh");
						$("#searchWords").controlgroup("refresh");
						//if the search word is removed via the search field and not via the checkboxes, remove both and refresh the search
						$("#" + $(this).attr("name")).click(function() {
							$(this).remove();
							$("#searchWords").enhanceWithin().controlgroup("refresh");
							writeLog("CLICK DETECTED " + $("input[name=" + $(this).attr("id") + "]").attr("type"));
							$("input[name=" + $(this).attr("id") + "]").prop("checked", false).checkboxradio("refresh");
							buildQueryString();
						});
					} else {
						$("#" + $(this).attr("name")).remove();
						$("#searchWords").enhanceWithin().controlgroup("refresh");
						$("#searchWords").controlgroup("refresh");
					}
					buildQueryString();

				});

				hideLoader();

				/*
				//check periodically if there is still a connection
				setInterval(function() {
					socket.emit("inCharge", cubeLocation, function(message) {
						//writeLog("Main client: " + message);				
						if (message) {
							$("#feedback").html("Du bist jetzt mit dem Fernseher verbunden und kannst dir beliebige Trailer anschauen.");
						} else {
							if (initState == "noRemoteConnection") {
								$("#feedback").html("Bevor du den Trailer am Fernseher ansehen kannst, tippe hier, um eine Verbindung herzustellen.");
								clearTimeout(myDisconnectTimer);
							}
						}
					});

				}, 3000);
	*/
			}).fail(function() {
				writeLog("Error loading file!!!");
			});

			firstConnect = false;
		}
	});
}

//get the values from the checkboxes, build the query string, send it to the server and show the result
function buildQueryString() {
	//check if at least one checkbox is checked. because if not show no results
	nothingSelected = true;
	//empty the searchQuery
	var filterQuery = {
		genre: [],
		country: [],
		year: [],
		ov: [],
		mood: []
	};

	//build genres
	$(".genre").each(function() {
		if ($(this).is(':checked')) {
			filterQuery.genre.push($(this).attr("name"));
			nothingSelected = false;
		}
	});
	//if no genres are selected, select all
	if (filterQuery.genre.length === 0) {
		for (var i = 0; i < allGenres.length; i++) {
			filterQuery.genre.push(allGenres[i]);
		}
	}

	//build countries
	$(".country").each(function() {
		if ($(this).is(':checked')) {
			filterQuery.country.push($(this).attr("name"));
			nothingSelected = false;
		}
	});
	//if no countries are selected, select all
	if (filterQuery.country.length === 0) {
		for (var u = 0; u < allCountries.length; u++) {
			filterQuery.country.push(allCountries[u]);
		}
	}

	//build ov
	$(".ov").each(function() {
		if ($(this).is(':checked')) {
			filterQuery.ov.push($(this).attr("name"));
			nothingSelected = false;
		}
	});
	//if no ov are selected, select all
	if (filterQuery.ov.length === 0) {
		for (var e = 0; e < allOV.length; e++) {
			filterQuery.ov.push(allOV[e]);
		}
	}

	//build year
	$(".year").each(function() {
		if ($(this).is(':checked')) {
			filterQuery.year.push($(this).attr("name"));
			nothingSelected = false;
		}
	});
	//if no years are selected, select all
	if (filterQuery.year.length === 0) {
		for (var o = 0; o < allYears.length; o++) {
			filterQuery.year.push(allYears[o]);
		}
	}

	//build mood
	$(".mood").each(function() {
		if ($(this).is(':checked')) {
			filterQuery.mood.push($(this).attr("name"));
			nothingSelected = false;
		}
	});
	//if no years are selected, select all
	if (filterQuery.mood.length === 0) {
		for (var h = 0; h < allMoods.length; h++) {
			filterQuery.mood.push(allMoods[h]);
		}
	}

	console.dir(filterQuery);


	//in case no check boxes are checked you dont have to make a query at all
	if (nothingSelected) {
		$("#resultsBtn1").html("0 Treffer");
		$("#resultsBtn1").attr("disabled", "");
		$("#resultsBtn2").html("0 Treffer");
		$("#resultsBtn2").attr("disabled", "");

	} else {
		//send query to server and display results
		socket.emit("queryDB", cubeLocation, filterQuery, function(queryShortResult) {
			$("#movieList").empty();
			var myArrayIndexNumber;
			var resultTrailerList = [];
			for (var v = 0; v < trailers.length; v++) {
				myArrayIndexNumber = $.inArray(trailers[v].interalName, queryShortResult);
				if (myArrayIndexNumber == -1) {
					//do nothing because movie is not a result
				} else {
					$('#movieList').append('<li class="movieListEntry" id= \'' + trailers[v].interalName + '\'><a>' + trailers[v].movieName + '</a></li>').listview('refresh');
					resultTrailerList.push(trailers[v]);
				}
			}

			$('.movieListEntry').click(function() {
				showMovieDetails($(this).attr("id"));
			});

			$("#resultsBtn1").html(queryShortResult.length + " Treffer");
			$("#resultsBtn2").html(queryShortResult.length + " Treffer");
			if (queryShortResult.length > 0) {
				$("#resultsBtn1").removeAttr("disabled");
				$("#resultsBtn2").removeAttr("disabled");
			} else {
				$("#resultsBtn1").attr("disabled", "");
				$("#resultsBtn2").removeAttr("disabled");
			}
			hideLoader();
		});
	}
}

//play a specific Trailer if you are connected to the monitor
function playTrailer(trailerType) {

	writeLog("INIT STATE: " + initState);

	if (initState == "noRemoteConnection") {
		socket.emit("isTrailerRunningAtTheMoment", cubeLocation, function(answer) {
			writeLog("FEEDBACK: " + answer);
			if (answer == "false") {
				$("#feedback").html("Bevor du den Trailer am Fernseher ansehen kannst, tippe hier, um eine Verbindung herzustellen.");
				$("#initElements").show(0);
				$("#abortConnection").html("Abbrechen");
			} else if (answer == "true") {
				$("#feedback").html("Zurzeit läuft gerade ein Trailer auf dem Fernseher.");
				$("#initElements").hide(0);
				$("#abortConnection").html("OK");
			} else if (answer == "noVideoClientHere") {
				$("#feedback").html("Kein Video Client im Moment.");
				$("#initElements").hide(0);
				$("#abortConnection").html("OK");
			}
			$("#feedbackPopup").popup("open");
		});
	} else {
		writeLog("I want to see: " + trailerType + " " + $("#movieName").attr("name"));
		socket.emit("inCharge", cubeLocation, function(message) {
			if (message) {
				socket.emit("playSpecifTrailer", cubeLocation, $("#movieName").attr("name"), trailerType, function(message) {
					writeLog("Feedback: " + message);
					socket.emit("writeTracking", cubeLocation, "randomClientEvent", "playTrailer", $("#movieName").attr("name"), function() {});
				});
			} else {}
		});
	}
}

//notify the server that you don't want to be remote client anymore
function revokeRemote() {
	socket.emit("dismissRemoteClient", cubeLocation, function() {
		writeLog("Successfully unregistered. You are not remote client anymore");
		initState = "noRemoteConnection";
		clearTimeout(myDisconnectTimer);
		$("#initElements").show(0);
		$("#movieControls").hide(0);
		$("#feedback").html("Bevor du den Trailer am Fernseher ansehen kannst, tippe hier, um eine Verbindung herzustellen.");
	});
}

//notify the server that remote client wants to take control of the video client's monitor
function giveMeControl() {
	socket.emit("giveMeControl", cubeLocation, function(answer) {
		//only allow a connection if no trailer is running at the moment
		if (answer) {
			$("#feedback").html("Zurzeit läuft gerade ein Trailer auf dem Fernseher.");
		} else {
			$("#feedback").html("Gib die Bestätigungsnummer ein, die am Fernseher angezeigt wird, um dich zu verbinden.");
			$("#initElements").hide(0);
			$("#codeElements").show(0);
			initState = "waitingForCode";
			//after 20 seconds reset the state
			myCodeTimer = setTimeout(function() {
				$("#feedback").html("Bevor du den Trailer am Fernseher ansehen kannst, tippe hier, um eine Verbindung herzustellen.");
				$("#initElements").show(0);
				$("#codeElements").hide(0);
			}, 20000);
		}
	});
}

//hide the popup or cancel the connection attempt
function abortConnect() {
	if (initState == "established") {
		$("#feedbackPopup").popup("close");
		$("#abortConnection").html("Abbrechen");
	} else {
		initState = "noRemoteConnection";
		$("#feedbackPopup").popup("close");
		setTimeout(function() {
			$("#initElements").show(0);
			$("#codeElements").hide(0);
		}, 200);
	}
}

//check with the server if the code is correct. if yes grant access to monitor
function submitCode() {
	writeLog("Secret Value: " + $("#secret").val());
	socket.emit("checkMyCode", cubeLocation, $("#secret").val(), function(answer) {
		if (answer) {
			$("#feedback").html("Du bist jetzt mit dem Fernseher verbunden und kannst dir nun alle Trailer anschauen wenn du auf einen \"Trailer spielen\" Button tippst.");
			$("#codeElements").hide(0);
			initState = "established";
			$("#secret").val("");
			clearTimeout(myCodeTimer);
			$("#abortConnection").html("OK");

			//remote rights should not be forever..
			myDisconnectTimer = setTimeout(function() {
				revokeRemote();
			}, disconnectTimeout);
		} else {
			//Code was incorrect. Waiting for correct code until the timeout mechanism strokes
			$("#feedback").html("Die Bestägigungsnummer war leider nicht richtig.");
		}
	});
}

function goBackFromMovieOverview() {
	$("#perContent").show(0);
	$("#movieListContainer").hide(0);
	$("#movieContainerBackBtn").hide(0);
}

//show the overview of the movie results
function showResults() {
	$("#perContent").hide(0);
	$("#movieListContainer").show(0);
	$("#movieContainerBackBtn").show(0);
}

//coming from landing page show the content now
function showContent() {
	$("#landingContent").hide(0);
	$("#content").show(0);
	$("#perContent").show(0);
	$("#infoBtn").hide(0);
	$("#connectionControls").show(0);
	$("#feedback").show(0);

	$("#genreDiv").hide(0);
	$("#countryDiv").hide(0);
	$("#ovDiv").hide(0);
	$("#yearDiv").hide(0);
	$("#moodDiv").hide(0);
}

//show info page and hide the rest
function showInfo() {
	socket.emit("writeTracking", cubeLocation, "clientEvent", "showInfo", "true", function() {});
	$("#landingContent").hide(0);
	$("#content").hide(0);
	$("#infoContent").show(0);
	$("#infoBackBtn").show(0);
	$("#infoBtn").hide(0);
	$("#title").html("AGB");
}

//go back from info page to main page
function goBackFromInfo() {
	$("#landingContent").show(0);
	$("#content").show(0);
	$("#infoContent").hide(0);
	$("#infoBackBtn").hide(0);
	$("#infoBtn").show(0);
	$("#title").html("Movie Cube");
}

//go back from detail view to movie list
function goBackToList() {
	$("#backBtn").hide(0);
	$("#movieContainerBackBtn").show(0);
	$("#movieListContainer").show(0);
	$("#movieContainer").hide(0);
	$("#title").html("Movie Cube");
}

//show the loading spinner
function showLoader() {
	$.mobile.loading("show", {
		text: "Laden",
		textVisible: true,
		theme: $.mobile.loader.prototype.options.theme,
		textonly: false,
		html: ""
	});
	hideLoader();
}

//hide the loading spinner
function hideLoader() {
	$.mobile.loading("hide");
}

function disconnect() {
	writeLog("disconnect");
	socket.disconnect();
}

//show movie detail page and fill the grid with data
function showMovieDetails(movieInternalName) {
	socket.emit("writeTracking", cubeLocation, "clientEvent", "showMovieDetails", "movieInternalName", function() {});
	$("#infoBtn").hide(0);
	$("#infoBtn").hide(0);
	$("#movieContainerBackBtn").hide(0);
	writeLog("I want to see details of: " + movieInternalName);
	$("#backBtn").show(0);
	$("#title").html("Filmdetails");
	$("#dtTrailerBtn").attr("onClick", "playTrailer(\"dt\")");
	$("#ovTrailerBtn").attr("onClick", "playTrailer(\"ov\")");
	for (var i = 0; i < trailers.length; i++) {
		if (trailers[i].interalName == movieInternalName) {
			$("#movieName").html(trailers[i].movieName + "<br>");
			$("#movieName").attr("name", trailers[i].interalName);
			$("#movieImg1").attr("src", trailers[i].imageURL);
			$("#movieImg2").attr("src", trailers[i].imageURL);
			if (trailers[i].hasOwnProperty('urlOV')) {
				$('#ovTrailerBtn').show(0);
			} else {
				$('#ovTrailerBtn').hide(0);
			}
			if (trailers[i].hasOwnProperty('urlDE')) {
				$('#dtTrailerBtn').show(0);
				writeLog("GERMAN TRAILER DETECTED");
			} else {
				$('#dtTrailerBtn').hide(0);
				writeLog("NO GERMAN TRAILER DETECTED");
			}
			$("#ovName").html(trailers[i].ovName);
			$("#year").html(trailers[i].year);
			$("#ov").html(trailers[i].ov);
			var countries = "";
			for (var u = 0; u < trailers[i].country.length; u++) {
				if (u !== trailers[i].country.length - 1) {
					countries = countries + trailers[i].country[u] + ", ";
				} else {
					countries = countries + trailers[i].country[u];
				}
			}
			$("#country").html(countries);
			var genres = "";
			for (u = 0; u < trailers[i].genre.length; u++) {
				if (u !== trailers[i].genre.length - 1) {
					genres = genres + trailers[i].genre[u] + ", ";
				} else {
					genres = genres + trailers[i].genre[u];
				}
			}
			$("#genre").html(genres);

			var moods = "";
			for (u = 0; u < trailers[i].mood.length; u++) {
				if (u !== trailers[i].mood.length - 1) {
					moods = moods + trailers[i].mood[u] + ", ";
				} else {
					moods = moods + trailers[i].mood[u];
				}
			}
			$("#mood").html(moods);

			$("#available").html(trailers[i].available);

			$("#director").html(trailers[i].director);
			var actors = "";
			for (u = 0; u < trailers[i].actors.length; u++) {
				if (u !== trailers[i].actors.length - 1) {
					actors = actors + trailers[i].actors[u] + "<br> ";
				} else {
					actors = actors + trailers[i].actors[u];
				}
			}
			$("#actors").html(actors);
			$("#plot").html(trailers[i].plot);
		}
		$("#movieListContainer").hide(0);
		$("#movieContainer").show(0);
		$('body').scrollTop(0);
	}
}


//##############################
//Utility Functions
//#############################


//get the request parameter
function getQueryParameter() {
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
	return query_string;
}

//get a list of all unique values of the array
function getUniques(myArray) {
	var cleaned = [];
	myArray.forEach(function(itm) {
		var unique = true;
		cleaned.forEach(function(itm2) {
			if (itm == itm2) unique = false;
		});
		if (unique) cleaned.push(itm);
	});
	return cleaned;
}


//logging with timestap
function writeLog(message) {
	console.log(new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds() + " " + message);
}