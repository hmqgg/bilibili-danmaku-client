"use strict";

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

/**
 * This file contains class definitino for DataConenction, the implementation of the
 * Data Layer of the Transport Protocol.
 */
var log = require('debug')('bilibili-danmaku-client/DataConnection');

var _require = require('../util/connection'),
    CascadeConnection = _require.CascadeConnection;

var _require2 = require('./SectionConnection'),
    SectionConnection = _require2.SectionConnection,
    Section = _require2.Section,
    SectionCoder = _require2.SectionCoder,
    StringCoder = _require2.StringCoder,
    JsonCoder = _require2.JsonCoder; // Section types are represented by SectionCoders.
// See SectionConnection.js for more information.


var handshakeCoder = new JsonCoder({
  controlFlag: true,
  opCode: 7,
  binaryFlag: true
});
var handshakeAckCoder = new SectionCoder({
  controlFlag: true,
  opCode: 8,
  binaryFlag: true
});
var dataCoder = new JsonCoder({
  controlFlag: false,
  opCode: 5,
  binaryFlag: false
});
var heartbeatCoder = new StringCoder({
  controlFlag: true,
  opCode: 2,
  binaryFlag: true
});
var heartbeatAckCoder = new SectionCoder({
  controlFlag: true,
  opCode: 3,
  binaryFlag: true
});
var coders = [handshakeCoder, handshakeAckCoder, dataCoder, heartbeatCoder, heartbeatAckCoder];
/**
 * DataConnection implements the Data Layer of the Transport Protocol.
 * It builds upon the Section Layer, so the Application Protocol can build upon this
 * class directly.
 * The convertion process of the Data Layer is moved to the Section Layer, see
 * SectioConnection.js for more information.
 */

var DataConnection = /*#__PURE__*/function (_CascadeConnection) {
  _inheritsLoose(DataConnection, _CascadeConnection);

  /**
   * Constructs a new DataConnection with the given parameters.
   * options contain 3 properties:
   * - property 'section', the options passed to SectionConnection as the third parameter.
   * - property 'timeout', the time to wait before handshake fails. Defaulted to 5s.
   * - property 'heartbeat', the time interval between heartbeats. Defaulted to 30s.
   * Note that the DataConnection opens only after both:
   * - The underlyinf SecdtionConnection has successfully opened.
   * - and the handshake process has finished successfully.
   * Note that DataConnection sends and receives JSONs, so it does not transforms and
   * detransforms Section[] messages of the SectionConnection directly.
   * @param {String} url The URL to connect to.
   * @param {Object} handshakeJson The handshake JSON to use.
   * @param {Object} options The options.
   */
  function DataConnection(url, handshakeJson, options) {
    var _this;

    if (options === void 0) {
      options = {};
    }

    var _options = options,
        section = _options.section,
        _options$timeout = _options.timeout,
        timeout = _options$timeout === void 0 ? 5000 : _options$timeout,
        _options$heartbeat = _options.heartbeat,
        heartbeat = _options$heartbeat === void 0 ? 30000 : _options$heartbeat;
    _this = _CascadeConnection.call(this, new SectionConnection(coders, url, section), {
      open: false,
      message: false
    }) || this;

    _this.parent.on('message', function (sections) {
      return sections.forEach(function (s) {
        return _this.emit('section', s);
      });
    });

    _this.on('section', function (s) {
      if (_this.state === 'opened' && dataCoder.hasConstructed(s)) _this.onMessage(s.data);
    });

    _this.setupHandshake(handshakeJson, timeout);

    _this.setupHeartbeat(heartbeat);

    return _this;
  }
  /**
   * Setup the handshake process. For more information about the handshake process,
   * see Wiki page 'Application Protocol'.
   * The connection will be closed after the given timeout if no Handshake ACK Section has
   * been received. In this case, a 'close' event will be emitted but no 'error' event.
   * @param {Object} handshakeJson The JSON to send as handshake.
   * @param {Number} timeout Time to wait before closing.
   */


  var _proto = DataConnection.prototype;

  _proto.setupHandshake = function setupHandshake(handshakeJson, timeout) {
    var _this2 = this;

    this.parent.on('open', function () {
      log('Sending handshake...');

      _this2.parent.send([new Section(handshakeCoder, handshakeJson)]);
    });
    setTimeout(function () {
      if (_this2.state === 'opening') {
        log('Handshake timed out, closing connection...');

        _this2.onClose();
      }
    }, timeout);
    this.on('section', function (section) {
      if (_this2.state === 'opening' && handshakeAckCoder.hasConstructed(section)) {
        log('Handshake ACK received, handshake successful.');

        _this2.onOpen();
      }
    });
  }
  /**
   * Setup the heartbeat process. For more information about the heartbeat process,
   * see Wiki page 'Application Protocol'.
   * The hearbeat will start immediately after the opening of the connection, and will
   * stop at closing.
   * @param {Number} interval Time bewteen heartbeats.
   */
  ;

  _proto.setupHeartbeat = function setupHeartbeat(interval) {
    var _this3 = this;

    var heartbeat;

    var sendHeartbeat = function sendHeartbeat() {
      log('Sending heartbeat...');

      _this3.parent.send([new Section(heartbeatCoder, '[object Object]')]);
    };

    this.on('open', function () {
      sendHeartbeat();
      heartbeat = setInterval(sendHeartbeat, interval);
    });
    this.on('close', function () {
      return clearInterval(heartbeat);
    });
    this.on('section', function (section) {
      if (_this3.state === 'opened' && heartbeatAckCoder.hasConstructed(section)) {
        log('Heartbeat ACK received.');
        var popularity = section.data.readInt32BE(0);

        _this3.onMessage({
          cmd: 'POPULARITY',
          data: {
            count: popularity
          }
        });
      }
    });
  };

  _proto.transform = function transform(json) {
    return [new Section(dataCoder, json)];
  } // SectionConnection sends Section[]
  ;

  return DataConnection;
}(CascadeConnection);

