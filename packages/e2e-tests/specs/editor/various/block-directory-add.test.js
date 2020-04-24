/**
 * WordPress dependencies
 */
import {
	createNewPost,
	searchForBlock,
	setUpResponseMocking,
	getEditedPostContent,
	getAllBlocks,
} from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import { enableExperimentalFeatures } from '../../../experimental-features';

// Urls to mock
const SEARCH_URLS = [
	'/__experimental/block-directory/search',
	`rest_route=${ encodeURIComponent(
		'/__experimental/block-directory/search'
	) }`,
];

const INSTALL_URLS = [
	'/__experimental/block-directory/install',
	`rest_route=${ encodeURIComponent(
		'/__experimental/block-directory/install'
	) }`,
];

// Example Blocks
const mockBlock1 = {
	name: 'block-directory-test-block/main-block',
	title: 'Block Directory Test Block',
	description: 'This plugin is useful for the block.',
	id: 'block-directory-test-block',
	rating: 0,
	rating_count: 0,
	active_installs: 0,
	author_block_rating: 0,
	author_block_count: 1,
	author: 'No Author',
	icon: 'block-default',
	assets: [
		'fake_url.com/block.js', // we will mock this
	],
	humanized_updated: '5 months ago',
};

const mockBlock2 = {
	...mockBlock1,
	name: 'block-directory-test-block/secondary-block',
	title: 'Block Directory Test Block - Pt Deux',
	id: 'block-directory-test-secondary-block',
};

// Block that will be registered
const block = `( function() {
	var registerBlockType = wp.blocks.registerBlockType;
	var el = wp.element.createElement;

	registerBlockType( '${ mockBlock1.name }', {
		title: 'Test Block for Block Directory',
		icon: 'hammer',
		category: 'common',
		attributes: {},
		edit: function( props ) {
			return el( 'p', null, 'Test Copy' );
		},
		save: function() {
			return null;
		},
	} );
} )();`;

function getResponseObject( obj, contentType ) {
	return {
		status: 200,
		contentType,
		body: obj,
	};
}
/* eslint no-console: 0 */
function createResponse( mockResponse, contentType = undefined ) {
	return async ( request ) => {
		console.log( request );

		request.respond( getResponseObject( mockResponse, contentType ) );
	};
}

const matchUrl = ( reqUrl, urls ) => {
	return urls.some( ( el ) => reqUrl.indexOf( el ) >= 0 );
};

describe( 'adding blocks from block directory', () => {
	beforeEach( async () => {
		await enableExperimentalFeatures( [ '#gutenberg-block-directory' ] );
		await createNewPost();
	} );

	it( 'Should show an empty state when no plugin is found.', async () => {
		// Be super weird so there won't be a matching block installed
		const impossibleBlockName = '@#$@@Dsdsdfw2#$@';

		// Return an empty list of plugins
		await setUpResponseMocking( [
			{
				match: ( request ) => matchUrl( request.url(), SEARCH_URLS ),
				onRequestMatch: createResponse( JSON.stringify( [] ) ),
			},
		] );

		// Search for the block via the inserter
		await searchForBlock( impossibleBlockName );

		const selectorContent = await page.evaluate(
			() =>
				document.querySelector( '.block-editor-inserter__block-list' )
					.innerHTML
		);
		expect( selectorContent ).toContain( 'has-no-results' );
	} );

	it( 'Should be able to add (the first) block.', async () => {
		// Setup our mocks
		await setUpResponseMocking( [
			{
				// Mock response for search with the block
				match: ( request ) => matchUrl( request.url(), SEARCH_URLS ),
				onRequestMatch: createResponse(
					JSON.stringify( [ mockBlock1, mockBlock2 ] )
				),
			},
			{
				// Mock response for install
				match: ( request ) => matchUrl( request.url(), INSTALL_URLS ),
				onRequestMatch: createResponse( JSON.stringify( true ) ),
			},
			{
				// Mock the response for the js asset once it gets injected
				match: ( request ) =>
					request.url().includes( mockBlock1.assets[ 0 ] ),
				onRequestMatch: createResponse(
					Buffer.from( block, 'utf8' ),
					'application/javascript; charset=utf-8'
				),
			},
		] );

		// Search for the block via the inserter
		await searchForBlock( mockBlock1.title );

		// Grab the first block in the list -> Needs to be the first one, the mock response expects it.
		const addBtn = await page.waitForSelector(
			'.block-directory-downloadable-blocks-list li:first-child button'
		);

		// Add the block
		await addBtn.click();

		console.log( await getEditedPostContent() );

		// To be honest, not sure why this is necessary, but the getEditedPostContent returns empty without querying wp.data first.
		await getAllBlocks();

		console.log( await getEditedPostContent() );

		// The block will auto select and get added, make sure we see it in the content
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );