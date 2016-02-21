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
let co = require('co');
let path = require('path');
let EOL = require('os').EOL;
let _ = require('./helper');
let logger = require('./logger');

let defaultOpt = {

};

function ADB(options) {
  this.options = _.merge(defaultOpt, options);
  this.deviceId = null;
}

ADB.prototype.setDeviceId = function(deviceId) {
  this.deviceId = deviceId;
};

ADB.prototype.getApiLevel = function() {
  var args = Array.prototype.slice.call(arguments);
  args.unshift('getprop ro.build.version.sdk');
  return this.shell.apply(this, args);
};

ADB.prototype.startApp = function() {
  var args = Array.prototype.slice.call(arguments);
  var options = args.shift();
  var shell = `am start -n ${options.package}/${options.activity}`;

  args.unshift(shell);

  if (args.length > 1) {
    var cb = args[1];

    if (typeof cb === 'function') {
      this.getApiLevel((err, apiLevel) => {
        if (parseInt(apiLevel, 10) > 15) {
          args[0] = `${args[0]} -S`;
        }
        this.shell.apply(this, args);
      });
    } else {
      logger.warn('exec startApp failed');
    }
  } else {
    return new Promise((resolve, reject) => {
      this.getApiLevel((err, apiLevel) => {
        if (parseInt(apiLevel, 10) > 15) {
          args[0] = `${args[0]} -S`;
        }

        this.shell.apply(this, args).then(data => {
          resolve(data);
        }).catch(err => {
          reject(`exec ${cmd} error with: ${err}`);
        });
      });
    });
  }
};

ADB.prototype.shell = function() {
  var args = Array.prototype.slice.call(arguments);
  var cmd = _.adbShell(`-s ${this.deviceId} shell %s`, args[0]);

  if (args.length > 1) {
    var cb = args[1];

    if (typeof cb === 'function') {
      _.exec(cmd).then(data => {
        cb.call(this, null, data);
      }).catch(err => {
        cb.call(this, `exec ${cmd} error with: ${err}`);
      });
    } else {
      logger.warn('exec shell failed');
    }
  } else {
    return _.exec(cmd);
  }
};

ADB.prototype.push = function() {
  var args = Array.prototype.slice.call(arguments);
  var localPath = args[0];
  var remotePath = args[1];
  var cmd = _.adbShell(`-s ${this.deviceId} push ${localPath} ${remotePath}`);

  if (args.length > 2) {
    var cb = args[2];

    if (typeof cb === 'function') {
      _.exec(cmd).then(data => {
        cb.call(this, null, data);
      }).catch(err => {
        cb.call(this, `exec ${cmd} error with: ${err}`);
      });
    } else {
      logger.warn('exec push failed');
    }
  } else {
    return _.exec(cmd);
  }
};

ADB.prototype.pull = function() {
  var args = Array.prototype.slice.call(arguments);
  var remotePath = args[0];
  var localPath = args[1];
  var cmd = _.adbShell(`-s ${this.deviceId} pull ${remotePath} ${localPath}`);

  if (args.length > 2) {
    var cb = args[2];

    if (typeof cb === 'function') {
      _.exec(cmd).then(data => {
        cb.call(this, null, data);
      }).catch(err => {
        cb.call(this, `exec ${cmd} error with: ${err}`);
      });
    } else {
      logger.warn('exec pull failed');
    }
  } else {
    return _.exec(cmd);
  }
};

ADB.prototype.install = function() {
  var args = Array.prototype.slice.call(arguments);
  var apk = path.resolve(args[0]);
  var cmd = _.adbShell(`-s ${this.deviceId} install -r "${apk}"`);

  if (args.length > 1) {
    var cb = args[1];

    if (typeof cb === 'function') {
      _.exec(cmd).then(data => {
        cb.call(this, null, data);
      }).catch(err => {
        cb.call(this, `exec ${cmd} error with: ${err}`);
      });
    } else {
      logger.warn('exec install failed');
    }
  } else {
    return _.exec(cmd);
  }
};

ADB.prototype.unInstall = function() {
  var args = Array.prototype.slice.call(arguments);
  var apk = args[0];
  var cmd = _.adbShell(`-s ${this.deviceId} unInstall "${apk}"`);

  if (args.length > 1) {
    var cb = args[1];

    if (typeof cb === 'function') {
      this.forceStop(apk, (err, data) => {
        _.exec(cmd).then(data => {
          cb.call(this, null, data);
        }).catch(err => {
          cb.call(this, `exec ${cmd} error with: ${err}`);
        });
      });
    } else {
      logger.warn('exec install failed');
    }
  } else {
    return new Promise((resolve, reject) => {
      this.forceStop(apk, (err, data) => {
        _.exec(cmd).then(data => {
          resolve(data);
        }).catch(err => {
          reject(`exec ${cmd} error with: ${err}`);
        });
      });
    });
  }
};

ADB.prototype.clear = function() {
  var args = Array.prototype.slice.call(arguments);
  args[0] = `pm clear ${args[0]}`;
  return this.shell.apply(this, args);
};

ADB.prototype.forceStop = function() {
  var args = Array.prototype.slice.call(arguments);
  args[0] = `am force-stop ${args[0]}`;
  return this.shell.apply(this, args);
};

ADB.prototype.input = function() {
  var args = Array.prototype.slice.call(arguments);
  args[0] = `input ${args[0]}`;
  return this.shell.apply(this, args);
};

ADB.prototype.keyevent = function() {
  var args = Array.prototype.slice.call(arguments);
  args[0] = `keyevent ${args[0]}`;
  return this.input.apply(this, args);
};

