const electron = require('electron');
const url = require('url');
const path = require('path');
const Parser = require('./parser.js');

var config = {
  template: "metro",
  reverseArrow: false, // to make arrows point to ancestors, if displayed
  orientation: "vertical-reverse",
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
  var meta = branches.find(function (element) {
    return parentName == element.name;
  });

  if (meta == undefined) {
    return branches.find(function (element) {
      return parentName == element.parent;
    });
  }

  return meta;

}

async function addBranchIfNew(name) {
  var meta = branches.find(function (element) {
    return name == element.name;
  });

  if (meta == undefined) {
    var prName = await parse.getParent(name);
    meta = branchMeta(findbranch(prName).branch.branch(name), name, prName);
    branches.push(meta);
  }
  else {
    console.log(meta);
  }

  return branches.indexOf(meta);

}

async function main() {
  var result = await run();
  result.reverse();
  var first = gitGraph.branch(result[0].Branch[0]);
  branches.push(branchMeta(first, result[0].Branch[0], await parse.getParent(result[0].Branch[0])));
  var branch = gitGraph;

  for (node of result) {
    console.log(node.Branch[0]);
    if (node.Branch != []) {
      branch = branches[await addBranchIfNew(node.Branch[0])];
    }


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