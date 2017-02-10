#!/usr/bin/env node
var recursive = require('recursive-readdir');
var comments = require('js-comments');
var fs = require('fs');
var xlsx = require('node-xlsx');
var argv = require('yargs')
    .option('directory', {
        alias: 'd',
        default: './',
		description: "The directory where JS files live, to recursively extract comments"
    })
    .option('output', {
        alias: 'o',
        require: true,
		description: "The path to where the JSON output should be stored"
    })
    .option('ignorePatterns', {
        alias: 'i',
        array: true,
		description: "One or more strings that should be ignored when found in the path of the file name being read"
    })
    .argv;
	
var extractComments = function(directory, outputFile, ignorePatterns, cb) {
    var sheetRows = [];

    recursive(directory, function(err, files) {
        if (err) {
            console.log(err);
            process.exit(1);
        }

        for (var i in files) {
            var ignore = files[i].lastIndexOf('.js') != files[i].length - 3;

            if (ignorePatterns) {
                for (var z in ignorePatterns) {
                    if (files[i].indexOf(ignorePatterns[z]) > -1) {
                        ignore = true;
                    }
                }
            }

            if (ignore) {
                console.log('Ignoring ' + files[i]);
                continue;
            }

            console.log('Reading ' + files[i]);

            var contents = fs.readFileSync(files[i]).toString();
            var regex = /([\t*|\s*|^]\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/)|(\/\/.*)/g;
            var contentsMatches = contents.match(regex);

            if (!contentsMatches) {
                continue;
            }

            for (var i = 0; i < contentsMatches.length; i++) {
                if (!contentsMatches[i] || !contentsMatches[i].trim()) {
                    continue;
                }

                var current = contentsMatches[i].trim();

                if (current.indexOf('/// <reference') == 0) {
                    continue;
                }

                var columns = [ files[i] ];
                columns.push(current);
                sheetRows.push(columns);
            }
        }

        //var xlsxBuffer = xlsx.build([{ name: 'Comments', data: sheetRows }]);
        fs.writeFileSync(outputFile, JSON.stringify(sheetRows, null, '\t'));

        console.log('Done');
        process.exit(0);
    });
};

extractComments(argv.directory, argv.output, argv.ignorePatterns, function() {
    process.exit(0);
});