var logger = require('bunyan').createLogger({
    name: 'models.Connection'
  }),
  connections = {};

exports.add = function(key, value) {
  if (!connections[key]) {
    connections[key] = value;
  }
  logger.debug("conn model add %j k:%s v:%s", connections, key, value);
};

exports.get = function(key) {
  return connections[key];
  logger.debug("conn model get %j k:%s v:%s", connections, key, connections[key]);
};
