/* ================================================================
 * macaca-adb by xdf(xudafeng[at]126.com)
 *
 * first created at : Thu Aug 06 2015 14:48:08 GMT+0800 (CST)
 *
 * ================================================================
 * Copyright  xdf
 *
 * Licensed under the MIT License
 * You may not use this file except in compliance with the License.
 *
 * ================================================================ */

'use strict';

let fs = require('fs');
let path = require('path');
let util = require('util');
const EOL = require('os').EOL;
var _ = require('macaca-utils');
var logger = require('./logger');
var childProcess = require('child_process');

_.exec = function(cmd, opts) {
  return new Promise(function(resolve, reject) {
    childProcess.exec(cmd, _.merge({
      maxBuffer: 1024 * 512,
      wrapArgs: false
    }, opts || {}), function(err, stdout, stderr) {
      if (err) {
        return reject(err);
      }
      resolve(_.trim(stdout));
    });
  });
};

_.spawn = function() {
  var args = Array.prototype.slice.call(arguments);
  return new Promise(function(resolve, reject) {
    var stdout = '';
    var stderr = '';
    var child = childProcess.spawn.apply(childProcess, args);

    child.on('error', function(error) {
      reject(error);
    });

    child.stdout.on('data', function(data) {
      stdout += data;
    });

    child.stderr.on('data', function(data) {
      stderr += data;
    });

    child.on('close', function(code) {
      var error;
      if (code) {
        error = new Error(stderr);
        error.code = code;
        return reject(error);
      }
      resolve([stdout, stderr]);
    });
  });
};

_.adbShell = function() {
  var args = Array.prototype.slice.call(arguments);
  var ANDROID_HOME = process.env.ANDROID_HOME;

  if (ANDROID_HOME) {
    var adb = `${ANDROID_HOME}/platform-tools/adb`;
    args[0] = `${adb} ${args[0]}`;
    return util.format.apply(this, args);
  } else {
    logger.error('please set ANDROID_HOME');
  }
};

_.binaryShell = function(cmd) {
  var args = Array.prototype.slice.call(arguments);
  var ANDROID_HOME = process.env.ANDROID_HOME;

  if (ANDROID_HOME) {
    var cmd = args.shift();
    var buildToolsDir = `${ANDROID_HOME}/build-tools`;
    var buildToolsDirs = fs.readdirSync(buildToolsDir);
    var binaryDir = null;

    buildToolsDirs.forEach(version => {
      var temp = path.join(buildToolsDir, version, cmd);
      if (fs.existsSync(temp)) {
        binaryDir = temp;
      }
    });

    if (!binaryDir) {
      return;
    }
    args[0] = `${binaryDir} ${args[0]}`;
    return util.format.apply(this, args);
  } else {
    logger.error('please set ANDROID_HOME');
  }
};

_.parseMainifest = function(data) {
  var packageName = /package: name='([^']+)'/.exec(data)[1];
  var launchableActivity = /launchable-activity: name='([^']+)'/.exec(data)[1];
  return {
    package: packageName,
    activity: launchableActivity
  };
};

_.parseProcess = function(data, name) {
  var lines = data.split(EOL);
  var pids = [];

  lines.forEach(line => {
    if (!!~line.indexOf(name)) {
      var match = /[^\t ]+[\t ]+([0-9]+)/.exec(line);
      pids.push(match[1]);
    }
  });

  return pids;
};

module.exports = _;
