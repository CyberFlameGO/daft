/* Daft Toolkit                         http://www.measurement-factory.com/
 * Copyright (C) 2015,2016 The Measurement Factory.
 * Licensed under the Apache License, Version 2.0.                       */

import net from "net";
import Promise from 'bluebird';
import assert from "assert";
import * as Config from "../misc/Config";
import * as Gadgets from "../misc/Gadgets";
import Transaction from "./Transaction";
import StatusLine from "../http/StatusLine";
import SideAgent from "../side/Agent";

export default class Agent extends SideAgent {
    constructor() {
        assert.strictEqual(arguments.length, 0);

        super();

        this.socket = null; // connection to be established in start()
        this.localAddress = null;
        this.remoteAddress = null;
        this.nextHopAddress = Config.ProxyListeningAddress;

        this._transaction = new Transaction(this);
    }

    get request() {
        return this._transaction.request;
    }

    expectStatusCode(expectedCode) {
        assert(StatusLine.IsNumericCode(expectedCode));
        assert.strictEqual(this.transaction().response.startLine.codeInteger(), expectedCode);
    }

    start() {
        let savedReject = null;
        return new Promise((resolve, reject) => {
            this.socket = new net.Socket();
            this.socket.once('error', savedReject = reject);
            // open a TCP connection to the proxy
            this.socket.connect(this.nextHopAddress, resolve);
        }).tap(() => {
            this.socket.removeListener('error', savedReject);
            this.localAddress = { host: this.socket.localAddress, port: this.socket.localPort };
            this.remoteAddress = { host: this.socket.remoteAddress, port: this.socket.remotePort };
            console.log("Client at %s connected to %s",
                Gadgets.PrettyAddress(this.localAddress),
                Gadgets.PrettyAddress(this.remoteAddress));
        }).tap(() => {
            this._startTransaction(this._transaction, this.socket);
        });
    }

    async stop() {
        assert(!this._keepConnections); // no pconn support yet
        if (this.socket) {
            this.socket.destroy(); // XXX: what if a transaction does it too?
            this.socket = null;
            console.log("Client at %s disconnected from %s",
                Gadgets.PrettyAddress(this.localAddress),
                Gadgets.PrettyAddress(this.remoteAddress));
        }
    }
}
