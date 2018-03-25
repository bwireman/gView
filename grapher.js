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

async function init() {

  var nodes = await parse.buildNodes();
  var root = await parse.getRoot(nodes);
  var info = {
    "nodes":nodes, 
    "root": root
  } 

  return info;

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
  var result = await init();
  result.nodes.reverse();
  var first = gitGraph.branch(result.nodes[0].Branch[0]);
  branches.push(branchMeta(first, result.nodes[0].Branch[0], await parse.getParent(result.nodes[0].Branch[0])));
  var branch = gitGraph;

  for (node of result.nodes) {
    branch = branches[await addBranchIfNew(node.Branch[0])];
    
    var branchesInMerge = await parse.isMerge(node.Hash, result.root);
    if (branchesInMerge != null)
    {
      var merged = branches[await addBranchIfNew(branchesInMerge[0][0])];
      var from = branches[await addBranchIfNew(branchesInMerge[1][0])];
      from.branch.merge(merged.branch,  {
        message: node.Message,
        author: node.Author,
        messageHashDisplay: false,
        dotColor: "black",
      });
    }
    else
    {
      branch.branch.commit(
        {
          message: node.Message,
          author: node.Author,
          messageHashDisplay: false
        }
      );
    }
   

  }
}

main();