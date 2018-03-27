const electron = require('electron');
const url = require('url');
const path = require('path');

module.exports = class commitNode {
   

    constructor(auth, time, branch, msg, hash, merge, mergeWith) {
        this.Author = auth;
        this.TimeStamp = time;
        this.Branch = branch;
        this.Message = msg;
        this.Hash = hash;
        this.merge = merge;
        this.mergeWith = mergeWith;
    };
}
