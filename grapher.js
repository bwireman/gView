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
	var branchBasic = await parse.getAndMapBranches(root);
	var info = {
		"nodes": nodes,
		"root": root,
		"branchBasic": branchBasic
	}

	return info;

}

function branchMeta(br, nm, pr, parentBranch) {
	return {
		"branch": br,
		"name": nm,
		"parent": pr,
		"added": false
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




function addBranches(brBasic, root) {
	var rootBranch = gitGraph.branch(root);
	branches.push(branchMeta(rootBranch, root, root, rootBranch));
	branches[0].added = true;
	// branches.push(branchMeta(rootBranch.branch("dev"), "dev", root));
	// branches.push(branchMeta(branches[1].branch.branch("devisparent"), "devisparent", branches[1].name));
	console.log(brBasic);
	var toAdd = brBasic.length - 1;
	while (toAdd > 0) {
		for (var br of brBasic) {
			var Parent = branches.find(function (elt) {
				return elt.name == br.parent && br.name != root;
			});

			if (Parent != undefined) {
				branches.push(branchMeta(Parent.branch.branch(br.name), br.name, br.parent));
				toAdd--;
			}


		}
	}

	console.log(branches);
	return rootBranch;
}

async function main() {
	var result = await init();
	result.nodes.reverse();
	var brBasic = result.branchBasic;
	var branch = addBranches(brBasic, result.root);

	for (node of result.nodes) {
		branch = findbranch(node.Branch[0]);


		var branchesInMerge = await parse.isMerge(node.Hash, result.root);
		if (branchesInMerge != null) {
			var merged = await findbranch(branchesInMerge[0][0]);
			var from = await findbranch(branchesInMerge[1][0]);
			from.branch.merge(merged.branch, {
				message: node.Message,
				author: node.Author,
				messageHashDisplay: false,
				//lineDash: [3, 2],
    			dotStrokeWidth: 5,
    			dotColor: "white",
			});
		}
		else {
			if (branch.added == false) {
				branch.added = true;
				var Parent = branches.find(function (elt) {
					return elt.name == branch.parent;
				});

				branch.branch.delete();
				var newlyAdded = Parent.branch.branch(branch.name);
				branch.branch = newlyAdded;
				// Parent.branch.merge(branch.branch, {
				// 	message: node.Message,
				// 	author: node.Author,
				// 	messageHashDisplay: false,
				// 	fastForward: false
				// });
			}
			// else {
				branch.branch.commit(
					{
						message: node.Message,
						author: node.Author,
						messageHashDisplay: false,
					}
				);
			

		}


	}

}

main();