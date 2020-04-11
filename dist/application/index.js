"use strict";

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

/**
 * This file contains the class definition of ApplicationConnection, which implements
 * the Application Protocol.
 * For more information, see Wiki page 'Application Protocol'.
 */
var _require = require('lodash'),
    defaultsDeep = _require.defaultsDeep;

var log = require('debug')('bilibili-danmaku-client/ApplicationConnection');

var _require2 = require('../util/connection'),
    CascadeConnection = _require2.CascadeConnection;

var DataConnection = require('../transport');

var _require3 = require('./definitions'),
    registry = _require3.registry;

var url = 'wss://broadcastlv.chat.bilibili.com/sub';
/**
 * Return the handshake JSON with the room id.
 * @param {Number} room The room number.
 */

var getHandshake = function getHandshake(room) {
  return {
    protoVer: 1,
    platform: 'web',
    clientVer: '1.4.3',
    uid: 0,
    roomid: room
  };
};
/**
 * Default options. _.defaultsDeep() is used to merge it with given options.
 * rejectUnauthorized is set to true and passed to WebSocket to avoid
 * authentication errors.
 */


var defaultOptions = {
  section: {
    options: {
      rejectUnauthorized: false
    }
  }
};
/**
 * ApplicationConnection implements the Application Protocol.
 * However, this implementation does not 100% conform to the original defitnion.
 * The main difference is:
 * ApplicationConnection uses event 'message' instead of 'event' to notify the
 * arraival of an ApplicationEvent.
 * This is because ApplicationConnection extends BaseConnection. Meanwhile,
 * the 'event' event is defined in DanmakuClient, which is a thin wrap over
 * ApplicationConnection.
 * And since ApplicationConnection only supports the Client side, the Event-to-JSON
 * convertion is not supported.
 */

var ApplicationConnection = /*#__PURE__*/function (_CascadeConnection) {
  _inheritsLoose(ApplicationConnection, _CascadeConnection);

  /**
   * Construct a new ApplicationConnection with the given Room id and options.
   * Note that the Room id must be the original Room id, that is, the short Room id
   * is not accepted.
   * For example, one of the official Live Rooms, https://live.bilibili.com/1,
   * uses the original Room id 5440. In this case, trying to connect to Room 1 would
   * not work properly, the correct way is to connect to Room 5440.
   * @param {Number} room The id of the Room to connect to.
   * @param {Object} [options] The options to pass to DataConnection. Merged with defaultOptions.
   */
  function ApplicationConnection(room, options) {
    var _this;

    if (options === void 0) {
      options = {};
    }

    _this = _CascadeConnection.call(this, new DataConnection(url, getHandshake(room), defaultsDeep(options, defaultOptions))) || this;

    _this.on('open', function () {
      return log("Connection opened: room=" + room + ".");
    });

    _this.on('close', function () {
      return log('Connection closed.');
    });

    return _this;
  }

  var _proto = ApplicationConnection.prototype;

  _proto.transform = function transform() {
    throw new Error('Event -> JSON not supported!');
  };

  _proto.detransform = function detransform(json) {
    if (!('cmd' in json)) {
      log('Event invalid without \'cmd\' property:');
      log(json);
      return undefined;
    }

    if (json.cmd in registry) {
      try {
        var event = registry[json.cmd].transform(json);
        return event;
      } catch (e) {
        log("Unable to transform event: " + e);
        log(json);
        return undefined;
      }
    } else {
      log('Untransformed event:');
      log(json);
      return undefined;
    }
  };

  return ApplicationConnection;
}(CascadeConnection);

