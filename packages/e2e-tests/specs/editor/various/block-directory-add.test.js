/**
 * WordPress dependencies
 */
import {
	createNewPost,
	searchForBlock,
	setUpResponseMocking,
	getEditedPostContent,
	switchEditorModeTo,
} from '@wordpress/e2e-test-utils';

// Urls to mock
const SEARCH_URL = `rest_route=${ encodeURIComponent( '/__experimental/block-directory/search' ) }`;
const INSTALL_URL = `rest_route=${ encodeURIComponent( '/__experimental/block-directory/install' ) }`;

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

// We need to optionally return a buffer (for the block js) so use local versions of getJSONResponse & createJSONResponse
export function getJSONResponse( obj, contentType ) {
	return {
		status: 200,
		contentType,
		body: obj,
	};
}

export function createJSONResponse( mockResponse, contentType = undefined ) {
	return async ( request ) => request.respond( getJSONResponse( mockResponse, contentType ) );
}

describe( 'adding blocks from block directory', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'Should show an empty state when no plugin is found.', async () => {
		// Be super weird so there won't be a matching block installed
		const impossibleBlockName = '@#$@@Dsdsdfw2#$@';

		// Return an empty list of plugins
		await setUpResponseMocking( [
			{
				match: ( request ) => request.url().includes( SEARCH_URL ),
				onRequestMatch: createJSONResponse( JSON.stringify( [] ) ),
			},
		] );

		// Search for the block via the inserter
		await searchForBlock( impossibleBlockName );

		const selectorContent = await page.evaluate( () => document.querySelector( '.block-editor-inserter__results' ).innerHTML );
		expect( selectorContent ).not.toContain( '.block-editor-block-types-list' );
	} );

	it( 'Should be able to add (the first) block.', async () => {
		// Setup our mocks
		await setUpResponseMocking( [
			{
				// Mock response for search with the block
				match: ( request ) => request.url().includes( SEARCH_URL ),
				onRequestMatch: createJSONResponse( JSON.stringify( [ mockBlock1, mockBlock2 ] ) ),
			},
			{
				// Mock response for install
				match: ( request ) => request.url().includes( INSTALL_URL ),
				onRequestMatch: createJSONResponse( JSON.stringify( true ) ),
			},
			{
				// Mock the response  response for the js asset once it gets injects
				match: ( request ) => request.url().includes( mockBlock1.assets[ 0 ] ),
				onRequestMatch: createJSONResponse( Buffer.from( block, 'utf8' ), 'application/javascript; charset=utf-8' ),
			},
		] );

		// Search for the block via the inserter
		await searchForBlock( mockBlock1.title );

		// Grab the first block in the list -> Needs to be the first one, the mock response expects it.
		const addBtn = await page.waitForSelector( '.block-directory-downloadable-blocks-list li:first-child button' );

		// Add the block
		await addBtn.click();

		// To be honest, not sure why this is necessary, but the getEditedPostContent returns empty without it.
		await switchEditorModeTo( 'Code' );

		// The block will auto select and get added, make sure we see it in the content
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
