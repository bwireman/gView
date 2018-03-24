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
gitGraph.branch("test");
var nodes = [];
var currentBranch;

function getParent(idxInNodes) {
  var found = false;
  var i = idxInNodes;
  while (i > 0 && !found) {
    i--;
    if (nodes[i].branch != nodes[idxInNodes].branch) {
      found = true;
      return nodes[i].branch;
    }
  }

  return curr;

}

async function run() {
  return await parse.buildNodes();
}

async function main() {
  var result = await run();
  var curr = [];

  for (node of result) {
    // for (var j = 0; j < nodes[i].branch.length; ++i)
    // {
    //     if(!branchNames.includes(nodes[i].branch[j]))
    //     {
    //       var parent = getParent(i);
    //     }
    // }

    gitGraph.commit(
      {
        message: node.Message,
        author: node.Author,
        messageHashDisplay: false
      }
    );

  }
}

main();


  // /************************
  //  * BRANCHES AND COMMITS *
  //  ************************/

  // // Create branch named "master"
  // var master = gitGraph.branch("master");

  // // Commit on HEAD Branch which is "master"
  // gitGraph.commit("Initial commit");

  // // Add few commits on master
  // gitGraph.commit("My second commit").commit("Add awesome feature");

  // // Create a new "dev" branch from "master" with some custom configuration
  // var dev = master.branch({
  //   name: "dev",
  //   color: "#F00",
  //   // lineDash: [5],
  //   commitDefaultOptions: {
  //     color: "#F00"
  //   }
  // });

  // dev.commit("Youhou \\o/");

  // // Commit again on "master"
  // master.commit("I'm the master !");

  // // Advanced commit method with style and specific author (HEAD)
  // var commitConfig = {
  //   dotColor: "white",
  //   dotSize: 10,
  //   dotStrokeWidth: 10,
  //   messageHashDisplay: false,
  //   messageAuthorDisplay: true,
  //   message: "Alors c'est qui le papa ?",
  //   tooltipDisplay: false,
  //   author: "Me <me@planee.fr>"
  // };
  // gitGraph.commit(commitConfig);

  // // Create another from "master"
  // var feature3 = master.branch("feature3")
  // feature3.commit().commit();

  // /***********************
  //  *      CHECKOUT       *
  //  ***********************/

  // // Checkout to create "test" from "master" branch
  // // master.checkout();

  // /***********************
  //  *       DETAILS       *
  //  ***********************/

  // var commitWithDetailsConfig = {
  //   message: "A commit with detailed message",
  //   detailId: "detail"
  // };
  // gitGraph.commit(commitWithDetailsConfig).commit();
  // dev.commit().commit(); // 2 default commits on "dev"

  // /***********************
  //  *    CUSTOMIZATION    *
  //  ***********************/

  // gitGraph.author = "Fabien0102 <fabien0102@planee.fr>";
  // master.commit();

  // /***********************
  //  *       MERGES        *
  //  ***********************/

  // master.checkout();

  // // Merge "dev" branch into HEAD (which is "master"), with a default message
  // dev.merge();

  // // Create a "test" branch and merge it into "master" with a custom message and tag
  // var test = gitGraph.branch("test");
  // test.commit("Final commit");
  // test.merge(master, "My special merge commit message");

  // // Then, continue committing on the "test" branch
  // test.commit({
  //   message: "It works !"
  // });

  // var fastForwardBranch = test.branch("fast-forward");
  // fastForwardBranch.commit("First commit on FF branch");
  // fastForwardBranch.commit("Second commit on FF branch");

  // // If not commented, it will prevent fast-forward
  // // test.commit("Make Fast Forward impossible");

  // fastForwardBranch.merge(test, {
  //   fastForward: true
  // });

  // /***********************
  //  *        TAGS         *
  //  ***********************/

  // // Add a tag to a commit
  // test.commit({
  //   message: "Here you can see something",
  //   tag: "a-tag"
  // });

  // // Don't display tag box
  // test.commit({
  //   message: "Here is a fresh new tag",
  //   tag: "my-tag",
  //   displayTagBox: false
  // });

  // // Tag current HEAD
  // test.commit("Tag this commit").tag("b-tag");
  // gitGraph
  //   .commit("This one has no tag")
  //   .commit("Tag this one")
  //   .tag({
  //     tag: "c-tag",
  //     tagColor: "green",
  //     displayTagBox: false
  //   });

  // // Perform a merge, with a tag
  // test.merge(master, {
  //   message: "New release",
  //   tag: "v1.0.0"
  // });

  // // Create different branches from an empty one and do some commits
  // var features = master.branch("features")
  // var feature1 = features.branch("feature1")
  // var feature2 = features.branch("feature2")
  // feature2.commit().commit();
  // feature1.commit();

  // /***********************
  //  *       EVENTS        *
  //  ***********************/

  // gitGraph.canvas.addEventListener("graph:render", function (event) {
  //   console.log(event.data.id, "has been rendered with a scaling factor of", gitGraph.scalingFactor);
  // });

  // gitGraph.canvas.addEventListener("commit:mouseover", function (event) {
  //   console.log("You're over a commit.", "Here is a bunch of data ->", event.data);
  //   this.style.cursor = "pointer";
  // });

  // gitGraph.canvas.addEventListener("commit:mouseout", function (event) {
  //   console.log("You just left this commit ->", event.data);
  //   this.style.cursor = "auto";
  // });

  // // Attach a handler to the commit
  // test.commit({
  //   message: "Click me!",
  //   author: "Nicolas <me@planee.fr>",
  //   onClick: function (commit, isOverCommit, event) {
  //     console.log("You just clicked my commit.", commit, event);
  //   }
  // });

  // // Display WIP-like commit
  // test
  //   .commit({
  //     lineDash: [3, 2],
  //     dotStrokeWidth: 5,
  //     dotColor: "white",
  //     messageHashDisplay: false,
  //     messageAuthorDisplay: false,
  //     message: "Current WIP",
  //     tag: "HEAD",
  //     displayTagBox: false
  //   });
