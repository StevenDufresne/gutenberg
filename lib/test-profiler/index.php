<?php
/**
 * Add custom admin menu page
 */
add_action('admin_menu', function () {
	add_menu_page(
		'My Custom Page',
		'Profile Test Page',
		'manage_options',
		'my-custom-page',
		'my_custom_page_html',
		'dashicons-admin-generic',
		20
	);
});

/**
 * Render the custom admin page HTML
 */
function my_custom_page_html() {
	// Check user capabilities
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	// Output admin page markup
	echo '<div class="wrap">';
	echo '<h1>My Custom Admin Page</h1>';
	echo '<div id="root"></div>';
	echo '</div>';
}

/**
 * Enqueue scripts for the custom admin page
 */
add_action('admin_enqueue_scripts', function ( $hook ) {
	// Only load script on our specific page
	if ( $hook !== 'toplevel_page_my-custom-page' ) {
		return;
	}

	wp_enqueue_script(
		'my-custom-js',
		plugin_dir_url( __FILE__ ) . '/dist/script.umd.js',
		[],
		false,
		true
	);
});