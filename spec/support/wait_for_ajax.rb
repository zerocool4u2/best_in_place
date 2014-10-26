def wait_for_ajax
  return unless respond_to?(:evaluate_script)
  wait_until { finished_all_ajax_requests? }
end

def finished_all_ajax_requests?
  evaluate_script('!window.jQuery') || evaluate_script('jQuery.active').zero?
end

def wait_until(max_execution_time_in_seconds = Capybara.default_wait_time)
  Timeout.timeout(max_execution_time_in_seconds) do
    loop do
      if yield
        return true
      else
        sleep(0.1)
        next
      end
    end
  end
end