module.exports = DataConnection;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90cmFuc3BvcnQvaW5kZXguanMiXSwibmFtZXMiOlsibG9nIiwicmVxdWlyZSIsIkNhc2NhZGVDb25uZWN0aW9uIiwiU2VjdGlvbkNvbm5lY3Rpb24iLCJTZWN0aW9uIiwiU2VjdGlvbkNvZGVyIiwiU3RyaW5nQ29kZXIiLCJKc29uQ29kZXIiLCJoYW5kc2hha2VDb2RlciIsImNvbnRyb2xGbGFnIiwib3BDb2RlIiwiYmluYXJ5RmxhZyIsImhhbmRzaGFrZUFja0NvZGVyIiwiZGF0YUNvZGVyIiwiaGVhcnRiZWF0Q29kZXIiLCJoZWFydGJlYXRBY2tDb2RlciIsImNvZGVycyIsIkRhdGFDb25uZWN0aW9uIiwidXJsIiwiaGFuZHNoYWtlSnNvbiIsIm9wdGlvbnMiLCJzZWN0aW9uIiwidGltZW91dCIsImhlYXJ0YmVhdCIsIm9wZW4iLCJtZXNzYWdlIiwicGFyZW50Iiwib24iLCJzZWN0aW9ucyIsImZvckVhY2giLCJzIiwiZW1pdCIsInN0YXRlIiwiaGFzQ29uc3RydWN0ZWQiLCJvbk1lc3NhZ2UiLCJkYXRhIiwic2V0dXBIYW5kc2hha2UiLCJzZXR1cEhlYXJ0YmVhdCIsInNlbmQiLCJzZXRUaW1lb3V0Iiwib25DbG9zZSIsIm9uT3BlbiIsImludGVydmFsIiwic2VuZEhlYXJ0YmVhdCIsInNldEludGVydmFsIiwiY2xlYXJJbnRlcnZhbCIsInBvcHVsYXJpdHkiLCJyZWFkSW50MzJCRSIsImNtZCIsImNvdW50IiwidHJhbnNmb3JtIiwianNvbiIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTs7OztBQUtBLElBQU1BLEdBQUcsR0FBR0MsT0FBTyxDQUFDLE9BQUQsQ0FBUCxDQUFpQix3Q0FBakIsQ0FBWjs7ZUFFOEJBLE9BQU8sQ0FBQyxvQkFBRCxDO0lBQTdCQyxpQixZQUFBQSxpQjs7Z0JBQ3FFRCxPQUFPLENBQUMscUJBQUQsQztJQUE1RUUsaUIsYUFBQUEsaUI7SUFBbUJDLE8sYUFBQUEsTztJQUFTQyxZ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RDtBQUlBLFNBQUtmLEVBQUwsQ0FBUSxPQUFSLEVBQWlCO0FBQUEsYUFBTWtCLGFBQWEsQ0FBQ3RCLFNBQUQsQ0FBbkI7QUFBQSxLQUFqQjtBQUNBLFNBQUtJLEVBQUwsQ0FBUSxTQUFSLEVBQW1CLFVBQUNOLE9BQUQsRUFBYTtBQUM1QixVQUFJLE1BQUksQ0FBQ1csS0FBTCxLQUFlLFFBQWYsSUFBMkJqQixpQkFBaUIsQ0FBQ2tCLGNBQWxCLENBQWlDWixPQUFqQyxDQUEvQixFQUEwRTtBQUN0RXJCLFFBQUFBLEdBQUcsQ0FBQyx5QkFBRCxDQUFIO0FBQ0EsWUFBTThDLFVBQVUsR0FBR3pCLE9BQU8sQ0FBQ2MsSUFBUixDQUFhWSxXQUFiLENBQXlCLENBQXpCLENBQW5COztBQUNBLFFBQUEsTUFBSSxDQUFDYixTQUFMLENBQWU7QUFDWGMsVUFBQUEsR0FBRyxFQUFFLFlBRE07QUFFWGIsVUFBQUEsSUFBSSxFQUFFO0FBQ0ZjLFlBQUFBLEtBQUssRUFBRUg7QUFETDtBQUZLLFNBQWY7QUFNSDtBQUNKLEtBWEQ7QUFZSCxHOztTQUVESSxTLEdBQUEsbUJBQVVDLElBQVYsRUFBZ0I7QUFBRSxXQUFPLENBQUMsSUFBSS9DLE9BQUosQ0FBWVMsU0FBWixFQUF1QnNDLElBQXZCLENBQUQsQ0FBUDtBQUF3QyxHLENBQUM7Ozs7RUF4RmxDakQsaUI7O0FBMkY3QmtELE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQnBDLGNBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIFRoaXMgZmlsZSBjb250YWlucyBjbGFzcyBkZWZpbml0aW5vIGZvciBEYXRhQ29uZW5jdGlvbiwgdGhlIGltcGxlbWVudGF0aW9uIG9mIHRoZVxyXG4gKiBEYXRhIExheWVyIG9mIHRoZSBUcmFuc3BvcnQgUHJvdG9jb2wuXHJcbiAqL1xyXG5cclxuY29uc3QgbG9nID0gcmVxdWlyZSgnZGVidWcnKSgnYmlsaWJpbGktZGFubWFrdS1jbGllbnQvRGF0YUNvbm5lY3Rpb24nKTtcclxuXHJcbmNvbnN0IHsgQ2FzY2FkZUNvbm5lY3Rpb24gfSA9IHJlcXVpcmUoJy4uL3V0aWwvY29ubmVjdGlvbicpO1xyXG5jb25zdCB7IFNlY3Rpb25Db25uZWN0aW9uLCBTZWN0aW9uLCBTZWN0aW9uQ29kZXIsIFN0cmluZ0NvZGVyLCBKc29uQ29kZXIgfSA9IHJlcXVpcmUoJy4vU2VjdGlvbkNvbm5lY3Rpb24nKTtcclxuXHJcbi8vIFNlY3Rpb24gdHlwZXMgYXJlIHJlcHJlc2VudGVkIGJ5IFNlY3Rpb25Db2RlcnMuXHJcbi8vIFNlZSBTZWN0aW9uQ29ubmVjdGlvbi5qcyBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cclxuY29uc3QgaGFuZHNoYWtlQ29kZXIgPSBuZXcgSnNvbkNvZGVyKHsgY29udHJvbEZsYWc6IHRydWUsIG9wQ29kZTogNywgYmluYXJ5RmxhZzogdHJ1ZSB9KTtcclxuY29uc3QgaGFuZHNoYWtlQWNrQ29kZXIgPSBuZXcgU2VjdGlvbkNvZGVyKHsgY29udHJvbEZsYWc6IHRydWUsIG9wQ29kZTogOCwgYmluYXJ5RmxhZzogdHJ1ZSB9KTtcclxuY29uc3QgZGF0YUNvZGVyID0gbmV3IEpzb25Db2Rlcih7IGNvbnRyb2xGbGFnOiBmYWxzZSwgb3BDb2RlOiA1LCBiaW5hcnlGbGFnOiBmYWxzZSB9KTtcclxuY29uc3QgaGVhcnRiZWF0Q29kZXIgPSBuZXcgU3RyaW5nQ29kZXIoeyBjb250cm9sRmxhZzogdHJ1ZSwgb3BDb2RlOiAyLCBiaW5hcnlGbGFnOiB0cnVlIH0pO1xyXG5jb25zdCBoZWFydGJlYXRBY2tDb2RlciA9IG5ldyBTZWN0aW9uQ29kZXIoeyBjb250cm9sRmxhZzogdHJ1ZSwgb3BDb2RlOiAzLCBiaW5hcnlGbGFnOiB0cnVlIH0pO1xyXG5jb25zdCBjb2RlcnMgPSBbaGFuZHNoYWtlQ29kZXIsIGhhbmRzaGFrZUFja0NvZGVyLCBkYXRhQ29kZXIsIGhlYXJ0YmVhdENvZGVyLCBoZWFydGJlYXRBY2tDb2Rlcl07XHJcblxyXG4vKipcclxuICogRGF0YUNvbm5lY3Rpb24gaW1wbGVtZW50cyB0aGUgRGF0YSBMYXllciBvZiB0aGUgVHJhbnNwb3J0IFByb3RvY29sLlxyXG4gKiBJdCBidWlsZHMgdXBvbiB0aGUgU2VjdGlvbiBMYXllciwgc28gdGhlIEFwcGxpY2F0aW9uIFByb3RvY29sIGNhbiBidWlsZCB1cG9uIHRoaXNcclxuICogY2xhc3MgZGlyZWN0bHkuXHJcbiAqIFRoZSBjb252ZXJ0aW9uIHByb2Nlc3Mgb2YgdGhlIERhdGEgTGF5ZXIgaXMgbW92ZWQgdG8gdGhlIFNlY3Rpb24gTGF5ZXIsIHNlZVxyXG4gKiBTZWN0aW9Db25uZWN0aW9uLmpzIGZvciBtb3JlIGluZm9ybWF0aW9uLlxyXG4gKi9cclxuY2xhc3MgRGF0YUNvbm5lY3Rpb24gZXh0ZW5kcyBDYXNjYWRlQ29ubmVjdGlvbiB7XHJcbiAgICAvKipcclxuICAgICAqIENvbnN0cnVjdHMgYSBuZXcgRGF0YUNvbm5lY3Rpb24gd2l0aCB0aGUgZ2l2ZW4gcGFyYW1ldGVycy5cclxuICAgICAqIG9wdGlvbnMgY29udGFpbiAzIHByb3BlcnRpZXM6XHJcbiAgICAgKiAtIHByb3BlcnR5ICdzZWN0aW9uJywgdGhlIG9wdGlvbnMgcGFzc2VkIHRvIFNlY3Rpb25Db25uZWN0aW9uIGFzIHRoZSB0aGlyZCBwYXJhbWV0ZXIuXHJcbiAgICAgKiAtIHByb3BlcnR5ICd0aW1lb3V0JywgdGhlIHRpbWUgdG8gd2FpdCBiZWZvcmUgaGFuZHNoYWtlIGZhaWxzLiBEZWZhdWx0ZWQgdG8gNXMuXHJcbiAgICAgKiAtIHByb3BlcnR5ICdoZWFydGJlYXQnLCB0aGUgdGltZSBpbnRlcnZhbCBiZXR3ZWVuIGhlYXJ0YmVhdHMuIERlZmF1bHRlZCB0byAzMHMuXHJcbiAgICAgKiBOb3RlIHRoYXQgdGhlIERhdGFDb25uZWN0aW9uIG9wZW5zIG9ubHkgYWZ0ZXIgYm90aDpcclxuICAgICAqIC0gVGhlIHVuZGVybHlpbmYgU2VjZHRpb25Db25uZWN0aW9uIGhhcyBzdWNjZXNzZnVsbHkgb3BlbmVkLlxyXG4gICAgICogLSBhbmQgdGhlIGhhbmRzaGFrZSBwcm9jZXNzIGhhcyBmaW5pc2hlZCBzdWNjZXNzZnVsbHkuXHJcbiAgICAgKiBOb3RlIHRoYXQgRGF0YUNvbm5lY3Rpb24gc2VuZHMgYW5kIHJlY2VpdmVzIEpTT05zLCBzbyBpdCBkb2VzIG5vdCB0cmFuc2Zvcm1zIGFuZFxyXG4gICAgICogZGV0cmFuc2Zvcm1zIFNlY3Rpb25bXSBtZXNzYWdlcyBvZiB0aGUgU2VjdGlvbkNvbm5lY3Rpb24gZGlyZWN0bHkuXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdXJsIFRoZSBVUkwgdG8gY29ubmVjdCB0by5cclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBoYW5kc2hha2VKc29uIFRoZSBoYW5kc2hha2UgSlNPTiB0byB1c2UuXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBUaGUgb3B0aW9ucy5cclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IodXJsLCBoYW5kc2hha2VKc29uLCBvcHRpb25zID0ge30pIHtcclxuICAgICAgICBjb25zdCB7IHNlY3Rpb24sIHRpbWVvdXQgPSA1MDAwLCBoZWFydGJlYXQgPSAzMDAwMCB9ID0gb3B0aW9ucztcclxuICAgICAgICBzdXBlcihuZXcgU2VjdGlvbkNvbm5lY3Rpb24oY29kZXJzLCB1cmwsIHNlY3Rpb24pLCB7IG9wZW46IGZhbHNlLCBtZXNzYWdlOiBmYWxzZSB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5wYXJlbnQub24oJ21lc3NhZ2UnLCBzZWN0aW9ucyA9PiBzZWN0aW9ucy5mb3JFYWNoKHMgPT4gdGhpcy5lbWl0KCdzZWN0aW9uJywgcykpKTtcclxuICAgICAgICB0aGlzLm9uKCdzZWN0aW9uJywgKHMpID0+IHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUgPT09ICdvcGVuZWQnICYmIGRhdGFDb2Rlci5oYXNDb25zdHJ1Y3RlZChzKSkgdGhpcy5vbk1lc3NhZ2Uocy5kYXRhKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5zZXR1cEhhbmRzaGFrZShoYW5kc2hha2VKc29uLCB0aW1lb3V0KTtcclxuICAgICAgICB0aGlzLnNldHVwSGVhcnRiZWF0KGhlYXJ0YmVhdCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXR1cCB0aGUgaGFuZHNoYWtlIHByb2Nlc3MuIEZvciBtb3JlIGluZm9ybWF0aW9uIGFib3V0IHRoZSBoYW5kc2hha2UgcHJvY2VzcyxcclxuICAgICAqIHNlZSBXaWtpIHBhZ2UgJ0FwcGxpY2F0aW9uIFByb3RvY29sJy5cclxuICAgICAqIFRoZSBjb25uZWN0aW9uIHdpbGwgYmUgY2xvc2VkIGFmdGVyIHRoZSBnaXZlbiB0aW1lb3V0IGlmIG5vIEhhbmRzaGFrZSBBQ0sgU2VjdGlvbiBoYXNcclxuICAgICAqIGJlZW4gcmVjZWl2ZWQuIEluIHRoaXMgY2FzZSwgYSAnY2xvc2UnIGV2ZW50IHdpbGwgYmUgZW1pdHRlZCBidXQgbm8gJ2Vycm9yJyBldmVudC5cclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBoYW5kc2hha2VKc29uIFRoZSBKU09OIHRvIHNlbmQgYXMgaGFuZHNoYWtlLlxyXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHRpbWVvdXQgVGltZSB0byB3YWl0IGJlZm9yZSBjbG9zaW5nLlxyXG4gICAgICovXHJcbiAgICBzZXR1cEhhbmRzaGFrZShoYW5kc2hha2VKc29uLCB0aW1lb3V0KSB7XHJcbiAgICAgICAgdGhpcy5wYXJlbnQub24oJ29wZW4nLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIGxvZygnU2VuZGluZyBoYW5kc2hha2UuLi4nKTtcclxuICAgICAgICAgICAgdGhpcy5wYXJlbnQuc2VuZChbbmV3IFNlY3Rpb24oaGFuZHNoYWtlQ29kZXIsIGhhbmRzaGFrZUpzb24pXSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlID09PSAnb3BlbmluZycpIHtcclxuICAgICAgICAgICAgICAgIGxvZygnSGFuZHNoYWtlIHRpbWVkIG91dCwgY2xvc2luZyBjb25uZWN0aW9uLi4uJyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uQ2xvc2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIHRpbWVvdXQpO1xyXG4gICAgICAgIHRoaXMub24oJ3NlY3Rpb24nLCAoc2VjdGlvbikgPT4ge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0ZSA9PT0gJ29wZW5pbmcnICYmIGhhbmRzaGFrZUFja0NvZGVyLmhhc0NvbnN0cnVjdGVkKHNlY3Rpb24pKSB7XHJcbiAgICAgICAgICAgICAgICBsb2coJ0hhbmRzaGFrZSBBQ0sgcmVjZWl2ZWQsIGhhbmRzaGFrZSBzdWNjZXNzZnVsLicpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vbk9wZW4oKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0dXAgdGhlIGhlYXJ0YmVhdCBwcm9jZXNzLiBGb3IgbW9yZSBpbmZvcm1hdGlvbiBhYm91dCB0aGUgaGVhcnRiZWF0IHByb2Nlc3MsXHJcbiAgICAgKiBzZWUgV2lraSBwYWdlICdBcHBsaWNhdGlvbiBQcm90b2NvbCcuXHJcbiAgICAgKiBUaGUgaGVhcmJlYXQgd2lsbCBzdGFydCBpbW1lZGlhdGVseSBhZnRlciB0aGUgb3BlbmluZyBvZiB0aGUgY29ubmVjdGlvbiwgYW5kIHdpbGxcclxuICAgICAqIHN0b3AgYXQgY2xvc2luZy5cclxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBpbnRlcnZhbCBUaW1lIGJld3RlZW4gaGVhcnRiZWF0cy5cclxuICAgICAqL1xyXG4gICAgc2V0dXBIZWFydGJlYXQoaW50ZXJ2YWwpIHtcclxuICAgICAgICBsZXQgaGVhcnRiZWF0O1xyXG4gICAgICAgIGNvbnN0IHNlbmRIZWFydGJlYXQgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIGxvZygnU2VuZGluZyBoZWFydGJlYXQuLi4nKTtcclxuICAgICAgICAgICAgdGhpcy5wYXJlbnQuc2VuZChbbmV3IFNlY3Rpb24oaGVhcnRiZWF0Q29kZXIsICdbb2JqZWN0IE9iamVjdF0nKV0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5vbignb3BlbicsICgpID0+IHtcclxuICAgICAgICAgICAgc2VuZEhlYXJ0YmVhdCgpO1xyXG4gICAgICAgICAgICBoZWFydGJlYXQgPSBzZXRJbnRlcnZhbChzZW5kSGVhcnRiZWF0LCBpbnRlcnZhbCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5vbignY2xvc2UnLCAoKSA9PiBjbGVhckludGVydmFsKGhlYXJ0YmVhdCkpO1xyXG4gICAgICAgIHRoaXMub24oJ3NlY3Rpb24nLCAoc2VjdGlvbikgPT4ge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0ZSA9PT0gJ29wZW5lZCcgJiYgaGVhcnRiZWF0QWNrQ29kZXIuaGFzQ29uc3RydWN0ZWQoc2VjdGlvbikpIHtcclxuICAgICAgICAgICAgICAgIGxvZygnSGVhcnRiZWF0IEFDSyByZWNlaXZlZC4nKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBvcHVsYXJpdHkgPSBzZWN0aW9uLmRhdGEucmVhZEludDMyQkUoMCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uTWVzc2FnZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgY21kOiAnUE9QVUxBUklUWScsXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudDogcG9wdWxhcml0eSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICB0cmFuc2Zvcm0oanNvbikgeyByZXR1cm4gW25ldyBTZWN0aW9uKGRhdGFDb2RlciwganNvbildOyB9IC8vIFNlY3Rpb25Db25uZWN0aW9uIHNlbmRzIFNlY3Rpb25bXVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IERhdGFDb25uZWN0aW9uO1xyXG4iXX0=