const electron = require('electron');
const url = require('url');
const path = require('path');
const Parser = require('./parser.js');

var config = {
  template: "metro",
  reverseArrow: false, // to make arrows point to ancestors, if displayed
  orientation: "vertical",
  // mode: "compact" // special compact mode: hide messages & compact graph
};


var parse = new Parser();
var gitGraph = new GitGraph(config);
var branches = [];

async function run() {
  return await parse.buildNodes();
}

function branchMeta(br, nm, pr) {
  return {
    "branch": br,
    "name": nm,
    "parent": pr
  };
}

function findbranch(parentName) {
  console.log(parentName);
  var meta = branches.find(function (element) {
    return parentName == element.name;
  });

  console.log(meta);
  return meta;

}

async function addBranchIfNew(name) {
  var meta = branches.find(function (element) {
    return name == element.name;
  });

  if (meta == undefined) {
    console.log(name);
    var prName = await parse.getParent(name);
    console.log(prName);
    meta = branchMeta(name, findbranch(prName).branch(name), prName);
    branches.push(meta);
  }

  return branches.indexOf(meta);

}

async function main() {
  var result = await run();
  result.reverse();
  console.log(result[0]);
  var first = gitGraph.branch(result[0].Branch[0]);
  branches.push(branchMeta(gitGraph, result[0].Branch[0], result[0].Branch[0]));
  var branch = gitGraph;

  for (node of result) {

    branch = branches[await addBranchIfNew(node.Branch[0])];

    console.log(branch);
    branch.branch.commit(
      {
        message: node.Message,
        author: node.Author,
        messageHashDisplay: false
      }
    );

  }
}

main();