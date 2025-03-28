// src/Example.jsx
import { Button, Icon } from '@wordpress/components';
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


console.log('ok')
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

// Your onRender callback for the Profiler
const onRender = (
	id,
	phase,
	actualDuration,
	baseDuration,
	startTime,
	commitTime
) => {
	console.log( {
		id, // the "id" prop of the Profiler tree that has just committed
		phase, // "mount" (if the tree just mounted) or "update" (if it re-rendered)
		actualDuration, // time spent rendering the committed update
		baseDuration, // estimated time to render the entire subtree without memoization
		startTime, // when React began rendering this update
		commitTime, // when React committed this update
		// interactions // Set of interactions belonging to this update
	} );
};

const data = generateFakeData( 1000 ); // Using 1000 items as per your example

const Example = () => {
	// State for view - important for DataViews to be interactive
	const [ view, setView ] = React.useState( {
		type: 'table',
		search: '',
		filters: [],
		page: 1,
		perPage: 1000, // Increased perPage slightly
		sort: {
			field: 'date',
			direction: 'desc',
		},
		fields: [ 'author', 'status' ],
		// No need for titleField here, it's inferred or set in fields
		// titleField: "title",
		// Removed layout: {}, use defaultLayouts instead if needed for specific view types
	} );

	// State for pagination - This should update based on view changes
	const [ paginationInfo, setPaginationInfo ] = React.useState( {
		totalItems: data.length, // Use totalItems standardly
		totalPages: Math.ceil( data.length / view.perPage ),
	} );

	// Update pagination when view (especially perPage) changes
	React.useEffect( () => {
		setPaginationInfo( ( prev ) => ( {
			...prev,
			totalPages: Math.ceil( data.length / view.perPage ),
		} ) );
	}, [ view.perPage ] );

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

	// Callback when view state changes (sorting, filtering, pagination)
	const onChangeView = ( newView ) => {
		console.log( 'View changing:', newView );
		// You MUST update the state for the component to react
		setView( newView );
	};

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
					onChangeView={ onChangeView } // Pass the state setter callback
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
