'use strict';

var testApk = require('unlock-apk');

var ADB = require('../lib/macaca-adb');

var testApkPath = testApk.apkPath;

var tmpDir = '/data/local/tmp';

describe('macaca-adb.test.js', function() {

  this.timeout(6 * 10 * 1000);

  it('getVersion callback', function(done) {
    ADB.getVersion(function(err, data) {
      if (err) {
        console.log(err);
        done();
        return;
      }
      data.should.be.a.String;
      console.log(`version: ${data.match(/\d+.\d+.\d+/)[0]}`);
      done();
    });
  });

  it('getVersion promise', function(done) {
    ADB.getVersion().then(data => {
      data.should.be.a.String;
      console.log(`version: ${data.match(/\d+.\d+.\d+/)[0]}`);
      done();
    }).catch(function(err) {
      console.log(err);
      done();
    });
  });

  it('getDevices callback', function(done) {
    ADB.getDevices(function(err, data) {
      if (err) {
        console.log(err);
        done();
        return;
      }
      console.log(data);
      done();
    });
  });

  it('getDevices promise', function(done) {
    ADB.getDevices().then(function(data) {
      console.log(data);
      done();
    }).catch(function(err) {
      console.log(err);
      done();
    });
  });

  it('getEmulators callback', function(done) {
    ADB.getEmulators(function(err, data) {
      if (err) {
        console.log(err);
        done();
        return;
      }
      console.log(data);
      done();
    });
  });

  it('getEmulators promise', function(done) {
    ADB.getEmulators().then(data => {
      console.log(data);
      done();
    }).catch(function(err) {
      console.log(err);
      done();
    });
  });

  it('shell callback', function *(done) {
    var adb = new ADB();
    var devices = yield ADB.getDevices();

    if (devices.length) {
      var device = devices[0];
      adb.setDeviceId(device.udid);
      adb.shell('echo hello', (err, data) => {
        if (err) {
          console.log(err);
          done();
          return;
        }
        console.log(data);
        done();
      });
    } else {
      done();
    }
  });

  it('shell promise', function *(done) {
    var adb = new ADB();
    var devices = yield ADB.getDevices();

    if (devices.length) {
      var device = devices[0];
      adb.setDeviceId(device.udid);
      adb.shell('echo hello').then(data => {
        console.log(data);
        done();
      }).catch(() => {
        done();
      });
    } else {
      done();
    }
  });

  it('push callback', function *(done) {
    var adb = new ADB();
    var devices = yield ADB.getDevices();
    if (devices.length) {
      var device = devices[0];
      adb.setDeviceId(device.udid);
      adb.push('./README.md', tmpDir, (err, data) => {
        if (err) {
          console.log(err);
          done();
          return;
        }
        console.log(data);
        done();
      });
    } else {
      done();
    }
  });

  it('push promise', function *(done) {
    var adb = new ADB();
    var devices = yield ADB.getDevices();

    if (devices.length) {
      var device = devices[0];
      adb.setDeviceId(device.udid);
      adb.push('./README.md', tmpDir).then(data => {
        if (data) {
          console.log(data);
        }
        done();
      }).catch(() => {
        done();
      });
    } else {
      done();
    }
  });

  it('pull callback', function *(done) {
    var adb = new ADB();
    var devices = yield ADB.getDevices();
    if (devices.length) {
      var device = devices[0];
      adb.setDeviceId(device.udid);
      adb.pull(`${tmpDir}/README.md`, './test', (err, data) => {
        if (err) {
          console.log(err);
          done();
          return;
        }
        console.log(data);
        done();
      });
    } else {
      done();
    }
  });

  it('pull promise', function *(done) {
    var adb = new ADB();
    var devices = yield ADB.getDevices();

    if (devices.length) {
      var device = devices[0];
      adb.setDeviceId(device.udid);
      adb.pull(`${tmpDir}/README.md`, './test').then(data => {
        if (data) {
          console.log(data);
        }
        done();
      }).catch(() => {
        done();
      });
    } else {
      done();
    }
  });

  it('install callback', function *(done) {
    var adb = new ADB();
    var devices = yield ADB.getDevices();
    if (devices.length) {
      var device = devices[0];
      adb.setDeviceId(device.udid);
      adb.install(testApkPath)
        .then((err, data) => {
          if (err) {
            done();
            return;
          }
          done();
        }).catch(function() {
          done();
        });
    } else {
      done();
    }
  });

  it('install promise', function *(done) {
    var adb = new ADB();
    var devices = yield ADB.getDevices();

    if (devices.length) {
      var device = devices[0];
      adb.setDeviceId(device.udid);
      adb.install(testApkPath).then(data => {
        if (data) {
          console.log(data);
        }
        done();
      }).catch(() => {
        done();
      });
    } else {
      done();
    }
  });

  it('forceStop callback', function *(done) {
    var adb = new ADB();
    var devices = yield ADB.getDevices();
    if (devices.length) {
      var device = devices[0];
      adb.setDeviceId(device.udid);
      adb.forceStop('xdf.android_unlock', (err, data) => {
        if (err) {
          console.log(err);
          done();
          return;
        }
        console.log(data);
        done();
      }).catch(function() {
        done();
      });
    } else {
      done();
    }
  });

  it('forceStop promise', function *(done) {
    var adb = new ADB();
    var devices = yield ADB.getDevices();

    if (devices.length) {
      var device = devices[0];
      adb.setDeviceId(device.udid);
      adb.forceStop('xdf.android_unlock').then(data => {
        if (data) {
          console.log(data);
        }
        done();
      }).catch(() => {
        done();
      });
    } else {
      done();
    }
  });

  it('clear callback', function *(done) {
    var adb = new ADB();
    var devices = yield ADB.getDevices();
    if (devices.length) {
      var device = devices[0];
      adb.setDeviceId(device.udid);
      adb.clear('xdf.android_unlock', (err, data) => {
        if (err) {
          console.log(err);
          done();
          return;
        }
        console.log(data);
        done();
      }).catch(function() {
        done();
      });
    } else {
      done();
    }
  });

  it('clear promise', function *(done) {
    var adb = new ADB();
    var devices = yield ADB.getDevices();

    if (devices.length) {
      var device = devices[0];
      adb.setDeviceId(device.udid);
      adb.clear('xdf.android_unlock').then(data => {
        if (data) {
          console.log(data);
        }
        done();
      }).catch(() => {
        done();
      });
    } else {
      done();
    }
  });

  it('unInstall callback', function *(done) {
    var adb = new ADB();
    var devices = yield ADB.getDevices();
    if (devices.length) {
      var device = devices[0];
      adb.setDeviceId(device.udid);
      adb.unInstall('xdf.android_unlock', (err, data) => {
        if (err) {
          console.log(err);
          done();
          return;
        }
        console.log(data);
        done();
      }).catch(function() {
        done();
      });
    } else {
      done();
    }
  });

  it('unInstall promise', function *(done) {
    var adb = new ADB();
    var devices = yield ADB.getDevices();

    if (devices.length) {
      var device = devices[0];
      adb.setDeviceId(device.udid);
      adb.unInstall('xdf.android_unlock').then(data => {
        if (data) {
          console.log(data);
        }
        done();
      }).catch(() => {
        done();
      });
    } else {
      done();
    }
  });

  it('input callback', function *(done) {
    var adb = new ADB();
    var devices = yield ADB.getDevices();
    if (devices.length) {
      var device = devices[0];
      adb.setDeviceId(device.udid);
      adb.input('xxxxxxx', (err, data) => {
        if (err) {
          console.log(err);
          done();
          return;
        }
        console.log(data);
        done();
      }).catch(function() {
        done();
      });
    } else {
      done();
    }
  });

  it('input promise', function *(done) {
    var adb = new ADB();
    var devices = yield ADB.getDevices();

    if (devices.length) {
      var device = devices[0];
      adb.setDeviceId(device.udid);
      adb.input('xxxxxxx').then(data => {
        if (data) {
          console.log(data);
        }
        done();
      }).catch(() => {
        done();
      });
    } else {
      done();
    }
  });

  it('goBack callback', function *(done) {
    var adb = new ADB();
    var devices = yield ADB.getDevices();
    if (devices.length) {
      var device = devices[0];
      adb.setDeviceId(device.udid);
      adb.goBack((err, data) => {
        if (err) {
          console.log(err);
          done();
          return;
        }
        console.log(data);
        done();
      }).catch(function() {
        done();
      });
    } else {
      done();
    }
  });

  it('goBack promise', function *(done) {
    var adb = new ADB();
    var devices = yield ADB.getDevices();

    if (devices.length) {
      var device = devices[0];
      adb.setDeviceId(device.udid);
      adb.goBack().then(data => {
        if (data) {
          console.log(data);
        }
        done();
      }).catch(() => {
        done();
      });
    } else {
      done();
    }
  });

  it('getApiLevel callback', function *(done) {
    var adb = new ADB();
    var devices = yield ADB.getDevices();
    if (devices.length) {
      var device = devices[0];
      adb.setDeviceId(device.udid);
      adb.getApiLevel((err, data) => {
        if (err) {
          console.log(err);
          done();
          return;
        }
        console.log(data);
        done();
      }).catch(function() {
        done();
      });
    } else {
      done();
    }
  });

  it('getApiLevel promise', function *(done) {
    var adb = new ADB();
    var devices = yield ADB.getDevices();

    if (devices.length) {
      var device = devices[0];
      adb.setDeviceId(device.udid);
      adb.getApiLevel().then(data => {
        if (data) {
          console.log(data);
        }
        done();
      }).catch(() => {
        done();
      });
    } else {
      done();
    }
  });

  let startAppOpts = {
    package: 'com.android.browser',
    activity: 'com.android.browser.BrowserActivity'
  };

  it('startApp callback', function *() {
    var adb = new ADB();
    var devices = yield ADB.getDevices();
    if (devices.length) {
      var device = devices[0];
      adb.setDeviceId(device.udid);
      adb.startApp(startAppOpts ,(err, data) => {
        if (err) {
          console.log(err);
        } else {
          console.log(data);
        }
      });
    }
  });

  it('startApp promise', function *(done) {
    var adb = new ADB();
    var devices = yield ADB.getDevices();

    if (devices.length) {
      var device = devices[0];
      adb.setDeviceId(device.udid);
      adb.startApp(startAppOpts).then(data => {
        if (data) {
          console.log(data);
        }
        done();
      }).catch(() => {
        done();
      });
    } else {
      done();
    }
  });

  it('getApkMainifest callback', function(done) {
    ADB.getApkMainifest(testApkPath, function(err, data) {
      if (err) {
        console.log(err);
        done();
        return;
      }
      data.should.be.a.String;
      console.log(data);
      done();
    });
  });

  it('getApkMainifest promise', function(done) {
    ADB.getApkMainifest(testApkPath).then(data => {
      if (data) {
        data.should.be.a.String;
        console.log(data);
      }
      done();
    }).catch(err => {
      console.log(err);
      done();
    });
  });

  var processName = 'com.sina.weibo';

  it('killProcess callback', function *(done) {
    var adb = new ADB();
    var devices = yield ADB.getDevices();

    if (devices.length) {
      var device = devices[0];
      adb.setDeviceId(device.udid);
      adb.killProcess(processName ,(err, data) => {
        if (err) {
          console.log(err);
          done();
          return;
        }
        console.log(data);
        done();
      }).catch(function() {
        done();
      });
    } else {
      done();
    }
  });

  it('killProcess promise', function *(done) {
    var adb = new ADB();
    var devices = yield ADB.getDevices();

    if (devices.length) {
      var device = devices[0];
      adb.setDeviceId(device.udid);
      adb.killProcess(processName).then(data => {
        if (data) {
          console.log(data);
        }
        done();
      }).catch(function() {
        done();
      });
    } else {
      done();
    }
  });

  it('dumpsysWindow callback', function *(done) {
    var adb = new ADB();
    var devices = yield ADB.getDevices();
    if (devices.length) {
      var device = devices[0];
      adb.setDeviceId(device.udid);
      adb.dumpsysWindow((err, data) => {
        if (err) {
          console.log(err);
          done();
          return;
        }
        console.log(data);
        done();
      }).catch(function() {
        done();
      });
    } else {
      done();
    }
  });

  it('dumpsysWindow promise', function *(done) {
    var adb = new ADB();
    var devices = yield ADB.getDevices();

    if (devices.length) {
      var device = devices[0];
      adb.setDeviceId(device.udid);
      adb.dumpsysWindow().then(data => {
        if (data) {
          console.log(data);
        }
        done();
      }).catch(() => {
        done();
      });
    } else {
      done();
    }
  });

  it('waitActivityReady callback', function *(done) {
    var adb = new ADB();
    var devices = yield ADB.getDevices();
    if (devices.length) {
      var device = devices[0];
      adb.setDeviceId(device.udid);
      adb.waitActivityReady(testApk.package, testApk.activity, (err, data) => {
        if (err) {
          console.log(err);
        } else {
          console.log(data);
        }
        done();
      });
    } else {
      done();
    }
  });

  it('waitActivityReady promise', function *(done) {
    var adb = new ADB();
    var devices = yield ADB.getDevices();

    if (devices.length) {
      var device = devices[0];
      adb.setDeviceId(device.udid);
      adb.waitActivityReady(testApk.package, testApk.activity).then(data => {
        if (data) {
          console.log(data);
        }
        done();
      }).catch(() => {
        done();
      });
    }else{
      done();
    }
  });

  it('isScreenLocked callback', function *(done) {
    var adb = new ADB();
    var devices = yield ADB.getDevices();
    if (devices.length) {
      var device = devices[0];
      adb.setDeviceId(device.udid);
      adb.isScreenLocked((err, data) => {
        if (err) {
          console.log(err);
          done();
          return;
        }
        console.log(data);
        done();
      }).catch(function(err) {
        console.log(err);
        done();
      });
    } else {
      done();
    }
  });

  it('isScreenLocked promise', function *(done) {
    var adb = new ADB();
    var devices = yield ADB.getDevices();

    if (devices.length) {
      var device = devices[0];
      adb.setDeviceId(device.udid);
      adb.isScreenLocked().then(data => {
        if (data) {
          console.log(data);
        }
        done();
      }).catch(() => {
        done();
      });
    } else {
      done();
    }
  });

  it('isInstalled callback', function *(done) {
    var adb = new ADB();
    var devices = yield ADB.getDevices();

    if (devices.length) {
      var device = devices[0];
      adb.setDeviceId(device.udid);
      adb.isInstalled(testApk.package, (err, data) => {
        if (err) {
          console.log(err);
          done();
          return;
        }
        console.log(data);
        done();
      });
    } else {
      done();
    }
  });

  it('isInstalled promise', function *(done) {
    var adb = new ADB();
    var devices = yield ADB.getDevices();

    if (devices.length) {
      var device = devices[0];
      adb.setDeviceId(device.udid);
      adb.isInstalled(testApk.package).then(data => {
        if (data) {
          console.log(data);
        }
        done();
      }).catch(() => {
        done();
      });
    } else {
      done();
    }
  });

  it('getFocusedActivity promise', function *(done) {
    var adb = new ADB();
    var devices = yield ADB.getDevices();

    if (devices.length) {
      var device = devices[0];
      adb.setDeviceId(device.udid);
      adb.getFocusedActivity().then(data => {
        if (data) {
          console.log(data);
        }
        done();
      }).catch(function() {
        done();
      });
    } else {
      done();
    }
  });

});
