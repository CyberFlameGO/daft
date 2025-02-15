/* Daft Toolkit                         http://www.measurement-factory.com/
 * Copyright (C) 2015,2016 The Measurement Factory.
 * Licensed under the Apache License, Version 2.0.                       */

/* Manages an HTTP response message, including headers and body */

import assert from "assert";
import Message from "./Message";
import StatusLine from "./StatusLine";
import { Must } from "../misc/Gadgets";
import * as Config from "../misc/Config";

// custom CLI options
Config.Recognize([
    {
        option: "response-ends-at-eof",
        type: "Boolean",
        default: "false",
        description: "send unchunked response without Content-Length",
    },
]);

export default class Response extends Message {

    constructor(...args) {
        super(new StatusLine(), ...args);

        // force the sender to close the connection to mark the end of response
        this.forceEof = null; // use Config.responseEndAtEof by default
    }

    // makes us an exact replica of them
    reset(them) {
        super.reset(them);
        this.forceEof = them.forceEof;
        return this;
    }

    from(resource) {
        this.relatedResource(resource, "From");

        if (resource.lastModificationTime)
            this.header.add("Last-Modified", resource.lastModificationTime.toUTCString());
        if (resource.nextModificationTime)
            this.header.add("Expires", resource.nextModificationTime.toUTCString());

        resource.mime.fields.forEach(field => this.header.add(field));

        if (resource.body) {
            // XXX: We cannot support dynamic resource.body updates because
            // server transactions copy resource info at serve(resource) time,
            // each using this.body to keep track of the outedSize() progress.
            assert(resource.body.innedAll);
            assert.strictEqual(resource.body.outedSize(), 0);
            this.addBody(resource.body.clone());
        }
    }

    syncContentLength() {
        const forceEof = this.forceEof === null ? Config.responseEndsAtEof() : this.forceEof;
        if (forceEof) {
            Must(this.body);
            Must(!this.chunkingBody());
            this.header.prohibitNamed("Content-Length");
            this.header.prohibitNamed("Transfer-Encoding"); // XXX: "chunked"
        } else {
            super.syncContentLength();
        }
    }

    prefix(messageWriter) {
        return messageWriter.responsePrefix(this);
    }
}
