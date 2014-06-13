def retry_on_timeout(n = 3, &block)
  block.call
rescue Capybara::TimeoutError, Capybara::ElementNotFound => e
  fail if n.zero?
  puts "Catched error: #{e.message}. #{n-1} more attempts."
  retry_on_timeout(n - 1, &block)
end
