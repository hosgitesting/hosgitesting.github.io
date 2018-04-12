
/*-- GLOBAL VARIABLES ------------------------------------------------------------------------*/

/* TODO ------

------------*/


var testData;
var testInstructions = {
	apiKey: "",
	urlStart: ""
};
var runall = false;
var runningTests = [];
var numRunningTests = 5;
var async = false;
var getResultsDone = 0;


/*-- ON PAGE LOAD ----------------------------------------------------------------------------*/

$(document).ready(function() {
	getQueryString();

	if (testInstructions["apiKey"].length > 0) {
		getTests();
	}

	initClickEvents();
	$(".menu-cont").hide();
	$("#running-tests").hide();
});

/*-- FUNCTIONS -------------------------------------------------------------------------------*/

// Loads tests into HTML, using API key from var: testInstructions
function getTests() {
	if (testInstructions["apiKey"].length == 0) {
		alert("Please enter an API key");
		showTestInstructions();
	}
	else {
		var success = false;
		$("#loading-tests").show();
		$("#get-tests-button").hide();

		$.ajax({
			dataType: "json",
			url: "https://api.ghostinspector.com/v1/tests/?apiKey=" + testInstructions.apiKey,
			success: function(results) {
				if (results.code == "SUCCESS") {
					testData = sortBySuite(results.data); 
					success = true;
					formatTests();
				}
				else {
					alert("Something went wrong:\n\n" + results.errorType + "\n" + results.message);
					$("#get-tests-button").show();
				}

				$("#loading-tests").hide();
			},
			error: function() {
				alert("Something went wrong getting tests.");
				$("#get-tests-button").show();
				$("#loading-tests").hide();
			}
		});

		return success;
	}
}

// Executes running a single test given a test ID, using any/all data from var: testInstructions 
function runTest(testid) {
	if (testInstructions["apiKey"].length == 0) {
		alert("Please enter an API key");
		showTestInstructions();
	}
	else {
		var queryData = "";
		var url = "";
		var index = 0;

		$.each(testInstructions, function(name, value) {
			if (value.length > 0) {
				if (index == 0) {
	    			queryData += name + "=" + value;
	    		}
	    		else {
	    			queryData += "&" + name + "=" + value;
	    		}

	    		index++;
	    	}
		});

		url = "https://api.ghostinspector.com/v1/tests/" + testid + "/execute/?" + queryData;
		hideTestComplete(testid);
		hidePending(testid);
		showLoading(testid);

		if (async) { 
			showRunningTests(); 
		}

		$.ajax({
			dataType: "json",
			url: url,
			success: function(results) {
				if (results.code == "SUCCESS") {
					hideLoading(testid);
					showTestComplete(testid, results.data.passing);
					getTestResults(testid);
					if (async) { runNextTest(testid); }
				}
				else {
					alert("Something went wrong:\n\n" + results.errorType + "\n" + results.message);
					hideLoading(testid);
					if (async) { cancelTests(); }
				}
			},
			error: function() {
				alert("Something went wrong running a test.");
				if (async) { runNextTest(testid); }
			}
		});
	}
}

// Begins running a single test given the test element (used mostly for sequential testing)
function runSingleTest(test) {
	var testid = test.attr("id");

	if (async) { 
		var checkIndex = runningTests.indexOf(testid);

		if (checkIndex == -1) {
			numRunningTests = 1;
			runningTests.push(testid);
			runNextTest();
		}
	}
	else {
		runTest(testid);
	}
}

// Begins running a suite of tests given the suite element
function runSuiteTests(suite) {
	var run = false; 

	suite.find($(".test")).each(function() {
		var testid = $(this).attr("id");

		if (async) {
			var checkIndex = runningTests.indexOf(testid);

			if (checkIndex == -1) {
				hideTestComplete(testid);
				showPending(testid);
				runningTests.push(testid);
				run = true;
			}
		}
		else {
			runTest(testid);
		}
	});

	numRunningTests = (suite.find($(".test")).length);
	if (run) { runNextTest(); }
}

// Begins running all tests currently loaded
function runAllTests() {
	var run = false;

	if ($(".test").length > 0) {
		$(".test").each(function() {
			var testid = $(this).attr("id");

			if (async) { 
				var checkIndex = runningTests.indexOf(testid);

				if (checkIndex == -1) {
					hideTestComplete(testid);
					showPending(testid);
					runningTests.push(testid);
					run = true;
				}
			}
			else {
				runTest(testid);
			}
		});

		numRunningTests = $(".test").length;
		if (run) { runNextTest(); }
	}
	else {
		alert("There are no tests to run");
	}
}

