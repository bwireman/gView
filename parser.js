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
            fullLogJson = await git(workingDir).log({'--all': null, '--graph':null, '--decorate':null});
        }
        catch (e) {
            console.log(e);
        }
        
        return fullLogJson;
    }

    async buildNodes() {

        let nodes = [];

        let log = await this.log(directoryPath);
        console.log(log);
        for (var i = 0; i < log.all.length; i++) {
            nodes.push(new Node (log.all[i].author_name, log.all[i].date, log.all[i].message, log.all[i].message));
        }

        console.log(nodes);
    }

}

