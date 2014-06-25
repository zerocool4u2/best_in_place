module BestInPlace
  module Helper

    def best_in_place(object, field, opts = {})

      best_in_place_assert_arguments(opts)

      real_object = best_in_place_real_object_for object
      type = opts[:as] || :input
      collection = Array(opts[:collection])
      field = field.to_s

      display_value = best_in_place_build_value_for(real_object, field, opts)

      value = nil
      if type == :select && collection.any?
        value = real_object.send(field)
        display_value = Hash[opts[:collection]].stringify_keys[value.to_s]
        collection = opts[:collection].to_json
      end
      if type == :checkbox
        value = !!real_object.send(field)
        collection = %w(No Yes) if collection.blank?
        display_value = value ? collection.last : collection.first
        collection = collection.to_json
      end
      options={}
      options[:class] = ['best_in_place'] + Array(opts[:class] || opts[:classes])
      options[:id] = opts[:id] || BestInPlace::Utils.build_best_in_place_id(real_object, field)
      options[:data]= HashWithIndifferentAccess.new(opts[:data])

      options[:data]['attribute'] = field
      options[:data]['activator'] = opts[:activator].presence
      options[:data]['cancel-button'] = opts[:cancel_button].presence
      options[:data]['cancel-button-class'] = opts[:cancel_button_class].presence
      options[:data]['collection'] = html_escape(collection) unless collection.blank?
      options[:data]['html-attrs'] = opts[:html_attrs].to_json unless opts[:html_attrs].blank?
      options[:data]['inner-class'] = opts[:inner_class].presence

      options[:data]['nil'] = html_escape(opts[:place_holder]).presence

      options[:data]['object'] = opts[:param] || BestInPlace::Utils.object_to_key(real_object)
      options[:data]['ok-button'] = opts[:ok_button].presence
      options[:data]['ok-button-class'] = opts[:ok_button_class].presence
      options[:data]['original-content'] = html_escape(real_object.send(field)) if opts[:display_as] || opts[:display_with]
      options[:data]['type'] = type

      options[:data]['url'] = url_for(opts[:url] || object)

      options[:data]['use-confirm'] = opts[:use_confirm].presence
      options[:data]['value'] = html_escape(value) if value


      if opts[:sanitize].presence.to_s == 'false'
        options[:data][:sanitize] = false
      end

      #delete nil keys only
      options[:data].delete_if {|k,v| v.nil?}

      content_tag(:span, options) do
        !options[:data][:sanitize] ? display_value : display_value.html_safe
      end

    end

    def best_in_place_if(condition, object, field, opts={})
      if condition
        best_in_place(object, field, opts)
      else
        best_in_place_build_value_for best_in_place_real_object_for(object), field, opts
      end
    end

    def best_in_place_unless(condition, object, field, opts={})
      best_in_place_if(!condition, object, field, opts)
    end


    private

    def best_in_place_build_value_for(object, field, opts)
      klass = if object.respond_to?(:id)
                "#{object.class}_#{object.id}"
              else
                object.class.to_s
              end

      if opts[:display_as]
        BestInPlace::DisplayMethods.add_model_method(klass, field, opts[:display_as])
        object.send(opts[:display_as]).to_s

      elsif opts[:display_with].try(:is_a?, Proc)
        BestInPlace::DisplayMethods.add_helper_proc(klass, field, opts[:display_with])
        opts[:display_with].call(object.send(field))

      elsif opts[:display_with]
        BestInPlace::DisplayMethods.add_helper_method(klass, field, opts[:display_with], opts[:helper_options])
        if opts[:helper_options]
          BestInPlace::ViewHelpers.send(opts[:display_with], object.send(field), opts[:helper_options])
        else
          field_value = object.send(field)

          if field_value.blank?
            ''
          else
            BestInPlace::ViewHelpers.send(opts[:display_with], field_value)
          end
        end

      else
        object.send(field).to_s
      end
    end

    def best_in_place_real_object_for(object)
      (object.is_a?(Array) && object.last.class.respond_to?(:model_name)) ? object.last : object
    end

    def best_in_place_assert_arguments(args)
      args.assert_valid_keys(:id, :type, :nil, :class, :collection, :data,
                             :activator, :cancel_button, :cancel_button_class, :html_attrs, :inner_class, :nil,
                             :object_name, :ok_button, :ok_button_class, :display_as, :display_with, :path,
                             :use_confirm, :sanitize, :helper_options, :url, :place_holder, :class, :as, :param)

      best_in_place_deprecated_options(args)

      if args[:display_as] && args[:display_with]
        fail ArgumentError, 'Can`t use both `display_as`` and `display_with` options at the same time'
      end

      if args[:display_with] && !args[:display_with].is_a?(Proc) && !ViewHelpers.respond_to?(args[:display_with])
        fail ArgumentError, "Can't find helper #{args[:display_with]}"
      end
    end

    def best_in_place_deprecated_options(args)
      if deprecated_option = args.delete(:path)
        args[:url] = deprecated_option
        ActiveSupport::Deprecation.warn('[Best_in_place] :path is deprecated in favor of :url ')
      end

      if deprecated_option = args.delete(:object_name)
        args[:param] = deprecated_option
        ActiveSupport::Deprecation.warn('[Best_in_place] :object_name is deprecated in favor of :param ')
      end

      if deprecated_option = args.delete(:type)
        args[:as] = deprecated_option
        ActiveSupport::Deprecation.warn('[Best_in_place] :type is deprecated in favor of :as ')
      end

      if deprecated_option = args.delete(:classes)
        args[:class] = deprecated_option
        AActiveSupport::Deprecation.warn('[Best_in_place] :classes is deprecated in favor of :class ')
      end

      if deprecated_option = args.delete(:nil)
        args[:place_holder] = deprecated_option
        ActiveSupport::Deprecation.warn('[Best_in_place] :nil is deprecated in favor of :place_holder ')
      end

    end
  end
end



