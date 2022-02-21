
const errors = require('@feathersjs/errors');

module.exports = getUserData;

function getUserData (data, checks = []) {
  if (Array.isArray(data) ? data.length === 0 : data.total === 0) {
    throw new errors.BadRequest('User not found.',
      { errors: { $className: 'badParams' } });
  }

  const users = Array.isArray(data) ? data : data.data || [ data ];
  const user = users[0];

  if (users.length !== 1) {
    throw new errors.BadRequest('More than 1 user selected.',
      { errors: { $className: 'badParams' } });
  }

  if (checks.includes('isNotVerified') && user.isVerified) {
    throw new errors.BadRequest('用户已通过验证.',
      { errors: { $className: 'isNotVerified' } });
  }

  if (checks.includes('isNotVerifiedOrHasVerifyChanges') &&
    user.isVerified && !Object.keys(user.verifyChanges || {}).length
  ) {
    throw new errors.BadRequest('用户已通过验证且没有需要验证的更新.',
      { errors: { $className: 'nothingToVerify' } });
  }

  if (checks.includes('isNotGenericVerifiedOrHasVerifyChanges') &&
    user.isGenericVerified && !Object.keys(user.verifyChanges || {}).length
  ) {
    throw new errors.BadRequest('用户验证码已验证且没有需要验证的更新.',
      { errors: { $className: 'nothingGenericToVerify' } });
  }

  if (checks.includes('isVerified') && !user.isVerified) {
    throw new errors.BadRequest('用户没有验证.',
      { errors: { $className: 'isVerified' } });
  }

  if (checks.includes('isGenericVerified') && !user.isGenericVerified) {
    throw new errors.BadRequest('用户验证码没有验证.',
      { errors: { $className: 'isGenericVerified' } });
  }

  if (checks.includes('verifyNotExpired') && user.verifyExpires < Date.now()) {
    throw new errors.BadRequest('验证码已过期.',
      { errors: { $className: 'verifyExpired' } });
  }

  if (checks.includes('resetNotExpired') && user.resetExpires < Date.now()) {
    throw new errors.BadRequest('密码重置验证码已过期.',
      { errors: { $className: 'resetExpired' } });
  }

  if (checks.includes('isNotGenericVerified') && user.isGenericVerified) {
    throw new errors.BadRequest('验证码已被使用.',
      { errors: { $className: 'isNotGenericVerified' } });
  }

  if (checks.includes('verifyNearExpiry') && user.verifyExpires > Date.now() + 1000 * 10 /*10 seconds*/) {
    throw new errors.BadRequest('不能频繁获取验证码.',
      { errors: { $className: 'verifyExpired' } });
  }
  return user;
}
