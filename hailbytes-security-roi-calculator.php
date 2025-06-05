<?php
/**
 * Plugin Name: HailBytes Security Training ROI Calculator
 * Plugin URI: https://hailbytes.com/security-training-roi-calculator
 * Description: Calculate return on investment for security awareness training programs and justify training budgets with comprehensive analytics.
 * Version: 1.0.0
 * Author: HailBytes
 * Author URI: https://hailbytes.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('HAILBYTES_ROI_VERSION', '1.0.0');
define('HAILBYTES_ROI_PLUGIN_URL', plugin_dir_url(__FILE__));
define('HAILBYTES_ROI_PLUGIN_PATH', plugin_dir_path(__FILE__));

/**
 * Main plugin class
 */
class HailBytesSecurityROI {
    
    public function __construct() {
        add_action('init', array($this, 'init'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_shortcode('security_training_roi_calculator', array($this, 'roi_calculator_shortcode'));
        add_action('wp_ajax_calculate_security_roi', array($this, 'ajax_calculate_roi'));
        add_action('wp_ajax_nopriv_calculate_security_roi', array($this, 'ajax_calculate_roi'));
        register_activation_hook(__FILE__, array($this, 'activate'));
    }
    
    public function init() {
        // Plugin initialization
    }
    
    public function enqueue_scripts() {
        global $post;
        if (is_a($post, 'WP_Post') && has_shortcode($post->post_content, 'security_training_roi_calculator')) {
            
            wp_enqueue_script('chart-js', 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js', array(), '3.9.1', true);
            
            wp_enqueue_script(
                'hailbytes-roi-calculator',
                HAILBYTES_ROI_PLUGIN_URL . 'assets/calculator.js',
                array('jquery', 'chart-js'),
                HAILBYTES_ROI_VERSION,
                true
            );
            
            wp_enqueue_style(
                'hailbytes-roi-calculator',
                HAILBYTES_ROI_PLUGIN_URL . 'assets/calculator.css',
                array(),
                HAILBYTES_ROI_VERSION
            );
            
            wp_localize_script('hailbytes-roi-calculator', 'hailbytes_ajax', array(
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('hailbytes_roi_nonce')
            ));
        }
    }
    
    public function roi_calculator_shortcode($atts) {
        $atts = shortcode_atts(array(
            'title' => 'Security Training ROI Calculator',
            'show_hailbytes_branding' => 'true'
        ), $atts);
        
        ob_start();
        ?>
        <div id="hailbytes-roi-calculator" class="hailbytes-calculator-container">
            <div class="calculator-header">
                <h2><?php echo esc_html($atts['title']); ?></h2>
                <p class="calculator-subtitle">Calculate the return on investment for your security awareness training program.</p>
            </div>
            
            <div class="calculator-tabs">
                <button class="tab-button active" data-tab="baseline">Baseline Assessment</button>
                <button class="tab-button" data-tab="training">Training Program</button>
                <button class="tab-button" data-tab="costs">Investment Costs</button>
                <button class="tab-button" data-tab="results">ROI Results</button>
            </div>
            
            <form id="roi-calculator-form">
                <?php wp_nonce_field('hailbytes_roi_nonce', 'roi_nonce'); ?>
                
                <!-- Baseline Assessment Tab -->
                <div class="tab-content active" id="baseline-tab">
                    <h3>Current Security Posture</h3>
                    
                    <div class="form-group">
                        <label for="organization_name">Organization Name</label>
                        <input type="text" id="organization_name" name="organization_name" required>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="employee_count">Total Employees</label>
                            <input type="number" id="employee_count" name="employee_count" min="1" required>
                        </div>
                        <div class="form-group">
                            <label for="industry">Industry Sector</label>
                            <select id="industry" name="industry" required>
                                <option value="">Select Industry</option>
                                <option value="financial">Financial Services</option>
                                <option value="healthcare">Healthcare</option>
                                <option value="government">Government</option>
                                <option value="education">Education</option>
                                <option value="retail">Retail</option>
                                <option value="manufacturing">Manufacturing</option>
                                <option value="technology">Technology</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="current_phishing_rate">Current Phishing Click Rate (%)</label>
                            <input type="number" id="current_phishing_rate" name="current_phishing_rate" min="0" max="100" step="0.1">
                            <small>If unknown, we'll use industry averages</small>
                        </div>
                        <div class="form-group">
                            <label for="avg_incident_cost">Average Cost per Security Incident ($)</label>
                            <input type="number" id="avg_incident_cost" name="avg_incident_cost" min="0" step="100" value="445000">
                        </div>
                    </div>
                </div>
                
                <!-- Training Program Tab -->
                <div class="tab-content" id="training-tab">
                    <h3>Training Program Configuration</h3>
                    
                    <div class="training-components">
                        <h4>Training Components</h4>
                        <div class="checkbox-group">
                            <label><input type="checkbox" name="training_components[]" value="awareness" checked> Security Awareness Training</label>
                            <label><input type="checkbox" name="training_components[]" value="phishing" checked> Phishing Simulations</label>
                            <label><input type="checkbox" name="training_components[]" value="compliance"> Compliance Training</label>
                            <label><input type="checkbox" name="training_components[]" value="advanced"> Advanced Security Training</label>
                        </div>
                    </div>
                </div>
                
                <!-- Investment Costs Tab -->
                <div class="tab-content" id="costs-tab">
                    <h3>Investment Costs</h3>
                    
                    <div class="form-group">
                        <label for="platform_licensing">Training Platform Licensing (Annual $)</label>
                        <input type="number" id="platform_licensing" name="platform_licensing" min="0" step="100">
                        <small>Typical range: $5-25 per user per year</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="employee_time_cost">Employee Training Time Cost ($/hour)</label>
                        <input type="number" id="employee_time_cost" name="employee_time_cost" min="0" step="1" value="35">
                    </div>
                    
                    <div class="form-group">
                        <label for="training_hours_year">Training Hours per Employee per Year</label>
                        <input type="number" id="training_hours_year" name="training_hours_year" min="1" max="40" value="8">
                    </div>
                </div>
                
                <!-- Results Tab -->
                <div class="tab-content" id="results-tab">
                    <div id="calculation-results" style="display: none;">
                        <h3>ROI Analysis Results</h3>
                        
                        <div class="results-summary">
                            <div class="metric-card">
                                <h4>Total Investment</h4>
                                <div class="metric-value" id="total-investment">$0</div>
                            </div>
                            <div class="metric-card">
                                <h4>Annual Benefits</h4>
                                <div class="metric-value" id="annual-benefits">$0</div>
                            </div>
                            <div class="metric-card">
                                <h4>ROI Percentage</h4>
                                <div class="metric-value roi-positive" id="roi-percentage">0%</div>
                            </div>
                            <div class="metric-card">
                                <h4>Payback Period</h4>
                                <div class="metric-value" id="payback-period">0 months</div>
                            </div>
                        </div>
                        
                        <div class="detailed-breakdown">
                            <h4>Analysis Summary</h4>
                            <div id="breakdown-content"></div>
                        </div>
                        
                        <?php if ($atts['show_hailbytes_branding'] === 'true'): ?>
                        <div class="hailbytes-promotion">
                            <h4>Enhance Your Security Training with HailBytes</h4>
                            <p>Ready to implement a comprehensive security awareness training program?</p>
                            <div class="cta-buttons">
                                <a href="https://hailbytes.com/contact" class="cta-button primary">Get Custom Quote</a>
                            </div>
                        </div>
                        <?php endif; ?>
                    </div>
                    
                    <div id="calculation-loading" style="display: none;">
                        <div class="loading-spinner"></div>
                        <p>Calculating your security training ROI...</p>
                    </div>
                </div>
                
                <div class="calculator-navigation">
                    <button type="button" id="prev-tab" class="nav-button" style="display: none;">Previous</button>
                    <button type="button" id="next-tab" class="nav-button">Next</button>
                    <button type="button" id="calculate-roi" class="calculate-button" style="display: none;">Calculate ROI</button>
                </div>
            </form>
        </div>
        <?php
        return ob_get_clean();
    }
    
    public function ajax_calculate_roi() {
        check_ajax_referer('hailbytes_roi_nonce', 'nonce');
        
        if (!isset($_POST['form_data'])) {
            wp_send_json_error('Missing form data');
        }
        
        wp_parse_str(sanitize_text_field($_POST['form_data']), $form_data);
        
        // Simple ROI calculation
        $employees = intval($form_data['employee_count'] ?? 0);
        $platform_cost = floatval($form_data['platform_licensing'] ?? 0);
        $employee_time_cost = floatval($form_data['employee_time_cost'] ?? 35);
        $training_hours = floatval($form_data['training_hours_year'] ?? 8);
        $incident_cost = floatval($form_data['avg_incident_cost'] ?? 445000);
        
        if ($employees <= 0) {
            wp_send_json_error('Invalid employee count');
        }
        
        // Calculate costs
        if ($platform_cost == 0) {
            $platform_cost = $employees * 15; // $15 per employee default
        }
        $employee_training_cost = $employees * $training_hours * $employee_time_cost;
        $total_investment = $platform_cost + $employee_training_cost;
        
        // Calculate benefits (simplified)
        $prevented_incidents = max(1, $employees / 500); // 1 incident per 500 employees prevented
        $annual_benefits = $prevented_incidents * $incident_cost * 0.6; // 60% of incident cost saved
        
        // Calculate ROI
        $roi_percentage = $total_investment > 0 ? (($annual_benefits - $total_investment) / $total_investment) * 100 : 0;
        $payback_period = $annual_benefits > 0 ? ($total_investment / $annual_benefits) * 12 : 0;
        
        $results = array(
            'totalInvestment' => round($total_investment),
            'annualBenefits' => round($annual_benefits),
            'roiPercentage' => round($roi_percentage, 1),
            'paybackPeriod' => round($payback_period, 1),
            'breakdown' => array(
                'platform_cost' => $platform_cost,
                'training_cost' => $employee_training_cost,
                'prevented_incidents' => $prevented_incidents
            )
        );
        
        wp_send_json_success($results);
    }
    
    public function activate() {
        // Simple activation - no database creation for now
        update_option('hailbytes_roi_version', HAILBYTES_ROI_VERSION);
    }
}

// Initialize the plugin
function hailbytes_roi_init() {
    new HailBytesSecurityROI();
}
add_action('plugins_loaded', 'hailbytes_roi_init');