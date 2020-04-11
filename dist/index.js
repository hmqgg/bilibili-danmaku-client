"use strict";

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

/**
 * This file contains the class definition of DanmakuClient, the only API
 * open to applications.
 * The Wiki page 'DanmakuClient' contains more choreographed documentation,
 * see that instead.
 */
var EventEmitter = require('events');

var ApplicationConnection = require('./application');
/**
 * DanmakuClient is the only open API to applications.
 * Internally it is a thin wrap over ApplicationConnection, which provides a
 * more explicit control of the lifecycle and partial backwards compatibility
 * to the old version.
 * The lifecycle of DanmakuClient is as follows:
 * - Start from state 'idle'.
 * - 'idle' -> 'opening': On start().
 * - 'opening' -> 'opened': When connection is successfully opened. Emit event 'open'.
 *             -> 'closing': On terminate().
 *             -> 'closed': If the connection is closed by the server. Emit event 'close'.
 *             -> 'closed': If an error has occurred. Emit event 'close'. Emit event
 *                          'error' with the error.
 * - 'opened' -> 'closing': On terminate().
 *            -> 'closed': If the connection is closed by the server. Emit event 'close'.
 *            -> 'closed': If an error has occurred. Emit event 'close'. Emit event
 *                         'error' with the error.
 * - 'closing' -> 'closed': When connection is succefully closed. Emit event 'close'.
 * - End in state 'closed'.
 */


var DanmakuClient = /*#__PURE__*/function (_EventEmitter) {
  _inheritsLoose(DanmakuClient, _EventEmitter);

  /**
   * Construct a new DanmakuClient with the given Room id and options.
   * Note that the Room id must be the original Room id, that is, the short Room id
   * is not accepted.
   * For example, one of the official Live Rooms, https://live.bilibili.com/1,
   * uses the original Room id 5440. In this case, trying to connect to Room 1 would
   * not work properly, the correct way is to connect to Room 5440.
   * @param {Number} room The id of the Room to connect to.
   * @param {Object} [options] The options to pass to ApplicationConnection.
   *   Use this only when you know what you're doing.
   */
  function DanmakuClient(room, options) {
    var _this;

    _this = _EventEmitter.call(this) || this;
    _this.room = room;
    _this.options = options;
    _this.state = 'idle';
    return _this;
  }
  /**
   * Start the DanmakuClient.
   * This method is only available in state 'idle'. Otherwise nothing will happen.
   * Internally the underlying ApplicationConnection is not created before start(),
   * so this.connection will not be available then,
   */


  var _proto = DanmakuClient.prototype;

  _proto.start = function start() {
    var _this2 = this;

    if (this.state !== 'idle') return;
    this.connection = new ApplicationConnection(this.room, this.options);
    this.state = 'opening';
    this.connection.on('open', function () {
      _this2.state = 'opened';

      _this2.emit('open');
    });
    this.connection.on('error', function (err) {
      return _this2.emit('error', err);
    });
    this.connection.on('close', function () {
      _this2.state = 'closed';

      _this2.emit('close');
    });
    this.connection.on('message', function (event) {
      return _this2.emit('event', event);
    });
  }
  /**
   * Request closing of the DanmakuClient.
   * Note that this method will return immediately after requesting. The client will
   * be actually closed at time when the 'close' event is emitted.
   */
  ;

  _proto.terminate = function terminate() {
    if (this.state === 'opening' || this.state === 'opened') this.connection.close();
  };

  return DanmakuClient;
}(EventEmitter);

