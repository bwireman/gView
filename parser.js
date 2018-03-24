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
                nodes[i].Branch = CurrBranch;
            }
        }

        console.log(nodes);
        return nodes;
    }

    parseBranch(commitMessage) {

        if (commitMessage.includes("(") && commitMessage.includes(")"))
        {
            let leftParen = commitMessage.indexOf("(");
            let rightParen = commitMessage.indexOf(")");
            let temp = commitMessage.substring(leftParen, rightParen).split(",");
            return temp;
        }
        else
        {
            return null;
        }
    }

}