// Runs the next pending test, or completes testing if no pending tests remain (used for sequential testing)
function runNextTest(lastId = false) {
	var barWidth = 0;

	if (runningTests.length == 0 ) {
		numRunningTests = 0;
		barWidth = 100;
		$("#running-tests-progress-bar-animation").css("animation-name", "none");

		setTimeout(function() {
			hideRunningTests();
		}, 2000);
	}
	else {
		if (lastId) {
			if (runningTests.length > 0) {
				runTest(runningTests[0]);
				runningTests.splice(0, 1);
				barWidth = 100 - Math.ceil(((runningTests.length + 1) / numRunningTests) * 100);
			}
			else {
				setTimeout(function() {
					hideRunningTests();
				}, 2000);
			}
		}
		else {
			runTest(runningTests[0]);
			runningTests.splice(0, 1);
			barWidth = 0;
		}
	}

	if (runningTests.length <= 0) {
		$("#cancel-tests-button").addClass("disabled");
	}
	else {
		$("#cancel-tests-button").removeClass("disabled");
	}

	$("#running-tests-progress-bar").css("width", barWidth + "%");
	$("#running-tests-progress-text").text(barWidth + "%");
}

// Generates HTML for tests retrieved from Ghost Inspector from func: getTests(), using data from var: testData
function formatTests() {
	var msg = '';
	var suite = '';

	for (i=0; i<testData.length; i++) {
		var test = testData[i];
		var testDesc = test.details || "(No description)";

		if (suite != test.suite._id) {
			if (suite!= '') {
				msg += '</div>';
			}

			msg += '<div class="suite">';
			msg += 		'<div class="suite-heading">';
			msg += 			'<div class="suite-name">' + test.suite.name + '</div>';
			msg += 			'<div class="run-suite-button button button-green">Run Suite</div>';
			msg += 		'</div>';
			suite = test.suite._id;
		}

		msg += '<div class="test" id="' + test._id + '">';
		msg += 		'<div class="test-expand-cont">';
		msg +=  		'<div class="test-expand-arrow"></div>';
		msg += 		'</div>';
		msg += 		'<div class="test-name">' + test.name + '</div>';
		msg += 		'<div class="desc-cont">' + testDesc + '<br>';
		msg += 			'<div class="results-test-steps-cont-outer">';
		msg +=			'</div>';
		msg +=		'</div>';
		msg += 		'<div class="button-cont">';
		msg +=			'<div class="pending"></div>';
		msg += 			'<div class="loading"></div>';
		msg += 			'<div class="test-complete"></div>';
		msg += 			'<div class="test-failed">Failed</div>';
		msg += 			'<div class="run-test-button button button-green">Run Test</div>';
		msg += 		'</div>';
		msg += '</div>';
	}

	$("#test-cont").empty();
	$("#test-cont").append(msg);
	initClickEvents();

	$(".pass").each(function() {
		if ($(this).html() != 'true') {
			$(this).removeClass("pass");
		}
	});

	if (runall) {
		runAllTests();
		runall = false;
	}
}

// Sorts tests alphabetically by suite
function sortBySuite(data) {
	function compare(a, b) {
		var suiteA = a.suite.name;
		var suiteB = b.suite.name;
		var comparison = 0;

		if (suiteA > suiteB) {
	  		comparison = 1;
	 	} 
	 	else if (suiteA < suiteB) {
	  		comparison = -1;
	  	}
	 	return comparison;
	}
	return data.sort(compare);
}

// Initializes element click events
function initClickEvents() {
	$(".test-expand-cont").unbind('click').click(function() {
		var $test = $(this).closest($(".test"));
		var $desc = $test.find($(".desc-cont"));
		var descHeight = $desc[0].scrollHeight + 10;

		if ($test.hasClass("test-active")) {
			$(".test").removeClass("test-active");
			$(".desc-cont").css("height", 0);
		}
		else {
			$(".test").removeClass("test-active");
			$(".desc-cont").css("height", 0);
			$test.addClass("test-active");
			$desc.css("height", descHeight);
		}
	});

	$(".run-test-button").unbind('click').click(function() {
		if (!$(this).hasClass("disabled")) {
			runSingleTest($(this).closest($(".test")));
		}
	});

	$(".run-all-button").unbind('click').click(function() {
		if (!$(this).hasClass("disabled")) {
			runAllTests();
		}
	});

	$(".run-suite-button").unbind('click').click(function() {
		if (!$(this).hasClass("disabled")) {
			runSuiteTests($(this).closest($(".suite")));
		}
	});

	$(".test-instructions-button").unbind('click').click(function() {
		showTestInstructions();
	});

	$("#test-overlay").unbind('click').click(function() {
		showTestInstructions();
	});

	$("#get-tests-button").unbind('click').click(function() {
		getTests();
	});

	$("#get-latest-results-button").unbind('click').click(function() {
		$(this).addClass("disabled");
		getResultsDone = 0;

		$(".test").each(function() {
			var testid = $(this).attr("id");
			getTestResults(testid);
		});
	});
}

