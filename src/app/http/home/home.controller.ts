import { TRequestFunction } from '@/libs/core';
import { APP_NAME, APP_VERSION } from '@/libs/config';

const home: TRequestFunction = async () => {
	return {
		result: { APP_NAME, APP_VERSION }
	};
};

export default {
	home
};

