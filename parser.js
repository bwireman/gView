const electron = require('electron');
const url = require('url');
const path = require('path');
const Node = require('./commitnode.js');

//let directoryPath = "C:/Users/Ben Wireman/Desktop/tester";
let directoryPath = __dirname;
module.exports = class parser {

    async log(workingDir) {
        const git = require('simple-git/promise');

        let fullLogJson = null;
        try {
            fullLogJson = await git(workingDir).log({'--decorate': null, '--all': null });
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

        if (branch.length == 1)
        {
            return branch.replace("*", "").trim();
        }
        else if(branch.length > 1)
        {
            var foundRoot = false;
            var toReturn = null;
            for (var br of branch)
            {
                if (br.includes("*") && !foundRoot)
                {
                    toReturn = [br.replace("*", "").trim()];
                }
                else if(br.replace("*", "").trim() == root)
                {
                    foundRoot = true;
                    toReturn = [br.replace("*", "").trim()];
                }
            
            }

            if(!foundRoot && toReturn == null)
            {
                toReturn = [branch[0].trim()];
            }

            return toReturn;
        }

    }

    async getRoot(Nodes) {

        var currentBranchOfNode = "";
        for (var i = 0; i < Nodes.length; i++) {

            if (Nodes[i].Branch.length > 0)
            {
                currentBranchOfNode = Nodes[i].Branch[0];
                var parent = await this.getParent(currentBranchOfNode);
                if (parent == currentBranchOfNode)
                {
                    return parent;
                }
            }
        }

    }

    async buildNodes() {

        let nodes = [];

        let log = await this.log(directoryPath);
        for (var i = 0; i < log.all.length; i++) {
            nodes.push(new Node(log.all[i].author_name, log.all[i].date, this.parseBranch(log.all[i].message), log.all[i].message, log.all[i].hash));
        }
        let CurrBranch = (await this.getCurrentBranch(directoryPath)).current;
        var root = await this.getRoot(nodes);
        for (var i = 0; i < nodes.length; i++) {
            
            nodes[i].Branch = await this.getBranch(nodes[i].Hash, root);

        }

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
                    temp.push(possibles[i].replace("HEAD -> ", "").trim());
                }
            }

            return temp;
        }
        else {
            return [];
        }
    }

    async isMerge(hash, root) {

        const git = require('simple-git/promise');

        let commitInfo = null;
        try {
            commitInfo = await git(directoryPath).raw([
                'cat-file', '-p', hash
            ]);
        }
        catch (e) {
            console.log(e);
        }

        commitInfo = commitInfo.split("\n");
        var parents = [];

        for (var i = 1; i < commitInfo.length; ++i)
        {
            if (commitInfo[i].includes("parent") && i != commitInfo.length - 2)
            {
                parents.push(commitInfo[i].replace("parent", "").trim());
            }
        }

        
        if (parents.length > 1)
        {
            var branches = [];
            for (var prHash of parents)
            {
                branches.push(await this.getBranch(prHash, root))
            }

            return branches;

        }
        else
        {
            return null;
        }

        
    }

}