function showLoading(testid) {
	$test = $(".test[id=" + testid + "]").find($(".run-test-button"));
	$test.addClass("disabled");
	$test.closest($(".button-cont")).find($(".loading")).show();
}

function hideLoading(testid) {
	$test = $(".test[id=" + testid + "]").find($(".run-test-button"));
	$test.removeClass("disabled");
	$test.closest($(".button-cont")).find($(".loading")).hide();
}

function showPending(testid) {
	$test = $(".test[id=" + testid + "]").find($(".run-test-button"));
	$test.addClass("disabled");
	$test.closest($(".button-cont")).find($(".pending")).show();
}

function hidePending(testid) {
	$test = $(".test[id=" + testid + "]").find($(".run-test-button"));
	$test.removeClass("disabled");
	$test.closest($(".button-cont")).find($(".pending")).hide();
}

function showTestComplete(testid, success = true) {
	if (success) {
		$(".test[id=" + testid + "]").find($(".test-complete")).css("opacity", 1);
		$(".test[id=" + testid + "]").find($(".test-failed")).css("opacity", 0);
	}
	else {
		$(".test[id=" + testid + "]").find($(".test-failed")).css("opacity", 1);
		$(".test[id=" + testid + "]").find($(".test-complete")).css("opacity", 0);	
	}
}

function hideTestComplete(testid) {
	$(".test[id=" + testid + "]").find($(".test-complete")).css("opacity", 0);
	$(".test[id=" + testid + "]").find($(".test-failed")).css("opacity", 0);
}

function showTestInstructions(hide = false) {
	$cont = $("#test-instructions-cont");
	$("#get-latest-results-button").removeClass("disabled");

	if ($cont.css("display") != "none" || hide) {
		$("#test-inst-cont").css("top", -100);
		$cont.css("opacity", 0);

		setTimeout(function() {
			$cont.hide();
		}, 500);
	}
	else {
		$(".test-input").each(function() {
			$(this).val(testInstructions[$(this).attr("instruction")]);
		});

		$("#test-sync").val((async ? "async" : "sync"));

		$cont.show();
		$("#test-inst-cont").css("top", 25);
		$cont.css("opacity", 1);
		$(".test-input:first").focus();
	}
}

// Saves the values of each field from the options menu to the matching value in var: testInstructions
function saveTestInstructions() {
	$cont = $("#test-inst-cont");
	var newApiKey = false;

	$cont.find($(".test-input")).each(function() {
		var instruction = $(this).attr("instruction");

		if (instruction == "apiKey") {
			if ($(this).val() != testInstructions["apiKey"] && $(this).val().length > 0) {
				newApiKey = true;
			}
		}
		else if (instruction == "urlStart") {
			var substrings = ["https", "http", ":", "//", "www.", "www"];

			for (i=0; i<substrings.length; i++) {
				if ($(this).val().indexOf(substrings[i]) !== -1) {
					$(this).val($(this).val().replace(substrings[i],''));
				}
			}
		}

		testInstructions[instruction] = $(this).val();
	});

	async = ($("#test-sync").val() == "sync" ? false : true);

	showTestInstructions(true);
	setQueryString();

	if (newApiKey) {
		getTests();
	}
}

// Clears each input in the options menu
function clearTestInstructions() {
	$(".test-input").val("");
}

// Retrieves the query string and updates fields in the options menu for any values present
function getQueryString() {
	var obj = {};
    var hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    
    for (i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        obj[hash[0]] = hash[1];
    }

    if (!$.isEmptyObject(obj)) {
    	$.each(obj, function(name, value) {
			switch (name) {
				case "runall":
					if (value == "true") {
						runall = true;
					}
					break;

				default:
					if (name.length > 0 && value != undefined) {
						testInstructions[name] = value;
					}
					break;
			}
		});

		setQueryString();
    }

    return obj;
}

// Updates the query string to include any values present in var: testInstructions
function setQueryString() {
  	var query = [];
  	var queryString = "";
  	
  	for(var attr in testInstructions) {
		if (testInstructions.hasOwnProperty(attr) && testInstructions[attr].length > 0) {
  			query.push(encodeURIComponent(attr) + "=" + encodeURIComponent(testInstructions[attr]));
		}
	}

	queryString = '?' + query.join('&');

	if (history.pushState) {
		var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + queryString;
		window.history.pushState({path:newurl},'',newurl);
	}
}