module.exports = ApplicationConnection;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hcHBsaWNhdGlvbi9pbmRleC5qcyJdLCJuYW1lcyI6WyJyZXF1aXJlIiwiZGVmYXVsdHNEZWVwIiwibG9nIiwiQ2FzY2FkZUNvbm5lY3Rpb24iLCJEYXRhQ29ubmVjdGlvbiIsInJlZ2lzdHJ5IiwidXJsIiwiZ2V0SGFuZHNoYWtlIiwicm9vbSIsInByb3RvVmVyIiwicGxhdGZvcm0iLCJjbGllbnRWZXIiLCJ1aWQiLCJyb29taWQiLCJkZWZhdWx0T3B0aW9ucyIsInNlY3Rpb24iLCJvcHRpb25zIiwicmVqZWN0VW5hdXRob3JpemVkIiwiQXBwbGljYXRpb25Db25uZWN0aW9uIiwib24iLCJ0cmFuc2Zvcm0iLCJFcnJvciIsImRldHJhbnNmb3JtIiwianNvbiIsInVuZGVmaW5lZCIsImNtZCIsImV2ZW50IiwiZSIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTs7Ozs7ZUFNeUJBLE9BQU8sQ0FBQyxRQUFELEM7SUFBeEJDLFksWUFBQUEsWTs7QUFDUixJQUFNQyxHQUFHLEdBQUdGLE9BQU8sQ0FBQyxPQUFELENBQVAsQ0FBaUIsK0NBQWpCLENBQVo7O2dCQUU4QkEsT0FBTyxDQUFDLG9CQUFELEM7SUFBN0JHLGlCLGFBQUFBLGlCOztBQUNSLElBQU1DLGNBQWMsR0FBR0osT0FBTyxDQUFDLGNBQUQsQ0FBOUI7O2dCQUNxQkEsT0FBTyxDQUFDLGVBQUQsQztJQUFwQkssUSxhQUFBQSxROztBQUVSLElBQU1DLEdBQUcsR0FBRyx5Q0FBWjtBQUNBOzs7OztBQUlBLElBQU1DLFlBQVksR0FBRyxTQUFmQSxZQUFlLENBQUFDLElBQUk7QUFBQSxTQUFLO0FBQzFCQyxJQUFBQSxRQUFRLEVBQUUsQ0FEZ0I7QUFFMUJDLElBQUFBLFFBQVEsRUFBRSxLQUZnQjtBQUcxQkMsSUFBQUEsU0FBUyxFQUFFLE9BSGU7QUFJMUJDLElBQUFBLEdBQUcsRUFBRSxDQUpxQjtBQUsxQkMsSUFBQUEsTUFBTSxFQUFFTDtBQUxrQixHQUFMO0FBQUEsQ0FBekI7QUFPQTs7Ozs7OztBQUtBLElBQU1NLGNBQWMsR0FBRztBQUFFQyxFQUFBQSxPQUFPLEVBQUU7QUFBRUMsSUFBQUEsT0FBTyxFQUFFO0FBQUVDLE1BQUFBLGtCQUFrQixFQUFFO0FBQXRCO0FBQVg7QUFBWCxDQUF2QjtBQUVBOzs7Ozs7Ozs7Ozs7O0lBWU1DLHFCOzs7QUFDRjs7Ozs7Ozs7OztBQVVBLGlDQUFZVixJQUFaLEVBQWtCUSxPQUFsQixFQUFnQztBQUFBOztBQUFBLFFBQWRBLE9BQWM7QUFBZEEsTUFBQUEsT0FBYyxHQUFKLEVBQUk7QUFBQTs7QUFDNUIsMENBQU0sSUFBSVosY0FBSixDQUFtQkUsR0FBbkIsRUFBd0JDLFlBQVksQ0FBQ0MsSUFBRCxDQUFwQyxFQUE0Q1AsWUFBWSxDQUFDZSxPQUFELEVBQVVGLGNBQVYsQ0FBeEQsQ0FBTjs7QUFDQSxVQUFLSyxFQUFMLENBQVEsTUFBUixFQUFnQjtBQUFBLGFBQU1qQixHQUFHLDhCQUE0Qk0sSUFBNUIsT0FBVDtBQUFBLEtBQWhCOztBQUNBLFVBQUtXLEVBQUwsQ0FBUSxPQUFSLEVBQWlCO0FBQUEsYUFBTWpCLEdBQUcsQ0FBQyxvQkFBRCxDQUFUO0FBQUEsS0FBakI7O0FBSDRCO0FBSS9COzs7O1NBRURrQixTLEdBQUEscUJBQVk7QUFBRSxVQUFNLElBQUlDLEtBQUosQ0FBVSw4QkFBVixDQUFOO0FBQWtELEc7O1NBQ2hFQyxXLEdBQUEscUJBQVlDLElBQVosRUFBa0I7QUFDZCxRQUFJLEVBQUUsU0FBU0EsSUFBWCxDQUFKLEVBQXNCO0FBQ2xCckIsTUFBQUEsR0FBRyxDQUFDLHlDQUFELENBQUg7QUFDQUEsTUFBQUEsR0FBRyxDQUFDcUIsSUFBRCxDQUFIO0FBQ0EsYUFBT0MsU0FBUDtBQUNIOztBQUNELFFBQUlELElBQUksQ0FBQ0UsR0FBTCxJQUFZcEIsUUFBaEIsRUFBMEI7QUFDdEIsVUFBSTtBQUNBLFlBQU1xQixLQUFLLEdBQUdyQixRQUFRLENBQUNrQixJQUFJLENBQUNFLEdBQU4sQ0FBUixDQUFtQkwsU0FBbkIsQ0FBNkJHLElBQTdCLENBQWQ7QUFDQSxlQUFPRyxLQUFQO0FBQ0gsT0FIRCxDQUdFLE9BQU9DLENBQVAsRUFBVTtBQUNSekIsUUFBQUEsR0FBRyxpQ0FBK0J5QixDQUEvQixDQUFIO0FBQ0F6QixRQUFBQSxHQUFHLENBQUNxQixJQUFELENBQUg7QUFDQSxlQUFPQyxTQUFQO0FBQ0g7QUFDSixLQVRELE1BU087QUFDSHRCLE1BQUFBLEdBQUcsQ0FBQyxzQkFBRCxDQUFIO0FBQ0FBLE1BQUFBLEdBQUcsQ0FBQ3FCLElBQUQsQ0FBSDtBQUNBLGFBQU9DLFNBQVA7QUFDSDtBQUNKLEc7OztFQXRDK0JyQixpQjs7QUF5Q3BDeUIsTUFBTSxDQUFDQyxPQUFQLEdBQWlCWCxxQkFBakIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogVGhpcyBmaWxlIGNvbnRhaW5zIHRoZSBjbGFzcyBkZWZpbml0aW9uIG9mIEFwcGxpY2F0aW9uQ29ubmVjdGlvbiwgd2hpY2ggaW1wbGVtZW50c1xyXG4gKiB0aGUgQXBwbGljYXRpb24gUHJvdG9jb2wuXHJcbiAqIEZvciBtb3JlIGluZm9ybWF0aW9uLCBzZWUgV2lraSBwYWdlICdBcHBsaWNhdGlvbiBQcm90b2NvbCcuXHJcbiAqL1xyXG5cclxuY29uc3QgeyBkZWZhdWx0c0RlZXAgfSA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xyXG5jb25zdCBsb2cgPSByZXF1aXJlKCdkZWJ1ZycpKCdiaWxpYmlsaS1kYW5tYWt1LWNsaWVudC9BcHBsaWNhdGlvbkNvbm5lY3Rpb24nKTtcclxuXHJcbmNvbnN0IHsgQ2FzY2FkZUNvbm5lY3Rpb24gfSA9IHJlcXVpcmUoJy4uL3V0aWwvY29ubmVjdGlvbicpO1xyXG5jb25zdCBEYXRhQ29ubmVjdGlvbiA9IHJlcXVpcmUoJy4uL3RyYW5zcG9ydCcpO1xyXG5jb25zdCB7IHJlZ2lzdHJ5IH0gPSByZXF1aXJlKCcuL2RlZmluaXRpb25zJyk7XHJcblxyXG5jb25zdCB1cmwgPSAnd3NzOi8vYnJvYWRjYXN0bHYuY2hhdC5iaWxpYmlsaS5jb20vc3ViJztcclxuLyoqXHJcbiAqIFJldHVybiB0aGUgaGFuZHNoYWtlIEpTT04gd2l0aCB0aGUgcm9vbSBpZC5cclxuICogQHBhcmFtIHtOdW1iZXJ9IHJvb20gVGhlIHJvb20gbnVtYmVyLlxyXG4gKi9cclxuY29uc3QgZ2V0SGFuZHNoYWtlID0gcm9vbSA9PiAoe1xyXG4gICAgcHJvdG9WZXI6IDEsXHJcbiAgICBwbGF0Zm9ybTogJ3dlYicsXHJcbiAgICBjbGllbnRWZXI6ICcxLjQuMycsXHJcbiAgICB1aWQ6IDAsXHJcbiAgICByb29taWQ6IHJvb20sXHJcbn0pO1xyXG4vKipcclxuICogRGVmYXVsdCBvcHRpb25zLiBfLmRlZmF1bHRzRGVlcCgpIGlzIHVzZWQgdG8gbWVyZ2UgaXQgd2l0aCBnaXZlbiBvcHRpb25zLlxyXG4gKiByZWplY3RVbmF1dGhvcml6ZWQgaXMgc2V0IHRvIHRydWUgYW5kIHBhc3NlZCB0byBXZWJTb2NrZXQgdG8gYXZvaWRcclxuICogYXV0aGVudGljYXRpb24gZXJyb3JzLlxyXG4gKi9cclxuY29uc3QgZGVmYXVsdE9wdGlvbnMgPSB7IHNlY3Rpb246IHsgb3B0aW9uczogeyByZWplY3RVbmF1dGhvcml6ZWQ6IGZhbHNlIH0gfSB9O1xyXG5cclxuLyoqXHJcbiAqIEFwcGxpY2F0aW9uQ29ubmVjdGlvbiBpbXBsZW1lbnRzIHRoZSBBcHBsaWNhdGlvbiBQcm90b2NvbC5cclxuICogSG93ZXZlciwgdGhpcyBpbXBsZW1lbnRhdGlvbiBkb2VzIG5vdCAxMDAlIGNvbmZvcm0gdG8gdGhlIG9yaWdpbmFsIGRlZml0bmlvbi5cclxuICogVGhlIG1haW4gZGlmZmVyZW5jZSBpczpcclxuICogQXBwbGljYXRpb25Db25uZWN0aW9uIHVzZXMgZXZlbnQgJ21lc3NhZ2UnIGluc3RlYWQgb2YgJ2V2ZW50JyB0byBub3RpZnkgdGhlXHJcbiAqIGFycmFpdmFsIG9mIGFuIEFwcGxpY2F0aW9uRXZlbnQuXHJcbiAqIFRoaXMgaXMgYmVjYXVzZSBBcHBsaWNhdGlvbkNvbm5lY3Rpb24gZXh0ZW5kcyBCYXNlQ29ubmVjdGlvbi4gTWVhbndoaWxlLFxyXG4gKiB0aGUgJ2V2ZW50JyBldmVudCBpcyBkZWZpbmVkIGluIERhbm1ha3VDbGllbnQsIHdoaWNoIGlzIGEgdGhpbiB3cmFwIG92ZXJcclxuICogQXBwbGljYXRpb25Db25uZWN0aW9uLlxyXG4gKiBBbmQgc2luY2UgQXBwbGljYXRpb25Db25uZWN0aW9uIG9ubHkgc3VwcG9ydHMgdGhlIENsaWVudCBzaWRlLCB0aGUgRXZlbnQtdG8tSlNPTlxyXG4gKiBjb252ZXJ0aW9uIGlzIG5vdCBzdXBwb3J0ZWQuXHJcbiAqL1xyXG5jbGFzcyBBcHBsaWNhdGlvbkNvbm5lY3Rpb24gZXh0ZW5kcyBDYXNjYWRlQ29ubmVjdGlvbiB7XHJcbiAgICAvKipcclxuICAgICAqIENvbnN0cnVjdCBhIG5ldyBBcHBsaWNhdGlvbkNvbm5lY3Rpb24gd2l0aCB0aGUgZ2l2ZW4gUm9vbSBpZCBhbmQgb3B0aW9ucy5cclxuICAgICAqIE5vdGUgdGhhdCB0aGUgUm9vbSBpZCBtdXN0IGJlIHRoZSBvcmlnaW5hbCBSb29tIGlkLCB0aGF0IGlzLCB0aGUgc2hvcnQgUm9vbSBpZFxyXG4gICAgICogaXMgbm90IGFjY2VwdGVkLlxyXG4gICAgICogRm9yIGV4YW1wbGUsIG9uZSBvZiB0aGUgb2ZmaWNpYWwgTGl2ZSBSb29tcywgaHR0cHM6Ly9saXZlLmJpbGliaWxpLmNvbS8xLFxyXG4gICAgICogdXNlcyB0aGUgb3JpZ2luYWwgUm9vbSBpZCA1NDQwLiBJbiB0aGlzIGNhc2UsIHRyeWluZyB0byBjb25uZWN0IHRvIFJvb20gMSB3b3VsZFxyXG4gICAgICogbm90IHdvcmsgcHJvcGVybHksIHRoZSBjb3JyZWN0IHdheSBpcyB0byBjb25uZWN0IHRvIFJvb20gNTQ0MC5cclxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSByb29tIFRoZSBpZCBvZiB0aGUgUm9vbSB0byBjb25uZWN0IHRvLlxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBUaGUgb3B0aW9ucyB0byBwYXNzIHRvIERhdGFDb25uZWN0aW9uLiBNZXJnZWQgd2l0aCBkZWZhdWx0T3B0aW9ucy5cclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3Iocm9vbSwgb3B0aW9ucyA9IHt9KSB7XHJcbiAgICAgICAgc3VwZXIobmV3IERhdGFDb25uZWN0aW9uKHVybCwgZ2V0SGFuZHNoYWtlKHJvb20pLCBkZWZhdWx0c0RlZXAob3B0aW9ucywgZGVmYXVsdE9wdGlvbnMpKSk7XHJcbiAgICAgICAgdGhpcy5vbignb3BlbicsICgpID0+IGxvZyhgQ29ubmVjdGlvbiBvcGVuZWQ6IHJvb209JHtyb29tfS5gKSk7XHJcbiAgICAgICAgdGhpcy5vbignY2xvc2UnLCAoKSA9PiBsb2coJ0Nvbm5lY3Rpb24gY2xvc2VkLicpKTtcclxuICAgIH1cclxuXHJcbiAgICB0cmFuc2Zvcm0oKSB7IHRocm93IG5ldyBFcnJvcignRXZlbnQgLT4gSlNPTiBub3Qgc3VwcG9ydGVkIScpOyB9XHJcbiAgICBkZXRyYW5zZm9ybShqc29uKSB7XHJcbiAgICAgICAgaWYgKCEoJ2NtZCcgaW4ganNvbikpIHtcclxuICAgICAgICAgICAgbG9nKCdFdmVudCBpbnZhbGlkIHdpdGhvdXQgXFwnY21kXFwnIHByb3BlcnR5OicpO1xyXG4gICAgICAgICAgICBsb2coanNvbik7XHJcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChqc29uLmNtZCBpbiByZWdpc3RyeSkge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZXZlbnQgPSByZWdpc3RyeVtqc29uLmNtZF0udHJhbnNmb3JtKGpzb24pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGV2ZW50O1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICBsb2coYFVuYWJsZSB0byB0cmFuc2Zvcm0gZXZlbnQ6ICR7ZX1gKTtcclxuICAgICAgICAgICAgICAgIGxvZyhqc29uKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsb2coJ1VudHJhbnNmb3JtZWQgZXZlbnQ6Jyk7XHJcbiAgICAgICAgICAgIGxvZyhqc29uKTtcclxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQXBwbGljYXRpb25Db25uZWN0aW9uO1xyXG4iXX0=