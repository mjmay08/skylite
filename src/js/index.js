import { SkynetClient } from "skynet-js";

var execBtn = document.getElementById("execute");
var outputElm = document.getElementById('output');
var errorElm = document.getElementById('error');
var commandsElm = document.getElementById('commands');
var dbFileElm = document.getElementById('dbfile');
var savedbElm = document.getElementById('savedb');
var importSkylinkElm = document.getElementById('importSkylinkBtn');

// Start the worker in which sql.js will run
var worker = new Worker("js/worker.sql-wasm.js");
worker.onerror = error;

// Open a database
worker.postMessage({ action: 'open' });

// Connect to the HTML element we 'print' to
function print(text) {
	outputElm.innerHTML = text.replace(/\n/g, '<br>');
}
function error(e) {
	console.log(e);
	errorElm.style.height = '2em';
	errorElm.textContent = e.message;
}

function noerror() {
	errorElm.style.height = '0';
}

// Run a command in the database
function execute(commands) {
	tic();
	worker.onmessage = function (event) {
		var results = event.data.results;
		toc("Executing SQL");
		if (!results) {
			error({message: event.data.error});
			return;
		}

		tic();
		outputElm.innerHTML = "";
		for (var i = 0; i < results.length; i++) {
			outputElm.appendChild(tableCreate(results[i].columns, results[i].values));
		}
		toc("Displaying results");
	}
	worker.postMessage({ action: 'exec', sql: commands });
	outputElm.textContent = "Fetching results...";
}

// Create an HTML table
var tableCreate = function () {
	function valconcat(vals, tagName) {
		if (vals.length === 0) return '';
		var open = '<' + tagName + '>', close = '</' + tagName + '>';
		return open + vals.join(close + open) + close;
	}
	return function (columns, values) {
		var tbl = document.createElement('table');
		var html = '<thead>' + valconcat(columns, 'th') + '</thead>';
		var rows = values.map(function (v) { return valconcat(v, 'td'); });
		html += '<tbody>' + valconcat(rows, 'tr') + '</tbody>';
		tbl.innerHTML = html;
		return tbl;
	}
}();

// Execute the commands when the button is clicked
function execEditorContents() {
	noerror()
	execute(editor.getValue() + ';');
}
execBtn.addEventListener("click", execEditorContents, true);

// Performance measurement functions
var tictime;
if (!window.performance || !performance.now) { window.performance = { now: Date.now } }
function tic() { tictime = performance.now() }
function toc(msg) {
	var dt = performance.now() - tictime;
	console.log((msg || 'toc') + ": " + dt + "ms");
}

// Add syntax highlihjting to the textarea
var editor = CodeMirror.fromTextArea(commandsElm, {
	mode: 'text/x-mysql',
	viewportMargin: Infinity,
	indentWithTabs: true,
	smartIndent: true,
	lineNumbers: true,
	matchBrackets: true,
	autofocus: true,
	extraKeys: {
		"Ctrl-Enter": execEditorContents,
		"Ctrl-S": savedb,
	}
});

function promptForSkylink() {
	const skylink = prompt("Please enter skylink");
	if (skylink !== null) {
		document.getElementById("overlay-download").style.display = "block";
		importFromSkynet(skylink);
	}
}

// Load a db from skynet
function importFromSkynet(skylink) {
	//const skylink = document.getElementById('importSkylink').value;
	importSkylinkElm.disabled = true;
	var oReq = new XMLHttpRequest();
	try {
		const skylinkUrl = client.getDownloadUrl(skylink);
		console.log("Skylink to download: " + skylinkUrl);
		oReq.open("GET", skylinkUrl, true);
		oReq.responseType = "arraybuffer";
	} catch (exception) {
		importSkylinkElm.disabled = false;
		document.getElementById("overlay-download").style.display = "none";
		alert("Invalid skylink");
	}

	oReq.onload = function (oEvent) {
		var arrayBuffer = oReq.response;
		worker.onmessage = function () {
			toc("Loading database from file");
			// Show the schema of the loaded database
			editor.setValue("SELECT `name`, `sql`\n  FROM `sqlite_master`\n  WHERE type='table';");
			execEditorContents();
		};
		tic();
		try {
			worker.postMessage({ action: 'open', buffer: arrayBuffer }, [arrayBuffer]);
		}
		catch (exception) {
			worker.postMessage({ action: 'open', buffer: arrayBuffer });
		} finally {
			importSkylinkElm.disabled = false;
			document.getElementById("overlay-download").style.display = "none";
		}
	}
	oReq.send(null);
}
importSkylinkElm.addEventListener("click", promptForSkylink, true);

// Upload the db to skynet
function savedb() {
	savedbElm.disabled = true;
	worker.onmessage = async function (event) {
		toc("Exporting the database");
		var arraybuff = event.data.buffer;
		var blob = new Blob([arraybuff]);
		const filename = "dbFile";
		const dbFile = new File([arraybuff], filename, {
			type: "text/plain",
		});
		try {
			document.getElementById("overlay").style.display = "block";
			client.upload(dbFile, { onUploadProgress }).then(function(link) {
				console.log(link);
				uploadedSkylink.innerHTML = link.skylink;
				modal.style.display = "block";
				savedbElm.disabled = false;
			}, function(err) {
				savedbElm.disabled = false;
			});
		} catch (error) {
			console.log(error);
		} finally {
			document.getElementById("overlay").style.display = "none";
		}
	};
	tic();
	worker.postMessage({ action: 'export' });
}
savedbElm.addEventListener("click", savedb, true);


const client = new SkynetClient("https://siasky.net");
const onUploadProgress = (progress, { loaded, total }) => {
  console.info(`Progress ${Math.round(progress * 100)}%`);
  var elem = document.getElementById("myBar");
  console.log(progress);
  elem.style.width = progress + "%";
};

var modal = document.getElementById("uploadCompleteModal");
var uploadedSkylink = document.getElementById("uploadedSkylink");

var span = document.getElementsByClassName("close")[0];
span.onclick = function() {
  modal.style.display = "none";
}
