/*
 * BestInPlace (for jQuery)
 * version: 3.0.0.alpha (2014)
 *
 * By Bernat Farrero based on the work of Jan Varwig.
 * Examples at http://bernatfarrero.com
 *
 * Licensed under the MIT:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @requires jQuery >= v1.4
 *
 * Usage:
 *
 * Attention.
 * The format of the JSON object given to the select inputs is the following:
 * [["key", "value"],["key", "value"]]
 * The format of the JSON object given to the checkbox inputs is the following:
 * ["falseValue", "trueValue"]

 */
//= require jquery.autosize

function BestInPlaceEditor(e) {
    'use strict';
    this.element = e;
    this.initOptions();
    this.bindForm();
    this.initNil();
    jQuery(this.activator).bind('click', {editor: this}, this.clickHandler);
}

BestInPlaceEditor.prototype = {
    // Public Interface Functions //////////////////////////////////////////////

    activate: function () {
        'use strict';
        var to_display = "";
        if (this.isNil()) {
            to_display = "";
        } else if (this.original_content) {
            to_display = this.original_content;
        } else {
            if (this.sanitize) {
                to_display = this.element.text();
            } else {
                to_display = this.element.html().replace('&amp;', '&');
            }
        }

        this.oldValue = this.isNil() ? "" : this.element.html();
        this.display_value = to_display;
        jQuery(this.activator).unbind("click", this.clickHandler);
        this.activateForm();
        this.element.trigger(jQuery.Event("best_in_place:activate"));
    },

    abort: function () {
        'use strict';
        this.activateText(this.oldValue);
        jQuery(this.activator).bind('click', {editor: this}, this.clickHandler);
        this.element.trigger(jQuery.Event("best_in_place:abort"));
        this.element.trigger(jQuery.Event("best_in_place:deactivate"));
    },

    abortIfConfirm: function () {
        'use strict';
        if (!this.useConfirm) {
            this.abort();
            return;
        }

        if (confirm(BestInPlaceEditor.defaults.confirmMessage)) {
            this.abort();
        }
    },

    update: function () {
        'use strict';
        var editor = this;

        if (this.formType in {"input": 1, "textarea": 1} && this.getValue() === this.oldValue) {
            // Avoid request if no change is made
            this.abort();
            return true;
        }

        editor.ajax({
            "type": BestInPlaceEditor.defaults.ajaxMethod,
            "dataType": BestInPlaceEditor.defaults.ajaxDataType,
            "data": editor.requestData(),
            "success": function (data) {
                editor.loadSuccessCallback(data);
            },
            "error": function (request, error) {
                editor.loadErrorCallback(request, error);
            }


        });
        var value = this.getValue();
        switch (this.formType) {
            case "select":

                this.previousCollectionValue = value;

                jQuery.each(this.values, function (i, v) {
                        if (value === v[0]) {
                            editor.element.html(v[1]);
                        }
                    }
                );
                break;

            case "checkbox":
                editor.element.html(this.values[value]);
                editor.element.data('bipValue')(value);
                break;

            default:
                if (this.getValue() !== "") {
                    if (this.sanitize) {
                        editor.element.text(value);
                    } else {
                        editor.element.html(value);
                    }
                } else {
                    editor.element.html(this.nil);
                }
        }

        editor.element.trigger(jQuery.Event("best_in_place:update"));
    },

    activateForm: function () {
        'use strict';
        alert("The form was not properly initialized. activateForm is unbound");
    },

    activateText: function (value) {
        'use strict';
        this.element.html(value);
        if (this.isNil()) {
            this.element.html(this.nil);
        }
    },

    // Helper Functions ////////////////////////////////////////////////////////

    initOptions: function () {
        // Try parent supplied info
        'use strict';
        var self = this;
        self.element.parents().each(function () {
            var $parent = jQuery(this);
            self.url = self.url || $parent.data("bipUrl");
            self.activator = self.activator || $parent.data("bipActivator");
            self.okButton = self.okButton || $parent.data("bipOkButton");
            self.okButtonClass = self.okButtonClass || $parent.data("bipOkButtonClass");
            self.cancelButton = self.cancelButton || $parent.data("bipCancelButton");
            self.cancelButtonClass = self.cancelButtonClass || $parent.data("bip-cancel-button-class");
        });

        // Load own attributes (overrides all others)
        self.url = self.element.data("bip-url") || self.url || document.location.pathname;
        self.collection = self.element.data("bip-collection") || self.collection;
        self.formType = self.element.data("bip-type") || "input";
        self.objectName = self.element.data("bip-object") || self.objectName;
        self.attributeName = self.element.data("bip-attribute") || self.attributeName;
        self.activator = self.element.data("bip-activator") || self.element;
        self.okButton = self.element.data("bip-ok-button") || self.okButton;
        self.okButtonClass = self.element.data("bip-ok-button-class") || self.okButtonClass || '';
        self.cancelButton = self.element.data("bip-cancel-button") || self.cancelButton;
        self.cancelButtonClass = self.element.data("bip-cancel-button-class") || self.cancelButtonClass || '';
        self.nil = self.element.data("bip-bip-placeholder") || self.nil || "—";
        self.inner_class = self.element.data("bip-inner-class") || self.inner_class || null;
        self.html_attrs = self.element.data("bip-html-attrs") || self.html_attrs;
        self.original_content = self.element.data("bip-original-content") || self.original_content;
        self.collectionValue = self.element.data("bip-value") || self.collectionValue;

        if (!self.element.data("bip-sanitize")) {
            self.sanitize = true;
        } else {
            self.sanitize = (self.element.data("bip-sanitize") !== "false");
            console.log(self.element.data("bip-sanitize"));
        }

        if (!self.element.data("bip-confirm")) {
            self.useConfirm = true;
        } else {
            self.useConfirm = (self.element.data("bip-use-confirm") !== "false");
        }

        if ((self.formType === "select" || self.formType === "checkbox") && self.collection !== null) {
            self.values = jQuery.parseJSON(self.collection);
        }

    },

    bindForm: function () {
        'use strict';
        this.activateForm = BestInPlaceEditor.forms[this.formType].activateForm;
        this.getValue = BestInPlaceEditor.forms[this.formType].getValue;
    },

    initNil: function () {
        'use strict';
        if (this.element.html() === "") {
            this.element.html(this.nil);
        }
    },

    isNil: function () {
        'use strict';
        // TODO: It only work when form is deactivated.
        // Condition will fail when form is activated
        return this.element.html() === "" || this.element.html() === this.nil;
    },

    getValue: function () {
        'use strict';
        alert("The form was not properly initialized. getValue is unbound");
    },

    // Trim and Strips HTML from text
    sanitizeValue: function (s) {
        'use strict';
        return jQuery.trim(s);
    },

    /* Generate the data sent in the POST request */
    requestData: function () {
        'use strict';
        // To prevent xss attacks, a csrf token must be defined as a meta attribute
        var csrf_token = jQuery('meta[name=csrf-token]').attr('content'),
            csrf_param = jQuery('meta[name=csrf-param]').attr('content');

        var data = "_method=" + BestInPlaceEditor.defaults.ajaxMethod;
        data += "&" + this.objectName + '[' + this.attributeName + ']=' + encodeURIComponent(this.getValue());

        if (csrf_param !== undefined && csrf_token !== undefined) {
            data += "&" + csrf_param + "=" + encodeURIComponent(csrf_token);
        }
        return data;
    },

    ajax: function (options) {
        'use strict';
        options.url = this.url;
        options.beforeSend = function (xhr) {
            xhr.setRequestHeader("Accept", "application/json");
        };
        return jQuery.ajax(options);
    },

    // Handlers ////////////////////////////////////////////////////////////////

    loadSuccessCallback: function (data) {
        'use strict';
        data = jQuery.trim(data);

        if (data && data !== "") {
            var response = jQuery.parseJSON(jQuery.trim(data));
            if (response !== null && response.hasOwnProperty("display_as")) {
                this.element.attr("data-bip-original-content", this.element.text());
                this.original_content = this.element.text();
                this.element.html(response.display_as);
            }

            this.element.trigger(jQuery.Event("best_in_place:success"), data);
            this.element.trigger(jQuery.Event("ajax:success"), data);
        } else {
            this.element.trigger(jQuery.Event("best_in_place:success"));
            this.element.trigger(jQuery.Event("ajax:success"));
        }

        // Binding back after being clicked
        jQuery(this.activator).bind('click', {editor: this}, this.clickHandler);
        this.element.trigger(jQuery.Event("best_in_place:deactivate"));

        if (this.collectionValue !== null && this.formType === "select") {
            this.collectionValue = this.previousCollectionValue;
            this.previousCollectionValue = null;
        }
    },

    loadErrorCallback: function (request, error) {
        'use strict';
        this.activateText(this.oldValue);

        this.element.trigger(jQuery.Event("best_in_place:error"), [request, error]);
        this.element.trigger(jQuery.Event("ajax:error"), request, error);

        // Binding back after being clicked
        jQuery(this.activator).bind('click', {editor: this}, this.clickHandler);
        this.element.trigger(jQuery.Event("best_in_place:deactivate"));
    },

    clickHandler: function (event) {
        'use strict';
        event.preventDefault();
        event.data.editor.activate();
    },

    setHtmlAttributes: function () {
        'use strict';
        var formField = this.element.find(this.formType);

        if (this.html_attrs) {
            var attrs = jQuery.parseJSON(this.html_attrs);
            for (var key in attrs) {
                formField.attr(key, attrs[key]);
            }
        }
    },

    placeButtons: function (output, field) {
        'use strict';
        if (field.okButton) {
            output.append(
                jQuery(document.createElement('input'))
                    .attr('type', 'submit')
                    .attr('class', field.okButtonClass)
                    .attr('value', field.okButton)
            );
        }
        if (field.cancelButton) {
            output.append(
                jQuery(document.createElement('input'))
                    .attr('type', 'button')
                    .attr('class', field.cancelButtonClass)
                    .attr('value', field.cancelButton)
            );
        }
    }


};


// Button cases:
// If no buttons, then blur saves, ESC cancels
// If just Cancel button, then blur saves, ESC or clicking Cancel cancels (careful of blur event!)
// If just OK button, then clicking OK saves (careful of blur event!), ESC or blur cancels
// If both buttons, then clicking OK saves, ESC or clicking Cancel or blur cancels
BestInPlaceEditor.forms = {
    "input": {
        activateForm: function () {
            'use strict';
            var output = jQuery(document.createElement('form'))
                .addClass('form_in_place')
                .attr('action', 'javascript:void(0);')
                .attr('style', 'display:inline');
            var input_elt = jQuery(document.createElement('input'))
                .attr('type', 'text')
                .attr('name', this.attributeName)
                .val(this.display_value);
            if (this.inner_class !== null) {
                input_elt.addClass(this.inner_class);
            }
            output.append(input_elt);
            this.placeButtons(output, this);

            this.element.html(output);
            this.setHtmlAttributes();

            this.element.find("input[type='text']")[0].select();
            this.element.find("form").bind('submit', {editor: this}, BestInPlaceEditor.forms.input.submitHandler);
            if (this.cancelButton) {
                this.element.find("input[type='button']").bind('click', {editor: this}, BestInPlaceEditor.forms.input.cancelButtonHandler);
            }
            this.element.find("input[type='text']").bind('blur', {editor: this}, BestInPlaceEditor.forms.input.inputBlurHandler);
            this.element.find("input[type='text']").bind('keyup', {editor: this}, BestInPlaceEditor.forms.input.keyupHandler);
            this.blurTimer = null;
            this.userClicked = false;
        },

        getValue: function () {
            'use strict';
            return this.sanitizeValue(this.element.find("input").val());
        },

        // When buttons are present, use a timer on the blur event to give precedence to clicks
        inputBlurHandler: function (event) {
            'use strict';
            if (event.data.editor.okButton) {
                event.data.editor.blurTimer = setTimeout(function () {
                    if (!event.data.editor.userClicked) {
                        event.data.editor.abort();
                    }
                }, 500);
            } else {
                if (event.data.editor.cancelButton) {
                    event.data.editor.blurTimer = setTimeout(function () {
                        if (!event.data.editor.userClicked) {
                            event.data.editor.update();
                        }
                    }, 500);
                } else {
                    event.data.editor.update();
                }
            }
        },

        submitHandler: function (event) {
            'use strict';
            event.data.editor.userClicked = true;
            clearTimeout(event.data.editor.blurTimer);
            event.data.editor.update();
        },

        cancelButtonHandler: function (event) {
            'use strict';
            event.data.editor.userClicked = true;
            clearTimeout(event.data.editor.blurTimer);
            event.data.editor.abort();
            event.stopPropagation(); // Without this, click isn't handled
        },

        keyupHandler: function (event) {
            'use strict';
            if (event.keyCode === 27) {
                event.data.editor.abort();
            }
        }
    },

    "select": {
        activateForm: function () {
            'use strict';
            var output = jQuery(document.createElement('form'))
                    .attr('action', 'javascript:void(0)')
                    .attr('style', 'display:inline'),
                selected = '',
                select_elt = jQuery(document.createElement('select'))
                    .attr('class', this.inner_class !== null ? this.inner_class : ''),
                currentCollectionValue = this.collectionValue;

            jQuery.each(this.values, function (key, value) {
                var option_elt = jQuery(document.createElement('option'))
                    .val(key)
                    .html(value);
                if (value[0] === currentCollectionValue) {
                    option_elt.attr('selected', 'selected');
                }
                select_elt.append(option_elt);
            });
            output.append(select_elt);

            this.element.html(output);
            this.setHtmlAttributes();
            this.element.find("select").bind('change', {editor: this}, BestInPlaceEditor.forms.select.blurHandler);
            this.element.find("select").bind('blur', {editor: this}, BestInPlaceEditor.forms.select.blurHandler);
            this.element.find("select").bind('keyup', {editor: this}, BestInPlaceEditor.forms.select.keyupHandler);
            this.element.find("select")[0].focus();
        },

        getValue: function () {
            'use strict';
            return this.sanitizeValue(this.element.find("select").val());
        },

        blurHandler: function (event) {
            'use strict';
            event.data.editor.update();
        },

        keyupHandler: function (event) {
            'use strict';
            if (event.keyCode === 27) {
                event.data.editor.abort();
            }
        }
    },

    "checkbox": {
        activateForm: function () {
            'use strict';
            this.collectionValue = !this.getValue();
            this.setHtmlAttributes();
            this.update();
        },

        getValue: function () {
            'use strict';
            return this.collectionValue;
        }
    },

    "textarea": {
        activateForm: function () {
            'use strict';
            // grab width and height of text
            var width = this.element.css('width');
            var height = this.element.css('height');

            // construct form
            var output = jQuery(document.createElement('form'))
                .addClass('form_in_place')
                .attr('action', 'javascript:void(0);')
                .attr('style', 'display:inline');
            var textarea_elt = jQuery(document.createElement('textarea'))
                .val(this.sanitizeValue(this.display_value));
            if (this.inner_class !== null) {
                textarea_elt.addClass(this.inner_class);
            }
            output.append(textarea_elt);

            this.placeButtons(output, this);

            this.element.html(output);
            this.setHtmlAttributes();

            // set width and height of textarea
            jQuery(this.element.find("textarea")[0]).css({ 'min-width': width, 'min-height': height });
            jQuery(this.element.find("textarea")[0]).autosize();

            this.element.find("textarea")[0].focus();
            this.element.find("form").bind('submit', {editor: this}, BestInPlaceEditor.forms.textarea.submitHandler);
            if (this.cancelButton) {
                this.element.find("input[type='button']").bind('click', {editor: this}, BestInPlaceEditor.forms.textarea.cancelButtonHandler);
            }
            this.element.find("textarea").bind('blur', {editor: this}, BestInPlaceEditor.forms.textarea.blurHandler);
            this.element.find("textarea").bind('keyup', {editor: this}, BestInPlaceEditor.forms.textarea.keyupHandler);
            this.blurTimer = null;
            this.userClicked = false;
        },

        getValue: function () {
            'use strict';
            return this.sanitizeValue(this.element.find("textarea").val());
        },

        // When buttons are present, use a timer on the blur event to give precedence to clicks
        blurHandler: function (event) {
            'use strict';
            if (event.data.editor.okButton) {
                event.data.editor.blurTimer = setTimeout(function () {
                    if (!event.data.editor.userClicked) {
                        event.data.editor.abortIfConfirm();
                    }
                }, 500);
            } else {
                if (event.data.editor.cancelButton) {
                    event.data.editor.blurTimer = setTimeout(function () {
                        if (!event.data.editor.userClicked) {
                            event.data.editor.update();
                        }
                    }, 500);
                } else {
                    event.data.editor.update();
                }
            }
        },

        submitHandler: function (event) {
            'use strict';
            event.data.editor.userClicked = true;
            clearTimeout(event.data.editor.blurTimer);
            event.data.editor.update();
        },

        cancelButtonHandler: function (event) {
            'use strict';
            event.data.editor.userClicked = true;
            clearTimeout(event.data.editor.blurTimer);
            event.data.editor.abortIfConfirm();
            event.stopPropagation(); // Without this, click isn't handled
        },

        keyupHandler: function (event) {
            'use strict';
            if (event.keyCode === 27) {
                event.data.editor.abortIfConfirm();
            }
        }
    }
};

BestInPlaceEditor.defaults = {
    confirmMessage: "Are you sure you want to discard your changes?",
    ajaxMethod: "patch",
    ajaxDataType: 'text'
};

jQuery.fn.best_in_place = function () {
    'use strict';
    function setBestInPlace(element) {
        if (!element.data('bestInPlaceEditor')) {
            element.data('bestInPlaceEditor', new BestInPlaceEditor(element));
            return true;
        }
    }

    jQuery(this.context).delegate(this.selector, 'click', function () {
        var el = jQuery(this);
        if (setBestInPlace(el)) {
            el.click();
        }
    });

    this.each(function () {
        setBestInPlace(jQuery(this));
    });

    return this;
};



