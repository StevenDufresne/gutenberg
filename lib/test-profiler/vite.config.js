/**
 * External dependencies
 */
import process from 'process';

export default {
	build: {
		lib: {
			entry: 'script.jsx',
			name: 'MyAdminLibrary',
			fileName: 'script',
			formats: [ 'umd' ],
		},
		outDir: 'dist',
		minify: false,
		sourcemap: true,
		rollupOptions: {
			external: [ 'process' ], // Ensure `process` is handled as external
			output: {
				globals: {
					process: 'process', // Define `process` globally in the UMD bundle
				},
			},
		},
	},
	server: {
		watch: {
			usePolling: true, // useful for local development with certain setups (e.g., Docker)
		},
	},
	define: {
		process: JSON.stringify( process ), // Inject process polyfill
		'process.env.NODE_ENV': JSON.stringify( 'development' ),
	},
	optimizeDeps: {
		include: [
			'path-to-your-local-package', // include your local packages here
		],
	},
};
