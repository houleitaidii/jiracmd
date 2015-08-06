#!/usr/bin/env node
var program = require("commander");
var fs = require("fs");
var request = require("request");
// var jira = require('./jiraconfig').config;
var JiraApi = require('jira').JiraApi;
var chalk = require('chalk');
var utils = require('utility');

program.version('0.0.1')
		.usage('search jira via commander')
		.parse(process.argv)

if(!program.args.length){
	console.log("for example: jira number-1 number-2");
}else{
	var configFile = fs.readFileSync('/etc/jiraconfig','utf-8');
	var json_config = JSON.parse(configFile);
	var jira = new JiraApi('http', json_config.host, json_config.port, json_config.user, json_config.pwd, '2');

	for(var i=0;i<program.args.length;i++){
		jira.findIssue(program.args[i], function(error, issue){
			if(error){
				console.log(error);
				process.exit(1);
			}else{
				// console.log(issue);
				var comments = issue.fields.comment.comments;
				var str_comment = "";
				var comment_length = comments.length;
				for(var c=comment_length-1;c>=0;c--){
					comment = comments[c];
					updated = utils.YYYYMMDDHHmmss(new Date(comment.updated));
					str_comment += chalk.yellow(updated) + "\n";
					str_comment += comment.updateAuthor.name + ":"
								 + comment.body + "\n";
				}

				var result = "";
				result += chalk.cyan.bold(issue.key) + " " ;
				result += chalk.magenta.bold(issue.fields.priority.name + " " 
							+ issue.fields.issuetype.name + " " + issue.fields.status.name) + "\n";
				
				result += chalk.red.bold(issue.fields.reporter.name + "->" 
						+ issue.fields.assignee.name) + " \n";
				
				result += chalk.bold("Summary:") + "\n    ";
				result += issue.fields.summary + "\n";
				
				result += chalk.bold("Description:\n    ") + issue.fields.description + "\n";
				result += chalk.bold("Comments(↓):\n");

				result += str_comment;

				console.log(result);
			}
		});
	}
}