ADB.prototype.goBack = function() {
  var args = Array.prototype.slice.call(arguments);
  args.unshift('4');
  return this.keyevent.apply(this, args);
};

ADB.prototype.killProcess = function() {
  var args = Array.prototype.slice.call(arguments);
  var name = args[0];

  if (args.length > 1) {
    var cb = args[1];

    if (typeof cb === 'function') {
      this.getPIds(name).then(pids => {
        if (pids.length) {
          this.shell(`kill ${pids.join(' ')}`).then(data => {
            cb.call(this, null, data);
          }).catch(function(err) {
            cb.call(this, `kill process ${name} error with: ${err}`);
          });
        } else {
          cb.call(this, `no process named: ${name}`);
        }
      }).catch(err => {
        cb.call(this, `kill process ${name} error with: ${err}`);
      });
    } else {
      logger.warn('get apk mainifest failed');
    }
  } else {
    return new Promise((resolve, reject) => {
      this.getPIds(name).then(pids => {
        if (pids.length) {
          this.shell(`kill ${pids.join(' ')}`).then(data => {
            resolve(data);
          }).catch(function(err) {
            reject(`kill process ${name} error with: ${err}`);
          });
        } else {
          reject(`no process named: ${name}`);
        }
      }).catch(err => {
        reject(`kill process ${name} error with: ${err}`);
      });
    });
  }
};

ADB.prototype.getPIds = function() {
  var args = Array.prototype.slice.call(arguments);
  var name = args[0];
  var cmd = `ps "${name}"`;

  if (args.length > 1) {
    var cb = args[1];

    if (typeof cb === 'function') {
      this.shell(cmd).then(data => {
        cb.call(this, null, _.parseProcess(data, name));
      }).catch(function(err) {
        cb.call(this, `exec ${cmd} error with: ${err}`);
      });
    } else {
      logger.warn('get PIDs failed');
    }
  } else {
    return new Promise((resolve, reject) => {
      this.shell(cmd).then(data => {
        resolve(_.parseProcess(data, name));
      }).catch(err => {
        reject('get PIDs failed');
      });
    });
  }
};

ADB.getVersion = function() {
  var args = Array.prototype.slice.call(arguments);
  var cmd = _.adbShell('version');

  if (args.length) {
    var cb = args[0];

    if (typeof cb === 'function') {
      _.exec(cmd).then(data => {
        cb.call(this, null, data);
      }).catch(err => {
        cb.call(this, `exec ${cmd} error with: ${err}`);
      });
    } else {
      logger.warn('get adb version failed');
    }
  } else {
    return _.exec(cmd);
  }
};

ADB.getDevices = function() {
  var args = Array.prototype.slice.call(arguments);
  var cmd = _.adbShell('devices');
  var dataFilter = data => {
    try {
      data = data.split(EOL);
      data.shift();
      return data.map(device => {
        device = device.split(/\s+/);
        var isVirtual = /\W+/.test(device[0]);
        return {
          // 192.168.56.101:5555
          // emulator-5554
          type: isVirtual ? 'virtual' : 'physical',
          udid: device[0],
          port: isVirtual ? device[0].match(/\W\d{4}/)[0].slice(1, 5) : null
        };
      });
    } catch (e) {
      logger.warn(`adb devices data parse with error: ${e.stack}`);
      return [];
    }
  };

  if (args.length) {
    var cb = args[0];

    if (typeof cb === 'function') {
      _.exec(cmd).then(data => {
        cb.call(this, null, dataFilter(data));
      }).catch(err => {
        cb.call(this, `exec ${cmd} error with: ${err}`);
      });
    } else {
      logger.warn('get devices failed');
    }
  } else {
    return new Promise((resolve, reject) => {
      _.exec(cmd).then(data => {
        resolve(dataFilter(data));
      }).catch(err => {
        reject(`exec ${cmd} error with: ${err}`);
      });
    });
  }
};

ADB.getEmulators = function() {
  var args = Array.prototype.slice.call(arguments);
  var dataFilter = devices => {
    return devices.filter(device => {
      return device.type === 'virtual';
    });
  };

  if (args.length) {
    var cb = args[0];

    if (typeof cb === 'function') {
      this.getDevices().then(devices => {
        cb.call(this, null, dataFilter(devices));
      }).catch(err => {
        cb.call(this, 'get emulators failed');
      });
    } else {
      logger.warn('get emulators failed');
    }
  } else {
    return new Promise((resolve, reject) => {
      this.getDevices().then(devices => {
        resolve(dataFilter(devices));
      }).catch(err => {
        reject('get emulators failed');
      });
    });
  }
};

ADB.getApkMainifest = function() {
  var args = Array.prototype.slice.call(arguments);
  var apk = path.resolve(args[0]);
  var cmd = _.binaryShell('aapt', `dump badging ${apk}`);

  if (args.length > 1) {
    var cb = args[1];

    if (typeof cb === 'function') {
      _.exec(cmd).then(data => {
        cb.call(this, null, _.parseMainifest(data));
      }).catch(err => {
        cb.call(this, `exec ${cmd} error with: ${err}`);
      });
    } else {
      logger.warn('get apk mainifest failed');
    }
  } else {
    return new Promise((resolve, reject) => {
      _.exec(cmd).then(data => {
        resolve(_.parseMainifest(data));
      }).catch(err => {
        reject('get apk mainifest failed');
      });
    });
  }
};

module.exports = ADB;