// Retrieves a list of all previous testing results from Ghost Inspector for a single test, given a test ID
function getTestResults(testid) {
	var url = 'https://api.ghostinspector.com/v1/tests/' + testid + '/results/?apiKey=' + testInstructions.apiKey;

	$.ajax({
		dataType: "json",
		url: url,
		success: function(results) {
			if (results.code == "SUCCESS") {
				setTestResults(testid, results);
			}
			else {
				alert("Something went wrong:\n\n" + results.errorType + "\n" + results.message);
			}
		},
		error: function() {
			alert("Something went wrong getting test results.");
		}
	});
}

// Generates HTML for the most recent test results for a single test, given a test ID and the full list of results (from func: getTestResults())
function setTestResults(testid, results) {
	var $stepCont = $(".test[id=" + testid + "]").find($(".results-test-steps-cont-outer"));
	var msg = '';
	var data = results.data[0];
	var step;
	var command;
	var passing = false;

	$stepCont.empty();
	$stepCont.append('' + 
		'<div class="results-test-heading">Latest Test Results (' + formatDateTime(data.dateExecutionFinished) + ')' + 
			'<div class="results-test-step-button-cont">' +
				'<div class="button" onclick="window.open(\'' + data.screenshot.original.defaultUrl + '\', \'mywindow\');" style="margin-right: 10px;">Screenshot</div>' +
				'<div class="button" onclick="window.open(\'' + data.video.url + '\', \'mywindow\');">Video</div>' +
			'</div>' + 
			'<div style="position: absolute; right: 0px; bottom: 0px;">Start: <a href="' + data.startUrl + '">' + data.startUrl + '</a></div>' + 
		'</div>' + 
		'<div class="results-test-steps-cont"></div>' + 
	'');

	var $stepInner = $stepCont.find($(".results-test-steps-cont"));

	for (i=0; i< data.steps.length; i++) {
		step = data.steps[i]
		command = step.command.charAt(0).toUpperCase() + step.command.slice(1);
		passing = (step.passing ? "results-test-step-pass" : "results-test-step-fail");

		msg +=		'<div class="results-test-step ' + passing + '">';
		msg +=			'<div class="results-test-step-name">' + (step.sequence + 1) + '</div>';
		msg +=			'<div class="results-test-step-status"></div>';
		msg +=			'<div class="results-test-step-info">';
		msg +=				'<div class="results-test-step-command">' + command + ': </div>';
		msg +=				'<div class="results-test-step-target">' + step.target + ' > </div>';
		msg +=				'<pre class="results-test-step-value">' + step.value + '</pre>';
		msg +=				'<div class="results-test-step-url">';
		msg +=					'<a href="' + step.url + '">' + step.url + '</a>';
		msg +=				'</div>';
		msg +=			'</div>';
		msg +=		'</div>';
	}

	$stepInner.append(msg);
	showTestComplete(testid, data.passing);

	getResultsDone++; 
	if (getResultsDone == $(".test").length) {
		showTestInstructions(true);
		$(".test").removeClass("test-active");
		$(".desc-cont").css("height", 0);
	}
}

// Displays the overlay bar containing test progress bar and Cancel Pending Tests button
function showRunningTests() {
	if (async) { 
		$("#running-tests").show();
		$("#running-tests").css("opacity", 1);
		$("#running-tests-progress-bar-animation").css("animation-name", "progress-bar");
	}
}

function hideRunningTests() {
	if (runningTests.length == 0) {
		numRunningTests = 0;
		$("#running-tests").css("opacity", 0);

		setTimeout(function() {
			$("#running-tests").hide();	
		}, 500);
	}
}

// Removes any pending tests from the queue (array: runningTests)
function cancelTests() {
	if (!$("#cancel-tests-button").hasClass("disabled")) {
		for (i=0; i<runningTests.length; i++) {
			hidePending(runningTests[i]);;
		}

		runningTests = [];
		$("#cancel-tests-button").addClass("disabled");
		var barWidth = 100 - Math.ceil((1 / numRunningTests) * 100);
		$("#running-tests-progress-bar").css("width", barWidth + "%");
		$("#running-tests-progress-text").text(barWidth + "%");
	}
}

// Returns formatted date-time 
function formatDateTime(dateTime) {
	var parts = dateTime.split("T");
	var date = parts[0];
	var time = parts[1];

	time = time.slice(0, -1);
	return date + " / " + time;
}