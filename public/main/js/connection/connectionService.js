angular.module('connection')
  .service('connectionService', ["$q", "$rootScope", "$log", "httpService", "userService", "locationService", "pubsub", "pubsubSubscriber", "pubsubEvent",
    function($q, $rootScope, $log, httpService, userService, locationService, pubsub, pubsubSubscriber, pubsubEvent) {
      var self = this,
        socket;

      self.getConnection = function() {
        var i, deferred = $q.defer();
        httpService.get({
          url: window.location.href.replace(/\/home.*/, "") + "/connection"
        }).then(function(data) {
          userService.connected = true

          for (var i in data) {
            if (data.hasOwnProperty(i)) {
              userService[i] = data[i];
            }
          }

          userService.displayName = data.displayName || data.username || data.email;
          userService.link = window.location.origin + "/a/" + data.link;

          socket = io({
            query: 'token=' + data.token
          });
          socket.on('message', function(data) {
            $log.info("message received", data);

            if (data.type === "call") {
              if (data.action === "start") {
                pubsub.publish({
                  publisher: pubsubSubscriber.connection_service,
                  subscriber: pubsubSubscriber.call_fsm,
                  event: pubsubEvent.on_incoming_call_notify,
                  msg: {
                    from: data.from,
                    fromPhoto: data.fromPhoto,
                    fromType: data.fromType,
                    // TODO who is adding second data object in message
                    remoteSdp: data.data.msg.sdp,
                    callId: data.data.msg.callId
                  }
                });
              } else if (data.action === "answer") {
                pubsub.publish({
                  publisher: pubsubSubscriber.connection_service,
                  subscriber: pubsubSubscriber.call_fsm,
                  event: pubsubEvent.call_answered_notify,
                  msg: {
                    from: data.from,
                    // TODO who is adding second data object in message
                    sdp: data.data.msg.sdp,
                    callId: data.data.msg.callId
                  }
                });
              } else if (data.action === "accept") {
                pubsub.publish({
                  publisher: pubsubSubscriber.connection_service,
                  subscriber: pubsubSubscriber.call_fsm,
                  event: pubsubEvent.call_accepted_notify,
                  msg: {
                    callId: data.data.msg.callId
                  }
                });
              } else if (data.action === "candidate") {
                pubsub.publish({
                  publisher: pubsubSubscriber.connection_service,
                  subscriber: pubsubSubscriber.peer_service,
                  event: pubsubEvent.ice_candidate_notify,
                  msg: {
                    candidate: data.data.msg.candidate,
                    callId: data.data.msg.callId
                  }
                });
              } else if (data.action === "end") {
                pubsub.publish({
                  publisher: pubsubSubscriber.connection_service,
                  subscriber: pubsubSubscriber.call_fsm,
                  event: pubsubEvent.call_end_notify,
                  msg: {
                    callId: data.data.msg.callId
                  }
                });
              }
            }
          });

          socket.on('session', function(data) {
            userService.socketId = data.id;
            deferred.resolve();
          });

          socket.on('disconnect', function() {
            socket.disconnect();
            socket = null;
            userService.connected = false;
            locationService.toLogin();
          });
        });

        return deferred.promise;
      };

      self.sendMessage = function() {
        socket.emit('message', {
          to: "test2@test.com",
          text: "hey you!"
        });
      };
    }
  ]);
