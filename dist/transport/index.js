"use strict";

require("core-js/modules/es.array.for-each");

require("core-js/modules/web.dom-collections.for-each");

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90cmFuc3BvcnQvaW5kZXguanMiXSwibmFtZXMiOlsibG9nIiwicmVxdWlyZSIsIkNhc2NhZGVDb25uZWN0aW9uIiwiU2VjdGlvbkNvbm5lY3Rpb24iLCJTZWN0aW9uIiwiU2VjdGlvbkNvZGVyIiwiU3RyaW5nQ29kZXIiLCJKc29uQ29kZXIiLCJoYW5kc2hha2VDb2RlciIsImNvbnRyb2xGbGFnIiwib3BDb2RlIiwiYmluYXJ5RmxhZyIsImhhbmRzaGFrZUFja0NvZGVyIiwiZGF0YUNvZGVyIiwiaGVhcnRiZWF0Q29kZXIiLCJoZWFydGJlYXRBY2tDb2RlciIsImNvZGVycyIsIkRhdGFDb25uZWN0aW9uIiwidXJsIiwiaGFuZHNoYWtlSnNvbiIsIm9wdGlvbnMiLCJzZWN0aW9uIiwidGltZW91dCIsImhlYXJ0YmVhdCIsIm9wZW4iLCJtZXNzYWdlIiwicGFyZW50Iiwib24iLCJzZWN0aW9ucyIsImZvckVhY2giLCJzIiwiZW1pdCIsInN0YXRlIiwiaGFzQ29uc3RydWN0ZWQiLCJvbk1lc3NhZ2UiLCJkYXRhIiwic2V0dXBIYW5kc2hha2UiLCJzZXR1cEhlYXJ0YmVhdCIsInNlbmQiLCJzZXRUaW1lb3V0Iiwib25DbG9zZSIsIm9uT3BlbiIsImludGVydmFsIiwic2VuZEhlYXJ0YmVhdCIsInNldEludGVydmFsIiwiY2xlYXJJbnRlcnZhbCIsInBvcHVsYXJpdHkiLCJyZWFkSW50MzJCRSIsImNtZCIsImNvdW50IiwidHJhbnNmb3JtIiwianNvbiIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUE7Ozs7QUFLQSxJQUFNQSxHQUFHLEdBQUdDLE9BQU8sQ0FBQyxPQUFELENBQVAsQ0FBaUIsd0NBQWpCLENBQVo7O2VBRThCQSxPQUFPLENBQUMsb0JBQUQsQztJQUE3QkMsaUIsWUFBQUEsaUI7O2dCQUNxRUQsT0FBTyxDQUFDLHFCQUFELEM7SUFBNUVFLGlCLGFBQUFBLGlCO0lBQW1CQyxPLGFBQUFBLE87SUFB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LEtBSEQ7QUFJQSxTQUFLZixFQUFMLENBQVEsT0FBUixFQUFpQjtBQUFBLGFBQU1rQixhQUFhLENBQUN0QixTQUFELENBQW5CO0FBQUEsS0FBakI7QUFDQSxTQUFLSSxFQUFMLENBQVEsU0FBUixFQUFtQixVQUFDTixPQUFELEVBQWE7QUFDNUIsVUFBSSxNQUFJLENBQUNXLEtBQUwsS0FBZSxRQUFmLElBQTJCakIsaUJBQWlCLENBQUNrQixjQUFsQixDQUFpQ1osT0FBakMsQ0FBL0IsRUFBMEU7QUFDdEVyQixRQUFBQSxHQUFHLENBQUMseUJBQUQsQ0FBSDtBQUNBLFlBQU04QyxVQUFVLEdBQUd6QixPQUFPLENBQUNjLElBQVIsQ0FBYVksV0FBYixDQUF5QixDQUF6QixDQUFuQjs7QUFDQSxRQUFBLE1BQUksQ0FBQ2IsU0FBTCxDQUFlO0FBQ1hjLFVBQUFBLEdBQUcsRUFBRSxZQURNO0FBRVhiLFVBQUFBLElBQUksRUFBRTtBQUNGYyxZQUFBQSxLQUFLLEVBQUVIO0FBREw7QUFGSyxTQUFmO0FBTUg7QUFDSixLQVhEO0FBWUgsRzs7U0FFREksUyxHQUFBLG1CQUFVQyxJQUFWLEVBQWdCO0FBQUUsV0FBTyxDQUFDLElBQUkvQyxPQUFKLENBQVlTLFNBQVosRUFBdUJzQyxJQUF2QixDQUFELENBQVA7QUFBd0MsRyxDQUFDOzs7O0VBeEZsQ2pELGlCOztBQTJGN0JrRCxNQUFNLENBQUNDLE9BQVAsR0FBaUJwQyxjQUFqQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBUaGlzIGZpbGUgY29udGFpbnMgY2xhc3MgZGVmaW5pdGlubyBmb3IgRGF0YUNvbmVuY3Rpb24sIHRoZSBpbXBsZW1lbnRhdGlvbiBvZiB0aGVcclxuICogRGF0YSBMYXllciBvZiB0aGUgVHJhbnNwb3J0IFByb3RvY29sLlxyXG4gKi9cclxuXHJcbmNvbnN0IGxvZyA9IHJlcXVpcmUoJ2RlYnVnJykoJ2JpbGliaWxpLWRhbm1ha3UtY2xpZW50L0RhdGFDb25uZWN0aW9uJyk7XHJcblxyXG5jb25zdCB7IENhc2NhZGVDb25uZWN0aW9uIH0gPSByZXF1aXJlKCcuLi91dGlsL2Nvbm5lY3Rpb24nKTtcclxuY29uc3QgeyBTZWN0aW9uQ29ubmVjdGlvbiwgU2VjdGlvbiwgU2VjdGlvbkNvZGVyLCBTdHJpbmdDb2RlciwgSnNvbkNvZGVyIH0gPSByZXF1aXJlKCcuL1NlY3Rpb25Db25uZWN0aW9uJyk7XHJcblxyXG4vLyBTZWN0aW9uIHR5cGVzIGFyZSByZXByZXNlbnRlZCBieSBTZWN0aW9uQ29kZXJzLlxyXG4vLyBTZWUgU2VjdGlvbkNvbm5lY3Rpb24uanMgZm9yIG1vcmUgaW5mb3JtYXRpb24uXHJcbmNvbnN0IGhhbmRzaGFrZUNvZGVyID0gbmV3IEpzb25Db2Rlcih7IGNvbnRyb2xGbGFnOiB0cnVlLCBvcENvZGU6IDcsIGJpbmFyeUZsYWc6IHRydWUgfSk7XHJcbmNvbnN0IGhhbmRzaGFrZUFja0NvZGVyID0gbmV3IFNlY3Rpb25Db2Rlcih7IGNvbnRyb2xGbGFnOiB0cnVlLCBvcENvZGU6IDgsIGJpbmFyeUZsYWc6IHRydWUgfSk7XHJcbmNvbnN0IGRhdGFDb2RlciA9IG5ldyBKc29uQ29kZXIoeyBjb250cm9sRmxhZzogZmFsc2UsIG9wQ29kZTogNSwgYmluYXJ5RmxhZzogZmFsc2UgfSk7XHJcbmNvbnN0IGhlYXJ0YmVhdENvZGVyID0gbmV3IFN0cmluZ0NvZGVyKHsgY29udHJvbEZsYWc6IHRydWUsIG9wQ29kZTogMiwgYmluYXJ5RmxhZzogdHJ1ZSB9KTtcclxuY29uc3QgaGVhcnRiZWF0QWNrQ29kZXIgPSBuZXcgU2VjdGlvbkNvZGVyKHsgY29udHJvbEZsYWc6IHRydWUsIG9wQ29kZTogMywgYmluYXJ5RmxhZzogdHJ1ZSB9KTtcclxuY29uc3QgY29kZXJzID0gW2hhbmRzaGFrZUNvZGVyLCBoYW5kc2hha2VBY2tDb2RlciwgZGF0YUNvZGVyLCBoZWFydGJlYXRDb2RlciwgaGVhcnRiZWF0QWNrQ29kZXJdO1xyXG5cclxuLyoqXHJcbiAqIERhdGFDb25uZWN0aW9uIGltcGxlbWVudHMgdGhlIERhdGEgTGF5ZXIgb2YgdGhlIFRyYW5zcG9ydCBQcm90b2NvbC5cclxuICogSXQgYnVpbGRzIHVwb24gdGhlIFNlY3Rpb24gTGF5ZXIsIHNvIHRoZSBBcHBsaWNhdGlvbiBQcm90b2NvbCBjYW4gYnVpbGQgdXBvbiB0aGlzXHJcbiAqIGNsYXNzIGRpcmVjdGx5LlxyXG4gKiBUaGUgY29udmVydGlvbiBwcm9jZXNzIG9mIHRoZSBEYXRhIExheWVyIGlzIG1vdmVkIHRvIHRoZSBTZWN0aW9uIExheWVyLCBzZWVcclxuICogU2VjdGlvQ29ubmVjdGlvbi5qcyBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cclxuICovXHJcbmNsYXNzIERhdGFDb25uZWN0aW9uIGV4dGVuZHMgQ2FzY2FkZUNvbm5lY3Rpb24ge1xyXG4gICAgLyoqXHJcbiAgICAgKiBDb25zdHJ1Y3RzIGEgbmV3IERhdGFDb25uZWN0aW9uIHdpdGggdGhlIGdpdmVuIHBhcmFtZXRlcnMuXHJcbiAgICAgKiBvcHRpb25zIGNvbnRhaW4gMyBwcm9wZXJ0aWVzOlxyXG4gICAgICogLSBwcm9wZXJ0eSAnc2VjdGlvbicsIHRoZSBvcHRpb25zIHBhc3NlZCB0byBTZWN0aW9uQ29ubmVjdGlvbiBhcyB0aGUgdGhpcmQgcGFyYW1ldGVyLlxyXG4gICAgICogLSBwcm9wZXJ0eSAndGltZW91dCcsIHRoZSB0aW1lIHRvIHdhaXQgYmVmb3JlIGhhbmRzaGFrZSBmYWlscy4gRGVmYXVsdGVkIHRvIDVzLlxyXG4gICAgICogLSBwcm9wZXJ0eSAnaGVhcnRiZWF0JywgdGhlIHRpbWUgaW50ZXJ2YWwgYmV0d2VlbiBoZWFydGJlYXRzLiBEZWZhdWx0ZWQgdG8gMzBzLlxyXG4gICAgICogTm90ZSB0aGF0IHRoZSBEYXRhQ29ubmVjdGlvbiBvcGVucyBvbmx5IGFmdGVyIGJvdGg6XHJcbiAgICAgKiAtIFRoZSB1bmRlcmx5aW5mIFNlY2R0aW9uQ29ubmVjdGlvbiBoYXMgc3VjY2Vzc2Z1bGx5IG9wZW5lZC5cclxuICAgICAqIC0gYW5kIHRoZSBoYW5kc2hha2UgcHJvY2VzcyBoYXMgZmluaXNoZWQgc3VjY2Vzc2Z1bGx5LlxyXG4gICAgICogTm90ZSB0aGF0IERhdGFDb25uZWN0aW9uIHNlbmRzIGFuZCByZWNlaXZlcyBKU09Ocywgc28gaXQgZG9lcyBub3QgdHJhbnNmb3JtcyBhbmRcclxuICAgICAqIGRldHJhbnNmb3JtcyBTZWN0aW9uW10gbWVzc2FnZXMgb2YgdGhlIFNlY3Rpb25Db25uZWN0aW9uIGRpcmVjdGx5LlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHVybCBUaGUgVVJMIHRvIGNvbm5lY3QgdG8uXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaGFuZHNoYWtlSnNvbiBUaGUgaGFuZHNoYWtlIEpTT04gdG8gdXNlLlxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgVGhlIG9wdGlvbnMuXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKHVybCwgaGFuZHNoYWtlSnNvbiwgb3B0aW9ucyA9IHt9KSB7XHJcbiAgICAgICAgY29uc3QgeyBzZWN0aW9uLCB0aW1lb3V0ID0gNTAwMCwgaGVhcnRiZWF0ID0gMzAwMDAgfSA9IG9wdGlvbnM7XHJcbiAgICAgICAgc3VwZXIobmV3IFNlY3Rpb25Db25uZWN0aW9uKGNvZGVycywgdXJsLCBzZWN0aW9uKSwgeyBvcGVuOiBmYWxzZSwgbWVzc2FnZTogZmFsc2UgfSk7XHJcblxyXG4gICAgICAgIHRoaXMucGFyZW50Lm9uKCdtZXNzYWdlJywgc2VjdGlvbnMgPT4gc2VjdGlvbnMuZm9yRWFjaChzID0+IHRoaXMuZW1pdCgnc2VjdGlvbicsIHMpKSk7XHJcbiAgICAgICAgdGhpcy5vbignc2VjdGlvbicsIChzKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlID09PSAnb3BlbmVkJyAmJiBkYXRhQ29kZXIuaGFzQ29uc3RydWN0ZWQocykpIHRoaXMub25NZXNzYWdlKHMuZGF0YSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuc2V0dXBIYW5kc2hha2UoaGFuZHNoYWtlSnNvbiwgdGltZW91dCk7XHJcbiAgICAgICAgdGhpcy5zZXR1cEhlYXJ0YmVhdChoZWFydGJlYXQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0dXAgdGhlIGhhbmRzaGFrZSBwcm9jZXNzLiBGb3IgbW9yZSBpbmZvcm1hdGlvbiBhYm91dCB0aGUgaGFuZHNoYWtlIHByb2Nlc3MsXHJcbiAgICAgKiBzZWUgV2lraSBwYWdlICdBcHBsaWNhdGlvbiBQcm90b2NvbCcuXHJcbiAgICAgKiBUaGUgY29ubmVjdGlvbiB3aWxsIGJlIGNsb3NlZCBhZnRlciB0aGUgZ2l2ZW4gdGltZW91dCBpZiBubyBIYW5kc2hha2UgQUNLIFNlY3Rpb24gaGFzXHJcbiAgICAgKiBiZWVuIHJlY2VpdmVkLiBJbiB0aGlzIGNhc2UsIGEgJ2Nsb3NlJyBldmVudCB3aWxsIGJlIGVtaXR0ZWQgYnV0IG5vICdlcnJvcicgZXZlbnQuXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaGFuZHNoYWtlSnNvbiBUaGUgSlNPTiB0byBzZW5kIGFzIGhhbmRzaGFrZS5cclxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSB0aW1lb3V0IFRpbWUgdG8gd2FpdCBiZWZvcmUgY2xvc2luZy5cclxuICAgICAqL1xyXG4gICAgc2V0dXBIYW5kc2hha2UoaGFuZHNoYWtlSnNvbiwgdGltZW91dCkge1xyXG4gICAgICAgIHRoaXMucGFyZW50Lm9uKCdvcGVuJywgKCkgPT4ge1xyXG4gICAgICAgICAgICBsb2coJ1NlbmRpbmcgaGFuZHNoYWtlLi4uJyk7XHJcbiAgICAgICAgICAgIHRoaXMucGFyZW50LnNlbmQoW25ldyBTZWN0aW9uKGhhbmRzaGFrZUNvZGVyLCBoYW5kc2hha2VKc29uKV0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0ZSA9PT0gJ29wZW5pbmcnKSB7XHJcbiAgICAgICAgICAgICAgICBsb2coJ0hhbmRzaGFrZSB0aW1lZCBvdXQsIGNsb3NpbmcgY29ubmVjdGlvbi4uLicpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vbkNsb3NlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LCB0aW1lb3V0KTtcclxuICAgICAgICB0aGlzLm9uKCdzZWN0aW9uJywgKHNlY3Rpb24pID0+IHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUgPT09ICdvcGVuaW5nJyAmJiBoYW5kc2hha2VBY2tDb2Rlci5oYXNDb25zdHJ1Y3RlZChzZWN0aW9uKSkge1xyXG4gICAgICAgICAgICAgICAgbG9nKCdIYW5kc2hha2UgQUNLIHJlY2VpdmVkLCBoYW5kc2hha2Ugc3VjY2Vzc2Z1bC4nKTtcclxuICAgICAgICAgICAgICAgIHRoaXMub25PcGVuKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldHVwIHRoZSBoZWFydGJlYXQgcHJvY2Vzcy4gRm9yIG1vcmUgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGhlYXJ0YmVhdCBwcm9jZXNzLFxyXG4gICAgICogc2VlIFdpa2kgcGFnZSAnQXBwbGljYXRpb24gUHJvdG9jb2wnLlxyXG4gICAgICogVGhlIGhlYXJiZWF0IHdpbGwgc3RhcnQgaW1tZWRpYXRlbHkgYWZ0ZXIgdGhlIG9wZW5pbmcgb2YgdGhlIGNvbm5lY3Rpb24sIGFuZCB3aWxsXHJcbiAgICAgKiBzdG9wIGF0IGNsb3NpbmcuXHJcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gaW50ZXJ2YWwgVGltZSBiZXd0ZWVuIGhlYXJ0YmVhdHMuXHJcbiAgICAgKi9cclxuICAgIHNldHVwSGVhcnRiZWF0KGludGVydmFsKSB7XHJcbiAgICAgICAgbGV0IGhlYXJ0YmVhdDtcclxuICAgICAgICBjb25zdCBzZW5kSGVhcnRiZWF0ID0gKCkgPT4ge1xyXG4gICAgICAgICAgICBsb2coJ1NlbmRpbmcgaGVhcnRiZWF0Li4uJyk7XHJcbiAgICAgICAgICAgIHRoaXMucGFyZW50LnNlbmQoW25ldyBTZWN0aW9uKGhlYXJ0YmVhdENvZGVyLCAnW29iamVjdCBPYmplY3RdJyldKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMub24oJ29wZW4nLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHNlbmRIZWFydGJlYXQoKTtcclxuICAgICAgICAgICAgaGVhcnRiZWF0ID0gc2V0SW50ZXJ2YWwoc2VuZEhlYXJ0YmVhdCwgaW50ZXJ2YWwpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMub24oJ2Nsb3NlJywgKCkgPT4gY2xlYXJJbnRlcnZhbChoZWFydGJlYXQpKTtcclxuICAgICAgICB0aGlzLm9uKCdzZWN0aW9uJywgKHNlY3Rpb24pID0+IHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUgPT09ICdvcGVuZWQnICYmIGhlYXJ0YmVhdEFja0NvZGVyLmhhc0NvbnN0cnVjdGVkKHNlY3Rpb24pKSB7XHJcbiAgICAgICAgICAgICAgICBsb2coJ0hlYXJ0YmVhdCBBQ0sgcmVjZWl2ZWQuJyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwb3B1bGFyaXR5ID0gc2VjdGlvbi5kYXRhLnJlYWRJbnQzMkJFKDApO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vbk1lc3NhZ2Uoe1xyXG4gICAgICAgICAgICAgICAgICAgIGNtZDogJ1BPUFVMQVJJVFknLFxyXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY291bnQ6IHBvcHVsYXJpdHksXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgdHJhbnNmb3JtKGpzb24pIHsgcmV0dXJuIFtuZXcgU2VjdGlvbihkYXRhQ29kZXIsIGpzb24pXTsgfSAvLyBTZWN0aW9uQ29ubmVjdGlvbiBzZW5kcyBTZWN0aW9uW11cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBEYXRhQ29ubmVjdGlvbjtcclxuIl19