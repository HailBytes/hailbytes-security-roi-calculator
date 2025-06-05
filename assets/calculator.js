jQuery(document).ready(function($) {
    let currentTab = 0;
    const tabs = ['baseline', 'training', 'costs', 'results'];
    
    console.log('HailBytes ROI Calculator loaded');
    
    // Tab navigation
    $('.tab-button').click(function() {
        const tabName = $(this).data('tab');
        const tabIndex = tabs.indexOf(tabName);
        showTab(tabIndex);
    });
    
    $('#next-tab').click(function() {
        console.log('Next button clicked, current tab:', currentTab);
        if (currentTab < tabs.length - 1) {
            showTab(currentTab + 1);
        }
    });
    
    $('#prev-tab').click(function() {
        console.log('Previous button clicked, current tab:', currentTab);
        if (currentTab > 0) {
            showTab(currentTab - 1);
        }
    });
    
    function showTab(index) {
        console.log('Showing tab:', index, tabs[index]);
        currentTab = index;
        
        // Update tab buttons
        $('.tab-button').removeClass('active');
        $('.tab-button').eq(index).addClass('active');
        
        // Update tab content
        $('.tab-content').removeClass('active');
        $('#' + tabs[index] + '-tab').addClass('active');
        
        // Update navigation buttons
        $('#prev-tab').toggle(index > 0);
        $('#next-tab').toggle(index < tabs.length - 1);
        $('#calculate-roi').toggle(index === tabs.length - 1);
    }
    
    // Auto-calculate platform licensing based on employee count
    $('#employee_count').on('input', function() {
        const employees = parseInt($(this).val()) || 0;
        if (employees > 0 && $('#platform_licensing').val() === '') {
            const estimatedCost = employees * 15; // $15 per user average
            $('#platform_licensing').val(estimatedCost);
        }
    });
    
    // Calculate ROI
    $('#calculate-roi').click(function() {
        console.log('Calculate ROI clicked');
        calculateROI();
    });
    
    function calculateROI() {
        $('#calculation-loading').show();
        $('#calculation-results').hide();
        
        const formData = $('#roi-calculator-form').serialize();
        console.log('Form data:', formData);
        
        $.ajax({
            url: hailbytes_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'calculate_security_roi',
                nonce: hailbytes_ajax.nonce,
                form_data: formData
            },
            success: function(response) {
                console.log('AJAX response:', response);
                if (response.success) {
                    displayResults(response.data);
                } else {
                    alert('Error calculating ROI: ' + response.data);
                }
                $('#calculation-loading').hide();
            },
            error: function(xhr, status, error) {
                console.error('AJAX Error:', error);
                alert('Error calculating ROI. Please try again.');
                $('#calculation-loading').hide();
            }
        });
    }
    
    function displayResults(data) {
        console.log('Displaying results:', data);
        
        // Update summary metrics
        $('#total-investment').text('$' + numberWithCommas(data.totalInvestment));
        $('#annual-benefits').text('$' + numberWithCommas(data.annualBenefits));
        $('#roi-percentage').text(data.roiPercentage + '%')
            .removeClass('roi-positive roi-negative')
            .addClass(data.roiPercentage > 0 ? 'roi-positive' : 'roi-negative');
        $('#payback-period').text(data.paybackPeriod + ' months');
        
        // Display breakdown
        let breakdownHtml = '<div class="simple-breakdown">';
        breakdownHtml += '<p><strong>Platform Cost:</strong> $' + numberWithCommas(data.breakdown.platform_cost) + '</p>';
        breakdownHtml += '<p><strong>Training Cost:</strong> $' + numberWithCommas(data.breakdown.training_cost) + '</p>';
        breakdownHtml += '<p><strong>Prevented Incidents:</strong> ' + data.breakdown.prevented_incidents + '</p>';
        breakdownHtml += '</div>';
        
        $('#breakdown-content').html(breakdownHtml);
        
        $('#calculation-results').show();
    }
    
    function numberWithCommas(x) {
        if (x === null || x === undefined) return '0';
        return Math.round(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    
    // Initialize first tab
    showTab(0);
});