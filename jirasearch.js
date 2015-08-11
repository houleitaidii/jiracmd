#!/usr/bin/env node
var program = require("commander");
var fs = require("fs");
var request = require("request");
// var jira = require('./jiraconfig').config;
var JiraApi = require('jira').JiraApi;
var chalk = require('chalk');
var utils = require('utility');
var os = require("os");

program.version('1.0')
		.usage('search jira via commander')
		.option('-m, --comment [value]', 'apply comments.')
		.option('-u, --users [value]', 'get users list.')
		.parse(process.argv)

// console.log(program.args);

// process.exit(1);

function getConfig(){
	var os_platform = os.platform();
	var config_file_path = os_platform.indexOf('win',0) === 0 ? "c:\\jiraconfig" : "/etc/jiraconfig";
	var configFile = fs.readFileSync(config_file_path,'utf-8');
	var json_config = JSON.parse(configFile);
	var jira = new JiraApi('http', json_config.host, json_config.port, json_config.user, json_config.pwd, '2');
	return jira;
}

var commands = function(program, jira){
	this.program = program;
	this.jira = jira;

	this.do = function(){
		if(this.program.comment){
			if(typeof(this.program.comment) == 'boolean'){
				console.log('missing content');
			}else{
				submitComment(this.program, this.jira, this.program.comment);
			}
			return;
		}

		if(this.program.users){
			getUserList(this.program.users, this.jira);
		}

		findIssues(this.program, this.jira);

	};

	var findIssues = function(program, jira){
		var args = program.args;
		for(var i=0;i<args.length;i++){
			jira.findIssue(args[i], function(error, issue){
				if(error){
					console.log(error);
					process.exit(1);
				}else{
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
	};

	var submitComment = function(program, jira, content){
		var args = program.args;
		if(args.length == 0){
			console.log("issue number missing");
			return;
		}
		jira.addComment(args[0],content, function(error, issue){
			if(error){
				console.log(error);
				process.exit(1);
			}else{
				console.log(issue);
			}
		})
	};

	var getUserList = function(username, jira){
		jira.searchUsers(username,0,100,true,false,function(error, body){
			if(error){
				console.log(error);
				process.exit(1);
			}else{
				for(var i=0,l=body.length;i<l;i++){
					var currentUser = body[i];
					console.log("username: " + chalk.cyan(currentUser.name) + " display as: " + chalk.cyan(currentUser.displayName) + " email: "+ chalk.cyan(currentUser.emailAddress));
				}
			}
		})
	};
}

var command = new commands(program, getConfig());
command.do();