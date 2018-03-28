const electron = require('electron');
const url = require('url');
const path = require('path');
const Node = require('./commitnode.js');

//let directoryPath = "C:/Users/Ben Wireman/Desktop/tester";
let directoryPath = __dirname;
module.exports = class parser {

   

    async log(workingDir) {
        const git = require('simple-git/promise');

        let hash = " ";
        let message = " ";
        let branch = " ";
        let author = " ";
        let date = " ";
        let merge = false;
        let mergeWith = null;
        let log = [];
        var fullLogJson = await git(directoryPath).raw(['log', '-g', '--all']);
        try {
                var temp = fullLogJson.split("\n");
                var lineCount = 0;
               
                for (var line of temp) {
                    //console.log( "\n" + line);

                    if (lineCount == 0) {
                        hash = line.replace("commit", "").trim();
                    }
                    else if (lineCount == 1) { 
                        branch = line.replace("Reflog: ", "");
                        var beforeBracket = branch.substring(0, branch.indexOf("@{"));
                        var lastSlash = beforeBracket.lastIndexOf("/");
                        branch = beforeBracket.substring(lastSlash + 1, beforeBracket.length);
                    }
                    else if (lineCount == 2) {
                        var commit = line.includes("commit:");
                        message = line.replace("Reflog message: commit: ", "").trim();


                        if (!commit && message.includes('Reflog message: merge'))
                        {
                            merge = true;
                            mergeWith = line.substring(("Reflog message: merge").length, line.lastIndexOf(":")).trim();
                            message = message.replace("Reflog message: merge", "");
                            console.log(message);
                        }
                        else
                        {
                            merge = false;
                            mergeWith = null;
                        }

                    }
                    else if (lineCount == 3) {
                        author = line.replace("Author: ", "").trim();
                    }
                    else if (lineCount == 4) {
                        date = line.replace("Date: ", "").trim();
                    }
                    else if (merge && lineCount == 6)
                    {
                        message = line.trim();
                    }

                    lineCount++;

                    if (lineCount == 8) {
                        lineCount = 0;

                        var l = new Node(author, date, branch, message, hash, merge, mergeWith);

                        log.push(l);

                    }
                }

            console.log(log);

        }
        catch (e) {
            console.log(e);
        }

        return log;

    }

   

    Branch(name, prName) {

        return {
            "name": name,
            "parent": prName
        }

    }



    async getAndMapBranches(root) {
        const git = require('simple-git/promise');

        let branches = [];
        try {
            var output = await git(directoryPath).branch();
            // console.log(output);
            for (var br of output.all) {

                if (!br.includes("remotes/")) {
                    branches.push(this.Branch(br, await this.getParent(br)));
                }
            }



        }
        catch (e) {
            console.log(e);
        }
        return branches;
    }

    async getParent(branchName) {
        //git show-branch | grep '*' | grep -v "$(git rev-parse --abbrev-ref HEAD)" | head -n1 | sed 's/.*\[\(.*\)\].*/\1/' | sed 's/[\^~].*//'
        const git = require('simple-git/promise');

        function SymAndSpace(sym, space, name) {
            return {
                "symbol": sym,
                "spacing": space,
                "branch": name
            }
        }


        let raw = null;
        let parent = null;
        try {
            raw = await git(directoryPath).raw([
                'show-branch'
            ]);

            var post = raw.substring(raw.indexOf('-')).split("\n");
            var pre = raw.substring(0, raw.indexOf('-')).split("\n");
            var spacer = pre.length - 1;
            var SymbolsAndSpacings = [];
            var mySymbolAndSpacingIndex;
            var rewrite = false;
            //find symbols and spacing
            for (var k = 0; k < spacer; ++k) {
                var b = pre[k].substring(pre[k].indexOf('[') + 1, pre[k].indexOf(']')).trim();
                SymbolsAndSpacings.push(SymAndSpace(pre[k][k] == '!' ? '+' : '*', k, b));

                if (b == branchName.trim()) {
                    mySymbolAndSpacingIndex = k;
                    if (SymbolsAndSpacings[k].symbol != '*') {
                        rewrite = true;
                    }
                }
            }

            if (rewrite) {
                for (var line = 1; line < post.length; ++line) {
                    if (post[line][SymbolsAndSpacings[mySymbolAndSpacingIndex].spacing] == "+") {
                        post[line] = post[line].substring(0, SymbolsAndSpacings[mySymbolAndSpacingIndex].spacing) + "A"
                            + post[line].substring(1 + SymbolsAndSpacings[mySymbolAndSpacingIndex].spacing);
                    }
                }

                for (var line = 1; line < post.length; ++line) {
                    post[line] = post[line].substring(0, spacer).replace("*", "+") + post[line].substring(spacer);
                    post[line] = post[line].substring(0, spacer).replace("A", "*") + post[line].substring(spacer);
                }
            }


            var possibles = [];
            for (var line = 1; line < post.length; ++line) {
                if (post[line].includes("*")) {
                    possibles.push(post[line]);
                }
            }

            if (possibles.length == 0) {
                return branchName;
            }
            else {
                parent = possibles[0].substring(possibles[0].indexOf("[") + 1, possibles[0].indexOf("]"))
                    .replace("^", " ").replace("~", " ").trim();

                for (var line = 0; line < possibles.length; ++line) {

                    if (parent == branchName) {
                        parent = possibles[line].substring(possibles[line].indexOf("[") + 1, possibles[line].indexOf("]"))
                            .replace("^", " ").replace("~", " ").replace(/[0-9]/g, '').trim();
                    }
                }
            }

            return parent;

        }
        catch (e) {
            console.log(e);
        }

    }

    async getBranch(hash, root) {
        const git = require('simple-git/promise');
        hash = hash.trim();
        let branch = null;
        try {
            branch = await git(directoryPath).raw([
                'branch', '--contains', hash
            ]);
            branch = branch.split("\n");
        }
        catch (e) {
            console.log(e);
        }

        if (branch.length == 1) {
            return branch.replace("*", "").trim();
        }
        else if (branch.length > 1) {
            var foundRoot = false;
            var toReturn = null;
            for (var br of branch) {
                if (br.includes("*") && !foundRoot) {
                    toReturn = [br.replace("*", "").trim()];
                }
                else if (br.replace("*", "").trim() == root) {
                    foundRoot = true;
                    toReturn = [br.replace("*", "").trim()];
                }

            }

            if (!foundRoot && toReturn == null) {
                toReturn = [branch[0].trim()];
            }

            return toReturn;
        }

    }

    async getRoot(Nodes) {

        var currentBranchOfNode = "";
        for (var i = 0; i < Nodes.length; i++) {

            if (Nodes[i].Branch.length > 0) {
                currentBranchOfNode = Nodes[i].Branch[0];
                var parent = await this.getParent(currentBranchOfNode);
                if (parent == currentBranchOfNode) {
                    return parent;
                }
            }
        }

        return "dev";

    }

    async buildNodes() {

        let nodes = [];

        nodes = await this.log(directoryPath);
        // for (var i = 0; i < log.all.length; i++) {
        //     nodes.push(new Node(log.all[i].author_name, log.all[i].date, log.all[i].branch, log.all[i].message, log.all[i].hash));
        // }
        // for (var i = 0; i < nodes.length; i++) {

        //     nodes[i].Branch = await this.getBranch(nodes[i].Hash, root);

        // }

        nodes[nodes.length -1].Branch = await this.getRoot(nodes);

        return nodes;
    }

}

