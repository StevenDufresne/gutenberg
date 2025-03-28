<?php

add_action('admin_menu', function () {
    add_menu_page(
        'My Custom Page',      // Page title
        'Profile Test Page',         // Menu title
        'manage_options',      // Capability
        'my-custom-page',      // Menu slug
        'my_custom_page_html', // Callback function
        'dashicons-admin-generic', // Icon (optional)
        20                     // Position
    );
});

function my_custom_page_html() {
    if (!current_user_can('manage_options')) {
        return;
    }
    
    echo '<div class="wrap">';
    echo '<h1>My Custom Admin Page</h1>';
    echo '<div id="root"></div>';
    echo '</div>';
}

add_action('admin_enqueue_scripts', function ($hook) {
    if ($hook !== 'toplevel_page_my-custom-page') {
        return;
    }
    wp_enqueue_script('my-custom-js', plugin_dir_url(__FILE__) . '/dist/script.umd.js', [], false, true);
});