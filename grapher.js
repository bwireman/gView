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
let ALLbranches = [];

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

class branchMetaDATA {

	constructor(br, nm, pr, parentBranch) {
        this.branch = br;
		this.name = nm;
		this.parent = pr;
		this.added = false;
    };
}

function findbranch(parentName) {

	var meta = ALLbranches.find(function (element) {
		return parentName == element.name;
	});

	if (meta == undefined) {
		return ALLbranches.find(function (element) {
			return parentName == element.parent;
		});
	}
	return meta;

}




function addBranches(brBasic, root) {
	console.log(brBasic);
	console.log(root);
	var rootBranch = gitGraph.branch(root);
	ALLbranches.push(new branchMetaDATA(rootBranch, root, root, rootBranch));
	ALLbranches[0].added = true;
	var toAdd = brBasic.length - 1;
	while (toAdd > 0) {
		for (var br of brBasic) {
			//console.log(br);
			var Parent = ALLbranches.find(function (elt) {
				return elt.name == br.parent && br.name != root;
			});

			if (Parent != undefined) {
				ALLbranches.push(new branchMetaDATA(Parent.branch.branch(br.name), br.name, br.parent));
				toAdd--;
			}



		}
	}

	console.log(ALLbranches);
	return rootBranch;
}

async function main() {
	var result = await init();
	result.nodes.reverse();
	var brBasic = result.branchBasic;
	var branch = addBranches(brBasic, result.root);

	for (node of result.nodes) {
		branch = findbranch(node.Branch);

		if (node.merge) {
			var merged = await findbranch(node.mergeWith);
			var from = branch;
			console.log(from);
			console.log(merged);

			if (branch.added == false) {
				branch.added = true;
				var Parent = ALLbranches.find(function (elt) {
					return elt.name == branch.parent;
				});

				branch.branch.delete();
				var newlyAdded = Parent.branch.branch(branch.name);
				branch.branch = newlyAdded;
			}

			if (merged.added == false) {
				merged.added = true;
				var Parent = ALLbranches.find(function (elt) {
					return elt.name == merged.parent;
				});

				merged.branch.delete();
				var newlyAdded = Parent.branch.branch(merged.name);
				merged.branch = newlyAdded;
			}

			from.branch.merge(merged.branch, {
				message: node.Message,
				author: node.Author,
				messageHashDisplay: false,
				dotStrokeWidth: 5,
				dotColor: "white",
			});
		}
		else {
			if (branch.added == false) {
				branch.added = true;
				var Parent = ALLbranches.find(function (elt) {
					return elt.name == branch.parent;
				});

				branch.branch.delete();
				var newlyAdded = Parent.branch.branch(branch.name);
				branch.branch = newlyAdded;
			}
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