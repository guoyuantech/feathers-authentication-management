import { SetRequired } from 'type-fest';

import checkUnique from '../check-unique';
import ensureHasAllKeys from '../helpers/ensure-has-all-keys';
import { DataCheckUnique, CheckUniqueOptions } from '../types';
import { AuthenticationManagementBase } from './AuthenticationManagementBase';
import { makeDefaultOptions } from './index';

export class CheckUniqueService extends AuthenticationManagementBase<DataCheckUnique, null> {
  options: CheckUniqueOptions;

  constructor (options: SetRequired<Partial<CheckUniqueOptions>, 'app'>) {
    super();
    ensureHasAllKeys(options, ['app'], this.constructor.name);
    const defaultOptions: Omit<CheckUniqueOptions, 'app'> = makeDefaultOptions(['service']);
    this.options = Object.assign(defaultOptions, options);
  }

  async _create (data: DataCheckUnique): Promise<null> {
    return await checkUnique(
      this.options,
      data.value,
      data.ownId,
      data.meta
    );
  }
}
