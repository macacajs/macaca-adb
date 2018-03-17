'use strict';

const path = require('path');
const EOL = require('os').EOL;

const _ = require('./helper');
const logger = require('./logger');

const ANDROID_TMP_DIR = '/data/local/tmp';

let defaultOpt = {
};

function ADB(options) {
  this.options = _.merge(defaultOpt, options || {});
  this.deviceId = null;
}

ADB.ANDROID_TMP_DIR = ANDROID_TMP_DIR;

ADB.prototype.setDeviceId = function(deviceId) {
  this.deviceId = deviceId;
};

ADB.prototype.getTmpDir = function() {
  return ANDROID_TMP_DIR;
};

ADB.prototype.getApiLevel = function() {
  var args = Array.prototype.slice.call(arguments);
  args.unshift('getprop ro.build.version.sdk');
  return this.shell.apply(this, args);
};

ADB.prototype.getWebviewVersion = function() {
  var args = Array.prototype.slice.call(arguments);
  var promise = new Promise((resolve, reject) => {
    this.shell('pm dump com.google.android.webview | grep versionName').then(data => {
      if (data && data.trim().length !== 0) {
        let versionReg = /versionName=([\d]+)/gi.exec(data);
        if (versionReg) {
          let version = versionReg[1];
          resolve(version);
        } else {
          reject('Could not get the webview version!');
        }
      } else {
        reject('Could not get the webview version!');
      }
    }).catch(err => {
      reject(`Could not get the webview version with error ${err}`);
    });
  });
  if (args.length > 1) {
    var cb = args[1];

    return promise.then(data => {
      cb.call(this, null, data);
    }).catch(err => {
      cb.call(this, `Error occurred: ${err}`);
    });
  } else {
    return promise;
  }
};

ADB.prototype.startApp = function() {
  var args = Array.prototype.slice.call(arguments);
  var options = args.shift();
  var pkg = options.package;
  if (!pkg) {
    throw new Error('Android package name cannot be empty!');
  }
  var activity = options.activity;
  var shell;
  if (activity) {
    shell = `am start -S -a android.intent.action.MAIN -c android.intent.category.LAUNCHER -f 0x10200000 -n ${pkg}/${activity}`;
  } else {
    shell = `monkey -p ${pkg} -c android.intent.category.LAUNCHER 1`;
  }

  args.unshift(shell);

  var promise = new Promise((resolve, reject) => {
    this.getApiLevel((err, apiLevel) => {
      if (err) {
        console.log(err);
      }
      if (parseInt(apiLevel, 10) > 15) {
        args[0] = `${args[0]} -S`;
      }

      this.shell.apply(this, args).then(data => {
        resolve(data);
      }).catch(err => {
        reject(`exec startApp error with: ${err}`);
      });
    });
  });

  if (args.length > 1) {
    var cb = args[1];

    return promise.then(data => {
      cb.call(this, null, data);
    }).catch(err => {
      cb.call(this, `exec startApp error with: ${err}`);
    });
  } else {
    return promise;
  }
};

ADB.prototype.shell = function() {
  var args = Array.prototype.slice.call(arguments);
  var cmd = _.adbShell(`-s ${this.deviceId} shell "%s"`, args[0]);
  return _.execPromiseGenerator(cmd, args[1]);
};

ADB.prototype.spawn = function(args, opt) {
  return _.childProcess.spawn(_.getAdbPath(), ['-s', this.deviceId].concat(args), opt);
};

ADB.prototype.push = function() {
  var args = Array.prototype.slice.call(arguments);
  var localPath = args[0];
  var remotePath = args[1];
  var cmd = _.adbShell(`-s ${this.deviceId} push ${localPath} ${remotePath}`);
  return _.execPromiseGenerator(cmd, args[2]);
};

ADB.prototype.pull = function() {
  var args = Array.prototype.slice.call(arguments);
  var remotePath = args[0];
  var localPath = args[1];
  var cmd = _.adbShell(`-s ${this.deviceId} pull ${remotePath} ${localPath}`);
  return _.execPromiseGenerator(cmd, args[2]);
};

ADB.prototype.forward = function() {
  var args = Array.prototype.slice.call(arguments);
  var systemPort = args[0];
  var devicePort = args[1];
  var cmd = _.adbShell(`-s ${this.deviceId} forward tcp:${systemPort} tcp:${devicePort}`);
  return _.execPromiseGenerator(cmd, args[2]);
};

ADB.prototype.install = function() {
  var args = Array.prototype.slice.call(arguments);
  var apk = path.resolve(args[0]);
  var cmd = _.adbShell(`-s ${this.deviceId} install -r "${apk}"`);
  return _.execPromiseGenerator(cmd, args[1]);
};

ADB.prototype.unInstall = function() {
  var args = Array.prototype.slice.call(arguments);
  var apk = args[0];
  var cmd = _.adbShell(`-s ${this.deviceId} uninstall "${apk}"`);

  var promise = new Promise((resolve, reject) => {
    this.forceStop(apk, () => {
      _.exec(cmd).then(data => {
        resolve(data);
      }).catch(err => {
        reject(`exec ${cmd} error with: ${err}`);
      });
    });
  });

  if (args.length > 1) {
    var cb = args[1];

    return promise.then(data => {
      cb.call(this, null, data);
    }).catch(err => {
      cb.call(this, `exec ${cmd} error with: ${err}`);
    });
  } else {
    return promise;
  }
};

