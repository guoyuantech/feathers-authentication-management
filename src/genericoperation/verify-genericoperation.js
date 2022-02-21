const errors = require('@feathersjs/errors');
const makeDebug = require('debug');
const ensureObjPropsValid = require('../helpers/ensure-obj-props-valid');
const ensureValuesAreStrings = require('../helpers/ensure-values-are-strings');
const getUserData = require('../helpers/get-user-data');
const notifier = require('../helpers/notifier');

const debug = makeDebug('authLocalMgnt:verifyGenericOperation');

module.exports = {
  verifyGenericOperationWithLongToken,
  verifyGenericOperationWithShortToken
};

async function verifyGenericOperationWithLongToken (options, verifyToken, notifierOptions = {}) {
  ensureValuesAreStrings(verifyToken);

  const result = await verifyGenericOperation(options, { verifyToken }, { verifyToken }, notifierOptions);
  return result;
}

async function verifyGenericOperationWithShortToken (options, verifyShortToken, identifyUser, opcode = null, notifierOptions = {}) {
  ensureValuesAreStrings(verifyShortToken);
  console.log('identity user opcode', opcode);
  console.log(identifyUser);
  console.log(options.identifyGenericAuthUserProps);
  ensureObjPropsValid(identifyUser, options.identifyGenericAuthUserProps);

  const result = await verifyGenericOperation(options, identifyUser, { verifyShortToken, opcode }, notifierOptions);
  return result;
}

async function verifyGenericOperation (options, query, tokens, notifierOptions = {}) {
  debug('verifyGenericOperation', query, tokens);
  const usersService = options.app.service(options.genericAuthService);
  const usersServiceIdName = usersService.id;

  const users = await usersService.find({ query });
  const user1 = getUserData(users, ['isNotGenericVerifiedOrHasVerifyChanges', 'verifyNotExpired']);

  if (!Object.keys(tokens).every(key => tokens[key] === user1[key])) {
    throw new errors.BadRequest('验证码错误，请重新获取验证码',
      { errors: { $className: 'badParam' } }
    );
  }

  const user2 = await eraseVerifyGenericProps(user1, user1.verifyExpires > Date.now(), user1.verifyChanges || {});
  const user3 = await notifier(options.notifier, 'verifyGenericOperation', user2, notifierOptions);
  return options.sanitizeUserForClient(user3);

  async function eraseVerifyGenericProps (user, isGenericVerified, verifyChanges) {
    if (!isGenericVerified) {
      return;
    }

    const patchToUser = Object.assign({}, verifyChanges || {}, {
      isGenericVerified,
      opcode: null,
      verifyToken: null,
      verifyShortToken: null,
      verifyExpires: null,
      verifyChanges: {},
      isVerified: true // 单次验证通过，用户可以标记为已验证
    });

    const result = await usersService.patch(user[usersServiceIdName], patchToUser, {});
    return result;
  }
}
