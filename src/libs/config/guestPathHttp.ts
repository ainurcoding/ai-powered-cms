interface IGuestPathCfg {
	path: string
	/**
	 * set true jika ingin bypass pengecekan auth terhadap semua subpath nya
	 */
	withSubPath?: boolean

	/**
	 * list method yang di bypass, set array kosong jika berlaku ke semua method
	 */
	method: Array<'get' | 'post' | 'put' | 'delete' | 'patch'>
}

/**
 * List endpoint yang akan dilewati proses pengecekan auth jwt
 */
const guestPath: IGuestPathCfg[] = [
	{
		path: '/socket.io',
		withSubPath: true,
		method: []
	},
	{
		path: '/auth/login',
		method: ['post']
	},
	{
		path: '/',
		method: ['get']
	},
	{
		path: '/health',
		withSubPath: true,
		method: []
	},
	{
		path: '/docs',
		withSubPath: true,
		method: []
	},
	{
		path: '/json-api-docs',
		withSubPath: true,
		method: []
	},
	{
		// Public can view posts (GET only)
		path: '/posts',
		withSubPath: true,
		method: ['get']
	},
	{
		// Public can view categories
		path: '/categories',
		withSubPath: true,
		method: ['get']
	},
	{
		// Public can view tags
		path: '/tags',
		withSubPath: true,
		method: ['get']
	}
];

export default guestPath;
