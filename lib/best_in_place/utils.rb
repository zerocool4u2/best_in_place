module BestInPlace
  module Utils
    module_function
    extend ActionController::ModelNaming

    def build_best_in_place_id(object, field)
      case object
        when Symbol, String
          "best_in_place_#{object}_#{field}"
        else
          id = "best_in_place_#{object_to_key(object)}"
          id << "_#{object.id}" if object.persisted?
          id << "_#{field}"
          id
      end
    end

    def object_to_key(object)
      model_name_from_record_or_class(object).param_key
    end
  end
end
