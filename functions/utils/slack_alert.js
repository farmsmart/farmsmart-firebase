const { WebClient } = require('@slack/web-api');
const functions = require('firebase-functions');

const channel = '#farmsmart-alerts';

function post(message) {
  const token = functions.config().farmsmart.slack.api.token;
  const web = new WebClient(token);

  return web.chat.postMessage({ channel: channel, text: message }).catch(error => {
    throw new Error('Failed to post Slack message: ' + error);
  });
}

exports = module.exports = {
  post: post,
};
