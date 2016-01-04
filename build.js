#!/bin/env node

var fs = require("fs");
var path = require("path");

var config = {
	fhirResourceProfilesPath: "./profiles/profiles-resources.json",
	fhirExamplesPath:         "./examples",
	outputJsonPath:           "./dist/examples-by-resource.json",
	outputExamplesPath:       "./dist/examples/"
}

//http://stackoverflow.com/questions/8817394
var deepGet = function(obj, path) {
	for (var i=0, path=path.split('.'), len=path.length; i<len; i++) {
		obj = obj[path[i]];
		if (obj === undefined) break;
	}
	return obj;
};

var getResourceNames = function() {
	var resourceNames = []
	var fhirResourceProfilesPath = 
		path.join(__dirname, config.fhirResourceProfilesPath);
	var resources = 
		JSON.parse(fs.readFileSync(fhirResourceProfilesPath, "utf-8"));

	console.log("Parsing: " + fhirResourceProfilesPath);
	for (var i=0; i<resources.entry.length; i++) {
		var entry = resources.entry[i]
		var fhirType = deepGet(entry, "resource.snapshot.element.0.type.0.code");
		if (fhirType === "DomainResource")
			resourceNames.push(entry.resource.id);
	};

	return resourceNames.sort();
};

var getExamples = function(resourceNames) {
	var resourceExamples = []
	var fhirExamplesPath = path.join(__dirname, config.fhirExamplesPath);
	var exampleFiles = fs.readdirSync(fhirExamplesPath);

	for (var i=0; i<resourceNames.length; i++) {
		var resourceName = resourceNames[i];
		var examples = []
		for (var j=0; j<exampleFiles.length; j++) {
			var fileName = exampleFiles[j];
			if (
				fileName.indexOf("canonical") > -1 &&
				fileName.split("-")[0] === resourceName.toLowerCase() &&
				!/valueset|extension|questionnaire|profile/.test(fileName)
			) 
				examples.push(fileName);
		}
		console.log("" + examples.length + " for " + resourceName);

		if (examples.length > 0) {
			resourceExamples.push({name: resourceName, examples: examples.sort()});
		}
	}
	return resourceExamples;
};


var buildDist = function(exampleData) {
	var clearDir = function(dirPath) {
		var fileNames = fs.readdirSync(dirPath);
		for (var i=0; i<fileNames.length;i++) {
			fs.unlinkSync(path.join(dirPath, fileNames[i]));
		};
	}
	var copyFileSync = function(fromPath, toPath) {
		fs.writeFileSync(toPath, fs.readFileSync(fromPath));
	}

	var outputExamplesPath = path.join(__dirname, config.outputExamplesPath);
	console.log("Clearing: " + outputExamplesPath)
	clearDir(outputExamplesPath);
	var fhirExamplesPath = path.join(__dirname, config.fhirExamplesPath);
	for (var i=0; i<exampleData.length; i++) {
		var examples = exampleData[i].examples;
		for (var j=0; j<examples.length; j++) {
			var fileName = examples[j];
			console.log("Copying: " + fileName)
			copyFileSync(
				path.join(fhirExamplesPath, fileName),
				path.join(outputExamplesPath, fileName)
			)			
		};
	}
	var outputJsonPath = path.join(__dirname, config.outputJsonPath);
	console.log("Writing: " + outputJsonPath);
	fs.writeFileSync(outputJsonPath, JSON.stringify(exampleData));
}

var exampleData = getExamples(getResourceNames());
buildDist(exampleData);
