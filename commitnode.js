const electron = require('electron');
const url = require('url');
const path = require('path');

module.exports = class commitNode {
   

    constructor(auth, time, branch, msg) {
        this.Author = auth;
        this.TimeStamp = time;
        this.Branch = branch;
        this.Message = msg;
    };
}