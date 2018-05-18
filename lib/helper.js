'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const EOL = require('os').EOL;
const xutil = require('xutil');
const macacaUtils = require('macaca-utils');
const childProcess = require('child_process');

var logger = require('./logger');

var _ = macacaUtils.merge({}, macacaUtils);

const isWindows = _.platform.isWindows;

_.childProcess = childProcess;

_.sleep = function(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
};

_.exec = function(cmd, opts) {
  return new Promise((resolve, reject) => {
    childProcess.exec(cmd, _.merge({
      maxBuffer: 1024 * 512 * 10,
      wrapArgs: false
    }, opts || {}), (err, stdout) => {
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

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

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

_.waitForCondition = function(func, wait/* ms*/, interval/* ms*/) {
  wait = wait || 5000;
  interval = interval || 500;
  let start = Date.now();
  let end = start + wait;
  const fn = function() {
    return new Promise(function(resolve, reject) {
      const continuation = (res, rej) => {
        let now = Date.now();
        if (now < end) {
          res(_.sleep(interval).then(fn));
        } else {
          rej(`Wait For Condition timeout ${wait}`);
        }
      };
      func().then(isOk => {
        if (isOk) {
          resolve();
        } else {
          continuation(resolve, reject);
        }
      }).catch(() => {
        continuation(resolve, reject);
      });
    });
  };
  return fn();
};

_.adbShell = function() {
  var args = Array.prototype.slice.call(arguments);
  args[0] = `${this.getAdbPath()} ${args[0]}`;
  return util.format.apply(this, args);
};

_.getAdbPath = function() {
  var ANDROID_HOME = process.env.ANDROID_HOME;

  if (ANDROID_HOME) {
    return path.join(`${ANDROID_HOME}`, 'platform-tools', isWindows ? 'adb.exe' : 'adb');
  } else {
    logger.error('please set ANDROID_HOME');
    return null;
  }
};

_.binaryShell = function() {
  var args = Array.prototype.slice.call(arguments);
  var ANDROID_HOME = process.env.ANDROID_HOME;

  if (ANDROID_HOME) {
    var cmd = args.shift();
    var buildToolsDir = path.join(ANDROID_HOME, 'build-tools');
    var buildToolsDirs = fs.readdirSync(buildToolsDir);
    var binaryDir = null;

    buildToolsDirs.forEach(version => {

      if (xutil.platform.isWindows) {
        cmd = `${cmd}.exe`;
      }

      var temp = path.join(buildToolsDir, version, cmd);

      if (_.isExistedFile(temp)) {
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

_.parseVersion = function(data) {
  var version = /versionCode='([^']+)'/.exec(data);

  if (version) {
    version = version[1];
  } else {
    version = 0;
  }

  return version;
};

_.parseProcess = function(data, name) {
  var lines = data.split(EOL);
  var pids = [];

  lines.forEach(line => {
    if (~line.indexOf(name)) {
      var match = /[^\t ]+[\t ]+([0-9]+)/.exec(line);
      pids.push(match[1]);
    }
  });

  return pids;
};

_.parseFocusedApp = function(data) {
  var res = null;
  var reg = /mFocusedApp.+Record\{.*\s([^\s\/\}]+)\/([^\s\/\}]+)(\s[^\s\/\}]+)*\}/;
  data = data.split(EOL);
  data.forEach(line => {
    var match = reg.exec(line);
    if (match) {
      res = {
        package: match[1],
        activity: match[2]
      };
    }
  });
  return res;
};

_.parseFocusedActivity = function(data) {
  var res = null;
  var reg = /mFocusedActivity.+Record\{.*\s([^\s\/\}]+)\/([^\s\/\}]+)(\s[^\s\/\}]+)*\}/;
  data = data.split(EOL);
  data.forEach(line => {
    var match = reg.exec(line);
    if (match) {
      res = `${match[1]}/${match[2]}`;
    }
  });
  return res;
};

_.parseIsScreenLocked = function(data) {
  var matchShowingLockScreen = /mShowingLockscreen=\w+/gi.exec(data);
  var matchScreenOnFully = /mScreenOnFully=\w+/gi.exec(data);

  if (!matchShowingLockScreen || !matchScreenOnFully) {
    return false;
  }
  var matchShowingLockScreenRes = matchShowingLockScreen[0].split('=')[1];
  var matchScreenOnFullyRes = matchScreenOnFully[0].split('=')[1];
  return matchShowingLockScreenRes === 'true' || matchScreenOnFullyRes === 'false';
};

_.parseApkVersion = function(data) {
  var versionCode = /versionCode=\w+/gi.exec(data);
  if (versionCode) {
    versionCode = versionCode[0].split('=')[1];
  } else {
    versionCode = 0;
  }

  return versionCode;
};

_.parseIsInstalled = function(data, apk) {
  return !!~data.indexOf(`package:${apk}`);
};

_.execPromiseGenerator = function(cmd, cb) {
  var promise = _.exec(cmd);

  if (cb) {
    return promise.then(data => {
      cb.call(this, null, data);
    }).catch(err => {
      cb.call(this, `exec ${cmd} error with: ${err}`);
    });
  } else {
    return promise;
  }
};

module.exports = _;
