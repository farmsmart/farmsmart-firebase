const slack = require('./slack_alert');
const { WebClient } = require('@slack/web-api');
const functions = require('firebase-functions');

jest.mock('@slack/web-api', () => ({ WebClient: jest.fn() }));
//Skip test currently ,TypeError - trying to access setter - verify with latest -g firebase-tools .

// jest.spyOn(functions, 'config').mockImplementation(() => ({
//   farmsmart: {
//     slack: {
//       api: {
//         token: '1234',
//       },
//     },
//   },
// }));

describe.skip('Slack Alert', () => {
  afterAll(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should post message to alerts channel', () => {
    const resolvePost = jest.fn(() => Promise.resolve());

    WebClient.mockImplementation(() => ({
      chat: {
        postMessage: resolvePost,
      },
    }));

    const msg = 'Hello World!';
    return slack.post(msg).then(() => {
      expect(resolvePost).toBeCalledWith(expect.objectContaining({ text: msg }));
    });
  });

  it('should throw error if post fails', () => {
    const errorMsg = 'Slack Fail';
    const rejectPost = jest.fn(() => Promise.reject(errorMsg));

    WebClient.mockImplementation(() => ({
      chat: {
        postMessage: rejectPost,
      },
    }));

    const msg = 'Hello World!';
    return slack.post(msg).catch(error => {
      console.log(error);
      expect(error.message).toEqual(expect.stringContaining(errorMsg));
    });
  });
});
