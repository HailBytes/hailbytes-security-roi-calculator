<?php
/**
 * Uninstall script for HailBytes Security Training ROI Calculator
 * 
 * This file runs when the plugin is deleted from the WordPress admin.
 * It cleans up all plugin data including database tables and options.
 */

// If uninstall not called from WordPress, exit
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// Check if user has permission to delete plugins
if (!current_user_can('delete_plugins')) {
    exit;
}

/**
 * Remove plugin database tables
 */
function hailbytes_roi_remove_database_tables() {
    global $wpdb;
    
    $table_name = $wpdb->prefix . 'hailbytes_roi_calculations';
    
    // Drop the calculations table
    $wpdb->query("DROP TABLE IF EXISTS {$table_name}");
    
    // Remove database version option
    delete_option('hailbytes_roi_db_version');
}

/**
 * Remove plugin options
 */
function hailbytes_roi_remove_options() {
    // Remove plugin options
    delete_option('hailbytes_roi_options');
    delete_option('hailbytes_roi_version');
    delete_option('hailbytes_roi_activation_date');
    
    // Remove any cached data
    wp_cache_delete('hailbytes_roi_industry_benchmarks');
    wp_cache_delete('hailbytes_roi_calculation_stats');
}

/**
 * Remove user meta data related to plugin
 */
function hailbytes_roi_remove_user_meta() {
    global $wpdb;
    
    // Remove user meta related to plugin
    $wpdb->query("DELETE FROM {$wpdb->usermeta} WHERE meta_key LIKE 'hailbytes_roi_%'");
}

/**
 * Remove transients
 */
function hailbytes_roi_remove_transients() {
    global $wpdb;
    
    // Remove plugin-specific transients
    $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_hailbytes_roi_%'");
    $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_timeout_hailbytes_roi_%'");
}

/**
 * Remove scheduled events
 */
function hailbytes_roi_remove_scheduled_events() {
    // Remove any scheduled cron events
    wp_clear_scheduled_hook('hailbytes_roi_cleanup_old_calculations');
    wp_clear_scheduled_hook('hailbytes_roi_send_usage_stats');
}

/**
 * Clean up uploaded files (if any)
 */
function hailbytes_roi_remove_uploaded_files() {
    $upload_dir = wp_upload_dir();
    $plugin_upload_dir = $upload_dir['basedir'] . '/hailbytes-roi-calculator';
    
    if (is_dir($plugin_upload_dir)) {
        // Remove directory and all contents
        hailbytes_roi_remove_directory($plugin_upload_dir);
    }
}

/**
 * Recursively remove directory and contents
 */
function hailbytes_roi_remove_directory($dir) {
    if (!is_dir($dir)) {
        return false;
    }
    
    $files = array_diff(scandir($dir), array('.', '..'));
    
    foreach ($files as $file) {
        $path = $dir . DIRECTORY_SEPARATOR . $file;
        is_dir($path) ? hailbytes_roi_remove_directory($path) : unlink($path);
    }
    
    return rmdir($dir);
}

/**
 * Log uninstallation for debugging (optional)
 */
function hailbytes_roi_log_uninstall() {
    if (defined('WP_DEBUG') && WP_DEBUG) {
        error_log('HailBytes Security ROI Calculator: Plugin uninstalled on ' . current_time('mysql'));
    }
}

/**
 * Send anonymized uninstall feedback (optional)
 * Only sends if user has opted in to usage tracking
 */
function hailbytes_roi_send_uninstall_feedback() {
    $options = get_option('hailbytes_roi_options', array());
    
    if (isset($options['send_usage_stats']) && $options['send_usage_stats']) {
        $data = array(
            'action' => 'uninstall',
            'version' => '1.0.0',
            'site_url' => home_url(),
            'wp_version' => get_bloginfo('version'),
            'php_version' => PHP_VERSION,
            'uninstall_date' => current_time('mysql')
        );
        
        // Send anonymized data to help improve the plugin
        wp_remote_post('https://hailbytes.com/api/plugin-feedback', array(
            'body' => $data,
            'timeout' => 5,
            'blocking' => false,
            'headers' => array(
                'User-Agent' => 'HailBytes-ROI-Calculator/1.0.0; ' . home_url()
            )
        ));
    }
}

/**
 * Main uninstall function
 */
function hailbytes_roi_uninstall() {
    // Log the uninstall attempt
    hailbytes_roi_log_uninstall();
    
    // Send feedback if enabled
    hailbytes_roi_send_uninstall_feedback();
    
    // Remove database tables
    hailbytes_roi_remove_database_tables();
    
    // Remove plugin options
    hailbytes_roi_remove_options();
    
    // Remove user meta data
    hailbytes_roi_remove_user_meta();
    
    // Remove transients
    hailbytes_roi_remove_transients();
    
    // Remove scheduled events
    hailbytes_roi_remove_scheduled_events();
    
    // Remove uploaded files
    hailbytes_roi_remove_uploaded_files();
    
    // Clear any remaining cache
    if (function_exists('wp_cache_flush')) {
        wp_cache_flush();
    }
    
    // Clear rewrite rules
    flush_rewrite_rules();
}

// Execute uninstall
hailbytes_roi_uninstall();