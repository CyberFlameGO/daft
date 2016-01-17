#!/usr/bin/env babel-node

/* Daft Toolkit                         http://www.measurement-factory.com/
 * Copyright (C) 2015,2016 The Measurement Factory.
 * Licensed under the Apache License, Version 2.0.                       */

/*
 * A driver script for the do-as-you-are-told HTTP server.
 * Runs a server configured with a test plot specified on the command line.
 */

import Server from "./Agent";

if (process.argv.length !== 3)
    throw `usage: ${process.argv[1]} <test_plot.js5>`;

let fname = process.argv[2];
console.log("Test plot:", fname);

import fs from "fs";
fs.readFile(fname, function (err, data) {
    if (err)
        throw err;

    eval(data.toString()); // eslint-disable-line no-eval

    let server = new Server();
    server.start();
});
