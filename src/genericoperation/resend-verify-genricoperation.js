
const makeDebug = require('debug');
const ensureObjPropsValid = require('../helpers/ensure-obj-props-valid');
const getLongToken = require('../helpers/get-long-token');
const getShortToken = require('../helpers/get-short-token');
const getUserData = require('../helpers/get-user-data');
const notifier = require('../helpers/notifier');

const debug = makeDebug('authLocalMgnt:resendVerifyGenericOperation');

// {email}, {cellphone}, {verifyToken}, {verifyShortToken},
// {email, cellphone, verifyToken, verifyShortToken}
module.exports = async function resendVerifyGenericOperation (options, identifyUser, opcode, notifierOptions) {
  debug('identifyUser=', identifyUser);
  const usersService = options.app.service(options.genericAuthService);
  const usersServiceIdName = usersService.id;

  ensureObjPropsValid(identifyUser,
    options.identifyGenericAuthUserProps
  );

  const users = await usersService.find({ query: identifyUser });
  const user1 = getUserData(users, ['verifyNearExpiry']);

  console.log('patch with opcode ', opcode);
  const user2 = await usersService.patch(user1[usersServiceIdName], {
    isGenericVerified: false,
    opcode: opcode,
    verifyExpires: Date.now() + options.delay,
    verifyToken: await getLongToken(options.longTokenLen),
    verifyShortToken: await getShortToken(options.shortTokenLen, options.shortTokenDigits)
  });

  const user3 = await notifier(options.notifier, 'verifyGenericOperation', user2, notifierOptions);
  return options.sanitizeUserForClient(user3);
};
