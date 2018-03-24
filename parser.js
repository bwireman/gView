const electron = require('electron');
const url = require('url');
const path = require('path');
const Node = require('./commitnode.js');

let directoryPath = __dirname;
module.exports = class parser {

    async log (workingDir) {
        const git = require('simple-git/promise');
        
        let fullLogJson = null;
        try {
            fullLogJson = await git(workingDir).log({'--graph':null, '--decorate':null, '--all': null});
        }
        catch (e) {
            console.log(e);
        }
        
        return fullLogJson;
    }

    async getCurrentBranch (workingDir) {
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
        //var cmd = "show-branch | grep '*' | grep -v " + branchName + " | head -n1 | sed 's/.*\[\(.*\)\].*/\1/' | sed 's/[\^~].*//'"
        const git = require('simple-git/promise');
        
        let raw = null;
        let parent = null;
        try {
            raw = await git(directoryPath).raw([
                'show-branch'
            ]);

            raw = raw.substring(raw.indexOf('---')).split("*");
            var i = 1;

            while (raw[i].substring(raw[i].indexOf('[') + 1, raw[i].indexOf(']')).includes(branchName))
            {
                i++;
            }
            parent = raw[i].substring(raw[i].indexOf('[') + 1, raw[i].indexOf(']')).trim();


            console.log(raw);
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
            nodes.push(new Node (log.all[i].author_name, log.all[i].date, this.parseBranch(log.all[i].message), log.all[i].message));
        }
        let CurrBranch = (await this.getCurrentBranch(directoryPath)).current;

        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].Branch == null)
            {
                nodes[i].Branch = [CurrBranch];
            }
        }

        console.log(nodes);
        return nodes;
    }

    parseBranch(commitMessage) {

        if (commitMessage.includes("(") && commitMessage.includes(")"))
        {
            let leftParen = commitMessage.indexOf("(") + 1;
            let rightParen = commitMessage.indexOf(")");
            let possibles = commitMessage.substring(leftParen, rightParen).split(",");
            let temp = [];
            for (var i = 0; i < possibles.length; ++i)
            {
                if (!possibles[i].includes("origin"))
                {
                    temp.push(possibles[i].trim());
                }
            }


            return temp;
        }
        else
        {
            return null;
        }
    }

}

