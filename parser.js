const electron = require('electron');
const url = require('url');
const path = require('path');
const Node = require('./commitnode.js');

let directoryPath = __dirname;
module.exports = class parser {

    async log(workingDir) {
        const git = require('simple-git/promise');

        let fullLogJson = null;
        try {
            fullLogJson = await git(workingDir).log({ '--graph': null, '--decorate': null, '--all': null });
        }
        catch (e) {
            console.log(e);
        }

        return fullLogJson;
    }

    async getCurrentBranch(workingDir) {
        const git = require('simple-git/promise');

        let branch = null;
        try {
            branch = await git(workingDir).branch();
        }
        catch (e) {
            console.log(e);
        }

        return branch;
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

            var post = raw.substring(raw.indexOf('---')).split("\n");
            var pre = raw.substring(0, raw.indexOf('---')).split("\n");
            var spacer = pre.length - 1;
            var SymbolsAndSpacings = [];
            var mySymbolAndSpacingIndex;

            //find symbols and spacing
            for (var k = 0; k < spacer; ++k) {
                var b = pre[k].substring(pre[k].indexOf('[') + 1, pre[k].indexOf(']')).trim();
                SymbolsAndSpacings.push(SymAndSpace(pre[k][k] == '!' ? '+' : '*', k, b));

                if (b == branchName.trim()) {
                    mySymbolAndSpacingIndex = k;
                }
            }

            for (var commit of post) {
                var found = false;
                var alone = true;

                if (commit[SymbolsAndSpacings[mySymbolAndSpacingIndex].spacing] == SymbolsAndSpacings[mySymbolAndSpacingIndex].symbol) {
                    var searchSpace = commit.substring(0, spacer);
                    console.log(commit);
                    for (let i in searchSpace) {
                        if (!found && searchSpace[i] == SymbolsAndSpacings[i].symbol && i != mySymbolAndSpacingIndex) {
                            alone = false;
                            parent = commit.substring(commit.indexOf('[') + 1, commit.indexOf(']')).trim();
                        }

                        if(!alone)
                        {
                            
                        }
                    }
                }

            }

            // console.log(pre);
            console.log(parent);

        }
        catch (e) {
            console.log(e);
        }

        return parent;
    }

    async buildNodes() {

        let nodes = [];

        let log = await this.log(directoryPath);
        for (var i = 0; i < log.all.length; i++) {
            nodes.push(new Node(log.all[i].author_name, log.all[i].date, this.parseBranch(log.all[i].message), log.all[i].message));
        }
        let CurrBranch = (await this.getCurrentBranch(directoryPath)).current;

        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].Branch == null) {
                nodes[i].Branch = [CurrBranch];
            }
        }

        console.log(nodes);
        return nodes;
    }

    parseBranch(commitMessage) {

        if (commitMessage.includes("(") && commitMessage.includes(")")) {
            let leftParen = commitMessage.indexOf("(") + 1;
            let rightParen = commitMessage.indexOf(")");
            let possibles = commitMessage.substring(leftParen, rightParen).split(",");
            let temp = [];
            for (var i = 0; i < possibles.length; ++i) {
                if (!possibles[i].includes("origin")) {
                    temp.push(possibles[i].trim());
                }
            }


            return temp;
        }
        else {
            return null;
        }
    }

}

