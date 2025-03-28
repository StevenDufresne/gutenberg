// src/Example.jsx
import { DataViews } from '../../packages/dataviews';
import { edit } from '@wordpress/icons';
import React, { Profiler } from 'react';

// --- Mock for i18n ---
// In a real WP environment, this comes from '@wordpress/i18n' and handles translations
const __ = ( text, domain ) => {
	// console.log(`i18n: [${domain || 'default'}] "${text}"`); // Optional: log translation calls
	return text;
};
// --- End Mock ---

const generateFakeData = ( count ) => {
	const statuses = [
		'draft',
		'future',
		'‰pending',
		'private',
		'publish',
		'trash',
	];
	return Array.from( { length: count }, ( _, i ) => ( {
		id: i + 1,
		title: `Title ${ i + 1 }`,
		author: i % 2 === 0 ? 'Admin' : 'User',
		date: new Date( 2023, i % 12, ( i % 28 ) + 1 ).toISOString(),
		status: statuses[ i % statuses.length ],
	} ) );
};


const onRender = (
	id,
	phase,
	actualDuration,
	baseDuration,
	startTime,
	commitTime
) => {
	// Track cumulative render times
	window.renderMetrics = window.renderMetrics || {
		totalRenderTime: 0,
		renderCount: 0
	};

	window.renderMetrics.totalRenderTime += actualDuration;
	window.renderMetrics.renderCount++;

	// Calculate average render time
	const averageRenderTime = 
		window.renderMetrics.totalRenderTime / window.renderMetrics.renderCount;

	console.log('Render Metrics:', {
		id,
		phase,
		actualDuration,
		baseDuration,
		startTime,
		commitTime,
		averageRenderTime,
		totalRenderDuration: window.renderMetrics.totalRenderTime,
		totalRenderCount: window.renderMetrics.renderCount
	});
};

const data = generateFakeData( 50 );

const Example = () => {

	console.log('Rendering <Example />');

	const STATUSES = [
		{ value: 'draft', label: __( 'Draft' ) },
		{ value: 'future', label: __( 'Scheduled' ) },
		{ value: 'pending', label: __( 'Pending Review' ) },
		{ value: 'private', label: __( 'Private' ) },
		{ value: 'publish', label: __( 'Published' ) },
		{ value: 'trash', label: __( 'Trash' ) },
	];

	const fields = [
		{
			id: 'title',
			header: __( 'Title' ), // Use header for column title
			enableHiding: false,
			// Default rendering works for simple properties
		},
		{
			id: 'date',
			header: __( 'Date' ),
			render: ( { item } ) => (
				<time dateTime={ item.date }>
					{ new Date( item.date ).toLocaleDateString() }
				</time>
			),
		},
		{
			id: 'author',
			header: __( 'Author' ),
			render: ( { item } ) => <a href="#">{ item.author }</a>,
			elements: [
				// Used for filtering usually
				{ value: 'Admin', label: 'Admin' },
				{ value: 'User', label: 'User' },
			],
			filterBy: {
				// Define how filtering works for this field
				type: 'enum',
				operators: [ 'is', 'isNot' ],
			},
			enableSorting: true, // Let's allow sorting by author
		},
		{
			id: 'status',
			header: __( 'Status' ),
			// Render based on STATUSES lookup
			render: ( { item } ) =>
				STATUSES.find( ( { value } ) => value === item.status )
					?.label ?? item.status,
			elements: STATUSES, // Provide elements for filtering
			filterBy: {
				// Define how filtering works for this field
				type: 'enum',
				operators: [ 'isAny', 'isNone' ], // Common operators for multi-select
			},
			enableSorting: false, // Keep sorting disabled for status maybe
		},
	];

	const actions = [
		{
			id: 'edit',
			label: __( 'Edit' ),
			icon: edit, // Pass the icon component/data directly
			callback: ( items ) => console.log( 'Editing:', items ),
			supportsBulk: true,
			isEligible: () => true,
		},
	];

	const view = {
		type: 'table',
		search: '',
		filters: [],
		page: 1,
		perPage: 1000, // Increased perPage slightly
		sort: {
			field: 'date',
			direction: 'desc',
		},
		fields: [ 'title', 'author', 'status' ],
		// No need for titleField here, it's inferred or set in fields
		// titleField: "title",
		// Removed layout: {}, use defaultLayouts instead if needed for specific view types
	} 

	const paginationInfo = {
		totalItems: data.length,
		totalPages: Math.ceil( data.length / view.perPage ),
	};

	// Data might need pagination/sorting/filtering applied *before* passing
	// For simplicity here, DataViews might handle some of this internally based on `view` prop,
	// but often you'd apply it here based on `view.page`, `view.perPage`, `view.sort`, `view.filters`
	// Example (basic pagination):
	const startIndex = ( view.page - 1 ) * view.perPage;
	const endIndex = startIndex + view.perPage;
	const paginatedData = data.slice( startIndex, endIndex );
	// Add sorting/filtering logic here if needed

	return (
		// Wrap the part you want to profile
		<Profiler id="DataViewsComponent" onRender={ onRender }>
			<div style={ { padding: '20px' } }>
				{ ' ' }
				{ /* Add some padding */ }
				<h1>DataViews Profiler Test</h1>
				<DataViews
					data={ paginatedData } // Pass potentially filtered/sorted/paginated data
					fields={ fields }
					view={ view } // Pass the state variable
					actions={ actions }
					paginationInfo={ paginationInfo } // Pass pagination state
					// onSelectionChange={(selectedItems) => console.log('Selection:', selectedItems)} // Optional: handle selection
				/>
			</div>
		</Profiler>
	);
};

// Removed the DOMContentLoaded logic as it's handled by src/main.jsx


if (typeof window !== 'undefined') {
    document.addEventListener("DOMContentLoaded", function () {
        const container = document.getElementById("root");
        if (container) {
            import('@wordpress/element').then(({ createRoot }) => {
                const root = createRoot(container);

                root.render(<Example />);
            });
        }
    });
}
