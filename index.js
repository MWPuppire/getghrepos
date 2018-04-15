#!/usr/bin/env node
var syncRequest = require('sync-request'),
  readline = require('readline-sync'),
  yn = require('yn'),
  argv = require('minimist')(process.argv.slice(2)),
  runningAsScript = !module.parent;
function request(url) {return syncRequest('GET', url, {headers: {'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X x.y; rv:24.0) Gecko/20100101 Firefox/42.0'}})};

function getJSON(url) {
    return JSON.parse(request(url).getBody());
};

function parseRepo(repo) {
    var result = {};
    result.location = repo.full_name;
    result.desc = repo.description;
    result.name = repo.name;
    result.url = repo.html_url;
    result.language = repo.language;
    if (repo.homepage != "") {
        result.website = repo.homepage;
    } else {
        result.website = false;
    };
    return result;
};

function getOrgs(user) {
    var orgs = getJSON("https://api.github.com/users/" + user + "/orgs");
    var result = []
    for (var org in orgs) {
        result.push(orgs[org].repos_url);
    };
    return result;
};

function parseGHResult(ghresult) {
    var repos = {};
    for (var item in ghresult) {
        repos[item] = parseRepo(ghresult[item]);
    }
    return repos;
};

function getRepos(user) {
    var repos = parseGHResult(getJSON("https://api.github.com/users/" + user + "/repos"));
    var orgs = getOrgs(user);
    var orgRepos = {};
    for (var org in orgs) {
        orgRepos[org] = parseGHResult(getJSON(orgs[org]));
    };
    var size = Object.keys(orgRepos).length;
    var result = orgRepos;
    result[size] = repos;
    return result;
};

function main(user) {
    var prompt;
    if (!user) prompt = true;
    if (prompt) user = readline.question("What user do you want to view? ");
    var repos = getRepos(user);
    if (runningAsScript) {
        for (var key in repos) {
            for (var object in repos[key]) {
                for (var item in repos[key][object]) {
                    if (repos[key][object][item]) console.log(repos[key][object][item]);
                };
                console.log("\n");
            };
        };
        if (prompt) {
            if (yn(readline.question("Do you want to search again? "), {default: false, lenient: true})) main();
        };
    } else {
        return repos;
    };
};

if (runningAsScript) {
    if (argv._.length == 0) {
        main();
    } else {
        for (var i = 0; i < argv._.length; i++) {
            main(argv._[i]);
            console.log("\n\n");
        };
    };
} else {
    module.exports = main;
};