ADB.prototype.isInstalled = function() {
  var args = Array.prototype.slice.call(arguments);
  var apk = args[0];
  var cmd = 'pm list packages';

  var promise = new Promise((resolve, reject) => {
    this.shell(cmd).then(data => {
      resolve(_.parseIsInstalled(data, apk));
    }).catch(err => {
      reject(`get PIDs failed with ${err}`);
    });
  });

  if (args.length > 1) {
    var cb = args[1];

    promise.then(data => {
      cb.call(this, null, data);
    }).catch(function(err) {
      cb.call(this, `exec ${cmd} error with: ${err}`);
    });
  } else {
    return promise;
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

ADB.prototype.rm = function() {
  var args = Array.prototype.slice.call(arguments);
  args[0] = `rm ${args[0]}`;
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

ADB.prototype.dumpsysWindow = function() {
  var args = Array.prototype.slice.call(arguments);
  args.unshift('dumpsys window windows');
  return this.shell.apply(this, args);
};

ADB.prototype.isScreenLocked = function() {
  var args = Array.prototype.slice.call(arguments);
  var cmd = 'dumpsys window';

  var promise = new Promise((resolve, reject) => {
    this.shell(cmd).then(data => {
      resolve(_.parseIsScreenLocked(data));
    }).catch(err => {
      reject(`get PIDs failed with ${err}`);
    });
  });

  if (args.length) {
    var cb = args[0];

    return promise.then(data => {
      cb.call(this, null, data);
    }).catch(function(err) {
      cb.call(this, `exec ${cmd} error with: ${err}`);
    });
  } else {
    return promise;
  }
};

ADB.prototype.getInstalledApkVersion = function() {
  var args = Array.prototype.slice.call(arguments);
  var pkg = args[0];
  var cmd = `dumpsys package "${pkg}"`;

  var promise = new Promise((resolve, reject) => {
    this.shell(cmd).then(data => {
      resolve(_.parseApkVersion(data));
    }).catch(err => {
      reject(`get installed apk version code failed with ${err}`);
    });
  });

  if (args.length > 1) {
    var cb = args[1];

    promise.then(data => {
      cb.call(this, null, data);
    }).catch(function(err) {
      cb.call(this, `exec ${cmd} error with: ${err}`);
    });
  } else {
    return promise;
  }
};

ADB.prototype.isActivityReady = function() {
  var args = Array.prototype.slice.call(arguments);
  var pkg = args[0];

  var promise = new Promise((resolve, reject) => {
    this.dumpsysWindow().then(data => {
      var focusedApp = _.parseFocusedApp(data);
      resolve(focusedApp && focusedApp.package === pkg);
    }).catch(err => {
      reject(`try acitity failed with: ${err}`);
    });
  });

  if (args.length > 2) {
    var cb = args[2];

    promise.then(data => {
      cb.call(this, null, data);
    }).catch(err => {
      cb.call(this, `wait activity error with: ${err}`);
    });
  } else {
    return promise;
  }
};

ADB.prototype.waitActivityReady = function() {
  var args = Array.prototype.slice.call(arguments);
  var pkg = args[0];

  var getAcitity = () => {
    return new Promise((resolve, reject) => {
      this.dumpsysWindow().then(data => {
        var focusedApp = _.parseFocusedApp(data);
        resolve(focusedApp && focusedApp.package === pkg);
      }).catch(err => {
        reject(`get acitity failed with: ${err}`);
      });
    });
  };

  var promise = _.waitForCondition(getAcitity, 60 * 1000);

  if (args.length > 2) {
    var cb = args[2];

    promise.then(data => {
      cb.call(this, null, data);
    }).catch(err => {
      cb.call(this, `wait activity error with: ${err}`);
    });
  } else {
    return promise;
  }
};

ADB.prototype.killProcess = function() {
  var args = Array.prototype.slice.call(arguments);
  var name = args[0];

  var promise = new Promise((resolve, reject) => {
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

  if (args.length > 1) {
    var cb = args[1];

    promise.then(data => {
      cb.call(this, null, data);
    }).catch(function(err) {
      cb.call(this, `kill process ${name} error with: ${err}`);
    });
  } else {
    return promise;
  }
};

ADB.prototype.getPIds = function() {
  var args = Array.prototype.slice.call(arguments);
  var name = args[0];
  var cmd = 'ps ';

  var promise = new Promise((resolve, reject) => {
    this.shell(cmd).then(data => {
      resolve(_.parseProcess(data, name));
    }).catch(err => {
      reject(`get PIDs failed with: ${err}`);
    });
  });

  if (args.length > 1) {
    var cb = args[1];

    promise.then(data => {
      cb.call(this, null, data);
    }).catch(function(err) {
      cb.call(this, `exec ${cmd} error with: ${err}`);
    });
  } else {
    return promise;
  }
};

ADB.prototype.setIME = function() {
  var args = Array.prototype.slice.call(arguments);
  var name = args[0];
  var enable_cmd = `ime enable ${name}`;
  var set_cmd = `ime set ${name}`;

  var promise = new Promise((resolve, reject) => {
    this.shell(enable_cmd).then(() => {
      this.shell(set_cmd).then(data => {
        resolve(data);
      }).catch(err => {
        reject(`exec ${set_cmd} error with: ${err}`);
      });
    }).catch(err => {
      reject(`exec ${enable_cmd} error with: ${err}`);
    });
  });

  if (args.length > 1) {
    var cb = args[1];

    promise.then(data => {
      cb.call(this, null, data);
    }).catch(err => {
      cb.call(this, `exec ${enable_cmd} error with: ${err}`);
    });
  } else {
    return promise;
  }
};

ADB.prototype.disableIME = function() {
  var args = Array.prototype.slice.call(arguments);
  var name = args[0];
  var disable_cmd = `ime disable ${name}`;

  var promise = new Promise((resolve, reject) => {
    this.shell(disable_cmd).then(data => {
      resolve(data);
    }).catch(err => {
      reject(`exec ${disable_cmd} error with: ${err}`);
    });
  });

  if (args.length > 1) {
    var cb = args[1];

    promise.then(data => {
      cb.call(this, null, data);
    }).catch(err => {
      cb.call(this, `exec ${disable_cmd} error with: ${err}`);
    });
  } else {
    return promise;
  }
};

ADB.prototype.getFocusedActivity = function() {
  var args = Array.prototype.slice.call(arguments);
  var cmd = 'dumpsys activity | grep mFocusedActivity';

  var promise = new Promise((resolve, reject) => {
    this.shell(cmd).then(data => {
      resolve(_.parseFocusedActivity(data));
    }).catch(err => {
      reject(`get focusedActivity failed with ${err}`);
    });
  });

  if (args.length) {
    var cb = args[0];

    promise.then(data => {
      cb.call(this, null, data);
    }).catch(function(err) {
      cb.call(this, `exec ${cmd} error with: ${err}`);
    });
  } else {
    return promise;
  }
};

ADB.getVersion = function() {
  var args = Array.prototype.slice.call(arguments);
  var cmd = _.adbShell('version');
  return _.execPromiseGenerator(cmd, args[0]);
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

  var promise = new Promise((resolve, reject) => {
    _.exec(cmd).then(data => {
      resolve(dataFilter(data));
    }).catch(err => {
      reject(`exec ${cmd} error with: ${err}`);
    });
  });

  if (args.length) {
    var cb = args[0];

    promise.then(data => {
      cb.call(this, null, data);
    }).catch(err => {
      cb.call(this, `exec ${cmd} error with: ${err}`);
    });
  } else {
    return promise;
  }
};

ADB.getEmulators = function() {
  var args = Array.prototype.slice.call(arguments);
  var dataFilter = devices => {
    return devices.filter(device => {
      return device.type === 'virtual';
    });
  };

  var promise = new Promise((resolve, reject) => {
    this.getDevices().then(devices => {
      resolve(dataFilter(devices));
    }).catch(err => {
      reject(`get emulators failed with: ${err}`);
    });
  });

  if (args.length) {
    var cb = args[0];

    promise.then(data => {
      cb.call(this, null, data);
    }).catch(err => {
      cb.call(this, `get emulators failed with: ${err}`);
    });
  } else {
    return promise;
  }
};

ADB.getApkMainifest = function() {
  var args = Array.prototype.slice.call(arguments);
  var apk = path.resolve(args[0]);
  var cmd = _.binaryShell('aapt', `dump badging ${apk}`);

  var promise = new Promise((resolve, reject) => {
    _.exec(cmd).then(data => {
      resolve(_.parseMainifest(data));
    }).catch(err => {
      reject(`get apk mainifest failed with: ${err}`);
    });
  });

  if (args.length > 1) {
    var cb = args[1];

    promise.then(data => {
      cb.call(this, null, data);
    }).catch(err => {
      cb.call(this, `exec ${cmd} error with: ${err}`);
    });
  } else {
    return promise;
  }
};

ADB.getApkVersion = function() {
  var args = Array.prototype.slice.call(arguments);
  var apk = path.resolve(args[0]);
  var cmd = _.binaryShell('aapt', `dump badging ${apk}`);

  var promise = new Promise((resolve, reject) => {
    _.exec(cmd).then(data => {
      resolve(_.parseVersion(data));
    }).catch(err => {
      reject(`get apk mainifest failed with: ${err}`);
    });
  });

  if (args.length > 1) {
    var cb = args[1];

    promise.then(data => {
      cb.call(this, null, data);
    }).catch(err => {
      cb.call(this, `exec ${cmd} error with: ${err}`);
    });
  } else {
    return promise;
  }
};

ADB.getBootStatus = function() {
  var cmd = _.adbShell('shell getprop init.svc.bootanim');
  return _.exec(cmd);
};

ADB.emuKill = function() {
  var cmd = _.adbShell('emu kill');
  return _.exec(cmd);
};

module.exports = ADB;
