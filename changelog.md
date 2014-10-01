
1.0.0 / 2014-09-30
==================

 * THIS IS A BREAKING RELEASE.  Please consult the updated documentation.

 * add; new simplier client and server apis
 * add; support for console.log style client logging
 * add; support for raw gelf messages from client
 * add; support for Error objects
 * add; support for global custom fields
 * add; clearer api for per-message custom fields
 * add; line by line parsing of streams for client
 * add; unref() for servers

0.6.0 / 2014-09-29
==================

 * add; auto unref client

0.5.1 / 2014-08-26
==================

 * fix; bad microtime timestamp
 * mod; spec link in readme

0.5.0 / 2014-08-20
==================

 * add; console.log style message concat
 * add; optional microtime dep
 * mod; make facility optional (gelf 1.1)

0.4.0 / 2014-03-18
==================

 * drop; node 0.8 support
 * add; mocking for client
 * add; bound logging level functions

0.3.7 / 2014-01-08
==================

 * updated; deps
 * fix; do not write logs if client is closed
 * added; npm badge
 * updated; tests for node 0.10.0

0.3.6 / 2013-03-07
==================

  * fixed; undefined level emitted when .log is used [danmilon]

0.3.5 / 2013-02-19
==================

  * updated; do not get the hostname for every message [danmilon]
  * added; custom log method [danmilon]

0.3.4 / 2013-02-05
==================

  * fixed; handle out of order chunked message properly
  * fixed; catch duplicate ids errors in server

0.3.3 / 2013-02-04
==================

  * updated; use crypto.randomBytes for id

0.3.2 / 2013-01-24
==================

  * updated; udp error handling
  * updated; client 'message' includes level text instead of number
  * fixed; don't pass full_message if none
  * added; more tests

0.3.1 / 2012-11-01
==================

  * added; message event for client
  * added; link to GELF docs
  * added; graygelf img

0.3.0 / 2012-10-05
==================

  * added; proxy server support

0.2.1 / 2012-10-05
==================

  * updated; desc and keywords
  * removed; node 0.6 support
  * added; .npmignore

0.2.0 / 2012-10-05
==================

  * added; more tests
  * added; close methods for client and server
  * added; compressType option to client

0.1.0 / 2012-10-04
==================

  * added; graygelf server support, changed api
