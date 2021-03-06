'use strict';

// Modules
const _ = require('lodash');

// Builder
module.exports = {
  name: 'nginx',
  config: {
    version: '1.17',
    supported: ['1.14', '1.16', '1.17', '1.18'],
    legacy: ['1.14'],
    pinPairs: {
      '1.18': 'bitnami/nginx:1.18.0-debian-10-r28',
      '1.17': 'bitnami/nginx:1.17.10-debian-10-r52',
      '1.16': 'bitnami/nginx:1.16.1-debian-10-r106',
      '1.14': 'bitnami/nginx:1.14.2-r125',
    },
    patchesSupported: true,
    confSrc: __dirname,
    defaultFiles: {
      params: 'fastcgi_params',
      server: 'nginx.conf',
      vhosts: 'default.conf.tpl',
    },
    remoteFiles: {
      params: '/opt/bitnami/nginx/conf/fastcgi_params',
      server: '/opt/bitnami/nginx/conf/nginx.conf',
      vhosts: '/opt/bitnami/nginx/conf/lando.conf',
    },
    ssl: false,
    webroot: '.',
  },
  parent: '_webserver',
  builder: (parent, config) => class LandoNginx extends parent {
    constructor(id, options = {}) {
      options = _.merge({}, config, options);

      // Use different default for ssl
      if (options.ssl) options.defaultFiles.vhosts = 'default-ssl.conf.tpl';

      // If we are using the older 1.14 version we need different remote locations
      if (options.version === '1.14') {
        options.remoteFiles = _.merge({}, options.remoteFiles, {
          server: '/opt/bitnami/extra/nginx/templates/nginx.conf.tpl',
          vhosts: '/opt/bitnami/extra/nginx/templates/default.conf.tpl',
        });
        options.defaultFiles = _.merge({}, options.defaultFiles, {server: 'nginx.conf.tpl'});
      }

      // Build the default stuff here
      const nginx = {
        image: `bitnami/nginx:${options.version}`,
        command: `/launch.sh ${options.remoteFiles.vhosts}`,
        environment: {
          NGINX_HTTP_PORT_NUMBER: '80',
          NGINX_DAEMON_USER: 'root',
          NGINX_DAEMON_GROUP: 'root',
          LANDO_NEEDS_EXEC: 'DOEEET',
        },
        ports: ['80'],
        user: 'root',
        volumes: [
          `${options.confDest}/launch.sh:/launch.sh`,
          `${options.confDest}/${options.defaultFiles.params}:${options.remoteFiles.params}`,
          `${options.confDest}/${options.defaultFiles.vhosts}:${options.remoteFiles.vhosts}:ro`,
          `${options.confDest}/${options.defaultFiles.server}:${options.remoteFiles.server}`,
        ],
      };

      // Send it downstream
      super(id, options, {services: _.set({}, options.name, nginx)});
    };
  },
};
