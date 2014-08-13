"use strict";

define(['js/Constants',
    'js/NodePropertyNames',
    'js/Widgets/PartBrowser/PartBrowserWidget.DecoratorBase',
    'js/Widgets/DiagramDesigner/DiagramDesignerWidget.Constants',
    'text!../Core/ResosDecorator.html',
    '../Core/ResosDecorator.Core',
    'css!./ResosDecorator.PartBrowserWidget'], function (CONSTANTS,
                                                       nodePropertyNames,
                                                       PartBrowserWidgetDecoratorBase,
                                                       DiagramDesignerWidgetConstants,
                                                       resosDecoratorTemplate,
                                                       ResosDecoratorCore) {

    var ResosDecoratorPartBrowserWidget,
        DECORATOR_ID = "ResosDecoratorPartBrowserWidget";


    ResosDecoratorPartBrowserWidget = function (options) {
        var opts = _.extend( {}, options);

        PartBrowserWidgetDecoratorBase.apply(this, [opts]);
        ResosDecoratorCore.apply(this, [opts]);

        this._initializeVariables({"connectors": false});

        this.logger.debug("ResosDecoratorPartBrowserWidget ctor");
    };


    /************************ INHERITANCE *********************/
    _.extend(ResosDecoratorPartBrowserWidget.prototype, PartBrowserWidgetDecoratorBase.prototype);
    _.extend(ResosDecoratorPartBrowserWidget.prototype, ResosDecoratorCore.prototype);


    /**************** OVERRIDE INHERITED / EXTEND ****************/

    /**** Override from PartBrowserWidgetDecoratorBase ****/
    ResosDecoratorPartBrowserWidget.prototype.DECORATORID = DECORATOR_ID;


    /**** Override from PartBrowserWidgetDecoratorBase ****/
    ResosDecoratorPartBrowserWidget.prototype.$DOMBase = (function () {
        var el = $(resosDecoratorTemplate);
        //use the same HTML template as the DefaultDecorator.DiagramDesignerWidget
        //but remove the connector DOM elements since they are not needed in the PartBrowser
        el.find('.' + DiagramDesignerWidgetConstants.CONNECTOR_CLASS).remove();
        return el;
    })();


    /**** Override from PartBrowserWidgetDecoratorBase ****/
    ResosDecoratorPartBrowserWidget.prototype.beforeAppend = function () {
        this.$el = this.$DOMBase.clone();

        this._renderContent();
    };


    /**** Override from PartBrowserWidgetDecoratorBase ****/
    ResosDecoratorPartBrowserWidget.prototype.afterAppend = function () {
    };


    /**** Override from PartBrowserWidgetDecoratorBase ****/
    ResosDecoratorPartBrowserWidget.prototype.update = function () {
        this._update();
    };


    /**** Override from PartBrowserWidgetDecoratorBase ****/
    ResosDecoratorPartBrowserWidget.prototype.notifyComponentEvent = function (componentList) {
        var len = componentList.length;
        while (len--) {
            this._updatePort(componentList[len]);
        }
        this._checkTerritoryReady();
    };


    return ResosDecoratorPartBrowserWidget;
});