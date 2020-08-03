const { WebClient } = require('@slack/web-api');
const functions = require('firebase-functions');

const channel = '#farmsmart-alerts';

function post(message) {
  let token;
  if (functions.config().farmsmart.slack === undefined) {
    token = '00XYZ00';
    console.log('Using dummy token,not picked from runtime config :' + token);
  } else {
    token = functions.config().farmsmart.slack.api.token;
    console.log('Using token from runtime config :' + token);
  }
  const web = new WebClient(token);

  return web.chat.postMessage({ channel: channel, text: message }).catch(error => {
    throw new Error('Failed to post Slack message: ' + error);
  });
}

exports = module.exports = {
  post: post,
};