module.exports = DanmakuClient;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJFdmVudEVtaXR0ZXIiLCJyZXF1aXJlIiwiQXBwbGljYXRpb25Db25uZWN0aW9uIiwiRGFubWFrdUNsaWVudCIsInJvb20iLCJvcHRpb25zIiwic3RhdGUiLCJzdGFydCIsImNvbm5lY3Rpb24iLCJvbiIsImVtaXQiLCJlcnIiLCJldmVudCIsInRlcm1pbmF0ZSIsImNsb3NlIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBOzs7Ozs7QUFPQSxJQUFNQSxZQUFZLEdBQUdDLE9BQU8sQ0FBQyxRQUFELENBQTVCOztBQUVBLElBQU1DLHFCQUFxQixHQUFHRCxPQUFPLENBQUMsZUFBRCxDQUFyQztBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBb0JNRSxhOzs7QUFDRjs7Ozs7Ozs7Ozs7QUFXQSx5QkFBWUMsSUFBWixFQUFrQkMsT0FBbEIsRUFBMkI7QUFBQTs7QUFDdkI7QUFFQSxVQUFLRCxJQUFMLEdBQVlBLElBQVo7QUFDQSxVQUFLQyxPQUFMLEdBQWVBLE9BQWY7QUFDQSxVQUFLQyxLQUFMLEdBQWEsTUFBYjtBQUx1QjtBQU0xQjtBQUVEOzs7Ozs7Ozs7O1NBTUFDLEssR0FBQSxpQkFBUTtBQUFBOztBQUNKLFFBQUksS0FBS0QsS0FBTCxLQUFlLE1BQW5CLEVBQTJCO0FBQzNCLFNBQUtFLFVBQUwsR0FBa0IsSUFBSU4scUJBQUosQ0FBMEIsS0FBS0UsSUFBL0IsRUFBcUMsS0FBS0MsT0FBMUMsQ0FBbEI7QUFDQSxTQUFLQyxLQUFMLEdBQWEsU0FBYjtBQUNBLFNBQUtFLFVBQUwsQ0FBZ0JDLEVBQWhCLENBQW1CLE1BQW5CLEVBQTJCLFlBQU07QUFDN0IsTUFBQSxNQUFJLENBQUNILEtBQUwsR0FBYSxRQUFiOztBQUNBLE1BQUEsTUFBSSxDQUFDSSxJQUFMLENBQVUsTUFBVjtBQUNILEtBSEQ7QUFJQSxTQUFLRixVQUFMLENBQWdCQyxFQUFoQixDQUFtQixPQUFuQixFQUE0QixVQUFBRSxHQUFHO0FBQUEsYUFBSSxNQUFJLENBQUNELElBQUwsQ0FBVSxPQUFWLEVBQW1CQyxHQUFuQixDQUFKO0FBQUEsS0FBL0I7QUFDQSxTQUFLSCxVQUFMLENBQWdCQyxFQUFoQixDQUFtQixPQUFuQixFQUE0QixZQUFNO0FBQzlCLE1BQUEsTUFBSSxDQUFDSCxLQUFMLEdBQWEsUUFBYjs7QUFDQSxNQUFBLE1BQUksQ0FBQ0ksSUFBTCxDQUFVLE9BQVY7QUFDSCxLQUhEO0FBSUEsU0FBS0YsVUFBTCxDQUFnQkMsRUFBaEIsQ0FBbUIsU0FBbkIsRUFBOEIsVUFBQUcsS0FBSztBQUFBLGFBQUksTUFBSSxDQUFDRixJQUFMLENBQVUsT0FBVixFQUFtQkUsS0FBbkIsQ0FBSjtBQUFBLEtBQW5DO0FBQ0g7QUFFRDs7Ozs7OztTQUtBQyxTLEdBQUEscUJBQVk7QUFDUixRQUFJLEtBQUtQLEtBQUwsS0FBZSxTQUFmLElBQTRCLEtBQUtBLEtBQUwsS0FBZSxRQUEvQyxFQUF5RCxLQUFLRSxVQUFMLENBQWdCTSxLQUFoQjtBQUM1RCxHOzs7RUFqRHVCZCxZOztBQW9ENUJlLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQmIsYUFBakIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogVGhpcyBmaWxlIGNvbnRhaW5zIHRoZSBjbGFzcyBkZWZpbml0aW9uIG9mIERhbm1ha3VDbGllbnQsIHRoZSBvbmx5IEFQSVxyXG4gKiBvcGVuIHRvIGFwcGxpY2F0aW9ucy5cclxuICogVGhlIFdpa2kgcGFnZSAnRGFubWFrdUNsaWVudCcgY29udGFpbnMgbW9yZSBjaG9yZW9ncmFwaGVkIGRvY3VtZW50YXRpb24sXHJcbiAqIHNlZSB0aGF0IGluc3RlYWQuXHJcbiAqL1xyXG5cclxuY29uc3QgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJyk7XHJcblxyXG5jb25zdCBBcHBsaWNhdGlvbkNvbm5lY3Rpb24gPSByZXF1aXJlKCcuL2FwcGxpY2F0aW9uJyk7XHJcblxyXG4vKipcclxuICogRGFubWFrdUNsaWVudCBpcyB0aGUgb25seSBvcGVuIEFQSSB0byBhcHBsaWNhdGlvbnMuXHJcbiAqIEludGVybmFsbHkgaXQgaXMgYSB0aGluIHdyYXAgb3ZlciBBcHBsaWNhdGlvbkNvbm5lY3Rpb24sIHdoaWNoIHByb3ZpZGVzIGFcclxuICogbW9yZSBleHBsaWNpdCBjb250cm9sIG9mIHRoZSBsaWZlY3ljbGUgYW5kIHBhcnRpYWwgYmFja3dhcmRzIGNvbXBhdGliaWxpdHlcclxuICogdG8gdGhlIG9sZCB2ZXJzaW9uLlxyXG4gKiBUaGUgbGlmZWN5Y2xlIG9mIERhbm1ha3VDbGllbnQgaXMgYXMgZm9sbG93czpcclxuICogLSBTdGFydCBmcm9tIHN0YXRlICdpZGxlJy5cclxuICogLSAnaWRsZScgLT4gJ29wZW5pbmcnOiBPbiBzdGFydCgpLlxyXG4gKiAtICdvcGVuaW5nJyAtPiAnb3BlbmVkJzogV2hlbiBjb25uZWN0aW9uIGlzIHN1Y2Nlc3NmdWxseSBvcGVuZWQuIEVtaXQgZXZlbnQgJ29wZW4nLlxyXG4gKiAgICAgICAgICAgICAtPiAnY2xvc2luZyc6IE9uIHRlcm1pbmF0ZSgpLlxyXG4gKiAgICAgICAgICAgICAtPiAnY2xvc2VkJzogSWYgdGhlIGNvbm5lY3Rpb24gaXMgY2xvc2VkIGJ5IHRoZSBzZXJ2ZXIuIEVtaXQgZXZlbnQgJ2Nsb3NlJy5cclxuICogICAgICAgICAgICAgLT4gJ2Nsb3NlZCc6IElmIGFuIGVycm9yIGhhcyBvY2N1cnJlZC4gRW1pdCBldmVudCAnY2xvc2UnLiBFbWl0IGV2ZW50XHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAnZXJyb3InIHdpdGggdGhlIGVycm9yLlxyXG4gKiAtICdvcGVuZWQnIC0+ICdjbG9zaW5nJzogT24gdGVybWluYXRlKCkuXHJcbiAqICAgICAgICAgICAgLT4gJ2Nsb3NlZCc6IElmIHRoZSBjb25uZWN0aW9uIGlzIGNsb3NlZCBieSB0aGUgc2VydmVyLiBFbWl0IGV2ZW50ICdjbG9zZScuXHJcbiAqICAgICAgICAgICAgLT4gJ2Nsb3NlZCc6IElmIGFuIGVycm9yIGhhcyBvY2N1cnJlZC4gRW1pdCBldmVudCAnY2xvc2UnLiBFbWl0IGV2ZW50XHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICdlcnJvcicgd2l0aCB0aGUgZXJyb3IuXHJcbiAqIC0gJ2Nsb3NpbmcnIC0+ICdjbG9zZWQnOiBXaGVuIGNvbm5lY3Rpb24gaXMgc3VjY2VmdWxseSBjbG9zZWQuIEVtaXQgZXZlbnQgJ2Nsb3NlJy5cclxuICogLSBFbmQgaW4gc3RhdGUgJ2Nsb3NlZCcuXHJcbiAqL1xyXG5jbGFzcyBEYW5tYWt1Q2xpZW50IGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcclxuICAgIC8qKlxyXG4gICAgICogQ29uc3RydWN0IGEgbmV3IERhbm1ha3VDbGllbnQgd2l0aCB0aGUgZ2l2ZW4gUm9vbSBpZCBhbmQgb3B0aW9ucy5cclxuICAgICAqIE5vdGUgdGhhdCB0aGUgUm9vbSBpZCBtdXN0IGJlIHRoZSBvcmlnaW5hbCBSb29tIGlkLCB0aGF0IGlzLCB0aGUgc2hvcnQgUm9vbSBpZFxyXG4gICAgICogaXMgbm90IGFjY2VwdGVkLlxyXG4gICAgICogRm9yIGV4YW1wbGUsIG9uZSBvZiB0aGUgb2ZmaWNpYWwgTGl2ZSBSb29tcywgaHR0cHM6Ly9saXZlLmJpbGliaWxpLmNvbS8xLFxyXG4gICAgICogdXNlcyB0aGUgb3JpZ2luYWwgUm9vbSBpZCA1NDQwLiBJbiB0aGlzIGNhc2UsIHRyeWluZyB0byBjb25uZWN0IHRvIFJvb20gMSB3b3VsZFxyXG4gICAgICogbm90IHdvcmsgcHJvcGVybHksIHRoZSBjb3JyZWN0IHdheSBpcyB0byBjb25uZWN0IHRvIFJvb20gNTQ0MC5cclxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSByb29tIFRoZSBpZCBvZiB0aGUgUm9vbSB0byBjb25uZWN0IHRvLlxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBUaGUgb3B0aW9ucyB0byBwYXNzIHRvIEFwcGxpY2F0aW9uQ29ubmVjdGlvbi5cclxuICAgICAqICAgVXNlIHRoaXMgb25seSB3aGVuIHlvdSBrbm93IHdoYXQgeW91J3JlIGRvaW5nLlxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3Rvcihyb29tLCBvcHRpb25zKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuXHJcbiAgICAgICAgdGhpcy5yb29tID0gcm9vbTtcclxuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xyXG4gICAgICAgIHRoaXMuc3RhdGUgPSAnaWRsZSc7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTdGFydCB0aGUgRGFubWFrdUNsaWVudC5cclxuICAgICAqIFRoaXMgbWV0aG9kIGlzIG9ubHkgYXZhaWxhYmxlIGluIHN0YXRlICdpZGxlJy4gT3RoZXJ3aXNlIG5vdGhpbmcgd2lsbCBoYXBwZW4uXHJcbiAgICAgKiBJbnRlcm5hbGx5IHRoZSB1bmRlcmx5aW5nIEFwcGxpY2F0aW9uQ29ubmVjdGlvbiBpcyBub3QgY3JlYXRlZCBiZWZvcmUgc3RhcnQoKSxcclxuICAgICAqIHNvIHRoaXMuY29ubmVjdGlvbiB3aWxsIG5vdCBiZSBhdmFpbGFibGUgdGhlbixcclxuICAgICAqL1xyXG4gICAgc3RhcnQoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgIT09ICdpZGxlJykgcmV0dXJuO1xyXG4gICAgICAgIHRoaXMuY29ubmVjdGlvbiA9IG5ldyBBcHBsaWNhdGlvbkNvbm5lY3Rpb24odGhpcy5yb29tLCB0aGlzLm9wdGlvbnMpO1xyXG4gICAgICAgIHRoaXMuc3RhdGUgPSAnb3BlbmluZyc7XHJcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uLm9uKCdvcGVuJywgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gJ29wZW5lZCc7XHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnb3BlbicpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuY29ubmVjdGlvbi5vbignZXJyb3InLCBlcnIgPT4gdGhpcy5lbWl0KCdlcnJvcicsIGVycikpO1xyXG4gICAgICAgIHRoaXMuY29ubmVjdGlvbi5vbignY2xvc2UnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSAnY2xvc2VkJztcclxuICAgICAgICAgICAgdGhpcy5lbWl0KCdjbG9zZScpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuY29ubmVjdGlvbi5vbignbWVzc2FnZScsIGV2ZW50ID0+IHRoaXMuZW1pdCgnZXZlbnQnLCBldmVudCkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVxdWVzdCBjbG9zaW5nIG9mIHRoZSBEYW5tYWt1Q2xpZW50LlxyXG4gICAgICogTm90ZSB0aGF0IHRoaXMgbWV0aG9kIHdpbGwgcmV0dXJuIGltbWVkaWF0ZWx5IGFmdGVyIHJlcXVlc3RpbmcuIFRoZSBjbGllbnQgd2lsbFxyXG4gICAgICogYmUgYWN0dWFsbHkgY2xvc2VkIGF0IHRpbWUgd2hlbiB0aGUgJ2Nsb3NlJyBldmVudCBpcyBlbWl0dGVkLlxyXG4gICAgICovXHJcbiAgICB0ZXJtaW5hdGUoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgPT09ICdvcGVuaW5nJyB8fCB0aGlzLnN0YXRlID09PSAnb3BlbmVkJykgdGhpcy5jb25uZWN0aW9uLmNsb3NlKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRGFubWFrdUNsaWVudDtcclxuIl19