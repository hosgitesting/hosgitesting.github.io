
/*-- GLOBAL VARIABLES ------------------------------------------------------------------------*/

//     861527daa7cf3b6e26c294ea3738ec2d1df42fef
var testData;
var testInstructions = {
	apiKey: "",
	startUrl: ""
};
var testPasses = 0;
var testFails = 0;


/*-- ON PAGE LOAD ----------------------------------------------------------------------------*/

$(document).ready(function() {

	getQueryString();

	if (testInstructions["apiKey"].length > 0) {
		getTests();
	}

	initClickEvents();
	$("#test-instructions-cont").hide();
	

});




/*-- FUNCTIONS -------------------------------------------------------------------------------*/

function getTests() {

	if (testInstructions["apiKey"].length > 0) {
		var success = false;
		$("#loading-tests").show();

		$.ajax({
			dataType: "json",
			url: "https://api.ghostinspector.com/v1/tests/?apiKey=" + testInstructions["apiKey"],
			success: function(json) {
				if (json.code == "SUCCESS") {
					testData = sortBySuite(json.data); 
					success = true;
					formatTests();
					console.log("Tests retrieved: ");
					console.log(testData);
				}
				else {
					alert("Something went wrong:\n\n" + json.errorType + "\n" + json.message);
				}

				$("#loading-tests").hide();
			},
			error: function() {
				alert("Something went wrong when getting tests.");
			}
		});

		return success;
	}
	else {
		alert("Please enter an API key");
		showTestInstructions();
	}
}

function runTest(testid) {

	if (testInstructions["apiKey"].length > 0) {
		var results = false;
		var $test = $(".test[id=" + testid + "]");
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
	    	}
		});

		url = "https://api.ghostinspector.com/v1/tests/" + testid + "/execute/?" + queryData;
		console.log(url);

		hideTestComplete(testid);
		showLoading(testid)
		console.log("Running test: " + testid + " ...");

		$.ajax({
			dataType: "json",
			url: url,
			success: function(json) {
				if (json.code == "SUCCESS") {
					results = json;
					console.log("Results: " + testid);
					console.log(results);
					hideLoading(testid);
					showTestComplete(testid, results.data.passing);
				}
				else {
					alert("Something went wrong:\n\n" + json.errorType + "\n" + json.message);
					hideLoading(testid);
				}
			},
			error: function() {
				alert("Something went wrong when running tests.");
			}
		});

		return results;
	}
	else {
		alert("Please enter an API key");
		showTestInstructions();
	}
}

function runAllTests() {
	if ($(".test").length > 0) {
		$(".test").each(function() {
			var testid = $(this).attr("id");
			runTest(testid);
		});
	}
	else {
		alert("There are no tests to run");
	}
}

function runSuiteTests(suite) {
	suite.find($(".test")).each(function() {
		var testid = $(this).attr("id");

		runTest(testid);
	});
}

function formatTests() {
	var msg = '';
	var suite = '';

	for (i=0; i<testData.length; i++) {
		var test = testData[i];
		var testDesc = test.details || "(No description)";
		var testStatus = test.passing;

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
		msg += 		'<div class="desc-cont">' + testDesc + '<br><br><div class="desc-passing">Currently passing: <span class="pass" style="text-transform: capitalize; color: red">' + testStatus + '</span></div></div>';
		msg += 		'<div class="button-cont">';
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
}

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
			runTest($(this).closest($(".test")).attr("id"));
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

function showTestComplete(testid, success = true) {
	if (success) {
		$(".test[id=" + testid + "]").find($(".test-complete")).css("opacity", 1);
		testPasses++;
	}
	else {
		$(".test[id=" + testid + "]").find($(".test-failed")).css("opacity", 1);
		testFails++;
	}

	if ($(".disabled").length == 0) {
		console.log("----- TESTING COMPLETE -----");
		console.log("Passed: " + testPasses);
		console.log("Failed: " + testFails);
		console.log("----------------------------");
	}
}

function hideTestComplete(testid) {
	$(".test[id=" + testid + "]").find($(".test-complete")).css("opacity", 0);
	$(".test[id=" + testid + "]").find($(".test-failed")).css("opacity", 0);
	testPasses = 0;
	testFails = 0;
}

function showTestInstructions() {
	$cont = $("#test-instructions-cont");

	if ($cont.css("display") == "none") {
		$(".test-input").each(function() {
			$(this).val(testInstructions[$(this).attr("instruction")]);
		});

		$cont.show();
		$("#test-inst-cont").css("top", 25);
		$cont.css("opacity", 1);
		$(".test-input:first").select();
	}
	else {
		$("#test-inst-cont").css("top", -100);
		$cont.css("opacity", 0);

		setTimeout(function() {
			$cont.hide();
		}, 500);
	}
}

function saveTestInstructions() {
	$cont = $("#test-inst-cont");

	$cont.find($(".test-input")).each(function() {
		var instruction = $(this).attr("instruction");
		testInstructions[instruction] = $(this).val();
	});

	console.log("Custom test instructions set: ");
	console.log(testInstructions);
	showTestInstructions();
}

function clearTestInstructions() {
	$(".test-input").val("");
}

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
					//runAllTests();
					break;
				default:
					if (name.length > 0 && value != undefined) {
						testInstructions[name] = value;
					}
					break;
			}
		});
    }

    return obj;
}